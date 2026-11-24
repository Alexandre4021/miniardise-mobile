import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

/** RNTL 14 : rendu asynchrone (React 19). */
export async function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const r = await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { client, ...r };
}
