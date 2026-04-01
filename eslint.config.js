import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-console": "warn"
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", ".venv/**", "**/*.py", "**/__pycache__/**"]
  }
];
