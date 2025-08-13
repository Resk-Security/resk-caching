import { trace, context } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BasicTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

let initialized = false;

export function initTracing(): void {
  if (initialized) return;
  initialized = true;
  const serviceName = Bun.env.OTEL_SERVICE_NAME ?? "resk-caching";
  const resource = new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName });
  const provider = new BasicTracerProvider({ resource });
  const url = Bun.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces";
  const exporter = new OTLPTraceExporter({ url });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
}

export function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const tracer = trace.getTracer("resk-caching");
  const span = tracer.startSpan(name);
  const ctx = trace.setSpan(context.active(), span);
  return context.with(ctx, async () => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 });
      return result;
    } catch (e) {
      span.recordException(e as Error);
      span.setStatus({ code: 2, message: String((e as Error).message) });
      throw e;
    } finally {
      span.end();
    }
  });
}


