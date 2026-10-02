import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/convert/route";

function jsonRequest(body: unknown, method = "POST") {
  return new NextRequest("http://localhost/api/convert", {
    method,
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.1" },
    body: JSON.stringify(body),
  });
}

describe("/api/convert", () => {
  it("GET converts query name", async () => {
    const res = await GET(new NextRequest("http://localhost/api/convert?name=Mg%20Mg"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result.best.myanmar).toBe("မောင်မောင်");
  });

  it("GET returns 400 without name", async () => {
    const res = await GET(new NextRequest("http://localhost/api/convert"));
    expect(res.status).toBe(400);
  });

  it("POST single name", async () => {
    const res = await POST(jsonRequest({ name: "Aung Kyaw" }));
    const data = await res.json();
    expect(data.result.best.myanmar).toBe("အောင်ကျော်");
  });

  it("POST batch", async () => {
    const res = await POST(jsonRequest({ names: ["Mg Mg", "Aung Kyaw"] }));
    const data = await res.json();
    expect(data.results).toHaveLength(2);
  });

  it("POST rejects empty body fields", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });

  it("POST rejects oversized batch", async () => {
    const names = Array.from({ length: 201 }, (_, i) => `Name${i}`);
    const res = await POST(jsonRequest({ names }));
    expect(res.status).toBe(400);
  });

  it("POST rejects invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/convert", {
      method: "POST",
      body: "not-json",
      headers: { "x-forwarded-for": "203.0.113.2" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
