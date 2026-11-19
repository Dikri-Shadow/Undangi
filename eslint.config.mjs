import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".output/**",
    ".vercel/**",
    ".vinext/**",
    ".wrangler/**",
    "dist/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["app/admin/**/*.tsx", "components/admin/**/*.tsx"],
    rules: {
      // Vinext beta currently throws during next/link RSC prefetch hydration in
      // production. Admin navigation intentionally uses native anchors until
      // the upstream runtime issue is fixed.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
