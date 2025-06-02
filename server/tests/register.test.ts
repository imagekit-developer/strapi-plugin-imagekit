import ImageKit from 'imagekit';
import register from '../src/register';
import baseEntityMock from './utils/entity';
import schemaMock from './utils/schema';
import { getStrapiMock } from './utils/strapi';

describe('Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerSanitizer', () => {
    describe('sanitizer is registered', () => {
      const strapiMock = getStrapiMock();

      beforeEach(() => register({ strapi: strapiMock }));
      it('sanitizer is registered', async () => {
        expect(strapiMock.sanitizers.add).toHaveBeenCalledTimes(1);
        expect(strapiMock.sanitizers.add).toHaveBeenCalledWith(
          'content-api.output',
          expect.any(Function)
        );
      });
    });

    describe('sanitizer tests', () => {
      let sanitizerFn: any;
      let strapiMock: ReturnType<typeof getStrapiMock>;

      beforeEach(() => {
        strapiMock = getStrapiMock();
        register({ strapi: strapiMock });

        global.strapi = strapiMock;

        sanitizerFn = strapiMock.sanitizers.add.mock.calls[0][1];
      });

      it('should not convert to imagekit url', async () => {
        strapiMock
          .plugin('imagekit')
          .service('settings')
          .getSettings.mockResolvedValue({ enabled: false });

        const entity = {
          ...baseEntityMock,
          url: '/testing/381.jpg?updatedAt=1725532500672',
        };

        const response = await sanitizerFn(schemaMock, entity);

        expect(response.url).toBe('/testing/381.jpg?updatedAt=1725532500672');
      });

      it('should not convert to imagekit url', async () => {
        strapiMock
          .plugin('imagekit')
          .service('settings')
          .getSettings.mockResolvedValue({ enabled: true });

        const entity = {
          ...baseEntityMock,
          url: '/testing/381.jpg?updatedAt=1725532500672',
        };

        const response = await sanitizerFn(schemaMock, entity);

        expect(response.url).toBe('/testing/381.jpg?updatedAt=1725532500672');
      });

      it('should convert to imagekit url', async () => {
        strapiMock.plugin('imagekit').service('settings').getSettings.mockResolvedValue({
          enabled: true,
          urlEndpoint: 'https://ik.imagekit.io/your-endpoint',
        });

        strapiMock
          .plugin('imagekit')
          .service('upload')
          .getClient.mockResolvedValue(
            new ImageKit({
              publicKey: 'publicKey',
              privateKey: 'privateKey',
              urlEndpoint: 'https://ik.imagekit.io/your-endpoint',
            })
          );

        const entity = {
          ...baseEntityMock,
          url: '/testing/381.jpg',
        };

        const response = await sanitizerFn(schemaMock, entity);

        expect(response.url).toBe('https://ik.imagekit.io/your-endpoint/testing/381.jpg');
      });

      it('should convert to imagekit url including formats', async () => {
        strapiMock.plugin('imagekit').service('settings').getSettings.mockResolvedValue({
          enabled: true,
          urlEndpoint: 'https://ik.imagekit.io/your-endpoint',
        });

        strapiMock
          .plugin('imagekit')
          .service('upload')
          .getClient.mockResolvedValue(
            new ImageKit({
              publicKey: 'publicKey',
              privateKey: 'privateKey',
              urlEndpoint: 'https://ik.imagekit.io/your-endpoint',
            })
          );

        const entity = {
          ...baseEntityMock,
          url: '/uploads/36950.jpg',
          formats: {
            thumbnail: {
              name: 'thumbnail_36950.jpg',
              hash: 'thumbnail_36950_4ba52a0b2a',
              ext: '.jpg',
              mime: 'image/jpeg',
              path: null,
              width: 245,
              height: 153,
              size: 8.81,
              sizeInBytes: 8812,
              url: '/uploads/thumbnail_36950_4ba52a0b2a.jpg',
            },
            medium: {
              name: 'medium_36950.jpg',
              hash: 'medium_36950_4ba52a0b2a',
              ext: '.jpg',
              mime: 'image/jpeg',
              path: null,
              width: 750,
              height: 469,
              size: 52.35,
              sizeInBytes: 52349,
              url: '/uploads/medium_36950_4ba52a0b2a.jpg',
            },
            small: {
              name: 'small_36950.jpg',
              hash: 'small_36950_4ba52a0b2a',
              ext: '.jpg',
              mime: 'image/jpeg',
              path: null,
              width: 500,
              height: 313,
              size: 27.51,
              sizeInBytes: 27512,
              url: '/uploads/small_36950_4ba52a0b2a.jpg',
            },
            large: {
              name: 'large_36950.jpg',
              hash: 'large_36950_4ba52a0b2a',
              ext: '.jpg',
              mime: 'image/jpeg',
              path: null,
              width: 1000,
              height: 625,
              size: 83.6,
              sizeInBytes: 83598,
              url: '/uploads/large_36950_4ba52a0b2a.jpg',
            },
          },
        };

        const response = await sanitizerFn(schemaMock, entity);

        expect(response.url).toBe('https://ik.imagekit.io/your-endpoint/uploads/36950.jpg');
        expect(response.formats.thumbnail.url).toBe(
          'https://ik.imagekit.io/your-endpoint/uploads/thumbnail_36950_4ba52a0b2a.jpg'
        );
        expect(response.formats.medium.url).toBe(
          'https://ik.imagekit.io/your-endpoint/uploads/medium_36950_4ba52a0b2a.jpg'
        );
        expect(response.formats.small.url).toBe(
          'https://ik.imagekit.io/your-endpoint/uploads/small_36950_4ba52a0b2a.jpg'
        );
        expect(response.formats.large.url).toBe(
          'https://ik.imagekit.io/your-endpoint/uploads/large_36950_4ba52a0b2a.jpg'
        );
      });
    });
  });
});
