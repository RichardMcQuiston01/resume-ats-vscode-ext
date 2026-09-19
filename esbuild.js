// Bundles the extension host code and the webview script for packaging and debugging.
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  sourcemap: !production,
  minify: production,
  // Prefer jsonc-parser's ESM build: its UMD/CJS build uses a runtime require() for
  // its internal ./impl/* modules that esbuild can't statically bundle, leaving a
  // dangling require in dist/extension.js. The ESM build uses real import statements.
  mainFields: ['module', 'main'],
};

const webviewConfig = {
  entryPoints: ['src/webview/main.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: 'dist/webview.js',
  sourcemap: !production,
  minify: production,
};

async function main() {
  const contexts = await Promise.all(
    [extensionConfig, webviewConfig].map((config) => esbuild.context(config)),
  );

  if (watch) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
  } else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
