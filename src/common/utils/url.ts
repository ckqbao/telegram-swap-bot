export function buildQueryURL(url: string, params: Record<string, string>) {
  if (!url || !Object.keys(params).length) return url;

  const [path, paramsString] = url.split('?');
  const searchParams = new URLSearchParams(paramsString);

  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  return `${path}?${searchParams.toString()}`;
}
