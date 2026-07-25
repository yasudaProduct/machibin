# ADR-001: Expo SDK選定とビルド・モノレポ運用

- 日付: 2026-07-26
- ステータス: 採用

## 背景

M0（開発基盤）でExpo SDKバージョン・ビルド運用・pnpmモノレポ互換性を確定する必要があった（実装計画 R-02/R-03、12 §2「実装着手時の最新安定版」）。BD-05（iOS 15.1 / Android 7.0）との整合確認も必須（13 M-21の前提）。

## 決定

1. **Expo SDK 57**（scaffold時点の最新安定。React Native 0.86 / React 19.2 / expo-router、テンプレート標準の`src/app`構成）を採用する。
2. **対応OS下限**: RN 0.86の実測値は iOS 15.1（`react_native_pods.rb` の `min_ios_version_supported`）／ Android minSdk 24（`gradle/libs.versions.toml`）。**BD-05と完全一致**のため、03 §5・README BD-05の改訂は不要。
3. **ビルド運用の切替点**: M0〜M1はExpo Go（ネイティブモジュールなし）→ M2で`expo prebuild`によるローカルdevelopment buildへ移行（Clerk・MapLibre導入前）→ M5以降は実機（プッシュ通知）→ M7でEAS Build。Bundle IDはU-02（ドメイン確定）まで未設定とし、prebuild実行前に確定する。
4. **pnpmは既定linker（isolated）のまま**とする。SDK 57＋pnpm 10.33でinstall / lint / typecheck / jest-expoすべて通過したため、`node-linker=hoisted`への切替は行わない（Metro実機バンドルで問題が出た場合に再検討し本ADRを改訂）。
5. **pnpm 10の`onlyBuiltDependencies`**: `esbuild` / `unrs-resolver` / `workerd` のみビルドスクリプトを許可（pnpm-workspace.yaml）。
6. **TypeScriptのバージョン分離**: mobileはSDK 57テンプレート準拠のTS 6系、schema/apiはtypescript-eslint互換を優先しTS 5.9系とする。TS 6では`@types/jest`の自動取り込みが効かないため、mobile tsconfigに`"types": ["jest"]`を明示する。
7. **テスト規約の追記事項**: `@testing-library/react-native` v14は`render()`がPromiseを返すため、**必ずawaitする**（13 TC-J系の実装規約）。

## 理由

- SDK 57はscaffold時点の`create-expo-app@latest`既定であり、BD-05の下限と一致。旧SDKを選ぶ理由がない。
- pnpm isolatedで全チェックが通過した以上、hoisted化（副作用: phantom dependency許容）を先回りで入れる必要はない。
- テンプレートの`src/app`構成は12 §3.1の「app/をパッケージ直下」表記と位置が異なるが、src配下へソースを集約する意図に合致するため、テンプレート標準を尊重する（expo-routerのルーティング詳細は16 モバイルアプリ実装設計書で正式化する際に12 §3.1の表記も追随改訂する）。

## 影響

- 12 §2（pnpm 10系へ改訂済み・v1.3）、12 §3.1（`src/app`表記の追随はM2/16作成時）
- 13（RNTL render await規約はテストコードのコメントで運用。16作成時に明文化）
- 実装計画 R-02/R-03はクローズ（本ADRで解消）
