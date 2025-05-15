import type { Core } from '@strapi/strapi';
import { getService } from '../utils/getService';

const controller = ({ strapi }: { strapi: Core.Strapi }) => {
  const settingsService = getService(strapi, 'settings');

  return {
    getSettings: async (ctx) => {
      return settingsService.getSettings();
    },
    updateSettings: async (ctx) => {
      return settingsService.updateSettings(ctx.request.body);
    },
    restoreConfig: async (ctx) => {
      return settingsService.restoreConfig();
    },
  };
};

export default controller;
