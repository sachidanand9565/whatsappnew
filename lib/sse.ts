/**
 * lib/sse.ts
 * In-process pub/sub for Server-Sent Events.
 * Works as long as the app runs in a single Node.js process (dev + typical prod).
 */
import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(500);

export interface SSEPayload {
  type:        'new_message' | 'status_update';
  workspaceId: number;
  contactId:   number;
  direction?:  'inbound' | 'outbound';
}

/** Called from the webhook handler after a message is persisted. */
export function emitSSE(payload: SSEPayload) {
  emitter.emit(`ws:${payload.workspaceId}`, payload);
}

/** Subscribe to events for a workspace. Returns an unsubscribe function. */
export function subscribeSSE(
  workspaceId: number,
  cb: (payload: SSEPayload) => void,
): () => void {
  const key = `ws:${workspaceId}`;
  emitter.on(key, cb);
  return () => emitter.off(key, cb);
}
