/**
 * GET  /api/templates  — list workspace templates
 * POST /api/templates  — create + submit to Meta for approval
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, insert, execute } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const GRAPH = 'v20.0';

// Sample files bundled in /public, uploaded to Meta as the header example.
// Meta requires a `header_handle` (resumable upload) for media examples — a
// plain header_url is rejected with a generic "unknown error".
const SAMPLE_HEADER_FILES: Record<string, { file: string; type: string }> = {
  IMAGE:    { file: 'logo.png',   type: 'image/png' },
  DOCUMENT: { file: 'sample.pdf', type: 'application/pdf' },
  VIDEO:    { file: 'sample.mp4', type: 'video/mp4' },
};

// Resumable-upload a bundled sample file → returns the header_handle.
async function uploadSampleHeaderHandle(headerType: string, accessToken: string, appId: string): Promise<string> {
  const cfg = SAMPLE_HEADER_FILES[headerType];
  if (!cfg) throw new Error(`No sample file for header type ${headerType}`);

  const filePath = path.join(process.cwd(), 'public', cfg.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Sample file public/${cfg.file} is missing on the server`);
  }
  const buf = fs.readFileSync(filePath);

  // Step 1 — open an upload session
  const startRes = await fetch(
    `https://graph.facebook.com/${GRAPH}/${appId}/uploads` +
      `?file_name=${encodeURIComponent(cfg.file)}&file_length=${buf.length}` +
      `&file_type=${encodeURIComponent(cfg.type)}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const startData = await startRes.json();
  if (!startData.id) throw new Error(startData.error?.message || 'Upload session failed');

  // Step 2 — upload bytes, get the handle
  const upRes = await fetch(`https://graph.facebook.com/${GRAPH}/${startData.id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${accessToken}`, file_offset: '0' },
    body: buf,
  });
  const upData = await upRes.json();
  if (!upData.h) throw new Error(upData.error?.message || 'Sample upload failed');
  return upData.h as string;
}

// ─── GET ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const templates = await query<RowDataPacket[]>(
      'SELECT * FROM templates WHERE workspace_id = ? ORDER BY created_at DESC',
      [payload.workspaceId]
    );
    return apiSuccess(templates);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

// ─── POST ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const {
      name, language, category,
      header_type, header_content,
      header_handle,      // resumable-upload handle for uploaded media headers
      body_text, footer_text,
      buttons = [],
      variables = [],
      var_samples = {},   // { '{{1}}': 'John', '{{2}}': 'ORD-123' }
    } = body;

    if (!name || !body_text) return apiError('Name and body text are required');

    // ── 0. Block duplicates: same name + language in this workspace ──
    // (Meta's templates are unique by name+language, so catch it locally
    //  before submitting and showing a confusing Meta error.)
    const lang = language || 'en';
    const dup = await query<RowDataPacket[]>(
      'SELECT id FROM templates WHERE workspace_id = ? AND LOWER(name) = LOWER(?) AND language = ? LIMIT 1',
      [payload.workspaceId, name, lang]
    );
    if (dup.length > 0) {
      return apiError(`A template named "${name}" already exists in ${lang}. Please use a different name.`, 409);
    }

    // ── 1. Resolve credentials: DB → ENV fallback ────────────
    const ws = await query<RowDataPacket[]>(
      'SELECT access_token, waba_id FROM workspaces WHERE id = ?',
      [payload.workspaceId]
    );
    const wsRow      = ws[0] || {};
    const accessToken = (wsRow.access_token as string) || process.env.WHATSAPP_ACCESS_TOKEN || '';
    const wabaId      = (wsRow.waba_id      as string) || process.env.WABA_ID              || '';

    // ── 2. Save to DB first ──────────────────────────────────
    const id = await insert(
      `INSERT INTO templates
       (workspace_id, name, language, category, header_type, header_content,
        body_text, footer_text, buttons, variables, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        payload.workspaceId,
        name,
        language   || 'en',
        category   || 'UTILITY',
        (header_type === 'NONE' ? 'TEXT' : header_type) || 'TEXT',
        header_type === 'NONE' ? '' : (header_content || ''),
        body_text,
        footer_text || '',
        JSON.stringify(buttons),
        JSON.stringify(variables),
      ]
    );

    // ── 3. Submit to Meta if credentials available ───────────
    if (!accessToken || !wabaId) {
      return apiSuccess(
        { id, meta_submitted: false, warning: 'WhatsApp credentials not configured. Template saved locally. Go to Settings to add your API credentials.' },
        201
      );
    }

    try {
      // Media headers need a resumable-upload handle for the example. If the
      // client didn't supply one, auto-upload the bundled sample for this type.
      let mediaHandle: string | undefined = header_handle;
      if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(header_type) && !mediaHandle) {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID || '';
        if (!appId) throw new Error('Facebook App ID not configured (NEXT_PUBLIC_FACEBOOK_APP_ID)');
        mediaHandle = await uploadSampleHeaderHandle(header_type, accessToken, appId);
      }

      const components = buildMetaComponents({
        header_type,
        header_content,
        header_handle: mediaHandle,
        body_text,
        footer_text,
        buttons,
        var_samples,
      });

      const metaPayload = {
        name,
        language:   language || 'en',
        category:   category || 'UTILITY',
        components,
      };

      console.log('[Meta Template Submit]', JSON.stringify(metaPayload, null, 2));

      const metaRes = await axios.post(
        `https://graph.facebook.com/v19.0/${wabaId}/message_templates`,
        metaPayload,
        {
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const metaData = metaRes.data as { id: string; status: string };
      console.log('[Meta Template Response]', metaData);

      // Update DB with Meta ID and status
      await execute(
        'UPDATE templates SET meta_template_id = ?, status = ? WHERE id = ?',
        [metaData.id, metaData.status || 'PENDING', id]
      );

      return apiSuccess({ id, meta_submitted: true, meta_id: metaData.id, status: metaData.status }, 201);

    } catch (metaErr: unknown) {
      // Meta submission failed — log error, template still saved locally
      let metaError = 'Meta API error';
      if (axios.isAxiosError(metaErr)) {
        const errData = metaErr.response?.data as Record<string, unknown> | undefined;
        const fbError = (errData?.error as Record<string, unknown>) || {};
        // Meta's generic `message` is just "Invalid parameter" — the real reason
        // is in error_user_title / error_user_msg / error_data.details. Surface it.
        const errorData = (fbError.error_data as Record<string, unknown>) || {};
        const title  = fbError.error_user_title as string | undefined;
        const userMsg =
          (fbError.error_user_msg as string) ||
          (errorData.details as string) ||
          (fbError.message as string) ||
          metaErr.message;
        metaError = title && title !== userMsg ? `${title} — ${userMsg}` : userMsg;
        console.error('[Meta Template Error]', JSON.stringify(errData, null, 2));
      } else if (metaErr instanceof Error) {
        metaError = metaErr.message;
      }

      // Mark as failed in DB
      await execute('UPDATE templates SET status = ? WHERE id = ?', ['REJECTED', id]);

      return NextResponse.json({
        success:       false,
        meta_submitted: false,
        local_id:      id,
        error:         `Meta API Error: ${metaError}`,
      }, { status: 422 });
    }

  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[templates POST]', err);
    return apiError('Server error', 500);
  }
}

// ─── Build Meta API components array ─────────────────────────
function buildMetaComponents(opts: {
  header_type:    string;
  header_content: string;
  header_handle?: string;
  body_text:      string;
  footer_text:    string;
  buttons:        { type: string; text: string; url?: string; url_type?: string; phone?: string }[];
  var_samples:    Record<string, string>;
}) {
  const { header_type, header_content, header_handle, body_text, footer_text, buttons, var_samples } = opts;
  const components: object[] = [];

  // ── HEADER component ──────────────────────────────────────
  if (header_type === 'TEXT' && header_content) {
    components.push({ type: 'HEADER', format: 'TEXT', text: header_content });
  } else if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(header_type) && header_handle) {
    // Media example MUST be a resumable-upload handle — Meta rejects header_url
    // with a generic "unknown error". The handle is generated in the POST handler.
    components.push({
      type:    'HEADER',
      format:  header_type,
      example: { header_handle: [header_handle] },
    });
  }

  // ── BODY component ────────────────────────────────────────
  // Extract variables like {{1}}, {{2}} from body text
  const varMatches = [...new Set(body_text.match(/\{\{\d+\}\}/g) || [])];
  const bodyComponent: Record<string, unknown> = { type: 'BODY', text: body_text };

  if (varMatches.length > 0) {
    // Build example body_text array using sample values
    const exampleValues = varMatches.map((v) => var_samples[v] || `Sample_${v.replace(/\{\{|\}\}/g, '')}`);
    bodyComponent.example = { body_text: [exampleValues] };
  }

  components.push(bodyComponent);

  // ── FOOTER component ──────────────────────────────────────
  if (footer_text) {
    components.push({ type: 'FOOTER', text: footer_text });
  }

  // ── BUTTONS component ─────────────────────────────────────
  if (buttons && buttons.length > 0) {
    const metaButtons: object[] = buttons.map((btn) => {
      if (btn.type === 'QUICK_REPLY') {
        return { type: 'QUICK_REPLY', text: btn.text };
      }
      if (btn.type === 'URL') {
        const isDynamic = btn.url_type === 'dynamic';
        // Dynamic URL: base URL without {{1}}, example shows the full URL
        const baseUrl = isDynamic
          ? (btn.url || '').replace(/\{\{1\}\}.*$/, '')
          : (btn.url || '');
        return {
          type:       'URL',
          text:       btn.text,
          url:        isDynamic ? `${baseUrl}{{1}}` : baseUrl,
          ...(isDynamic ? { example: [(btn.url || '').replace('{{1}}', 'sample-value')] } : {}),
        };
      }
      if (btn.type === 'PHONE_NUMBER') {
        return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone || '' };
      }
      return {};
    });

    components.push({ type: 'BUTTONS', buttons: metaButtons });
  }

  return components;
}
