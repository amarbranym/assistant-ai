import fs from "fs";
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import { asyncHandler } from "./shared/utils/helpers";
import { logger } from "./config/clients/logger";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

interface RouteModule {
  GET?: (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
  POST?: (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
  PUT?: (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
  DELETE?: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>;
  getMiddleware?: Middleware[];
  postMiddleware?: Middleware[];
  putMiddleware?: Middleware[];
  deleteMiddleware?: Middleware[];
}

const ENDPOINTS_DIR = path.join(__dirname, "endpoints");

function toRoutePath(filePath: string): string {
  const relative = path
    .relative(ENDPOINTS_DIR, filePath)
    .replace(/\\/g, "/")
    .replace(/\/route\.[tj]s$/, "");

  const segments = relative.split("/").map((seg) => {
    if (seg.startsWith("[") && seg.endsWith("]")) {
      return `:${seg.slice(1, -1)}`;
    }
    return seg;
  });

  const routePath = "/" + segments.filter(Boolean).join("/");
  return routePath === "/index" ? "/" : routePath;
}

function findRouteFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRouteFiles(fullPath, acc);
    } else if (entry.isFile() && entry.name === "route.ts") {
      acc.push(fullPath);
    }
  }

  return acc;
}

export async function registerEndpoints(app: Express) {
  // Global API prefix (e.g. /api/v1/assistants)
  const API_PREFIX = "/api/v1";
  const files = findRouteFiles(ENDPOINTS_DIR);

  for (const file of files) {
    const routePath = API_PREFIX + toRoutePath(file);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = (await import(file)) as RouteModule;

    const map: [HttpMethod, keyof RouteModule, keyof RouteModule][] = [
      ["GET", "GET", "getMiddleware"],
      ["POST", "POST", "postMiddleware"],
      ["PUT", "PUT", "putMiddleware"],
      ["DELETE", "DELETE", "deleteMiddleware"]
    ];

    for (const [method, handlerKey, mwKey] of map) {
      const handler = mod[handlerKey];
      if (!handler) continue;

      const middlewares = (mod[mwKey] as Middleware[] | undefined) ?? [];

      (app as any)[method.toLowerCase()](
        routePath,
        ...middlewares,
        asyncHandler(handler as any)
      );

      logger.info({ method, routePath }, "Registered endpoint");
    }
  }
}

