import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import * as sass from 'sass';

import pkg from './package.json' with { type: 'json' };

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * (c) ${pkg.author?.name || pkg.author} — ${pkg.license} License
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
 * zero runtime asset requests. Replaces the legacy node-sass + postcss-base64
 * toolchain, which no longer builds on modern Node.
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

const plugins = [scssInline(), nodeResolve(), commonjs()];

const output = (file, format, extra = {}) => ({
  file,
  format,
  name: 'jqueryBpql',
  exports: 'named',
  banner,
  globals: { jquery: 'jQuery' },
  sourcemap: true,
  ...extra,
});

export default {
  input: 'src/index.js',
  external: ['jquery'],
  plugins,
  output: [
    output(pkg.module, 'es'),
    output(pkg.main, 'cjs'),
    output(pkg.browser, 'umd'),
    output(pkg.unpkg, 'umd', { plugins: [terser({ format: { comments: /^!/ } })] }),
  ],
};
