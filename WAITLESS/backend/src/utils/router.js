import { parseJsonBody, readRequestBody } from "./http.js";

function normalisePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchRoute(pattern, pathname) {
  const routeSegments = normalisePath(pattern).split("/").filter(Boolean);
  const pathSegments = normalisePath(pathname).split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const pathSegment = pathSegments[index];

    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function createRouter() {
  const routes = [];

  return {
    register(method, pattern, handler) {
      routes.push({
        method,
        pattern,
        handler,
      });
    },

    async handle(req, res) {
      const url = new URL(req.url, "http://localhost");

      for (const route of routes) {
        if (route.method !== req.method) {
          continue;
        }

        const params = matchRoute(route.pattern, url.pathname);
        if (!params) {
          continue;
        }

        const rawBody =
          req.method === "POST" || req.method === "PATCH"
            ? await readRequestBody(req)
            : undefined;
        const body =
          req.method === "POST" || req.method === "PATCH"
            ? parseJsonBody(rawBody)
            : undefined;

        return {
          matched: true,
          response: await route.handler({
            req,
            res,
            url,
            params,
            query: url.searchParams,
            body,
            rawBody,
          }),
        };
      }

      return {
        matched: false,
      };
    },
  };
}
