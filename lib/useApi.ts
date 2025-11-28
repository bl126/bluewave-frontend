import useSWR from "swr";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const fetcher = async (url: string) => {
  const res = await fetch(apiBase + url);
  if (!res.ok) throw new Error("API error");
  return res.json();
};

export function useApi(path: string) {
  const { data, error, isLoading } = useSWR(path, fetcher);
  return {
    data,
    error,
    loading: isLoading,
  };
}
