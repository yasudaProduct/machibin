# CLAUDE.md

まちびん — 位置情報を用いた「おすすめ場所」ランダム交換サービス（Expo + Cloudflare Workers + Neon）。

## 主要コマンド（12 §8）

| 操作 | コマンド |
| --- | --- |
| 依存導入 | `pnpm install` |
| 全チェック | `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm format:check` |
| API起動 | `pnpm --filter @machibin/api dev`（wrangler dev。http://localhost:8787/api/v1/health） |
| アプリ起動 | `pnpm --filter @machibin/mobile dev`（expo start） |
| 整形 | `pnpm format` |

## 実装規約の要点（詳細は docs/12_development_standards.md）

- **C-01** 文字数カウントは `@machibin/schema` の `countGraphemes()` のみ（独自実装禁止）
- **C-02** 座標は `roundToCellCenter()` を通した値のみ。**生座標を状態・ログ・ペイロードに置かない**
- **C-03** 日時はUTC ISO 8601。JST変換は `lib/datetime` に集約
- **C-04** APIエラーは `AppError` をthrow → エラーMWが07 §1.3形式へ変換
- **C-05** ログは `lib/logger` 経由のみ（`console.*` 禁止。11 §8.1のマスキング）
- **C-06** 業務ロジックは `services/`、`routes/` は薄く。Tx境界はservices
- **C-07** 通知失敗で業務処理をロールバックしない
- **C-08** 設計書ID（FR/API/TBL/PRM/BD等）を実装コメントで参照する
- 依存方向: `apps/*` → `packages/*` の一方向のみ。`packages/schema` は実行環境非依存
- モバイル: `refetchInterval` ポーリング原則禁止（02 §8.4）。トークンは `@clerk/expo`＋expo-secure-storeのみ
- RNTL v14の `render` はPromiseを返すため**await必須**

## ドキュメント

- 設計書の索引: `docs/README.md`（ID体系: FR/NFR/SCR/TBL/CD/API/JOB/NT/PRM/BD/TC/SP-xx）
- 実装計画（マイルストーンM0〜M7・進捗）: `docs/plans/phase1_implementation_plan.md`
- 技術判断の記録: `docs/adr/`
- **同期ルール（12 §10.1）**: 仕様変更を含むPRは該当設計書の改訂を同PRに含める。Drizzleスキーマ⇔06、OpenAPI⇔07、PRM⇔04 §3

## Git運用（12 §6）

- `feature/*` → `develop` のPR。マージはユーザーが実施。`main` 直接push禁止
- コミット: `<type>(<scope>): <日本語要約>`（feat / fix / docs / refactor / test / chore / ci / build）
- コミット末尾: `Co-Authored-By: Claude <モデル名> <noreply@anthropic.com>`
