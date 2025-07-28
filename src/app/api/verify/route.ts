import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();
  const session = await getSession();

  try {
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
    session.destroy();
    return NextResponse.json(
      { ok: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
