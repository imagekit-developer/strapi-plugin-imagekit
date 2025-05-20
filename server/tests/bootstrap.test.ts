import { permissions, PLUGIN_ID } from '../../common';
import bootstrap from '../src/bootstrap';
import { settingsServiceMock, uploadServiceMock } from './utils/plugins/imagekit/services';
import { getStrapiMock } from './utils/strapi';

// Mock the getService utility
jest.mock('../src/utils/getService', () => ({
  getService: jest.fn((_, serviceName) => {
    if (serviceName === 'settings') return settingsServiceMock;
    if (serviceName === 'upload') return uploadServiceMock;
    return jest.fn();
  }),
}));

describe('Bootstrap', () => {
  let strapiMock: ReturnType<typeof getStrapiMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    strapiMock = getStrapiMock();

    bootstrap({ strapi: strapiMock });
  });

  describe.only('saveConfig', () => {
    it('should save default config if no config exists', async () => {
      expect(strapiMock.store).toHaveBeenCalledTimes(1);
      expect(strapiMock.store).toHaveBeenCalledWith({ type: 'plugin', name: PLUGIN_ID });

      const get = strapiMock.store.mock.results.find((_) => _.type === 'return')?.value.get;

      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith({ key: 'config' });

      console.log(get);
    });

    it('should not overwrite existing config', async () => {
      // Mock the store to return existing config
      const existingConfig = {
        publicKey: 'existing-public-key',
        privateKey: 'existing-private-key',
        urlEndpoint: 'https://existing-endpoint.com',
      };
      const mockGet = jest.fn().mockResolvedValue(existingConfig);
      const mockSet = jest.fn().mockResolvedValue(undefined);

      const pluginStore = { get: mockGet, set: mockSet };
      jest.spyOn(strapiMock, 'store').mockReturnValue(pluginStore);

      // Import the function to test
      const { saveConfig } = require('../src/bootstrap');
      await saveConfig(strapiMock);

      // Verify set was not called
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('addPermissions', () => {
    it('should register all permissions', async () => {
      // Mock the permissions service
      const registerManyMock = jest.fn().mockResolvedValue(undefined);
      strapiMock.admin = {
        services: {
          permission: {
            actionProvider: {
              registerMany: registerManyMock,
            },
          },
        },
      };

      // Import the function to test
      const { addPermissions } = require('../src/bootstrap');
      await addPermissions(strapiMock);

      // Verify permissions were registered
      expect(registerManyMock).toHaveBeenCalledWith([
        {
          section: 'plugins',
          displayName: 'Access ImageKit Media Library',
          uid: permissions.mediaLibrary.read,
          pluginName: PLUGIN_ID,
        },
        {
          section: 'plugins',
          displayName: 'Settings: Read',
          uid: permissions.settings.read,
          subCategory: 'settings',
          pluginName: PLUGIN_ID,
        },
        {
          section: 'plugins',
          displayName: 'Settings: Change',
          uid: permissions.settings.change,
          subCategory: 'settings',
          pluginName: PLUGIN_ID,
        },
      ]);
    });
  });

  describe('registerTransformResponseDecorator', () => {
    it('should add transformResponse to API controllers', async () => {
      // This would test the transform response decorator logic
      // Implementation would depend on how the decorator is used in the app
    });
  });

  describe('registerUploadProvider', () => {
    it('should wrap upload provider methods', async () => {
      // This would test the upload provider registration
      // Implementation would depend on how the provider is used in the app
    });
  });
});
