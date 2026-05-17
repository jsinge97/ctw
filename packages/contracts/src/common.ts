import { z } from "zod";

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().datetime();

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const emptyObjectSchema = z.object({}).strict();

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RouteContract<
  TParams extends z.ZodType = z.ZodType,
  TQuery extends z.ZodType = z.ZodType,
  TBody extends z.ZodType = z.ZodType,
  TResponse extends z.ZodType = z.ZodType
> = {
  method: HttpMethod;
  path: string;
  summary: string;
  tags: string[];
  params?: TParams;
  query?: TQuery;
  body?: TBody;
  response: TResponse;
};

export function defineRoute<const T extends RouteContract>(route: T): T {
  return route;
}
