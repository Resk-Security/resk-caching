import { loadConfig } from "./shared/config";
import { getLogger } from "./shared/logger";
import { initTracing } from "./telemetry/tracing";
import { router } from "./web/router";
import { wsHandlers } from "./web/routes/ws";

const logger = getLogger();
const config = loadConfig();
initTracing();

const server = Bun.serve({
  port: config.server.port,
  development: Bun.env.NODE_ENV !== "production",
  routes: {
    "/health": new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    }),
  },
  fetch: (req: Request) => router.handle(req),
  error(error) {
    logger.error({ err: error }, "Unhandled server error");
    return new Response("Internal Server Error", { status: 500 });
  },
  websocket: wsHandlers,
});

logger.info({ port: server.port, url: server.url.toString() }, "resk-caching server started");


