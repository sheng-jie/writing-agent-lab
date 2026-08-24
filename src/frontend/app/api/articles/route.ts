import { NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5678";

export async function POST(request: Request) {
  const response = await fetch(`${backendUrl}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
  const body = await response.json();

  return NextResponse.json(body, { status: response.status });
}
