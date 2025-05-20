import type { Core } from '@strapi/strapi';
import { get } from 'lodash';
import { permissions, PLUGIN_ID } from '../../common';
import { File } from './services/upload.service';
import { getService } from './utils/getService';

async function saveConfig(strapi: Core.Strapi) {
  if (strapi.store) {
    const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID });
    const config = await pluginStore.get({ key: 'config' });
    if (!config) {
      const plugin = strapi.plugin(PLUGIN_ID);
      const publicKey = plugin.config<string>('publicKey', '');
      const privateKey = plugin.config<string>('privateKey', '');
      const urlEndpoint = plugin.config<string>('urlEndpoint', '');

      await pluginStore.set({ key: 'config', value: { publicKey, privateKey, urlEndpoint } });
    }
  }
}

async function addPermissions(strapi: Core.Strapi) {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Access ImageKit Media Library',
      uid: permissions.mediaLibrary.read,
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Settings: Read',
      subCategory: 'settings',
      uid: permissions.settings.read,
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Settings: Change',
      subCategory: 'settings',
      uid: permissions.settings.change,
      pluginName: PLUGIN_ID,
    },
  ];

  await strapi.admin?.services.permission.actionProvider.registerMany(actions);
}

async function registerUploadProvider(strapi: Core.Strapi) {
  const provider = strapi.plugin('upload').provider;
  const uploadService = getService(strapi, 'upload');
  const settingsService = getService(strapi, 'settings');

  Object.keys(uploadService).forEach((methodName) => {
    const method = get(uploadService, methodName);
    if (method) {
      const originalMethod = provider[methodName];
      provider[methodName] = async (file: File) => {
        const settings = await settingsService.getSettings();
        if (settings.uploadEnabled) {
          return await method(file);
        }

        return await originalMethod(file);
      };
    }
  });
}

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  await saveConfig(strapi);
  await addPermissions(strapi);
  await registerUploadProvider(strapi);
};

export default bootstrap;
