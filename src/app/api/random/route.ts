import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/auth";
import { OrbitportSeedResponse } from "@/types/orbitport";

const ORBITPORT_API_URL = process.env.ORBITPORT_API_URL;

export async function GET(req: NextRequest) {
  let usedFallback = false;
  let data: OrbitportSeedResponse | null = null;

  try {
    if (!ORBITPORT_API_URL) throw new Error("Missing Orbitport API URL");

    // Create a response object for cookie setting
    const res = NextResponse.next();

    // Get valid token using our auth utility
    const accessToken = await getValidToken(req, res);
    if (!accessToken) {
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }

    // Call downstream API with access token
    const response = await fetch(`${ORBITPORT_API_URL}/api/v1/services/trng`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Orbitport API error:", errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    data = await response.json();
  } catch (error) {
    console.warn("Using fallback random generation:", error);
    usedFallback = true;
    data = null;
  }

  return NextResponse.json({
    ...data,
    usedFallback,
  });
}
