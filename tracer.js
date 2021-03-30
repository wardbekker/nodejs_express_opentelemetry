const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const opentelemetry = require('@opentelemetry/api');

const provider = new NodeTracerProvider();

provider.register();

registerInstrumentations({
  tracerProvider: provider
});

module.exports = (serviceName, jaegerHost, logger) => {

let exporter = new JaegerExporter({
    logger: logger,
    serviceName: serviceName,
    host: jaegerHost
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  return opentelemetry.trace.getTracer("sample_app");
};
