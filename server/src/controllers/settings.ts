import type { Core } from '@strapi/strapi';
import { permissions } from '../../../common';
import { permissionsChecker } from '../decorators';
import { getService } from '../utils/getService';

const controller = ({ strapi }: { strapi: Core.Strapi }) => {
  const settingsService = getService(strapi, 'settings');

  return permissionsChecker({
    getSettings: {
      permissions: [
        permissions.render(permissions.settings.read),
        permissions.render(permissions.settings.change),
      ],
      apply: async (ctx) => {
        const settings = await settingsService.getSettings();

        if (ctx.state.userAbility.cannot(permissions.render(permissions.settings.change))) {
          return {
            ...settings,
            privateKey: Array.from({ length: settings.privateKey.length }, () => '*').join(''),
          };
        }

        return settings;
      },
    },
    updateSettings: {
      permissions: [permissions.render(permissions.settings.change)],
      apply: async (ctx) => {
        return settingsService.updateSettings(ctx.request.body);
      },
    },
    restoreConfig: {
      permissions: [permissions.render(permissions.settings.change)],
      apply: async (ctx) => {
        return settingsService.restoreConfig();
      },
    },
  });
};

export default controller;
