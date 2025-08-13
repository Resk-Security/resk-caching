// ESLint flat config for TypeScript + Prettier (no type-aware rules to avoid project parsing issues)
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";

export default [
  { ignores: ["dist/**", "node_modules/**", "eslint.config.js"] },
  ...tseslint.configs.recommended,
  {
    plugins: { import: pluginImport },
    rules: {
      "import/order": ["warn", { "newlines-between": "always", alphabetize: { order: "asc" } }],
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/consistent-type-definitions": "off"
    },
  },
];


