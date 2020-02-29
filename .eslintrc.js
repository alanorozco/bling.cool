module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
  },
  extends: ['plugin:prettier/recommended'],
  plugins: ['disable', 'notice', 'sort-imports-es6-autofix', 'import'],
  rules: {
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-commonjs': 'error',
    'import/no-duplicates': 'error',
    'import/no-restricted-paths': [
      'error',
      { zones: [{ target: './src', from: './builder' }] },
    ],
    'no-undef': 'error',
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
