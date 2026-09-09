import { NextResponse } from "next/server";
import USERS from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }

  const { username, password } = body || {};
  if (!username || !password) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }

  const user = USERS[username];
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  createSession(user);

  return NextResponse.json({
    username: user.username,
    role: user.role,
    displayName: user.displayName,
  });
}
