import { Core } from '@strapi/strapi';
import { imagekitMock } from './plugins/imagekit';
import { uploadMock } from './plugins/upload';

type StrapiMockConfig = {
  storeConfig?: any;
  config?: any;
  log?: any;
  imagekitPlugin?: any;
  uploadPlugin?: any;
  query?: any;
};

type StrapiMock = Core.Strapi & { store: jest.Mock };

export const getStrapiMock = ({
  storeConfig,
  config,
  log,
  imagekitPlugin = imagekitMock,
  uploadPlugin = uploadMock,
  query,
}: StrapiMockConfig = {}) =>
  ({
    config,
    log,
    query,
    store: jest.fn().mockImplementation(() => ({
      get: jest.fn(() => Promise.resolve(storeConfig)),
      set: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    })),
    plugin(name: 'upload' | 'imagekit') {
      switch (name) {
        case 'upload':
          return uploadPlugin;
        case 'imagekit':
          return imagekitPlugin;
        default:
          throw new Error(`Unknown plugin: ${name}`);
      }
    },
    controllers: {},
    admin: {
      services: {
        permission: {
          actionProvider: {
            registerMany: jest.fn(() => Promise.resolve()),
          },
        },
      },
    },
    sanitizers: {
      add: jest.fn(),
    },
    getModel: jest.fn(),
  }) as unknown as StrapiMock;
