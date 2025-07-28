import { Box, Flex, Typography } from '@strapi/design-system';
import { Page, useNotification } from '@strapi/strapi/admin';
import {
  ImagekitMediaLibraryWidget,
  MediaLibraryWidgetOptions,
} from 'imagekit-media-library-widget';
import { camelCase } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../../../../common';
import { useHTTP } from '../../hooks';

const MediaLibraryPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const http = useHTTP();
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaLibrary = useRef<ImagekitMediaLibraryWidget>(null);

  const handleMediaSelection = useCallback(async (payload: any) => {
    if (!payload || !payload.data || !payload.data.length) {
      return;
    }

    const assets = payload.data;
    try {
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

      const response = await http.post<WebhookPayload, WebhookResponse>('/webhook', payload);

      if (response?.status === 'success') {
        const stats = response.stats || { successful: 0, total: 0, failed: 0 };

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
      } else if (response?.status === 'warning') {
        toggleNotification({
          type: 'warning',
          message: formatMessage(
            {
              id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.warning`,
              defaultMessage: 'Import completed with warnings: {message}',
            },
            { message: response.message || 'Some files may not have been imported' }
          ),
        });
      } else {
        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: `${camelCase(PLUGIN_ID)}.page.mediaLibrary.notification.import.complete`,
            defaultMessage: 'Import process failed',
          }),
        });
      }
    } catch (error: any) {
      console.error('Error importing from ImageKit:', error);

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
  }, []);

  const initializeMediaLibrary = useCallback(() => {
    if (!mediaLibrary.current) {
      try {
        const config: MediaLibraryWidgetOptions = {
          container: '#ik-media-library-container',
          className: 'imagekit-media-library',
          view: 'inline',
          renderOpenButton: false,
          mlSettings: {
            toolbar: {
              showCloseButton: false,
              showInsertButton: true,
            },
          },
        };

        const widget = new ImagekitMediaLibraryWidget(config, handleMediaSelection);
        mediaLibrary.current = widget;
      } catch (error) {
        console.error('Error initializing ImageKit Media Library:', error);
      }
    }
  }, [handleMediaSelection]);

  useEffect(() => {
    if (containerRef?.current) {
      initializeMediaLibrary();
    }

    return () => {
      if (mediaLibrary?.current) {
        mediaLibrary.current.destroy();
      }
    };
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
