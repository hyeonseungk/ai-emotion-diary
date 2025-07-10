import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript 관련 규칙들을 warn으로 변경
      "@typescript-eslint/no-unused-vars": "warn",

      // React hooks 관련 규칙들을 warn으로 변경
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
