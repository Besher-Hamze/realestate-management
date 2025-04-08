import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable this rule globally
      "@typescript-eslint/no-unused-vars": [
        "warn", // Change unused vars to warnings instead of errors
        { vars: "all", args: "none", ignoreRestSiblings: true },
      ],
      "react-hooks/exhaustive-deps": "warn", // Ensure react hooks dependencies are monitored but not errors
      "@typescript-eslint/ban-types": "off", // Disable ban-types to allow using PageProps type
      "@next/next/no-page-custom-font": "off", // Disable warnings for custom fonts in pages
      "typescript-eslint/no-misused-promises": "off", // Disable warnings about Promise return types
    },
    ignorePatterns: [
      ".next/**/*", // Ignore all files in the .next directory
      "node_modules/**/*",
    ],
  },
];

export default eslintConfig;