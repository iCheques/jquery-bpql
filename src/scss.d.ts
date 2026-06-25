declare module '*.scss' {
  /** Compiled, image-inlined CSS string (handled by the Rollup `scss-inline` plugin). */
  const css: string;
  export default css;
}
