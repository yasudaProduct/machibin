# 開発標準・リポジトリ構成ガイド

**プロダクト名:** まちびん
**サブタイトル:** 「おすすめ場所」ランダム交換サービス

---

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
| --- | --- | --- | --- |
| 1.0 | 2026-07-21 | Claude | 初版作成 |
| 1.1 | 2026-07-21 | Claude | §11.2の通知許可タイミング矛盾を解消（05を09に統一）につき、当該行を既知の設計課題から削除 |
| 1.2 | 2026-07-22 | Claude | §11.2のidempotencyKey永続化設計を解消（06 §6.4に定義）につき、当該行を既知の設計課題から削除 |
| 1.3 | 2026-07-26 | Claude | §9のPR必須チェック表へtest:mobile（L1'）を追加（13 §8との整合）。§2のpnpmを10系へ更新（M0実装時の実環境に合わせた） |

## 文書情報

| 項目 | 内容 |
| --- | --- |
| 文書名 | まちびん 開発標準・リポジトリ構成ガイド |
| ステータス | ドラフト |
| 対象 | 実装工程全般（リポジトリ構成、型共有、コーディング規約、Git運用） |
| 関連文書 | 02 アーキテクチャ設計書、03 システム構成設計書、06 データベース設計書、07 API設計書、13 テスト設計書、14 環境構築手順書 |

---

## 1. はじめに

### 1.1 目的

本書は、設計書群（01〜11）が定める仕様を実装に落とす際の「作り方」の標準を定める。リポジトリ構成・型共有方針・コーディング規約・Git運用を先に確定し、実装中の迷いと手戻りを減らすことを目的とする。

### 1.2 位置づけ

- 仕様（何を作るか）は各設計書を正とする。本書は実装方式（どう作るか）の正である。
- 本書の規約と実装が乖離した場合は、実装を直すか本書を改訂する（黙認しない）。
- CI/CDパイプラインの詳細は 17 CI/CD・リリース設計書（未作成）に委譲し、本書はローカル開発とPRまでを扱う。

---

## 2. 技術前提（ツールチェーン）

| 区分 | 採用 | 備考 |
| --- | --- | --- |
| ランタイム | Node.js 22（LTS） | `package.json` の `engines` と `.node-version` で固定 |
| パッケージマネージャ | pnpm 10系（corepack） | `packageManager` フィールドで固定。ワークスペース機能を使用 |
| 言語 | TypeScript 5系（strict） | 全パッケージ共通。JSの追加は不可 |
| モバイル | Expo SDK（実装着手時の最新安定版） | BD-05のOS下限（iOS 15.1 / Android 7.0）を満たすことをアップデート毎に確認 |
| API | Hono 4系 ＋ wrangler 4系 | 02 §3.1 |
| DB | Drizzle ORM ＋ drizzle-kit | 06 §8 |
| バリデーション | zod | 型共有の中核（§4） |
| テスト | Vitest（API・共有パッケージ）／jest-expo（RNコンポーネント）／Maestro（E2E） | 13 テスト設計書 |
| Lint / Format | ESLint 9（flat config）＋ Prettier | 共有設定は `packages/config` |

**依存更新方針:** パッチ・マイナーは随時。メジャー更新（Expo SDK、Hono、Drizzle）は動作確認とセットで単独PRにする。Expo SDKの更新はBD-05・EAS Updateの`runtimeVersion`互換に影響するため、リリース直前には行わない。

---

## 3. リポジトリ構成

### 3.1 モノレポ構成（pnpm workspaces）

```text
machibin/
├── apps/
│   ├── mobile/                 # Expoアプリ（05 画面設計書の実装）
│   │   ├── app/                # expo-routerルート（詳細は16で確定）
│   │   ├── src/
│   │   │   ├── components/     # 画面横断の共有UI
│   │   │   ├── features/       # ドメイン単位（post / collection / profile / report ...）
│   │   │   └── lib/            # api-client, clerk, notifications, map, datetime
│   │   └── assets/             # アイコン・アバタープリセット・Lottie
│   └── api/                    # Cloudflare Workers + Hono（07/08の実装）
│       ├── src/
│       │   ├── index.ts        # エントリ（fetch / scheduledをexport）
│       │   ├── routes/         # APIグループ単位（me, spots, home, collection, reports, admin, webhooks, tiles）
│       │   ├── middleware/     # auth（10 §5）, error（07 §1.3）, logging（11 §8.1）
│       │   ├── services/       # 業務ロジック（04 機能設計書の実装。Tx境界はここ）
│       │   ├── db/             # schema.ts（06の正）, queries/（06 §6のSQL）
│       │   ├── jobs/           # job02 / job03 / job04（08）
│       │   └── lib/            # geohash, turnstile, expo-push, clerk, svix
│       ├── drizzle/            # drizzle-kit生成マイグレーション
│       └── wrangler.toml       # env: staging / production（03 §4）
├── packages/
│   ├── schema/                 # zodスキーマ・API型・定数（CD-xx等）の単一の正（§4）
│   └── config/                 # tsconfig / eslint / prettier の共有設定
├── tools/
│   └── tiles/                  # 地図タイル生成・スタイル生成スクリプト（15）
├── docs/                       # 設計書一式（本書を含む）
│   ├── adr/                    # Architecture Decision Records（§10.3）
│   └── legal/                  # 利用規約・プライバシーポリシー（ドラフト）
├── .github/
│   ├── workflows/              # CI定義（詳細は17）
│   └── PULL_REQUEST_TEMPLATE.md
├── CLAUDE.md                   # AI支援開発用のリポジトリガイド（§10.4）
├── pnpm-workspace.yaml
└── package.json
```

### 3.2 依存方向の規則

| No | 規則 |
| --- | --- |
| D-01 | `apps/*` → `packages/*` の一方向のみ許可。apps間の依存・packagesからappsへの依存は禁止 |
| D-02 | `packages/schema` は実行環境非依存とする（Node / Workers / React Nativeすべてで動くコードのみ。`fs`・DOM・RN APIの参照禁止） |
| D-03 | DBスキーマ（Drizzle）は `apps/api` 内に閉じる。モバイルへ公開する型は必ず `packages/schema` のAPI入出力型を経由する |
| D-04 | パッケージ名は `@machibin/*` スコープ（例: `@machibin/schema`） |

---

## 4. 型共有・スキーマ戦略

07 API設計書のリクエスト/レスポンスを、クライアント・サーバーで二重定義しないための方針。

| 項目 | 方針 |
| --- | --- |
| 単一の正 | `packages/schema` にzodスキーマとして定義する。命名は `spotsCreateRequestSchema` / `spotsCreateResponseSchema` のようにリソース＋操作で揃え、対応するAPI-IDをJSDocコメントに記す |
| サーバー側 | `@hono/zod-openapi` でルートを定義し、同一スキーマから**OpenAPI定義を自動生成**する（07 末尾の「実装時にOpenAPI定義を生成して本書と同期する」に対応）。生成物 `openapi.json` はCIアーティファクトとし、リポジトリにはコミットしない |
| クライアント側 | `z.infer` による型利用＋薄いfetchラッパー（`apps/mobile/src/lib/api-client`）。レスポンスは `safeParse` し、失敗時は共通エラー処理（05 §4.5の500相当）へ流す |
| エラーコード | 07 §1.3のcode一覧を `packages/schema` のユニオン型として定義し、クライアントのエラーマッピング（05 §4.5・§6 V-09）はこの型に対して網羅する |
| コード定義（CD-xx） | 06 §4のコード値と表示名を `packages/schema/constants` に定義する。表示名の正は06 |
| PRM既定値 | サーバーは実行時に `app_settings`（TBL-09）を参照する（04 §3が正）。クライアントは文字数カウンタ等の表示用に既定値の**定数ミラー**を持つ。**PRM変更時は定数ミラーも追随更新する**（乖離時はサーバー判定が正であり、クライアントはV-09でサーバーエラーを表示できるため実害は限定的） |

---

## 5. コーディング規約

### 5.1 命名

| 対象 | 規則 | 例 |
| --- | --- | --- |
| ファイル（一般） | kebab-case | `exchange-service.ts` |
| Reactコンポーネント | PascalCase + `.tsx` | `SpotCard.tsx` |
| hooks | `use`プレフィックス | `useCollection.ts` |
| zodスキーマ | `xxxSchema` | `spotsCreateRequestSchema` |
| DBカラム | snake_case（06のとおり。Drizzleのプロパティ名はcamelCase） | `delivered_at` / `deliveredAt` |
| API JSON | camelCase（07 §1.1） | `collectionItemId` |
| 環境変数 | UPPER_SNAKE。クライアント公開値は `EXPO_PUBLIC_` プレフィックス必須 | `EXPO_PUBLIC_API_URL` |

### 5.2 TypeScript / Lint

- `strict: true` に加え `noUncheckedIndexedAccess` を有効化する。ベースtsconfigは `packages/config`。
- `any`・非nullアサーション（`!`）は原則禁止。やむを得ない場合は理由コメントを付す。
- import順序は builtin → external → `@machibin/*` → 相対 とし、ESLintで自動整列する。

### 5.3 ドメイン共通ルール（設計書由来の実装規約）

| No | 規約 | 根拠 |
| --- | --- | --- |
| C-01 | 文字数カウントは `@machibin/schema` の `countGraphemes()` のみを使用する（画面カウンタ・APIバリデーション共通。独自実装禁止） | 04 §5 G-01、05 §6 V-01、SP-03 |
| C-02 | 座標は `roundToCellCenter()`（geohash precision＝PRM-04）を通した値のみを保持・送信する。**生座標を状態管理・ログ・APIペイロードに置くコードを書かない** | 11 §3（構造的保証を実装レベルで維持） |
| C-03 | 日時は保存・通信ともUTC ISO 8601。JST変換は `lib/datetime`（dayjs + timezone plugin）に集約し、画面での直接変換を禁止する | 05 §4.3、04 §5 G-02 |
| C-04 | APIのエラーは `AppError(code, status, details)` をthrowし、エラーミドルウェアが07 §1.3形式へ変換する。ルート内での直接Response組み立て禁止 | 07 §1.3 |
| C-05 | ログは `lib/logger` 経由のみ（`console.*` 直接使用禁止）。出力禁止項目（座標・コメント・トークン等）は11 §8.1に従い、loggerがマスキングを担う | 11 §8.1 |
| C-06 | 業務ロジックは `services/` に置き、`routes/` はバリデーションと呼び出しのみの薄い層とする。DBトランザクション境界はservices層 | 04（機能横断ルールの実装単位） |
| C-07 | 通知送信の失敗で業務処理をロールバックしない（送信は確定処理の後段） | 04 §5 G-05 |
| C-08 | 設計書のID（FR/API/TBL/PRM/BD等）を実装コメントで参照する（例: `// BD-01: 即時配達のため'scheduled'は経由しない`） | トレーサビリティ確保 |

### 5.4 モバイル固有

- サーバー状態はTanStack Queryで管理する。**`refetchInterval`によるポーリングは原則禁止**（02 §8.4。Neonのスケールtoゼロ維持）。フォアグラウンド復帰時の再取得（05 §5.3）は許可。
- 認証トークンは `@clerk/expo` ＋ `expo-secure-store` の管理に一任し、AsyncStorage等への複製を禁止する（10 §4.1）。
- 画面コンポーネントのファイル冒頭に対応するSCR-IDをコメントで記す。ルーティング詳細（expo-routerのパス・ディープリンク）は 16 モバイルアプリ実装設計書（未作成）で確定する。

---

## 6. Git運用

### 6.1 ブランチモデル

| ブランチ | 役割 | デプロイ先 |
| --- | --- | --- |
| `main` | 本番リリース済みの状態。保護ブランチ（直接push禁止・PR必須） | production（03 §4） |
| `develop` | 統合ブランチ。featureのマージ先 | staging（自動デプロイ。詳細は17） |
| `feature/*` `fix/*` `docs/*` `chore/*` | 作業ブランチ。`develop` から分岐 | — |
| `claude/*` | AIセッション由来の作業ブランチ。`feature/*` と同等に扱う | — |
| `hotfix/*` | 本番緊急修正。`main` から分岐し、`main` と `develop` の両方へマージ | — |

リリースは `develop` → `main` のPRで行う（本番デプロイのトリガー。詳細は17）。

### 6.2 コミットメッセージ

Conventional Commits形式＋日本語要約とする。

```text
<type>(<scope>): <日本語要約>

type : feat / fix / docs / refactor / test / chore / ci / build
scope: api / mobile / schema / docs / infra / tiles（省略可）
例   : feat(api): API-20 投函と交換抽選を実装
```

### 6.3 プルリクエスト

| 項目 | 規約 |
| --- | --- |
| 粒度 | 1 PR = 1関心事。目安±500行以内（マイグレーション・生成物は除く） |
| 記載事項 | 目的／関連ID（FR・API・SCR等）／変更内容／確認方法（実行したテスト・スクリーンショット） |
| マージ条件 | CI（lint・型チェック・テスト）green必須。squash merge推奨 |
| セルフレビュー | マージ前チェック: 設計書との乖離有無（乖離時は§10.1）、PII・シークレット混入なし、C-01〜C-08違反なし |

### 6.4 禁止事項

- `main` への直接push、CI失敗状態でのマージ。
- 生成物（`dist/`、`.expo/`、`openapi.json`、`node_modules`）のコミット。
- シークレット・APIキー・接続文字列のコミット（`.env*` はgitignore。テンプレは `.env.example` を維持）。
- 11 §3の構造的保証（丸め済み座標のみ保存）を迂回する実装・スキーマ変更（必要な場合は11の改訂とセットでPRする）。

---

## 7. バージョン・環境変数

### 7.1 バージョニング

| 対象 | 方式 |
| --- | --- |
| モバイルアプリ | semver（開発中は0.x）。`versionCode` / `buildNumber` はEASの `autoIncrement`。`runtimeVersion` は `{"policy": "appVersion"}`（OTA互換境界。運用詳細は17） |
| API | 継続デプロイ（バージョンタグなし）。破壊的変更はパスの `/api/v2` 追加で行う（07 §1.1） |

### 7.2 環境変数の3系統

| 系統 | 置き場所 | 規約 |
| --- | --- | --- |
| モバイル | `eas.json` のprofile別env（14 §12） | `EXPO_PUBLIC_*` のみ。**ビルドに埋め込まれるため秘密情報は禁止** |
| API（非秘密） | `wrangler.toml` の `[vars]`（env別） | 例: 環境名、タイルデータセット版 |
| API（秘密） | Wrangler Secrets | 一覧は10 §10.1。設定手順は14 §11 |

---

## 8. ローカル開発フロー

| 操作 | コマンド（標準スクリプト名） |
| --- | --- |
| 依存導入 | `pnpm install` |
| API起動 | `pnpm --filter api dev`（`wrangler dev`。既定 http://localhost:8787） |
| アプリ起動 | `pnpm --filter mobile dev`（`expo start` → development build / シミュレータ） |
| 全体チェック | `pnpm lint` / `pnpm typecheck` / `pnpm test`（ルートで `-r` 実行） |
| マイグレーション | `pnpm --filter api db:generate` → `db:migrate`（対象DBは環境変数で指定。14 §5） |

- ローカルAPIはNeonの `dev` ブランチに接続する（03 §4）。ローカルPostgresは使わないことを基本とし、オフライン開発が必要な場合のみ13 §4.1の代替構成を用いる。
- テストの実行区分・環境は 13 テスト設計書を正とする。

---

## 9. スクリプト・CIの接点

PRで必須となるチェックは以下とする（ワークフロー定義の詳細は17で設計する）。

| チェック | 内容 |
| --- | --- |
| lint | ESLint＋Prettier（`--check`） |
| typecheck | 全パッケージ `tsc --noEmit` |
| test:unit | Vitest（L1。13 §3） |
| test:mobile | jest-expo＋React Native Testing Library（L1'。13 §2.1） |
| test:api | API結合テスト（L2。PRごとのNeonテストブランチ。13 §4.1。M1で追加） |

---

## 10. ドキュメント運用

### 10.1 設計書と実装の同期ルール

| 正とするもの | 同期先 | ルール |
| --- | --- | --- |
| `apps/api/src/db/schema.ts`（Drizzle） | 06 データベース設計書 | 06 §8のとおり実装を正とし、乖離が生じたPRで06を改訂する |
| `@hono/zod-openapi` 生成のOpenAPI | 07 API設計書 | 入出力の変更PRで07を改訂する |
| 04 §3 PRM一覧 | `app_settings` シード＋schema定数ミラー | PRM追加・変更は04改訂→シード→定数の順 |
| その他設計書 | 実装 | 仕様変更を含むPRは該当設計書の改訂を同PRに含める（困難な場合はIssue化しPR本文にリンク） |

### 10.2 BD-xx級の意思決定

配達方式・認証手段のようなプロダクト仕様の決定変更は、README §2のBD表と関連文書の改訂で行う（既存運用の継続）。

### 10.3 ADR（実装レベルの技術判断）

ライブラリ選定・実装方式など、設計書を改訂するほどではない技術判断は `docs/adr/NNN-<slug>.md` に記録する。

```markdown
# ADR-NNN: <タイトル>
- 日付 / ステータス（提案・採用・廃止）
- 背景: なぜ判断が必要になったか
- 決定: 何を選んだか
- 理由: 比較した選択肢と決め手
- 影響: 関連する設計書・コード・SP-xx
```

### 10.4 CLAUDE.md

スキャフォールド時にリポジトリ直下へ `CLAUDE.md` を作成し、次を記載する: 主要コマンド（§8）、本書の要点（C-01〜C-08、依存方向）、設計書の索引（docs/README.md参照）、変更時の設計書同期ルール（§10.1）。

---

## 11. 実装前スパイクと既知の設計課題

### 11.1 実装前スパイク（SP-xx）

実装着手前後に短時間で検証し、結果をADRに記録する技術検証項目。

| SP-ID | 検証内容 | 確認事項 | 影響文書 | 完了条件 |
| --- | --- | --- | --- | --- |
| SP-01 | TurnstileのReact Native組み込み方式 | 不可視ウィジェットをWebView経由で実行しトークンを取得できるか（API-20/50の`turnstileToken`）。不可の場合の代替（Workers側WAF・独自チャレンジ） | 03 §3.1、05 SCR-03/09、07 | 投函フローでトークン検証が通るPoC＋ADR |
| SP-02 | テストDB戦略 | Neonテストブランチ（ローカル・CI）でのマイグレーション適用・リセット・並列制御の実際（13 §4.1） | 13 | 結合テストの雛形1本がCIで安定动作 |
| SP-03 | グラフェム文字数カウントのHermes互換 | `Intl.Segmenter` がHermesで利用可能か。不可なら`grapheme-splitter`等へフォールバック（RN・Workersで同一結果になること） | 04 G-01、05 V-01 | 絵文字ZWJ・結合文字のfixtureが両環境で一致 |
| SP-04 | PMTiles抽出サイズと配信Worker性能 | 日本抽出後のファイルサイズ実測（R2無料枠10GBとの整合）、キャッシュミス時のレイテンシ・CPU時間 | 15、02 §8 | 15 §9の性能目標を満たす計測結果 |
| SP-05 | E2Eテスト用サインイン経路 | Clerkのsign-in token（Backend API発行）でOAuth画面を経由せずE2Eサインインできるか（staging限定・BD-02のソーシャルログインのみ構成でのE2E成立性） | 13 §4.2 | Maestroで認証済み状態から開始できる |
| SP-06 | ユーザー単位レート制限の実現方式 | 07 §1.5の「回/時/ユーザー」をCloudflare Rate Limiting（IPベースが基本）でどう実現するか。WAFカスタムルール（JWTクレーム）かアプリ内実装かを決定 | 07 §1.5 | 方式決定＋07改訂 |

### 11.2 既知の設計課題（文書改訂待ち）

実装前に既存設計書側の解消が必要な事項。担当文書の改訂で解消する。

| 課題 | 関連文書 | 暫定方針 |
| --- | --- | --- |
| アバタープリセットの範囲（枚数・アセット）が未定義（API-11「プリセット範囲内の整数」の範囲） | 05、06 TBL-01、07 API-11 | アセット制作時に枚数を確定し、schema定数＋各文書へ反映 |
| 市区町村マスタ（JIS X 0402）の出典・形式・更新方針が未定義 | 05 SCR-10 | 総務省の全国地方公共団体コードを元にアプリ同梱JSONを生成する方向。政令指定都市の区の扱いを含め実装時に確定 |
| Clerk削除失敗時のリトライが10 §6.3で「JOB-04で再試行」とされているが、08 JOB-04に当該処理の定義がない | 08、10 | JOB-04へ「`status='withdrawn'` かつ `clerk_user_id` 未置換」の再削除処理を追加定義 |
| NT-03タップ後にSCR-11で該当投函を特定表示できない（API-21にリアクション情報がない） | 09 §3.2、07 API-21 | Phase 1は一覧表示のみ（05 §5.11の割り切り）を09にも明記 |

---

## 12. Definition of Done

タスク（PR）の完了条件。

1. 対応する設計書のID（FR/API/SCR等）を満たし、乖離があれば§10.1の同期を実施済み。
2. 13 テスト設計書のレベル定義に従うテストを追加・更新し、CIがgreen。
3. lint・typecheck通過。C-01〜C-08違反なし。
4. ログ・エラー経路に11 §8.1の禁止項目が含まれない。
5. 動作確認の方法（コマンド・画面・スクリーンショット）がPRに記録されている。

---

## 13. 拡張方針

| 対象 | 導入条件 |
| --- | --- |
| Turborepo（タスクキャッシュ） | パッケージ数・CI時間が増え、`pnpm -r` の直列実行が開発の律速になったとき |
| Renovate（依存自動更新） | リリース後、依存更新の手動運用が滞り始めたとき |
| Storybook / ビジュアルリグレッション | Phase 2でUIバリエーションが増えたとき |
| changesets | ライブラリとして外部公開するパッケージが生まれたとき（現状予定なし） |

---

*本書はドラフトであり、スキャフォールド・実装初期の学びに応じて改訂する。*
