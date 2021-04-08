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
    const parent = opentelemetry.getSpan(opentelemetry.context.active());
    const mainSpan = tracer.startSpan('middleware example span');
    const child = logger.child({ trace_id: mainSpan.spanContext.traceId }, {parent: parent})
    child.info("middleware - start of request")
    next()
    mainSpan.end()
    child.info("middleware - end of request")
});

app.get("/", (req, res) => {
    const parent = opentelemetry.getSpan(opentelemetry.context.active());
    const span = tracer.startSpan("custom span for a unit of work", {parent: parent});
    // poor man's nodejs sleep

    for (let i = 0; i < 50000000; i++) {
        // noop
    }

    // https://wardbekker.grafana.net/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22grafanacloud-wardbekker-traces%22,%7B%22query%22:%225ec05b97c9f98c8cae541e720f8152d0%22%7D%5D
    const https = require('https');
    const options = {
        hostname: 'example.com',
        port: 443,
        path: '/',
        method: 'GET'
    }

    const r = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
      
        res.on('data', d => {
          //process.stdout.write(d)
        })
      })
      
      r.on('error', error => {
        //console.error(error)
      });
      
    r.end();

    span.end()
  
    logger.info("inside request handler ")
    res.send("Hello World!");    
});

app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
});
