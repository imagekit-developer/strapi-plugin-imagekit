import { PLUGIN_ID } from '../../../common';
import { EN } from './en';

type Path<T, Key extends keyof any = keyof T> = Key extends keyof T
  ? T[Key] extends Record<string, any>
    ? T[Key] extends ArrayLike<any>
      ? Key | `${Key & string}.${Path<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
      : Key | `${Key & string}.${Path<T[Key]> & string}`
    : Key
  : never;

export type TranslationPath = Path<EN>;

function flattenObject(obj: any, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], pre + key));
    } else {
      acc[pre + key] = obj[key];
    }
    return acc;
  }, {} as any);
}

type TradOptions = Record<string, string>;

const prefixPluginTranslations = (trad: TradOptions, pluginId: string): TradOptions => {
  if (!pluginId) {
    throw new TypeError("pluginId can't be empty");
  }
  return Object.keys(trad).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = trad[current];
    return acc;
  }, {} as TradOptions);
};

const trads = {
  en: () =>
    import('./en').then((mod) => ({
      default: prefixPluginTranslations(flattenObject(mod.default), `${PLUGIN_ID}`),
    })),
};

export default trads;
