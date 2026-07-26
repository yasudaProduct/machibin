// API-01 GET /health — 死活監視（07 §2、NFR-O04）
import { Hono } from 'hono';

export const healthRoute = new Hono();

healthRoute.get('/health', (c) => c.json({ status: 'ok' }));
