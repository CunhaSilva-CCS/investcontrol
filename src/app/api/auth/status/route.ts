import { NextResponse } from "next/server";
import { getAuthStatus } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";

export async function GET() {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  return NextResponse.json(await getAuthStatus());
}
