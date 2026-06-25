import jquery from 'jquery';
import once from './once';
import styles from './styles.scss';

/** Loader preferences used by `$.bpql`. */
export interface BPQLDefaults {
  /** Element shown while a request is in flight (defaults to the robot). */
  loader: JQuery | null;
  /** Whether `$.bpql` shows the loader automatically. */
  automaticLoader: boolean;
}

let stylesInjected = false;

/** Inject the loader stylesheet once, the first time a loader is rendered. */
function injectStyles(): void {
  if (stylesInjected) {
    return;
  }
  stylesInjected = true;
  jquery('<style>').attr('data-jquery-bpql', '').text(styles).appendTo('head');
}

/**
 * Build the default robot loader element. Created lazily so importing the
 * library has no side effects on the DOM (safe for SSR/bundling).
 */
function buildLoader(): JQuery {
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

/** Global loader preferences (see {@link BPQLDefaults}). */
export const defaults: BPQLDefaults = {
  loader: null,
  automaticLoader: true,
};

/**
 * Reference-counted controller so concurrent requests share a single overlay
 * and it is only removed once the last request settles.
 */
class LoaderController {
  private count = 0;

  private element: JQuery | null = null;

  show(): () => void {
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

  hide(): void {
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
 * dismissed on `complete`, preserving any handlers the caller supplied. Honors
 * `defaults.automaticLoader`. Returns a new object; the input is untouched.
 */
export function attachLoader(settings: JQuery.AjaxSettings): JQuery.AjaxSettings {
  if (!defaults.automaticLoader) {
    return settings;
  }

  const { beforeSend, complete } = settings;
  let dismiss: (() => void) | null = null;

  return jquery.extend({}, settings, {
    beforeSend(this: unknown, ...args: unknown[]): unknown {
      dismiss = controller.show();
      return beforeSend ? (beforeSend as (...a: unknown[]) => unknown).apply(this, args) : undefined;
    },
    complete(this: unknown, ...args: unknown[]): void {
      if (complete) {
        (complete as (...a: unknown[]) => unknown).apply(this, args);
      }
      if (dismiss) {
        dismiss();
      }
    },
  });
}
