import { Box, Flex, Typography } from '@strapi/design-system';
import { Page } from '@strapi/strapi/admin';
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
  const http = useHTTP();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any>(null);

  const handleMediaSelection = useCallback((payload: any) => {
    console.log('Selected media:', payload);
  }, []);

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
  }, [mediaLibrary, handleMediaSelection]);

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
