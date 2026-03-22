import { NextRequest, NextResponse } from 'next/server'

export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const origin = req.headers.get('origin') ?? ''
    const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim())
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')
    
    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : '',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Process the actual request
    const res = await handler(req)

    // Add CORS headers to response
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return res
  }
}
