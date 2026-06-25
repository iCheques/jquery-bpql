import jquery from 'jquery';
import once from './once';
import styles from './styles.scss';

let stylesInjected = false;

/** Inject the loader stylesheet once, the first time a loader is rendered. */
function injectStyles() {
  if (stylesInjected) {
    return;
  }
  stylesInjected = true;
  jquery('<style>')
    .attr('data-jquery-bpql', '')
    .text(styles)
    .appendTo('head');
}

/**
 * Build the default BIPBOP "robot" loader element. Created lazily so importing
 * the library has no side effects on the DOM (safe for SSR/bundling).
 *
 * @returns {JQuery} Detached loader element.
 */
function buildLoader() {
  injectStyles();

  const container = jquery('<div>', { class: 'bipbop-loader' });
  const circles = jquery('<div>', { class: 'floatingCirclesG' }).appendTo(container);
  const robot = jquery('<div>', { class: 'robo' }).appendTo(container);

  jquery('<div>', { class: 'body' }).appendTo(robot);
  jquery('<div>', { class: 'left-arm' }).appendTo(robot);
  jquery('<div>', { class: 'right-arm' }).appendTo(robot);

  for (let i = 1; i <= 4; i += 1) {
    jquery('<div>', { class: `itens item${i}` }).appendTo(robot);
  }
  for (let i = 1; i <= 8; i += 1) {
    jquery('<div>', { class: `f_circleG frotateG_0${i}` }).appendTo(circles);
  }

  return container;
}

/**
 * Global loader preferences.
 *
 * @namespace defaults
 * @property {JQuery|null} loader   Element shown while a request is in flight.
 *   Defaults to the BIPBOP robot (built on first use). Assign your own jQuery
 *   element to fully customize it.
 * @property {boolean} automaticLoader Whether `$.bpql` shows the loader
 *   automatically. Set to `false` to opt out globally.
 */
export const defaults = {
  loader: null,
  automaticLoader: true,
};

/**
 * Reference-counted controller so concurrent requests share a single overlay
 * and the loader is only removed once the last request settles.
 */
class LoaderController {
  constructor() {
    this.count = 0;
    this.element = null;
  }

  show() {
    this.count += 1;
    if (this.count === 1) {
      if (!defaults.loader) {
        defaults.loader = buildLoader();
      }
      this.element = defaults.loader;
      jquery('body').append(this.element);
    }
    return once(() => this.hide());
  }

  hide() {
    if (this.count === 0) {
      return;
    }
    this.count -= 1;
    if (this.count === 0 && this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

const controller = new LoaderController();

/**
 * Decorate jQuery.ajax settings so the loader is shown on `beforeSend` and
 * dismissed on `complete`, while preserving any handlers the caller supplied.
 * Honors `defaults.automaticLoader`.
 *
 * @param {Object} settings jQuery.ajax settings.
 * @returns {Object} New settings object (the input is left untouched).
 */
export function attachLoader(settings) {
  if (!defaults.automaticLoader) {
    return settings;
  }

  const { beforeSend, complete } = settings;
  let dismiss = null;

  return jquery.extend({}, settings, {
    beforeSend(...args) {
      dismiss = controller.show();
      return beforeSend ? beforeSend.apply(this, args) : undefined;
    },
    complete(...args) {
      if (complete) {
        complete.apply(this, args);
      }
      if (dismiss) {
        dismiss();
      }
    },
  });
}
