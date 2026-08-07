const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export function sitePath(path: string): string {
  if (path === "/") return `${publicBasePath}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${publicBasePath}${normalized.replace(/\/$/, "")}.html`;
}

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${publicBasePath}${normalized}`;
}

export function routePath(pathname: string): string {
  const withoutBase = publicBasePath && pathname.startsWith(publicBasePath)
    ? pathname.slice(publicBasePath.length)
    : pathname;
  return withoutBase.replace(/\.html$/, "").replace(/\/$/, "") || "/";
}
