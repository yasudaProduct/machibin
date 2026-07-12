# API設計書

**プロダクト名:** まちびん
**サブタイトル:** 「おすすめ場所」ランダム交換サービス

---

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
| --- | --- | --- | --- |
| 1.0 | 2026-07-12 | Claude | 初版作成 |
| 1.1 | 2026-07-12 | Claude | BD-01改訂(即時配達方式)を反映し、API-20/API-30のレスポンス仕様を更新 |

## 文書情報

| 項目 | 内容 |
| --- | --- |
| 文書名 | まちびん API設計書 |
| ステータス | ドラフト |
| 実行基盤 | Cloudflare Workers ＋ Hono（TypeScript） |
| 関連文書 | 02 アーキテクチャ設計書 §4・§5、04 機能設計書、06 データベース設計書、10 認証・認可設計書 |

---

## 1. 共通仕様

### 1.1 基本事項

| 項目 | 内容 |
| --- | --- |
| 方式 | REST（JSON） |
| ベースURL | `https://api.machibin.app/api/v1` ※ドメインは仮。取得後に確定 |
| 文字コード | UTF-8 |
| 日時形式 | ISO 8601（UTC。例: `2026-07-12T10:00:00Z`）。表示時のJST変換はクライアント責務 |
| 命名 | パス: ケバブ/複数形、JSONフィールド: camelCase |
| バージョニング | パスプレフィックス `/api/v1`。破壊的変更時にv2を追加 |

### 1.2 認証（詳細は 10 認証・認可設計書）

- 認証必須APIは `Authorization: Bearer <ClerkセッショントークンJWT>` を要求する。
- Workers側でJWKS検証し、`clerk_user_id` → `profiles.id` を解決してコンテキストに設定する。
- ロールは `user` / `admin`（ClerkのpublicMetadata.roleクレームで判定。BD-04）。

### 1.3 共通エラー形式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "コメントは20文字以上で入力してください。",
    "details": [{ "field": "comment", "reason": "minLength" }]
  }
}
```

| HTTP | code | 発生条件 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値不正（detailsに項目別理由） |
| 401 | UNAUTHORIZED | トークンなし・無効・期限切れ |
| 403 | FORBIDDEN | 権限不足（admin API等）、停止中アカウント（ACCOUNT_SUSPENDED を code に使用） |
| 403 | TURNSTILE_FAILED | Turnstileトークン検証失敗 |
| 404 | NOT_FOUND | リソースなし（他人のリソースへのアクセスも404で秘匿） |
| 409 | CONFLICT | 重複操作（例: ALREADY_REACTED、ALREADY_REGISTERED） |
| 422 | POST_LIMIT_EXCEEDED | 1日の投函上限超過（PRM-05） |
| 429 | RATE_LIMITED | レート制限（Cloudflare Rate Limiting / アプリ判定） |
| 500 | INTERNAL_ERROR | サーバー内部エラー（Sentryへ通知） |

### 1.4 ページネーション

- カーソル方式。`?cursor=<opaque>&limit=20`（limit上限50）。
- レスポンスは `{ "items": [...], "nextCursor": "..." | null }`。

### 1.5 レート制限（Cloudflare Rate Limiting。値はPRM相当で運用調整）

| 対象 | 制限（初期値） |
| --- | --- |
| POST /spots | 10回/時/ユーザー（別途 PRM-05 で1日上限） |
| POST /reports | 10回/日/ユーザー |
| その他認証API | 120回/分/ユーザー |
| Webhook・health | Cloudflare WAF既定 |

---

## 2. エンドポイント一覧

| API-ID | メソッド | パス | 概要 | 認可 | 関連機能 |
| --- | --- | --- | --- | --- | --- |
| API-01 | GET | /health | 死活監視 | 不要 | NFR-O04 |
| API-02 | POST | /webhooks/clerk | Clerk Webhook受信 | Svix署名 | FR-01 |
| API-10 | GET | /me | 自分のプロフィール取得 | user | FR-02 |
| API-11 | PATCH | /me | プロフィール更新（初回設定含む） | user | FR-02 |
| API-12 | DELETE | /me | 退会 | user | FR-01 |
| API-13 | PUT | /me/notification-settings | 通知設定更新 | user | FR-09 |
| API-14 | POST | /me/push-tokens | プッシュトークン登録 | user | FR-09 |
| API-15 | DELETE | /me/push-tokens | プッシュトークン削除（ログアウト時） | user | FR-09 |
| API-20 | POST | /spots | スポット投函＋交換抽選 | user | FR-03, FR-04 |
| API-21 | GET | /me/spots | 自分の投函一覧（visited累計はAPI-10で取得） | user | FR-07 |
| API-30 | GET | /home | ホーム画面サマリ | user | FR-05 |
| API-40 | GET | /collection | 場所帳一覧（リスト/地図bbox） | user | FR-07 |
| API-41 | GET | /collection/{id} | 場所帳アイテム詳細 | user | FR-05, FR-07 |
| API-42 | PATCH | /collection/{id} | 訪問ステータス更新 | user | FR-07 |
| API-43 | POST | /collection/{id}/reactions | リアクション付与 | user | FR-06 |
| API-50 | POST | /reports | 通報 | user | FR-08 |
| API-60 | POST | /admin/seed-spots | シードスポット一括投入 | admin | FR-10 |
| API-61 | GET | /admin/reports | 通報一覧 | admin | NFR-O01 |
| API-62 | PATCH | /admin/reports/{id} | 通報対応（非表示/停止の実行） | admin | NFR-O01 |
| API-63 | PATCH | /admin/spots/{id} | スポットステータス変更 | admin | NFR-O01 |
| API-64 | PATCH | /admin/users/{id} | ユーザーステータス変更 | admin | NFR-O01 |

---

## 3. エンドポイント詳細

### API-02 POST /webhooks/clerk

Clerkのイベント（`user.created` / `user.deleted`）を受信する。Svix署名（`svix-id` / `svix-timestamp` / `svix-signature`）を検証し、`svix-id` を `webhook_events`（TBL-11）に記録して冪等化する。

| イベント | 処理 |
| --- | --- |
| user.created | `profiles` に空レコード作成（clerk_user_idのみ） |
| user.deleted | 退会処理（API-12と同一のデータ削除処理。Clerkダッシュボード起点の削除に対応） |

レスポンス: `204 No Content`（処理済みイベントの再送も204）。

### API-10 GET /me

```json
// 200
{
  "id": "uuid",
  "nickname": "ゆうた",
  "avatarId": 3,
  "homeArea": { "code": "13106", "label": "東京都台東区" },
  "bio": "散歩が好きです",
  "onboardingCompleted": true,
  "notificationSettings": { "delivery": true, "reaction": true },
  "visitedCount": 12
}
```

- `onboardingCompleted`: nickname設定・年齢確認・規約同意がすべて完了しているか（SCR-10の表示判定に使用）。
- `visitedCount`: 自分の投稿が「行ってきた」された累計（FR-07。本人のみ閲覧可）。

### API-11 PATCH /me

```json
// リクエスト（すべて任意。初回設定時はnickname・ageConfirmed・tosAgreedを送信）
{
  "nickname": "ゆうた",
  "avatarId": 3,
  "homeArea": { "code": "13106", "label": "東京都台東区" },
  "bio": "散歩が好きです",
  "ageConfirmed": true,
  "tosAgreed": true
}
```

| 項目 | チェック |
| --- | --- |
| nickname | 1〜20文字（PRM-08） |
| avatarId | プリセット範囲内の整数 |
| homeArea.code | JIS X 0402 5桁。labelとの整合はクライアント提供のマスタに委ねる |
| bio | 50文字以内（PRM-09） |
| ageConfirmed / tosAgreed | trueのみ受理（falseへの変更不可）。受理時に `age_confirmed_at` / `tos_agreed_at` を記録 |

### API-12 DELETE /me

退会。DB側のデータ削除・匿名化（06 §7.1）を実行後、Clerk Backend APIでClerkユーザーを削除する。処理順序・失敗時の扱いは 10 認証・認可設計書 §6。

レスポンス: `204 No Content`。

### API-13 PUT /me/notification-settings

```json
// リクエスト
{ "delivery": true, "reaction": false }
```

- `delivery`は統合後のNT-01（交換成立・配達通知）の受信可否（`profiles.notify_delivery`）。`exchange`フィールドはPhase 1では受け付けない（`notify_exchange`列はPhase 2の朝夕ウィンドウ配達モード復活時に再利用するための予約列。06 §TBL-01、09 §7）。

### API-14 POST /me/push-tokens

```json
// リクエスト
{ "expoPushToken": "ExponentPushToken[xxxx]", "platform": "ios" }
```

- 既存トークンの場合は所有者を現ユーザーに付け替え、`disabled_at` を解除する（端末の使い回し対応）。

### API-15 DELETE /me/push-tokens

```json
// リクエスト
{ "expoPushToken": "ExponentPushToken[xxxx]" }
```

### API-20 POST /spots（コアAPI）

スポット投函と交換抽選を1トランザクションで行う（UC-01）。処理仕様の詳細は 04 機能設計書 §3.3。

```json
// リクエスト
{
  "name": "喫茶ロマン",
  "latitude": 35.7115,
  "longitude": 139.7967,
  "categoryCode": "cafe",
  "comment": "昭和から続く喫茶店。窓際の席から見える路地の景色が最高です。",
  "turnstileToken": "XXXX.DUMMY.TOKEN",
  "idempotencyKey": "3f1c..."
}
```

| 項目 | チェック |
| --- | --- |
| name | 1〜50文字 |
| latitude / longitude | 日本国内の有効範囲。**サーバーで座標丸めを再検証**（geohash7セル中心へスナップ。11 プライバシー設計書 §3） |
| categoryCode | CD-01のいずれか |
| comment | PRM-01（20文字）〜PRM-02（300文字） |
| turnstileToken | Cloudflare Turnstile検証（NFR-S03） |
| idempotencyKey | 任意。同一キーの再送は初回結果を返す（通信リトライでの二重投函防止） |

```json
// 201（在庫十分。抽選成立し同一トランザクション内で配達まで完了）
{
  "spot": { "id": "uuid", "name": "喫茶ロマン", "categoryCode": "cafe" },
  "exchange": {
    "id": "uuid",
    "status": "delivered",
    "deliveredAt": "2026-07-12T10:00:08Z"
  },
  "collectionItemId": "uuid"
}
```

```json
// 201（在庫不足。抽選候補0件）
{
  "spot": { "id": "uuid", "name": "喫茶ロマン", "categoryCode": "cafe" },
  "exchange": {
    "id": "uuid",
    "status": "pending"
  }
}
```

- 交換抽選で候補が見つかった場合、API-20と同一トランザクション内で場所帳スナップショット生成（`collection_items`）まで完了させ、`exchange.status = "delivered"` ・配達時刻 `deliveredAt`（投函から数秒後）を返す。`collectionItemId` は生成された場所帳アイテムのIDで、SCR-04が数秒の演出後にSCR-05へ遷移する際に用いる。
- 抽選候補が0件の場合も201で受理し、`exchange.status = "pending"` を返す（在庫不足時のみ非同期の再抽選ジョブが処理する。08 バッチ設計書）。
- 1日の投函上限（PRM-05）超過時は `422 POST_LIMIT_EXCEEDED`。

### API-21 GET /me/spots

自分の投函一覧。`?cursor=&limit=`。

```json
// 200
{
  "items": [
    {
      "id": "uuid",
      "name": "喫茶ロマン",
      "categoryCode": "cafe",
      "status": "active",
      "createdAt": "2026-07-10T02:15:00Z"
    }
  ],
  "nextCursor": null
}
```

### API-30 GET /home

ホーム画面（SCR-02）用サマリ。

```json
// 200
{
  "pendingDeliveries": [
    { "exchangeId": "uuid", "status": "pending" }
  ],
  "recentItems": [
    { "collectionItemId": "uuid", "spotName": "夕焼けだんだん", "deliveredAt": "2026-07-11T22:00:12Z", "hasReaction": false }
  ],
  "todayPostCount": 1,
  "todayPostLimit": 5
}
```

- 即時配達方式（BD-01）では、投函時に抽選候補があればAPI-20の時点で`delivered`まで完了するため、`pendingDeliveries[]`に残るのは基本的に在庫不足で`status = "pending"`のまま保留されている交換のみとなる。
- `deliverAt`のような確定配達予定時刻のフィールドは、Phase 1では非同期の再抽選ジョブの成立タイミング依存であり事前確定できないため、実質的に使用しない見込みである。

### API-40 GET /collection

場所帳。一覧表示は `?cursor=&limit=`、地図表示は `?bbox=minLng,minLat,maxLng,maxLat`（bbox指定時はカーソルなし・上限200件）。`?visited=true|false` で絞り込み可。

```json
// 200
{
  "items": [
    {
      "id": "uuid",
      "spotName": "夕焼けだんだん",
      "location": { "latitude": 35.727, "longitude": 139.767 },
      "categoryCode": "scenery",
      "visitedAt": null,
      "deliveredAt": "2026-07-11T22:00:12Z"
    }
  ],
  "nextCursor": null
}
```

### API-41 GET /collection/{id}

```json
// 200
{
  "id": "uuid",
  "spotId": "uuid",
  "spotName": "夕焼けだんだん",
  "location": { "latitude": 35.727, "longitude": 139.767 },
  "categoryCode": "scenery",
  "comment": "階段の上から見る夕日が本当にきれいです。猫もいます。",
  "senderAreaLabel": "東京都荒川区",
  "visitedAt": null,
  "deliveredAt": "2026-07-11T22:00:12Z",
  "reactions": [{ "type": "want_to_go", "createdAt": "2026-07-12T01:00:00Z" }],
  "reportable": true
}
```

- `senderAreaLabel` は市区町村レベルのみ（NFR-PR02）。差出人のニックネーム等は返さない。
- `spotId` は原本スポットへの参照で、通報（API-50）の `targetId` に使用する。原本が削除済みの場合はnull。`reportable` は原本が存在し通報可能な場合のみtrue（falseの場合、画面は通報導線を出さない）。

### API-42 PATCH /collection/{id}

```json
// リクエスト
{ "visited": true }
```

- `visited: true` で `visited_at = now()`、`false` で取り消し（NULL化）。

### API-43 POST /collection/{id}/reactions

```json
// リクエスト
{ "type": "visited", "reportComment": "行ってきました。夕日の時間は混みますが最高でした。" }
```

| 項目 | チェック |
| --- | --- |
| type | CD-07（want_to_go / visited） |
| reportComment | `visited` のときのみ許可。200文字以内（PRM-07）。任意 |

- 同一typeの重複は `409 ALREADY_REACTED`。
- リアクションの取り消しAPIは提供しない（Phase 1の意図的な仕様。04 §4.6。画面側は付与前に確認を挟む）。
- 付与後、投稿者（原本が存在し、通知許可がある場合のみ）へNT-03通知（09 通知設計書）。

### API-50 POST /reports

```json
// リクエスト
{
  "targetType": "spot",
  "targetId": "uuid",
  "reasonCode": "inappropriate_content",
  "detail": "コメントに個人宅の住所らしき記載があります。",
  "turnstileToken": "XXXX.DUMMY.TOKEN"
}
```

- `targetId` は、spot通報の場合は原本スポットID（API-41の `spotId`）、user通報の場合は対象ユーザーID。
- `turnstileToken` はTurnstile検証必須（NFR-S03。API-20と同様）。

処理（04 機能設計書 §3.8）:
1. `reports` 登録（spot通報時は投稿者を `target_user_id` に解決）。
2. `blocks` に通報者→対象ユーザーの除外関係を登録（既存なら何もしない）。
3. 同一スポットへのopen通報がしきい値（PRM-06）以上なら `status='hidden'` に自動変更。

### API-60 POST /admin/seed-spots

```json
// リクエスト（最大100件/回）
{
  "spots": [
    {
      "name": "谷中ぎんざ",
      "latitude": 35.7276,
      "longitude": 139.7663,
      "categoryCode": "shop",
      "comment": "夕方に行くと総菜の食べ歩きができます。階段からの夕日も有名です。",
      "senderAreaLabel": "東京都台東区"
    }
  ]
}
```

- `kind='seed'` で登録。通常投稿と同一のバリデーション（コメント最低文字数・座標丸め）を適用する（FR-10）。
- `senderAreaLabel` はシード配達時の差出人エリア表示に使用（運営が地域を設定）。`spots.seed_area_label`（TBL-03）に保存し、配達スナップショット生成時に `collection_items.sender_area_label` へ複製する。

### API-61 GET /admin/reports

`?status=open&cursor=&limit=`。通報一覧（対象スポット内容・投稿者の通報累計を含む）。

### API-62 PATCH /admin/reports/{id}

```json
// リクエスト
{ "status": "resolved", "actionCode": "hide_spot" }
```

- `actionCode` に応じて対象スポットの非表示化（CD-02: hidden）／対象ユーザーの停止（CD-06: suspended）を同時に実行する。

### API-63 / API-64（個別のステータス変更）

```json
// PATCH /admin/spots/{id}
{ "status": "hidden" }
// PATCH /admin/users/{id}
{ "status": "suspended" }
```

---

## 4. 認可マトリクス（要約。詳細は 10 認証・認可設計書 §5）

| ロール | 可能な操作 |
| --- | --- |
| 未認証 | API-01、API-02（署名検証あり）のみ |
| user（active） | API-10〜API-50。自分のリソースのみ（他人のIDを指定しても404） |
| user（suspended） | API-10・API-12・API-15（ログアウト時のトークン削除）のみ許可。API-20等は403 ACCOUNT_SUSPENDED |
| admin | userの全操作＋API-60〜64 |

---

## 5. 拡張方針（Phase 2以降）

| 追加予定 | 内容 |
| --- | --- |
| POST /spots の `distanceMode` パラメータ | ご近所／遠距離／完全ランダムの指定（FR-11）。抽選クエリに `ST_DWithin` 条件を追加 |
| GET /themes、POST /spots の `themeId` | お題交換（FR-12） |
| 交換リクエストへの現在地付与 | 旅先モード（FR-13）。丸め済み現在地のみ送信 |

---

*本書はドラフトであり、実装時にOpenAPI定義（Hono zod-openapi等）を生成して本書と同期する。*
