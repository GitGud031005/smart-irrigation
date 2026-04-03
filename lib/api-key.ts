/**
 * Gateway API-key authentication helper.
 *
 * The IoT gateway authenticates by sending:
 *   X-API-Key: <value of GATEWAY_API_KEY env var>
 *
 * Usage in a route:
 *   const gatewayAuth = verifyApiKey(request);
 *   if (!gatewayAuth.ok) return gatewayAuth.error;
 */
import { NextRequest, NextResponse } from 'next/server'

export interface ApiKeyOk  { ok: true }
export interface ApiKeyErr { ok: false; error: NextResponse }
export type ApiKeyResult = ApiKeyOk | ApiKeyErr

/**
 * Validates the `X-API-Key` header against the `GATEWAY_API_KEY` environment variable.
 * Returns `{ ok: true }` on success, or `{ ok: false, error: NextResponse }` on failure.
 *
 * If `GATEWAY_API_KEY` is not set the check is always rejected — misconfiguration is not silently bypassed.
 */
export function verifyApiKey(request: NextRequest): ApiKeyResult {
  const configured = process.env.GATEWAY_API_KEY
  if (!configured) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: 'Gateway API key is not configured on the server' },
        { status: 503 }
      ),
    }
  }

  const provided = request.headers.get('X-API-Key')
  if (!provided || provided !== configured) {
    return {
      ok: false,
      error: NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 }),
    }
  }

  return { ok: true }
}
