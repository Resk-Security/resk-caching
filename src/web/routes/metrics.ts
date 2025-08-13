import { renderPrometheus } from "../../metrics/metrics";

export function metricsHandler(): Response {
  const body = renderPrometheus();
  return new Response(body, { headers: { "content-type": "text/plain; version=0.0.4" } });
}


