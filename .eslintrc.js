module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    es6: true,
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^(_$|unused)',
        argsIgnorePattern: '^(_$|unused)',
        args: 'after-used',
        ignoreRestSiblings: false,
      },
    ],
  },
  extends: ['plugin:prettier/recommended'],
};
