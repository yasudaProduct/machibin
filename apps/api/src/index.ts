// machibin API エントリポイント（12 §3.1）
// ベースパスは /api/v1（07 §1.1）。scheduledハンドラ（JOB-02〜04）はM1で追加する。
import { Hono } from "hono";

import { healthRoute } from "./routes/health";

export const app = new Hono().basePath("/api/v1");

app.route("/", healthRoute);

export default app;
