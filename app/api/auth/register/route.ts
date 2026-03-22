/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/services/auth-service";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { toJsonSafe } from "@/lib/utils";
import { withCors } from "@/lib/cors";

const handler = async (request: NextRequest) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, password } = body;
  if (!email || !password)
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 },
    );
  try {
    const existing = await getUserByEmail(email);
    if (existing)
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    const u = await createUser({ email, password });
    // Create session token and auto-login
    const token = await createToken({ userId: u.id, email: u.email });
    // hide passwordHash
    const safe = toJsonSafe(u) as any;
    delete safe.passwordHash;
    const res = new NextResponse(JSON.stringify(safe), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

export const POST = withCors(handler);
export const OPTIONS = withCors(async () => new NextResponse());