# tools/tiles

地図タイル（PMTiles）の生成・スタイル生成スクリプト置き場。

実体は **M3（地図タイル基盤）** で実装する（docs/plans/phase1_implementation_plan.md §3 M3）。

| 予定スクリプト | 内容 | 設計 |
| --- | --- | --- |
| extract-japan | Protomaps公式ビルドから日本領域を `pmtiles extract` で切り出す | docs/15_map_tiles_design.md §3.2 |
| build-style.ts | `@protomaps/basemaps`（light・lang=ja）からstyle.jsonを生成 | 同 §3.3 |
| sync-assets.sh | グリフ・スプライトをR2へ同期 | 同 §3.3 |
