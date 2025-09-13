// ESLint flat config for TypeScript + Prettier (no type-aware rules to avoid project parsing issues)
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";

export default [
  { ignores: ["dist/**", "node_modules/**", "eslint.config.js", "site/**"], linterOptions: { reportUnusedDisableDirectives: "off" } },
  ...tseslint.configs.recommended,
  {
    plugins: { import: pluginImport },
    rules: {
      // Lint ergonomics for CI
      "import/order": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    },
  },
];


