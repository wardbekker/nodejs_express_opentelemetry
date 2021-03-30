"use strict";

const opentelemetry = require('@opentelemetry/api');
const jaegerHost = process.env.JAEGER_HOST || "localhost";
const logger = require("pino")();
const tracer = require("./tracer")("sample_app", jaegerHost, logger);

const port = 8080

// Import and initialize the tracer

var express = require("express");
var app = express();

const expressPino = require("express-pino-logger")({
  logger: logger.child({ service: "httpd" }),
});

app.use(function (req, res, next) {
    const mainSpan = tracer.startSpan('middleware example span');
    const child = logger.child({ trace_id: mainSpan.spanContext.traceId })
    child.info("middleware - start of request")
    next()
    mainSpan.end()
    child.info("middleware - end of request")
});

app.get("/", (req, res) => {
    const parent = opentelemetry.getSpan(opentelemetry.context.active());
    const span = tracer.startSpan("custom span for a unit of work", {parent: parent});
    // poor man's nodejs sleep
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    span.end()

    logger.info("inside request handler ")
    res.send("Hello World!");    
});

app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
});
