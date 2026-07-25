// @machibin/schema — API入出力スキーマ・定数の単一の正（12 §4）
// M0時点は骨組みのみ。本実装（zodスキーマ・CD-xx定数・PRMミラー・共有ロジック）はM1で行う。

/**
 * APIエラーコード（07 §1.3）。
 * M1でレスポンススキーマとともに完全定義する。
 */
export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "ACCOUNT_SUSPENDED",
  "TURNSTILE_FAILED",
  "NOT_FOUND",
  "CONFLICT",
  "ALREADY_REACTED",
  "POST_LIMIT_EXCEEDED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
