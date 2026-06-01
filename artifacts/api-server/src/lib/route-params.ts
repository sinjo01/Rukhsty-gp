import type { Request } from "express";

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Missing route parameter: ${name}`);
}
