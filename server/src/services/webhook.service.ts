import { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const { NotFoundError } = errors;
const FILE_MODEL_UID = 'plugin::upload.file';

// Events that will be emitted
const MEDIA_CREATE = 'media.create';

interface ImageKitFile {
  type: string;
  name: string;
  fileId: string;
  url: string;
  thumbnail: string;
  fileType: string;
  filePath: string;
  height: number;
  width: number;
  size: number;
  hasAlpha: boolean;
  mime: string;
  customMetadata?: Record<string, any>;
  tags?: string[] | null;
  AITags?: string[] | null;
  isPrivateFile: boolean;
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
  customCoordinates?: string | null;
  embeddedMetadata?: Record<string, any>;
}

interface ImageKitWebhookPayload {
  eventType: string;
  data: ImageKitFile[];
}

const webhookService = ({ strapi }: { strapi: Core.Strapi }) => {
  /**
   * Process the webhook payload from ImageKit
   * @param {ImageKitWebhookPayload} payload - The webhook payload from ImageKit
   * @returns {Promise<any[]>} The processed file entities
   */
  async function processWebhook(payload: ImageKitWebhookPayload) {
    const { eventType, data } = payload;

    if (eventType !== 'INSERT') {
      strapi.log.info(`[ImageKit Webhook Service] Ignoring webhook event type: ${eventType}`);
      return [];
    }

    // First pass: Import all files and identify which are formats and which are main files
    const importResults = await Promise.all(
      data.map(async (fileData) => {
        try {
          const result = await importFileToStrapi(fileData);
          return { fileData, result };
        } catch (error) {
          strapi.log.error(
            `[ImageKit Webhook Service] Error importing file ${fileData.name}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out errors
    const validResults = importResults.filter(Boolean) as Array<{
      fileData: ImageKitFile;
      result: any;
    }>;

    // Get main files and formats separately
    const mainFiles = validResults.filter((item) => !item.result.isFormat);
    const formatFiles = validResults.filter((item) => item.result.isFormat);

    strapi.log.info(
      `[ImageKit Webhook Service] Imported ${mainFiles.length} main files and ` +
        `${formatFiles.length} format files`
    );

    // Second pass: Associate formats with their parent files
    for (const formatItem of formatFiles) {
      const formatData = formatItem.result;
      const formatType = formatData.format; // thumbnail, small, medium, large
      const originalFileName = formatItem.fileData.name.replace(new RegExp(`^${formatType}_`), '');

      // Find the main file that this format belongs to
      const mainFile = mainFiles.find((m) => {
        // Check if original name matches or has similar pattern
        const baseName = path.basename(m.fileData.name, path.extname(m.fileData.name));
        const formatBaseName = path.basename(originalFileName, path.extname(originalFileName));
        return baseName === formatBaseName;
      });

      if (mainFile && mainFile.result.id) {
        try {
          // Get the main file's current data using direct database query instead of entityService
          const fileEntity = await strapi.db.query(FILE_MODEL_UID).findOne({
            where: { id: mainFile.result.id },
          });

          if (fileEntity) {
            // Update the main file with the format information
            const formats = fileEntity.formats || {};
            formats[formatType] = formatData.data;

            // Use direct database query to update the formats
            await strapi.db.query(FILE_MODEL_UID).update({
              where: { id: fileEntity.id },
              data: { formats },
            });

            strapi.log.info(
              `[ImageKit Webhook Service] Associated ${formatType} format with file ${fileEntity.name}`
            );
          }
        } catch (error) {
          strapi.log.error(
            `[ImageKit Webhook Service] Error associating format ${formatType} with main file:`,
            error
          );
        }
      }
    }

    // Return only the successful main file entities
    return mainFiles.map((item) => item.result).filter(Boolean);
  }

  /**
   * Import a file from ImageKit to Strapi by creating a database entry
   * @param {ImageKitFile} fileData - The file data from ImageKit
   * @returns {Promise<any>} The imported file entity
   */
  /**
   * Import a file from ImageKit to Strapi by creating a database entry
   * @param {ImageKitFile} fileData - The file data from ImageKit
   * @returns {Promise<any>} The imported file entity
   */
  async function importFileToStrapi(fileData: ImageKitFile) {
    const {
      name,
      url,
      mime,
      width,
      height,
      size,
      fileId,
      customMetadata,
      tags,
      AITags,
      createdAt,
      updatedAt,
      thumbnail,
    } = fileData;

    // Extract file extension and generate hash
    const ext = path.extname(name);
    const baseName = path.basename(name, ext);
    const hash = `${baseName.replace(/\s+/g, '_')}_${fileId.substring(0, 8)}`;

    const getBreakpoints = () =>
      strapi.config.get<Record<string, number>>('plugin::upload.breakpoints', {
        large: 1000,
        medium: 750,
        small: 500,
      });

    const breakpoints = getBreakpoints();

    const FORMATS = Object.keys(breakpoints);

    const formatMatch = name.match(new RegExp(`^(${FORMATS.join('|')})_(.+)`));
    const isFormat = !!formatMatch;

    if (isFormat) {
      strapi.log.info(`[ImageKit Webhook Service] This file appears to be a format: ${name}`);
    }

    // Generate a document ID for the file
    const documentId = uuidv4().replace(/-/g, '').substring(0, 24);

    // Prepare metadata for the file
    const metadata: Record<string, any> = { fileId };

    // Include additional metadata from ImageKit
    if (tags && tags.length > 0) {
      metadata.tags = tags;
    }

    if (AITags && AITags.length > 0) {
      metadata.aiTags = AITags;
    }

    if (customMetadata && Object.keys(customMetadata).length > 0) {
      metadata.customMetadata = customMetadata;
    }

    // Create the file entry
    const fileEntry = {
      name,
      alternativeText: null,
      caption: null,
      width,
      height,
      formats: {}, // Will be populated later for the main file
      hash,
      ext,
      mime,
      size: size / 1024, // Converting bytes to KB as Strapi stores size in KB
      url,
      previewUrl: thumbnail || null,
      provider: 'imagekit',
      provider_metadata: metadata,
      folderPath: '/',
      isUrlSigned: false,
      documentId: isFormat ? undefined : documentId,
    };

    // If this is not a format, save it as a main file
    if (!isFormat) {
      try {
        // Use Strapi's database query directly which gives more control over the process
        const fileEntity = await strapi.db.query(FILE_MODEL_UID).create({
          data: {
            ...fileEntry,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
        });

        // Emit media create event
        await emitEvent(MEDIA_CREATE, fileEntity);

        strapi.log.info(
          `[ImageKit Webhook Service] Successfully created file entry: ${name} with ID ${fileEntity.id}`
        );
        return fileEntity;
      } catch (error) {
        strapi.log.error(`[ImageKit Webhook Service] Error creating file entry: ${error.message}`);
        throw error;
      }
    } else {
      // This is a format, we just return the data in case we need to associate it later
      return { isFormat: true, format: formatMatch?.[1], data: fileEntry };
    }
  }

  /**
   * Emit an event when a media operation occurs
   * @param {string} event - The event name
   * @param {object} data - The event data
   */
  async function emitEvent(event: string, data: Record<string, any>) {
    strapi.eventHub.emit(event, { media: data });
  }

  /**
   * Find a file by its ID
   * @param {string|number} id - The file ID
   * @returns {Promise<object|null>} The file entity
   */
  async function findFile(id: string | number) {
    return strapi.db.query(FILE_MODEL_UID).findOne({
      where: { id },
    });
  }

  /**
   * Update file formats for a main file
   * @param {number} fileId - The file ID
   * @param {string} formatType - The format type (thumbnail, small, medium, large)
   * @param {object} formatData - The format data
   */
  async function updateFileFormats(fileId: number, formatType: string, formatData: any) {
    try {
      const file = await findFile(fileId);
      if (!file) {
        throw new NotFoundError(`File with id ${fileId} not found`);
      }

      const formats = file.formats || {};
      formats[formatType] = formatData;

      await strapi.db.query(FILE_MODEL_UID).update({
        where: { id: fileId },
        data: { formats },
      });

      return true;
    } catch (error) {
      strapi.log.error(`[ImageKit Webhook Service] Error updating formats: ${error.message}`);
      return false;
    }
  }

  return {
    processWebhook,
    findFile,
    updateFileFormats,
  };
};

export default webhookService;
