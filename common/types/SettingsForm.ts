import { UploadOptionsForm } from '../schema/upload-options.schema';

export type SettingsForm = {
  enabled: boolean;
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  useSignedUrls: boolean;
  expiry: number;
  uploadEnabled: boolean;
  uploadOptions: UploadOptionsForm;
  useTransformUrls: boolean;
};
