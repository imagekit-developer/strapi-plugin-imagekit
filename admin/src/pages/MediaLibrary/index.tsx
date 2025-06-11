import { Page } from '@strapi/strapi/admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { pluginPermissions } from '../../../../common';
import MediaLibraryPage from './MediaLibrary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const MediaLibraryPageWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Page.Protect permissions={pluginPermissions.settings}>
        <MediaLibraryPage />
      </Page.Protect>
    </QueryClientProvider>
  );
};

export { MediaLibraryPageWrapper };
