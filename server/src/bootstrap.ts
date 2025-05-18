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

function toImageKitUrl(src: string, settings: Settings, client: ImageKit): string {
  const endpoint = settings.urlEndpoint;

  if (src.startsWith(endpoint)) {
    return client.url({
      src,
      signed: settings.useSignedUrls,
    });
  }

  if (src.startsWith('/')) {
    return client.url({
      path: src,
      signed: settings.useSignedUrls,
    });
  }

  return src;
}

function transformFormats(
  formats: Record<string, any>,
  url: string,
  settings: Settings,
  client: ImageKit
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [name, fmt] of Object.entries(formats)) {
    if (
      fmt &&
      typeof fmt === 'object' &&
      typeof fmt.url === 'string' &&
      typeof fmt.width === 'number' &&
      typeof fmt.height === 'number'
    ) {
      const transformation = [
        {
          width: fmt.width,
          height: fmt.height,
        },
      ];

      const endpoint = settings.urlEndpoint;
      let path = settings.useTransformUrls ? url : fmt.url;
      let transformedUrl = fmt.url;
      if (path.startsWith(endpoint)) {
        transformedUrl = client.url({
          src: path,
          transformation,
          signed: settings.useSignedUrls,
          expireSeconds: settings.expiry > 0 ? settings.expiry : undefined,
        });
      } else if (path.startsWith('/')) {
        transformedUrl = client.url({
          path,
          transformation,
          signed: settings.useSignedUrls,
          expireSeconds: settings.expiry > 0 ? settings.expiry : undefined,
        });
      }

      result[name] = { ...fmt, url: transformedUrl };
    } else {
      result[name] = fmt;
    }
  }
  return result;
}

function replaceUrl(data: any, settings: Settings, imagekitClient: ImageKit) {
  for (const key of Object.keys(data)) {
    const val = get(data, key);
    if (val === null || val === undefined) continue;

    if (Array.isArray(val) || typeof val === 'object') {
      if (key === 'formats' && typeof val === 'object') {
        data[key] = transformFormats(val, data.url, settings, imagekitClient);
      } else {
        replaceUrl(val, settings, imagekitClient);
      }
    } else if (typeof val === 'string' && key === 'url') {
      data[key] = toImageKitUrl(val, settings, imagekitClient);
    }
  }
}

async function registerTransformResponseDecorator(strapi: Core.Strapi) {
  const controllers = strapi.controllers;
  for (const name of Object.keys(controllers)) {
    if (name.startsWith('api::')) {
      const original = controllers[name].transformResponse;
      controllers[name].transformResponse = async (data, meta) => {
        const settings = await getService(strapi, 'settings').getSettings();
        const imagekitClient = await getService(strapi, 'upload').getClient();

        if (settings.enabled && settings.urlEndpoint) {
          replaceUrl(data, settings, imagekitClient);
        }

        return original(data, meta);
      };
    }
  }
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
  await registerTransformResponseDecorator(strapi);
  await registerUploadProvider(strapi);
};

export default bootstrap;
