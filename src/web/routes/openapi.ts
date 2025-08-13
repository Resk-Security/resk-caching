import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Schemas reused across controllers
export const ZQueryPut = z
  .object({ query: z.string().min(1).max(10000), response: z.unknown(), ttl: z.number().int().positive().optional() })
  .openapi("CachePut");
export const ZQueryReq = z.object({ query: z.string().min(1).max(10000) }).openapi("CacheQuery");

// Common responses
export const ZError = z
  .object({ error: z.string(), details: z.any().optional() })
  .openapi("ErrorResponse");

export const ZPutSuccess = z
  .object({ success: z.literal(true) })
  .openapi("PutSuccess");

export const ZQuerySuccess = z
  .union([
    z.object({ error: z.literal("No cached response") }),
    z.record(z.any()),
  ])
  .openapi("QuerySuccess");

const registry = new OpenAPIRegistry();
registry.registerPath({
  method: "get",
  path: "/health",
  responses: { 200: { description: "OK" } },
});
registry.registerPath({
  method: "post",
  path: "/api/cache",
  description: "Put a value into cache",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ZQueryPut,
          example: { query: "Hello", response: { answer: "Hi!" }, ttl: 3600 },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: ZPutSuccess, example: { success: true } } },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: ZError, example: { error: "Bad Request" } } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ZError, example: { error: "Unauthorized" } } } },
  },
});
registry.registerPath({
  method: "delete",
  path: "/api/cache",
  description: "Clear cache",
  responses: {
    200: { description: "Success", content: { "application/json": { schema: ZPutSuccess, example: { success: true } } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ZError, example: { error: "Unauthorized" } } } },
  },
});
registry.registerPath({
  method: "post",
  path: "/api/cache/query",
  description: "Query cache",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: ZQueryReq, example: { query: "Hello" } } },
    },
  },
  responses: {
    200: {
      description: "Value or not found",
      content: {
        "application/json": {
          schema: ZQuerySuccess,
          examples: {
            miss: { value: { error: "No cached response" } },
            hit: { value: { answer: "Hi!" } },
          },
        },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: ZError, example: { error: "Bad Request" } } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ZError, example: { error: "Unauthorized" } } } },
  },
});
registry.registerPath({
  method: "get",
  path: "/api/openapi.json",
  description: "OpenAPI document",
  responses: { 200: { description: "OpenAPI JSON" } },
});
registry.registerPath({
  method: "get",
  path: "/api/metrics",
  description: "Prometheus metrics",
  responses: { 200: { description: "Metrics in text/plain" } },
});

export const openapiDocument = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: "3.1.0",
  info: { title: "resk-caching API", version: "0.1.0" },
});


