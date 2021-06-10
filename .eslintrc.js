module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  env: {
    node: true,
    es6: true
  },
  rules: {
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-extra-parens": "off",
    "@typescript-eslint/no-extra-parens": ["error"],

    "max-statements": ["error", 100],
    "max-lines-per-function": ["error", 200],
    "max-len": ["error", 120],
    "padded-blocks": ["error", "never"],
    "object-property-newline": "off",
    "object-curly-newline": ["error", { multiline: true, consistent: true }],
    "multiline-ternary": "off",

    "no-console": "off",
    "no-process-env": "off",

    "quote-props": ["error", "consistent-as-needed"],
    "one-var": "off",
    "no-ternary": "off",
    "no-confusing-arrow": "off",
    "no-await-in-loop": "off",
    "no-magic-numbers": "off",
    "no-new": "off",
    "require-await": "off",
    "class-methods-use-this": "off",
    "@typescript-eslint/camelcase": "off",
    "global-require": "off",
    "callback-return": "off",
    "no-plusplus": "off",
    "max-params": ["error", 6],
    "no-mixed-operators": "off",
    "function-paren-newline": "off",
    "function-call-argument-newline": "off",
    "default-case": "off"
  },
};