import type { Core } from '@strapi/strapi';
import ImageKit from 'imagekit';
import { get } from 'lodash';
import { permissions, PLUGIN_ID, Settings } from '../../common';
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
      displayName: 'Settings: Read',
      uid: permissions.settings.read,
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Settings: Change',
      uid: permissions.settings.change,
      pluginName: PLUGIN_ID,
    },
  ];

  await strapi.admin?.services.permission.actionProvider.registerMany(actions);
}

function replaceUrl(data: any, settings: Settings, imagekitClient: ImageKit) {
  for (const key of Object.keys(data)) {
    const property = get(data, key);
    if (property === null || property === undefined) {
      continue;
    }

    if (Array.isArray(property)) {
      replaceUrl(property, settings, imagekitClient);
    } else if (typeof property === 'object') {
      replaceUrl(property, settings, imagekitClient);
    } else if (typeof property === 'string') {
      if (key === 'url') {
        const urlEndpoint = settings.urlEndpoint;
        if (property.startsWith('/')) {
          data[key] = urlEndpoint + property;
        }
        if (data[key].startsWith(urlEndpoint) && settings.isPrivate) {
          data[key] = imagekitClient.url({
            src: data[key],
            signed: true,
          });
        }
      }
    }
  }
}

async function registerTransformResponseDecorator(strapi: Core.Strapi) {
  const controllers = strapi.controllers;
  for (const controller of Object.keys(controllers)) {
    if (controller.startsWith('api::')) {
      const originalTransformer = controllers[controller].transformResponse;
      controllers[controller].transformResponse = async (data, meta) => {
        const settingsService = getService(strapi, 'settings');
        const uploadService = getService(strapi, 'upload');
        const settings = await settingsService.getSettings();
        const imagekitClient = await uploadService.getClient();

        if (settings.enabled && settings.urlEndpoint) {
          replaceUrl(data, settings, imagekitClient);
        }

        return originalTransformer(data, meta);
      };
    }
  }
}

async function registerUploadProvider(strapi: Core.Strapi) {
  const provider = strapi.plugin('upload').provider;
  const uploadService = getService(strapi, 'upload');
  const settingsService = getService(strapi, 'settings');

  Object.keys(provider).forEach((key) => {
    const method = get(uploadService, key);
    if (method) {
      const originalMethod = provider[key];
      provider[key] = async (file: File) => {
        const settings = await settingsService.getSettings();
        if (!settings.uploadEnabled) {
          originalMethod(file);
        } else {
          method(file);
        }

        return file;
      };
    }
  });
}

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  await saveConfig(strapi);
  await addPermissions(strapi);
  await registerTransformResponseDecorator(strapi);
  await registerUploadProvider(strapi);
};

export default bootstrap;
