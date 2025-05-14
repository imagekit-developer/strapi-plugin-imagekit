import { get, isArray } from 'lodash';
import { PLUGIN_ID } from '.';

const settings = {
  read: 'settings.read',
  change: 'settings.change',
} as const;

type Settings = typeof settings;

const render = (uid: Settings[keyof Settings]) => `plugin::${PLUGIN_ID}.${uid}`;

export const permissions = {
  render,
  settings,
} as const;

export type Permissions = typeof permissions;

export const pluginPermissions = {
  settings: [{ action: permissions.render(permissions.settings.read), subject: null }],
  settingsChange: [{ action: permissions.render(permissions.settings.change), subject: null }],
};

export const flattenPermissions = Object.keys(pluginPermissions).reduce(
  (acc: Array<unknown>, key: string) => {
    const item = get(pluginPermissions, key);
    if (isArray(item)) {
      return [...acc, ...item];
    }
    return [...acc, item];
  },
  []
);
