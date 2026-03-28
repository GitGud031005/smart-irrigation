/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getProfile, updateProfile, deleteProfile } from '@/services/profile-service'
import { toJsonSafe } from '@/lib/utils'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { validate, updateProfileSchema } from '@/lib/validators'

async function authorizeProfile(request: NextRequest, profileId: string) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	const payload = token ? await verifyToken(token) : null
	if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	const profile = await getProfile(profileId)
	if (!profile) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
	if (profile.userId && profile.userId !== payload.userId)
		return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
	return { payload, profile }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
	const { profileId } = await params
	const auth = await authorizeProfile(request, profileId)
	if ('error' in auth) return auth.error
	try {
		return new NextResponse(JSON.stringify(toJsonSafe(auth.profile)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
	const { profileId } = await params
	const auth = await authorizeProfile(request, profileId)
	if ('error' in auth) return auth.error
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { userId: _ignored, ...rest } = body
		const v = validate(updateProfileSchema, rest)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const p = await updateProfile(profileId, {
			name: v.data.name ?? undefined,
			minMoisture: v.data.minMoisture,
			maxMoisture: v.data.maxMoisture,
			mode: v.data.mode,
		})
		return new NextResponse(JSON.stringify(toJsonSafe(p)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
	const { profileId } = await params
	const auth = await authorizeProfile(request, profileId)
	if ('error' in auth) return auth.error
	try {
		const p = await deleteProfile(profileId)
		return new NextResponse(JSON.stringify(toJsonSafe(p)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
