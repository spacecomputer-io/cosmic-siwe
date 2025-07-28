import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export const sessionOptions = {
  password: process.env.AUTH_SECRET as string,
  cookieName: "siwe-nonce-app-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export interface SessionData {
  nonce?: string;
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
