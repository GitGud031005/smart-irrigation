/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/services/auth-service";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { withCors } from "@/lib/cors";
import bcrypt from "bcrypt";

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
    const user = await getUserByEmail(email);
    if (!user)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    const token = await createToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withCors(handler);
export const OPTIONS = withCors(async () => new NextResponse());