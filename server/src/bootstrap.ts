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
      const enabled = plugin.config<boolean>('enabled', false);
      const publicKey = plugin.config<string>('publicKey', '');
      const privateKey = plugin.config<string>('privateKey', '');
      const urlEndpoint = plugin.config<string>('urlEndpoint', '');
      const useSignedUrls = plugin.config<boolean>('useSignedUrls', false);
      const expiry = plugin.config<number>('expiry', 0);
      const uploadEnabled = plugin.config<boolean>('uploadEnabled', false);
      const useTransformUrls = plugin.config<boolean>('useTransformUrls', false);
      const uploadOptions = {
        tags: plugin.config<string[]>('uploadOptions.tags', []),
        folder: plugin.config<string>('uploadOptions.folder', ''),
        overwriteTags: plugin.config<boolean>('uploadOptions.overwriteTags', false),
        overwriteCustomMetadata: plugin.config<boolean>(
          'uploadOptions.overwriteCustomMetadata',
          false
        ),
        checks: plugin.config<string>('uploadOptions.checks', ''),
        isPrivateFile: plugin.config<boolean>('uploadOptions.isPrivateFile', false),
      };

      await pluginStore.set({
        key: 'config',
        value: {
          enabled,
          publicKey,
          privateKey,
          urlEndpoint,
          useSignedUrls,
          expiry,
          uploadEnabled,
          uploadOptions,
          useTransformUrls,
        },
      });
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

// Export functions for testing
export { addPermissions, registerUploadProvider, saveConfig };
