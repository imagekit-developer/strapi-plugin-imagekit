import type { Core } from '@strapi/strapi';
import { async, traverseEntity } from '@strapi/utils';
import { Data, Model } from '@strapi/utils/dist/types';
import ImageKit from 'imagekit';
import { curry } from 'lodash/fp';
import { Settings } from '../../common';
import { getService } from './utils/getService';

function toImageKitUrl(src: string, settings: Settings, client: ImageKit): string {
  const endpoint = settings.urlEndpoint;

  if (!endpoint) {
    return src;
  }

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
      const transformation = settings.useTransformUrls
        ? [
            {
              width: fmt.width,
              height: fmt.height,
            },
          ]
        : [];

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

const convertToImageKitUrls = curry(async (schema: Model, entity: Data) => {
  const uploadService = getService(strapi, 'upload');
  const settingsService = getService(strapi, 'settings');
  const settings = await settingsService.getSettings();
  const client = await uploadService.getClient();

  if (!settings.enabled) {
    return entity;
  }

  return traverseEntity(
    (args, functions) => {
      const { schema, key, attribute, path, value, data } = args;
      const { set } = functions;
      if (attribute?.type === 'string' && key === 'url' && schema.uid === 'plugin::upload.file') {
        set(key, toImageKitUrl(value as string, settings, client) as any);
      }
      if (attribute?.type === 'json' && key === 'formats' && schema.uid === 'plugin::upload.file') {
        set(
          key,
          transformFormats(value as Record<string, any>, data.url as string, settings, client)
        );
      }
    },
    { schema, getModel: strapi.getModel.bind(strapi) },
    entity
  );
});

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.sanitizers.add(
    'content-api.output',
    curry((schema: Model, entity: Data) => {
      return async.pipe(convertToImageKitUrls(schema))(entity);
    })
  );
};
