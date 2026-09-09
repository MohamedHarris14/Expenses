// SERVER-ONLY. Implements a signed, httpOnly cookie session.
//
// The cookie payload is { username, role, displayName, iat } and is
// authenticated with an HMAC-SHA256 signature keyed by SESSION_SECRET.
// The browser cannot forge or read a valid session because it never
// has the secret, and any tampering invalidates the signature.
//
// paid_by / role checks throughout the API always come from this
// session, never from values the client sends in a request body.

import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local (development) or Vercel Project Settings → Environment Variables (production)."
    );
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  const data = base64url(JSON.stringify(payload));
  const hmac = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

function unsign(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [data, hmac] = token.split(".");
  if (!data || !hmac) return null;

  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");

  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Create a session cookie for an authenticated user.
 * `user` should be one of the entries from lib/auth.js.
 */
export function createSession(user) {
  const payload = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    iat: Date.now(),
  };
  const token = sign(payload);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Read and verify the current session, if any.
 * Returns { username, role, displayName } or null.
 */
export function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = unsign(token);
  if (!payload) return null;

  const ageMs = Date.now() - (payload.iat || 0);
  if (ageMs > MAX_AGE_SECONDS * 1000) return null;

  return {
    username: payload.username,
    role: payload.role,
    displayName: payload.displayName,
  };
}

/** Destroy the current session cookie (logout). */
export function destroySession() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
