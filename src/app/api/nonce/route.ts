import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "siwe";

export async function GET(req: NextRequest) {
  const session = await getSession();
  session.nonce = generateNonce();
  await session.save();

  return NextResponse.json({ nonce: session.nonce });
}
