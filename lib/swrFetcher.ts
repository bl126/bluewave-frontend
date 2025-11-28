// lib/swrFetcher.ts
export const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    const err: any = new Error("API error");
    err.status = res.status;
    throw err;
  }
  return res.json();
};
