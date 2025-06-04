import { Box, Flex, Typography } from '@strapi/design-system';
import { Page, useNotification } from '@strapi/strapi/admin';
import {
  ImagekitMediaLibraryWidget,
  MediaLibraryWidgetOptions,
} from 'imagekit-media-library-widget';
import { camelCase } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../../../../common';
import { useHTTP } from '../../hooks';

const MediaLibraryPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const http = useHTTP();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any>(null);

  const handleMediaSelection = useCallback((payload: any) => {
    // Only proceed if assets were selected
    if (!payload || !payload.data || !payload.data.length) {
      return;
    }

    // Automatically trigger import (alternatively, you could just show the modal)
    handleImportFromImageKit(payload.data);
  }, []);

  const handleImportFromImageKit = useCallback(
    async (assets?: any[]) => {
      try {
        // Use passed assets or get selected assets from the media library widget
        const assetData = assets || [];

        if (!assetData.length) {
          toggleNotification({
            type: 'warning',
            message: formatMessage({
              id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.noFiles`,
              defaultMessage: 'No files selected for import',
            }),
          });
          return;
        }

        // Define payload and response types for better type safety
        interface WebhookPayload {
          eventType: string;
          data: any[];
        }

        interface WebhookResponse {
          status: 'success' | 'warning' | 'error';
          message: string;
          imported?: any[];
          stats?: {
            total: number;
            successful: number;
            failed: number;
          };
          details?: string;
          error?: string;
        }

        const payload: WebhookPayload = {
          eventType: 'INSERT',
          data: assetData,
        };

        // Call the webhook API
        // Using axios type to properly type the response
        interface AxiosResponse<T> {
          data: T;
          status: number;
          statusText: string;
          headers: Record<string, string>;
        }

        const response = (await http.post('/webhook', payload)) as AxiosResponse<WebhookResponse>;
        const data = response.data;

        // Parse the response based on the structured data from the backend
        if (data?.status === 'success') {
          // Display success notification with stats
          const stats = data.stats || { successful: 0, total: 0, failed: 0 };

          toggleNotification({
            type: 'success',
            message: formatMessage(
              {
                id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.success`,
                defaultMessage: 'Successfully imported {successful} of {total} files',
              },
              { successful: stats.successful, total: stats.total }
            ),
          });

          // Reload the media library if files were imported
          if (stats.successful > 0) {
            // Could add a refresh function here if needed
          }
        } else if (data?.status === 'warning') {
          // Show warning notification
          toggleNotification({
            type: 'warning',
            message: formatMessage(
              {
                id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.warning`,
                defaultMessage: 'Import completed with warnings: {message}',
              },
              { message: data.message || 'Some files may not have been imported' }
            ),
          });
        } else {
          // Fallback for unexpected response format
          toggleNotification({
            type: 'success',
            message: formatMessage({
              id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.complete`,
              defaultMessage: 'Import process completed',
            }),
          });
        }
      } catch (error: any) {
        console.error('Error importing from ImageKit:', error);

        // Extract structured error information if available
        const errorResponse = error.response?.data;
        const errorMessage = errorResponse?.message || error.message || 'Unknown error';
        const errorDetails = errorResponse?.details || '';

        toggleNotification({
          type: 'warning',
          message: formatMessage(
            {
              id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.error`,
              defaultMessage: 'Error importing files: {message} {details}',
            },
            {
              message: errorMessage,
              details: errorDetails ? `(${errorDetails})` : '',
            }
          ),
        });
      }
    },
    [http, formatMessage, toggleNotification]
  );

  const initializeMediaLibrary = useCallback(() => {
    if (!mediaLibrary) {
      try {
        const config: MediaLibraryWidgetOptions = {
          container: '#ik-media-library-container',
          className: 'imagekit-media-library',
          view: 'inline' as const,
          renderOpenButton: false,
          mlSettings: {
            toolbar: {
              showCloseButton: false,
              showInsertButton: true,
            },
          },
        };

        const widget = new ImagekitMediaLibraryWidget(config, handleMediaSelection);
        setMediaLibrary(widget);
      } catch (error) {
        console.error('Error initializing ImageKit Media Library:', error);
      }
    }
  }, [handleMediaSelection]);

  useEffect(() => {
    if (containerRef.current) {
      initializeMediaLibrary();
    }
  }, [initializeMediaLibrary]);

  return (
    <Page.Main>
      <Box padding={4}>
        <Box paddingBottom={4}>
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="alpha">
              {formatMessage({
                id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.header.title`,
                defaultMessage: 'ImageKit Media Library',
              })}
            </Typography>
          </Flex>
        </Box>
        <Box>
          <div
            id="ik-media-library-container"
            ref={containerRef}
            style={{ height: 'calc(100vh - 88px)', width: '100%' }}
          />
        </Box>
      </Box>
    </Page.Main>
  );
};

export default MediaLibraryPage;
