import { permissions, PLUGIN_ID } from '../../common';
import bootstrap from '../src/bootstrap';
import { imagekitMock } from './utils/plugins/imagekit';
import { uploadServiceMock } from './utils/plugins/imagekit/services';
import { getStrapiMock } from './utils/strapi';

describe('Bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveConfig', () => {
    describe('when config does not exist in store', () => {
      const strapiMock = getStrapiMock();

      beforeEach(() => bootstrap({ strapi: strapiMock }));
      it('should save default config if no config exists', async () => {
        expect(strapiMock.store).toHaveBeenCalledTimes(1);
        expect(strapiMock.store).toHaveBeenCalledWith({ type: 'plugin', name: PLUGIN_ID });

        const get = strapiMock.store.mock.results.find((_) => _.type === 'return')?.value.get;

        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith({ key: 'config' });

        expect(imagekitMock.config).toHaveBeenCalledTimes(14);

        const set = strapiMock.store.mock.results.find((_) => _.type === 'return')?.value.set;
        expect(set).toHaveBeenCalledTimes(1);
        expect(set).toHaveBeenCalledWith({
          key: 'config',
          value: {
            enabled: false,
            publicKey: '',
            privateKey: '',
            urlEndpoint: '',
            useSignedUrls: false,
            expiry: 0,
            uploadEnabled: false,
            uploadOptions: {
              tags: [],
              folder: '',
              overwriteTags: false,
              overwriteCustomMetadata: false,
              checks: '',
              isPrivateFile: false,
            },
            useTransformUrls: false,
          },
        });

        expect(imagekitMock.config.mock.calls).toEqual([
          ['enabled', false],
          ['publicKey', ''],
          ['privateKey', ''],
          ['urlEndpoint', ''],
          ['useSignedUrls', false],
          ['expiry', 0],
          ['uploadEnabled', false],
          ['useTransformUrls', false],
          ['uploadOptions.tags', []],
          ['uploadOptions.folder', ''],
          ['uploadOptions.overwriteTags', false],
          ['uploadOptions.overwriteCustomMetadata', false],
          ['uploadOptions.checks', ''],
          ['uploadOptions.isPrivateFile', false],
        ]);
      });
    });

    describe('when config exists in store', () => {
      const strapiMock = getStrapiMock({ storeConfig: {} });

      beforeEach(() => bootstrap({ strapi: strapiMock }));
      it('should not overwrite existing config', async () => {
        expect(strapiMock.store).toHaveBeenCalledTimes(1);
        expect(strapiMock.store).toHaveBeenCalledWith({ type: 'plugin', name: PLUGIN_ID });

        const get = strapiMock.store.mock.results.find((_) => _.type === 'return')?.value.get;

        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith({ key: 'config' });

        expect(imagekitMock.config).toHaveBeenCalledTimes(0);
        const set = strapiMock.store.mock.results.find((_) => _.type === 'return')?.value.set;
        expect(set).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('addPermissions', () => {
    const strapiMock = getStrapiMock();

    beforeEach(() => bootstrap({ strapi: strapiMock }));
    it('should register all permissions', async () => {
      expect(
        strapiMock.admin.services.permission.actionProvider.registerMany
      ).toHaveBeenCalledTimes(1);
      expect(strapiMock.admin.services.permission.actionProvider.registerMany).toHaveBeenCalledWith(
        [
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
        ]
      );
    });
  });

  describe('registerUploadProvider', () => {
    const strapiMock = getStrapiMock({
      storeConfig: { uploadEnabled: true },
      config: { uploadEnabled: true },
    });

    describe('upload is enabled', () => {
      beforeEach(() => {
        bootstrap({ strapi: strapiMock });
        strapiMock
          .plugin('imagekit')
          .service('settings')
          .getSettings.mockResolvedValue({ uploadEnabled: true });
      });

      it('upload is called from provider', async () => {
        expect(uploadServiceMock.upload).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.upload({});
        expect(uploadServiceMock.upload).toHaveBeenCalledTimes(1);
      });

      it('uploadStream is called from provider', async () => {
        expect(uploadServiceMock.uploadStream).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.uploadStream({});
        expect(uploadServiceMock.uploadStream).toHaveBeenCalledTimes(1);
      });

      it('delete is called from provider', async () => {
        expect(uploadServiceMock.delete).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.delete({});
        expect(uploadServiceMock.delete).toHaveBeenCalledTimes(1);
      });

      it('isPrivate is called from provider', async () => {
        expect(uploadServiceMock.isPrivate).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.isPrivate({});
        expect(uploadServiceMock.isPrivate).toHaveBeenCalledTimes(1);
      });
    });

    describe('upload is disabled', () => {
      beforeEach(() => {
        bootstrap({ strapi: strapiMock });
        strapiMock
          .plugin('imagekit')
          .service('settings')
          .getSettings.mockResolvedValue({ uploadEnabled: false });
      });

      it('upload is called from provider', async () => {
        expect(uploadServiceMock.upload).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.upload({});
        expect(uploadServiceMock.upload).toHaveBeenCalledTimes(0);
      });

      it('uploadStream is called from provider', async () => {
        expect(uploadServiceMock.uploadStream).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.uploadStream({});
        expect(uploadServiceMock.uploadStream).toHaveBeenCalledTimes(0);
      });

      it('delete is called from provider', async () => {
        expect(uploadServiceMock.delete).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.delete({});
        expect(uploadServiceMock.delete).toHaveBeenCalledTimes(0);
      });

      it('isPrivate is called from provider', async () => {
        expect(uploadServiceMock.isPrivate).toHaveBeenCalledTimes(0);
        await strapiMock.plugin('upload').provider.isPrivate({});
        expect(uploadServiceMock.isPrivate).toHaveBeenCalledTimes(0);
      });
    });
  });
});
