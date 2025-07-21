// ESLint flat config for backend (Node.js)
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      // Ajoute ici tes règles personnalisées si besoin
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
      semi: ["warn", "always"],
    },
    ignores: ["node_modules/", "dist/", "package-lock.json"],
  },
]);
