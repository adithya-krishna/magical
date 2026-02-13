import { useQuery } from "@tanstack/react-query";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
export const DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE_OPTIONS[0];
export const MAX_PAGE_SIZE = 100;

type PaginationConfigResponse = {
  data: {
    pageSizeOptions: number[];
    defaultPageSize: number;
    maxPageSize: number;
  };
};

export function usePaginationConfig() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  return useQuery({
    queryKey: ["pagination-config"],
    queryFn: async (): Promise<PaginationConfigResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/pagination-config`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load pagination config");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
