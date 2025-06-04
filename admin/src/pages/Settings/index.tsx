import { Page } from '@strapi/strapi/admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { pluginPermissions } from '../../../../common';
import SettingsPage from './Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const SettingsPageWrapper = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Page.Protect permissions={pluginPermissions.settings}>
        <SettingsPage />
      </Page.Protect>
    </QueryClientProvider>
  );
};

export { SettingsPageWrapper };
