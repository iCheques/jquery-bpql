import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';

import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { dts } from 'rollup-plugin-dts';
import * as sass from 'sass';

import pkg from './package.json' with { type: 'json' };

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * (c) ${pkg.author} — ${pkg.license} License
 * ${pkg.homepage}
 */`;

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/**
 * Compile `.scss` imports with Dart Sass and inline every referenced image as a
 * base64 data URI, so the loader ships as a single self-contained string with
 * zero runtime asset requests.
 */
function scssInline() {
  return {
    name: 'scss-inline',
    transform(_code, id) {
      if (extname(id) !== '.scss') {
        return null;
      }
      const dir = dirname(id);
      let css = sass.compile(id, { style: 'compressed', loadPaths: [dir] }).css;

      const imagesDir = join(dir, 'images');
      for (const file of readdirSync(imagesDir)) {
        const mime = MIME[extname(file).toLowerCase()];
        if (!mime) continue;
        const base64 = readFileSync(join(imagesDir, file)).toString('base64');
        css = css.split(`images/${file}`).join(`data:${mime};base64,${base64}`);
        this.addWatchFile(join(imagesDir, file));
      }

      return { code: `export default ${JSON.stringify(css)};`, map: { mappings: '' } };
    },
  };
}

const external = ['jquery'];
const globals = { jquery: 'jQuery' };
const base = {
  name: 'jqueryBpql',
  exports: 'named',
  banner,
  globals,
  sourcemap: true,
};

export default [
  // JavaScript bundles: ESM, CJS, UMD and a minified UMD.
  {
    input: 'src/index.ts',
    external,
    plugins: [
      scssInline(),
      nodeResolve({ extensions: ['.ts', '.mjs', '.js', '.json'] }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    output: [
      { ...base, file: pkg.module, format: 'es' },
      { ...base, file: pkg.main, format: 'cjs' },
      { ...base, file: pkg.browser, format: 'umd' },
      { ...base, file: pkg.unpkg, format: 'umd', plugins: [terser({ format: { comments: /^!/ } })] },
    ],
  },
  // A single bundled type-definition file generated from the TypeScript source.
  {
    input: 'src/index.ts',
    external: [...external, /\.scss$/],
    plugins: [dts()],
    output: { file: pkg.types, format: 'es', banner },
  },
];
