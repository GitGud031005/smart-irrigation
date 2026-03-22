import { NextRequest, NextResponse } from 'next/server'
import { controlPump } from '@/lib/adafruit-io'
import { createIrrigationEvent, queryIrrigationEvents, updateIrrigationEvent } from '@/services/irrigation-service'
import { toJsonSafe } from '@/lib/utils'

export async function POST(request: NextRequest) {
  let body: { action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body
  if (action !== 'start' && action !== 'stop') {
    return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 })
  }

  try {
    if (action === 'start') {
      // Control pump ON via Adafruit IO
      await controlPump('1')

      // Record the event in DB (no zone, since zones aren't wired yet)
      const event = await createIrrigationEvent({ startTime: new Date() })
      return NextResponse.json(toJsonSafe({ success: true, event }), { status: 201 })
    } else {
      // Control pump OFF via Adafruit IO
      await controlPump('0')

      // Close the most recent open irrigation event
      const openEvents = await queryIrrigationEvents({ take: 10 })
      const openEvent = openEvents.find(e => !e.endTime)
      if (openEvent) {
        const now = new Date()
        const duration = Math.floor((now.getTime() - openEvent.startTime.getTime()) / 1000)
        const updated = await updateIrrigationEvent(openEvent.id, { endTime: now, duration })
        return NextResponse.json(toJsonSafe({ success: true, event: updated }), { status: 200 })
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
