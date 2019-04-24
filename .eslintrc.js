module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    es6: true,
    node: true,
  },
  extends: ['plugin:prettier/recommended'],
  plugins: ['disable', 'notice', 'sort-imports-es6-autofix'],
  rules: {
    'no-undef': 1,
    'sort-imports-es6-autofix/sort-imports-es6': [
      'error',
      { ignoreCase: true },
    ],
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^(_$|unused)',
        argsIgnorePattern: '^(_$|unused)',
        args: 'after-used',
        ignoreRestSiblings: false,
      },
    ],
    'notice/notice': [
      'error',
      {
        mustMatch: 'Copyright [0-9]{0,4} Alan Orozco',
        templateFile: 'artifacts/license-header.txt',
      },
    ],
  },
};
