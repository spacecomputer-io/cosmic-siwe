import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { getValidToken } from "@/lib/auth";
import { OrbitportSeedResponse } from "@/types/orbitport";

const ORBITPORT_API_URL = process.env.ORBITPORT_API_URL;

export async function GET(req: NextRequest) {
  let nonce: string;
  let usedFallback = false;

  try {
    // Try to get cosmic randomness first
    if (ORBITPORT_API_URL) {
      const res = NextResponse.next();
      const accessToken = await getValidToken(req, res);

      if (accessToken) {
        const response = await fetch(
          `${ORBITPORT_API_URL}/api/v1/services/trng`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data: OrbitportSeedResponse = await response.json();
          nonce = data.data; // Use cosmic randomness as nonce
          console.log("Generated cosmic nonce:", nonce);
        } else {
          throw new Error(`Orbitport API failed: ${response.status}`);
        }
      } else {
        throw new Error("Failed to get access token");
      }
    } else {
      throw new Error("Missing Orbitport API URL");
    }
  } catch (error) {
    console.warn("Using fallback nonce generation:", error);
    usedFallback = true;
    nonce = generateNonce(); // Fallback to standard nonce
    console.log("Generated fallback nonce:", nonce);
  }

  const session = await getSession();
  session.nonce = nonce;
  await session.save();

  return NextResponse.json({
    nonce: session.nonce,
    usedFallback,
  });
}
