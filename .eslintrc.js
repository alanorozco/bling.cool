module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    es6: true,
  },
  plugins: ['notice'],
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
    'notice/notice': [
      'error',
      {
        mustMatch: 'Copyright [0-9]{0,4} Alan Orozco',
        templateFile: 'artifacts/license-header.txt',
      },
    ],
  },
  extends: ['plugin:prettier/recommended'],
};
