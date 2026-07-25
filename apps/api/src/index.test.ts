// 13 §2.2: HonoアプリをNode上で app.request() により結合検証する方式の先行確認
import { describe, expect, it } from "vitest";

import { app } from "./index";

describe("API-01 GET /api/v1/health", () => {
  it("200と{status:'ok'}を返す", async () => {
    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("未定義パスは404を返す", async () => {
    const res = await app.request("/api/v1/unknown");
    expect(res.status).toBe(404);
  });
});
