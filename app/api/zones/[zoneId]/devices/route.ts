import { NextRequest, NextResponse } from 'next/server'
import { listDevices } from '@/services/device-service'
import { toJsonSafe } from '@/lib/utils'
import { verifyApiKey } from '@/lib/api-key'
import type { DeviceStatus, DeviceType } from '@/lib/generated/prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  const auth = verifyApiKey(request)
  if (!auth.ok) return auth.error

  const { zoneId } = await params
  const { searchParams } = request.nextUrl
  const deviceTypeRaw = searchParams.get('deviceType')
  const statusRaw = searchParams.get('status')

  const deviceType = deviceTypeRaw as DeviceType | null
  const status = statusRaw as DeviceStatus | null

  try {
    const devices = await listDevices({
      zoneId,
      ...(deviceType ? { deviceType } : {}),
      ...(status ? { status } : {}),
    })

    return new NextResponse(JSON.stringify(toJsonSafe(devices)), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
