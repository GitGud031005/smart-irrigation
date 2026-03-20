// Authentication utilities - password hashing, token creation/validation
// NFR4: hashed passwords, token-based sessions, TLS
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET ?? 'fallback-secret-change-in-prod'
)
const COOKIE_NAME = 'session'
const EXPIRY = '7d'

export interface SessionPayload {
	userId: string
	email: string
}

export async function createToken(payload: SessionPayload): Promise<string> {
	return new SignJWT(payload as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(EXPIRY)
		.sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, SECRET)
		return payload as unknown as SessionPayload
	} catch {
		return null
	}
}

export { COOKIE_NAME }
