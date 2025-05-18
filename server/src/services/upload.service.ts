import { Core } from '@strapi/strapi';
import StrapiUploadServer from '@strapi/upload/strapi-server';
import ImageKit from 'imagekit';
import { UploadOptions } from 'imagekit/dist/libs/interfaces';
import type { ReadStream } from 'node:fs';
import { join } from 'node:path';
import { tryCatch } from '../../../common';
import SettingsService from './settings.service';

export type File = Parameters<
  ReturnType<ReturnType<typeof StrapiUploadServer>['services']['provider']>['upload']
>[0];

type StrapiUploadOptions = Omit<
  UploadOptions,
  | 'file'
  | 'fileName'
  | 'responseFields'
  | 'overwriteFile'
  | 'isPublished'
  | 'isPrivateFile'
  | 'useUniqueFileName'
> & {
  ignoreStrapiFolders?: boolean;
};

const ValidUploadParams = [
  'tags',
  'customCoordinates',
  'extensions',
  'webhookUrl',
  'overwriteAITags',
  'overwriteTags',
  'overwriteCustomMetadata',
  'customMetadata',
  'transformation',
  'checks',
  'isPrivateFile',
];

export const toUploadParams = (
  file: File,
  uploadOptions: StrapiUploadOptions = {}
): StrapiUploadOptions => {
  const params = Object.entries(uploadOptions).reduce(
    (acc, [key, value]) => {
      if (ValidUploadParams.includes(key) && value !== undefined && value !== null) {
        acc[key as keyof StrapiUploadOptions] = value;
      }
      return acc;
    },
    {} as Record<keyof StrapiUploadOptions, any>
  );

  const ignoreStrapiFolders = uploadOptions.ignoreStrapiFolders ?? false;

  if (uploadOptions.folder && !ignoreStrapiFolders && file.folderPath) {
    params.folder = join(uploadOptions.folder, file.folderPath);
  } else if (uploadOptions.folder) {
    params.folder = uploadOptions.folder;
  } else if (file.folderPath) {
    params.folder = file.folderPath;
  }

  return params;
};

const uploadService = ({ strapi }: { strapi: Core.Strapi }) => {
  const settingsService = SettingsService({ strapi });
  let imagekitClient: ImageKit;

  async function getClient() {
    if (!imagekitClient) {
      const { publicKey, privateKey, urlEndpoint } = await settingsService.getSettings();
      const missingConfigs: string[] = [];
      if (!publicKey) missingConfigs.push('publicKey');
      if (!privateKey) missingConfigs.push('privateKey');
      if (!urlEndpoint) missingConfigs.push('urlEndpoint');
      if (missingConfigs.length > 0) {
        const error = [
          `Please remember to set up the file based config for the provider.`,
          `Refer to the "Configuration" of the README for this plugin for additional details.`,
          `Configs missing: ${missingConfigs.join(', ')}`,
        ].join(' ');
        throw new Error(`Error regarding @imagekit/strapi-provider-upload config: ${error}`);
      }
      imagekitClient = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    }
    return imagekitClient;
  }

  async function uploadFile(file: File, fileToUpload: Buffer | ReadStream) {
    const client = await getClient();
    const response = await tryCatch(
      client.upload({
        ...toUploadParams(file),
        file: fileToUpload,
        fileName: `${file.hash}${file.ext}`,
        useUniqueFileName: false,
        isPrivateFile: await isPrivate(),
      })
    );
    if (response.error) {
      strapi.log.error(`[ImageKit Upload Service]Error uploading file: ${response.error}`);
      return Promise.reject(response.error);
    }
    const fileDetails = await tryCatch(client.getFileDetails(response.data.fileId));
    if (fileDetails.error) {
      strapi.log.error(
        `[ImageKit Upload Provider]Error getting file details: ${fileDetails.error}`
      );
      return Promise.reject(fileDetails.error);
    }
    const { fileId, url } = fileDetails.data;
    strapi.log.info(`[ImageKit Upload Provider] File uploaded successfully with id ${fileId}`);
    file.provider = 'imagekit';
    file.url = url;
    file.provider_metadata = { fileId };
  }

  async function upload(file: File) {
    await getClient();
    let fileToUpload: Buffer | ReadStream | undefined;
    if (file?.buffer) {
      fileToUpload = file.buffer;
    } else if (file?.stream) {
      fileToUpload = file.stream as ReadStream;
    } else {
      return Promise.reject(new Error('[ImageKit Upload Service] Missing file buffer or stream'));
    }
    strapi.log.debug(
      `[ImageKit Upload Service] File to upload: ${JSON.stringify(file)} using ${typeof fileToUpload}`
    );
    await uploadFile(file, fileToUpload);
    return Promise.resolve();
  }

  async function uploadStream(file: File) {
    await getClient();
    return upload(file);
  }

  async function deleteFile(file: File) {
    const fileId = file?.provider_metadata?.fileId as string;
    strapi.log.debug(`[ImageKit Upload Service] Deleting file with id ${fileId}`);
    if (fileId) {
      await getClient();
      const getFileResponse = await tryCatch(imagekitClient.getFileDetails(fileId));
      if (getFileResponse.error) {
        strapi.log.error(
          `[ImageKit Upload Service] File with ID ${fileId} does not exist. Might have been deleted from ImageKit dashboard already.`
        );
        return Promise.resolve();
      }
      const deleteFileResponse = await tryCatch(imagekitClient.deleteFile(fileId));
      if (deleteFileResponse.error) {
        strapi.log.error(
          `[ImageKit Upload Service] Error deleting file: ${deleteFileResponse.error}`
        );
        return Promise.reject(deleteFileResponse.error);
      }
      strapi.log.info(`[ImageKit Upload Service] File with ID ${fileId} deleted successfully.`);
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  async function isPrivate() {
    const settings = await settingsService.getSettings();
    if (settings.uploadOptions?.isPrivateFile !== undefined) {
      return settings.uploadOptions?.isPrivateFile;
    }
    return false;
  }

  async function getSignedUrl(file: File) {
    const client = await getClient();
    try {
      strapi.log.debug(
        `[ImageKit Upload Service] Generating signed URL for file with ID ${file.provider_metadata?.fileId}`
      );
      const settings = await settingsService.getSettings();
      const imageURL = client.url({
        src: file.url!,
        signed: await isPrivate(),
        expireSeconds: settings.expiry > 0 ? settings.expiry : undefined,
      });
      return { url: imageURL };
    } catch (err) {
      strapi.log.error(
        `[ImageKit Upload Service] Error generating signed URL for file with ID ${file.provider_metadata?.fileId}`
      );
      return { url: file.url };
    }
  }

  return { upload, uploadStream, delete: deleteFile, isPrivate, getSignedUrl, getClient };
};

export default uploadService;
