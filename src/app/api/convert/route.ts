import { NextRequest, NextResponse } from "next/server";
import { convertBodySchema, MAX_NAME_LENGTH } from "@/lib/api-schemas";
import { convertName, convertNames } from "@/lib/converter";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

function rateLimited(request: NextRequest) {
  const key = clientKey(request);
  const { allowed, retryAfterSec } = checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", retryAfterSec },
      { status: 429, headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined },
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const limited = rateLimited(request);
  if (limited) return limited;

  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "Missing query parameter \"name\"" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Name must be at most ${MAX_NAME_LENGTH} characters` }, { status: 400 });
  }
  const result = convertName(name);
  return NextResponse.json({ result });
}

export async function POST(request: NextRequest) {
  const limited = rateLimited(request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = convertBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  if (parsed.data.name) {
    return NextResponse.json({ result: convertName(parsed.data.name) });
  }

  const results = convertNames(parsed.data.names ?? []);
  return NextResponse.json({ results });
}
