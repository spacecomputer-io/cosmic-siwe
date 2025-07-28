/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();

    if (!message || !signature) {
      return NextResponse.json(
        { ok: false, message: "Missing message or signature" },
        { status: 400 }
      );
    }

    const session = await getSession();

    if (!session.nonce) {
      return NextResponse.json(
        { ok: false, message: "No nonce found in session" },
        { status: 400 }
      );
    }

    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({
      signature,
      nonce: session.nonce,
    });

    if (fields.nonce !== session.nonce) {
      return NextResponse.json(
        { ok: false, message: "Invalid nonce." },
        { status: 422 }
      );
    }

    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Verification error:", error);

    // Try to get session for cleanup
    try {
      const session = await getSession();
      session.destroy();
    } catch (sessionError) {
      console.error("Error destroying session:", sessionError);
    }

    if (
      (error as any).error.type.includes(
        "Nonce does not match provided nonce for verification."
      )
    ) {
      return NextResponse.json(
        { ok: false, message: "Invalid nonce." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { ok: false, message: (error as Error).message || "Verification failed" },
      { status: 500 }
    );
  }
}
