const globals = require("globals");
const js = require("@eslint/js");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig({
    files: ["**/*.js"],
    plugins: {
        js,
    },
    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
    extends: [js.configs.recommended]
});