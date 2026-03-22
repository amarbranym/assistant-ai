import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "access_token";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const accessToken =
    typeof body === "object" &&
    body !== null &&
    "accessToken" in body &&
    typeof (body as { accessToken: unknown }).accessToken === "string"
      ? (body as { accessToken: string }).accessToken.trim()
      : "";

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { message: "Missing accessToken" } },
      { status: 400 }
    );
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}
