import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "siwe";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    session.nonce = generateNonce();

    // Ensure session is saved
    await session.save();

    console.log("Generated nonce:", session.nonce);

    return NextResponse.json({ nonce: session.nonce });
  } catch (error) {
    console.error("Error generating nonce:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}
