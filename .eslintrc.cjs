/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: false,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ["dist", "node_modules", "coverage"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": "error",
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "playwright", message: "@aiquaa/mcp-qa-core must not depend on tool-specific packages." },
          { name: "@playwright/test", message: "@aiquaa/mcp-qa-core must not depend on tool-specific packages." },
          { name: "newman", message: "@aiquaa/mcp-qa-core must not depend on tool-specific packages." },
          { name: "postman-collection", message: "@aiquaa/mcp-qa-core must not depend on tool-specific packages." }
        ]
      }
    ]
  }
};
