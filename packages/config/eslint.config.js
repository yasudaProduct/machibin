// @machibin/config 共有ESLint設定（flat config。12 §5.2）
// 各パッケージの eslint.config.js から `import base from '@machibin/config/eslint'` で継承する。
import prettier from "eslint-config-prettier";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      "import-x": importX,
    },
    rules: {
      // 12 §5.2: any・非nullアサーションは原則禁止（例外はeslint-disableコメント＋理由）
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 12 §5.2: import順序 builtin → external → @machibin/* → 相対
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@machibin/**", group: "internal" }],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  prettier,
);
