import type { Core } from '@strapi/strapi';
import { getService } from '../utils/getService';

const controller = ({ strapi }: { strapi: Core.Strapi }) => {
  const settingsService = getService(strapi, 'settings');

  return {
    getSettings: async (ctx) => {
      return settingsService.getSettings();
    },
    updateSettings: async (ctx) => {
      const { publicKey, privateKey, urlEndpoint, isPrivate, uploadEnabled } = ctx.request.body;
      return settingsService.updateSettings({
        publicKey,
        privateKey,
        urlEndpoint,
        isPrivate,
        uploadEnabled,
      });
    },
    restoreConfig: async (ctx) => {
      return settingsService.restoreConfig();
    },
  };
};

export default controller;
