import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // L2（DB結合）テストはファイル直列で実行する（13 §3）。M0時点はL1のみだが方針を先取りする。
    fileParallelism: false,
  },
});
