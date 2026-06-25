/**
 * lib/whatsapp.ts
 * Meta WhatsApp Cloud API wrapper
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import axios, { AxiosInstance } from 'axios';

const API_VERSION = 'v19.0';
const BASE_URL    = `https://graph.facebook.com/${API_VERSION}`;

// ---- Create axios instance for a specific workspace ----
export function createWAClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

// ---- Send plain text message ----
export async function sendTextMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  text:          string
) {
  const client = createWAClient(accessToken);
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to,
    type:              'text',
    text:              { preview_url: false, body: text },
  });
  return data; // { messages: [{ id: 'wamid...' }] }
}

// ---- Send template message ----
export async function sendTemplateMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  templateName:  string,
  language:      string,
  components:    object[] = []
) {
  const client = createWAClient(accessToken);
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type:     'template',
    template: {
      name:       templateName,
      language:   { code: language },
      components,
    },
  });
  return data;
}

// ---- Send image message ----
export async function sendImageMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  imageUrl:      string,
  caption?:      string
) {
  const client = createWAClient(accessToken);
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type:  'image',
    image: { link: imageUrl, caption },
  });
  return data;
}

// ---- Send any media by media_id (image/document/video/audio) ----
export async function sendMediaMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  mediaType:     'image' | 'document' | 'video' | 'audio',
  mediaId:       string,
  caption?:      string,
  filename?:     string
) {
  const client = createWAClient(accessToken);
  const payload: Record<string, unknown> = { id: mediaId };
  if (caption)  payload.caption  = caption;
  if (filename) payload.filename = filename;
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type:        mediaType,
    [mediaType]: payload,
  });
  return data;
}

// ---- Upload media file to WhatsApp and return media_id ----
export async function uploadMedia(
  accessToken:   string,
  phoneNumberId: string,
  fileBuffer:    Buffer,
  mimeType:      string,
  filename:      string
): Promise<string> {
  // Copy buffer into a fresh ArrayBuffer to avoid SharedArrayBuffer / pooled-Buffer issues
  const ab   = new ArrayBuffer(fileBuffer.byteLength);
  new Uint8Array(ab).set(fileBuffer);
  const blob = new Blob([ab], { type: mimeType });

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', blob, filename);

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/media`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body:    form,
  });

  const text = await res.text();
  let json: { id?: string; error?: { message: string; code?: number } };
  try { json = JSON.parse(text); }
  catch { throw new Error(`WhatsApp upload error: ${text}`); }

  if (!res.ok || json.error) {
    throw new Error(`WhatsApp: ${json.error?.message || `HTTP ${res.status}`}`);
  }
  if (!json.id) throw new Error('No media_id returned from WhatsApp');
  return json.id;
}

// ---- Mark message as read ----
export async function markAsRead(
  accessToken:   string,
  phoneNumberId: string,
  messageId:     string
) {
  const client = createWAClient(accessToken);
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    status:            'read',
    message_id:        messageId,
  });
  return data;
}

// ---- Submit template to Meta for approval ----
export async function submitTemplate(
  accessToken: string,
  wabaId:      string,
  template: {
    name:       string;
    language:   string;
    category:   string;
    components: object[];
  }
) {
  const client = createWAClient(accessToken);
  const { data } = await client.post(`/${wabaId}/message_templates`, template);
  return data; // { id: '...', status: 'PENDING' }
}

// ---- Get all templates from Meta ----
export async function getMetaTemplates(accessToken: string, wabaId: string) {
  const client = createWAClient(accessToken);
  const { data } = await client.get(`/${wabaId}/message_templates?fields=id,name,status,language,category,components`);
  return data.data;
}

// ---- Parse incoming webhook payload ----
export interface IncomingMessage {
  wamid:           string;
  from:            string;  // phone number
  timestamp:       string;
  type:            string;
  text?:           string;
  image?:          object;
  audio?:          object;
  document?:       object;
  video?:          object;
  sticker?:        object;
  location?:       object;
  contacts?:       object[];
  interactive?:    object;
  button?:         { text: string; payload: string };
  replied_to_wamid?: string;  // context.id from button replies
}

export interface StatusUpdate {
  wamid:     string;
  status:    'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errors?:   object[];
}

// Echo of a message the business sent from the WhatsApp Business app (coexistence).
// Same shape as an incoming message but addressed `to` the customer.
export interface EchoMessage {
  wamid:        string;
  to:           string;  // customer phone
  timestamp:    string;
  type:         string;
  text?:        string;
  image?:       object;
  audio?:       object;
  document?:    object;
  video?:       object;
  sticker?:     object;
  location?:    object;
  contacts?:    object[];
  interactive?: object;
}

export function parseWebhookBody(body: Record<string, unknown>): {
  messages: IncomingMessage[];
  statuses: StatusUpdate[];
  echoes:   EchoMessage[];
  phoneNumberId: string;
  profileNames: Record<string, string>; // waId → display name from WhatsApp profile
} {
  const result = { messages: [] as IncomingMessage[], statuses: [] as StatusUpdate[], echoes: [] as EchoMessage[], phoneNumberId: '', profileNames: {} as Record<string, string> };
  try {
    const entry     = (body.entry as Record<string, unknown>[])?.[0];
    const change    = (entry?.changes as Record<string, unknown>[])?.[0];
    const value     = change?.value as Record<string, unknown>;

    result.phoneNumberId = (value?.metadata as Record<string, unknown>)?.phone_number_id as string ?? '';

    // Extract profile names from contacts array
    const ctcs = (value?.contacts as Record<string, unknown>[]) ?? [];
    for (const c of ctcs) {
      const waId = c.wa_id as string;
      const name = (c.profile as Record<string, unknown>)?.name as string;
      if (waId && name) result.profileNames[waId] = name;
    }

    // Inbound messages
    const msgs = (value?.messages as Record<string, unknown>[]) ?? [];
    for (const m of msgs) {
      const btn     = m.button  as Record<string, unknown> | undefined;
      const context = m.context as Record<string, unknown> | undefined;
      result.messages.push({
        wamid:            m.id as string,
        from:             m.from as string,
        timestamp:        m.timestamp as string,
        type:             m.type as string,
        text:             (m.text as Record<string, unknown>)?.body as string,
        image:            m.image as object,
        audio:            m.audio as object,
        document:         m.document as object,
        video:            m.video as object,
        sticker:          m.sticker as object,
        location:         m.location as object,
        contacts:         m.contacts as object[],
        interactive:      m.interactive as object,
        button:           btn ? { text: btn.text as string, payload: btn.payload as string } : undefined,
        replied_to_wamid: context?.id as string | undefined,
      });
    }

    // Status updates
    const statuses = (value?.statuses as Record<string, unknown>[]) ?? [];
    for (const s of statuses) {
      result.statuses.push({
        wamid:     s.id as string,
        status:    s.status as StatusUpdate['status'],
        timestamp: s.timestamp as string,
        errors:    s.errors as object[],
      });
    }

    // Echoes — messages the business sent from the WhatsApp Business app (coexistence)
    const echoes = (value?.message_echoes as Record<string, unknown>[]) ?? [];
    for (const m of echoes) {
      result.echoes.push({
        wamid:       m.id as string,
        to:          m.to as string,
        timestamp:   m.timestamp as string,
        type:        m.type as string,
        text:        (m.text as Record<string, unknown>)?.body as string,
        image:       m.image as object,
        audio:       m.audio as object,
        document:    m.document as object,
        video:       m.video as object,
        sticker:     m.sticker as object,
        location:    m.location as object,
        contacts:    m.contacts as object[],
        interactive: m.interactive as object,
      });
    }
  } catch {
    // If parsing fails return empty arrays — we still log raw payload
  }
  return result;
}

// ---- Send interactive buttons message (max 3) ----
export async function sendInteractiveButtons(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  text:          string,
  buttons:       { text: string }[]
) {
  const client = createWAClient(accessToken);
  const formattedButtons = buttons.slice(0, 3).map((btn, idx) => ({
    type: 'reply',
    reply: {
      id: `btn_${idx}`,
      title: btn.text.substring(0, 20),
    }
  }));
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to,
    type:              'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: formattedButtons
      }
    }
  });
  return data;
}

// ---- Send interactive list message ----
export async function sendListMessage(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  body:          string,
  buttonText:    string,
  sections:      { title: string; rows: { title: string; description?: string }[] }[]
) {
  const client = createWAClient(accessToken);
  const formattedSections = sections.map((sec, secIdx) => ({
    title: sec.title.substring(0, 24),
    rows: (sec.rows || []).slice(0, 10).map((row, rowIdx) => ({
      id: `row_${secIdx}_${rowIdx}`,
      title: row.title.substring(0, 24),
      description: row.description ? row.description.substring(0, 72) : undefined,
    }))
  }));
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to,
    type:              'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonText.substring(0, 20),
        sections: formattedSections
      }
    }
  });
  return data;
}

// ---- Send media by link URL (image/document/video/audio) ----
export async function sendMediaByUrl(
  accessToken:   string,
  phoneNumberId: string,
  to:            string,
  mediaType:     'image' | 'document' | 'video' | 'audio',
  url:           string,
  caption?:      string,
  filename?:     string
) {
  const client = createWAClient(accessToken);
  const payload: Record<string, unknown> = { link: url };
  if (caption)  payload.caption  = caption;
  if (filename) payload.filename = filename;
  const { data } = await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type:        mediaType,
    [mediaType]: payload,
  });
  return data;
}
