import { queryOptions } from '@tanstack/react-query';

import { fetchHome } from '@/api/mobile/home';

export const homeQuery = () =>
  queryOptions({ queryKey: ['home'], queryFn: ({ signal }) => fetchHome(signal), staleTime: 5 * 60_000 });
