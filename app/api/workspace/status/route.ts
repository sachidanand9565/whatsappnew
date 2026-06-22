/**
 * GET /api/workspace/status
 * Fetches real-time WhatsApp phone number status from Meta API:
 * quality_rating, messaging_limit_tier, display_phone_number, verified_name
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

const QUALITY_MAP: Record<string, { label: string; color: string }> = {
  GREEN:  { label: 'High',   color: 'green'  },
  YELLOW: { label: 'Medium', color: 'yellow' },
  RED:    { label: 'Low',    color: 'red'    },
  NA:     { label: 'N/A',    color: 'gray'   },
};

const TIER_MAP: Record<string, string> = {
  TIER_50:        '50 / day',
  TIER_250:       '250 / day',
  TIER_1K:        '1,000 / day',
  TIER_2K:        '2,000 / day',
  TIER_10K:       '10,000 / day',
  TIER_100K:      '100,000 / day',
  TIER_UNLIMITED: 'Unlimited',
  UNLIMITED:      'Unlimited',       // some accounts return this
  '50':           '50 / day',
  '250':          '250 / day',
  '1000':         '1,000 / day',
  '10000':        '10,000 / day',
  '100000':       '100,000 / day',
};

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const rows = await query<RowDataPacket[]>(
      'SELECT phone_number_id, waba_id, access_token FROM workspaces WHERE id = ? LIMIT 1',
      [payload.workspaceId]
    );

    if (!rows.length) return apiError('Workspace not found', 404);

    const { phone_number_id, waba_id, access_token } = rows[0] as {
      phone_number_id: string | null;
      waba_id: string | null;
      access_token: string | null;
    };

    if (!phone_number_id || !access_token) {
      return NextResponse.json({
        success: true,
        data: { connected: false },
      });
    }

    const [metaRes, wabaRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v20.0/${phone_number_id}` +
        `?fields=quality_rating,messaging_limit_tier,display_phone_number,verified_name,name_status,status,code_verification_status` +
        `&access_token=${access_token}`
      ).then((r) => r.json()),
      waba_id
        ? fetch(
            `https://graph.facebook.com/v20.0/${waba_id}` +
            `?fields=account_review_status` +
            `&access_token=${access_token}`
          ).then((r) => r.json())
        : Promise.resolve(null),
    ]);
    const meta = metaRes;

    if (meta.error) {
      return NextResponse.json({
        success: true,
        data: {
          connected:    true,
          api_error:    meta.error.message,
          quality:      { label: 'N/A', color: 'gray' },
          quota:        'Unknown',
          phone_number: phone_number_id,
          verified_name: null,
        },
      });
    }

    const qualityRaw = (meta.quality_rating as string || 'NA').toUpperCase();
    const tierRaw    = (meta.messaging_limit_tier as string || '').toUpperCase();
    // Meta's true live state — "CONNECTED" means the number is fully approved & sending live.
    // Anything else (PENDING, FLAGGED, RESTRICTED...) means Meta review/approval isn't done yet,
    // even though our app already has valid credentials stored for it.
    const phoneStatus = (meta.status as string || '').toUpperCase();
    const isLive = phoneStatus === 'CONNECTED';

    return NextResponse.json({
      success: true,
      data: {
        connected:     true,
        is_live:       isLive,
        phone_status:  phoneStatus || 'UNKNOWN',
        account_review_status: wabaRes?.account_review_status || null,
        phone_number:  meta.display_phone_number || phone_number_id,
        verified_name: meta.verified_name || null,
        name_status:   meta.name_status   || null,
        quality:       QUALITY_MAP[qualityRaw] || { label: qualityRaw, color: 'gray' },
        quota:         TIER_MAP[tierRaw] || (tierRaw ? tierRaw.replace(/_/g, ' ') : null),
        name_declined: meta.name_status === 'DECLINED',
        raw: {
          quality_rating:        qualityRaw,
          messaging_limit_tier:  tierRaw,
        },
      },
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[workspace/status]', err?.message, err?.code);
    return apiError(err?.message || 'Server error', 500);
  }
}
