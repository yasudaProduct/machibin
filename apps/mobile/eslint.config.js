// mobileはeslint-config-expo（RN/Expo固有ルール）を基盤とし、共有規約の要点を上乗せする（12 §5.2）
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*'],
  },
  {
    rules: {
      // 12 §5.2: any・非nullアサーションは原則禁止（例外はeslint-disableコメント＋理由）
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  prettierConfig,
]);
