"use strict";

const opentelemetry = require('@opentelemetry/api');
const jaegerHost = process.env.JAEGER_HOST || "localhost";
const logger = require("pino")();
const tracer = require("./tracer")("sample_app", jaegerHost, logger);

const port = 8080

// monkeypatch example of the request liob
const request = require('request');
const https = require('https');
const http = require('http');

http.inner_request = http.request


const parent = opentelemetry.getSpan(opentelemetry.context.active());
const span = tracer.startSpan("outgoing request", {parent: parent});

http.request = function(uri, options, callback) {
  const parent = opentelemetry.getSpan(opentelemetry.context.active());
  const span = tracer.startSpan("sample monkeypatched request", {parent: parent});
 // console.log("http monkeypatch")

  let r = this.inner_request(uri, options, callback);
  // todo wait for inner request to finish
   span.end();

  return r
}

var express = require("express");

const pino = require('pino')("./logs/application.log")
const expressPino = require("express-pino-logger")({
  logger: pino.child({ service: "httpd" }),
});


// sub apps example
// --------

var sub1 = express();
sub1.get("/sub1", function(req, res){

    request('http://www.google.com', function (error, response, body) {
      console.error('error:', "ignore"); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('request:', "ok"); // Print the HTML for the Google homepage.
    });

  res.json({status: "SUCCESS!!!!!!"});
});

var sub2 = express();
sub2.get("/sub2", function(req, res){
  res.json({
    foo: "bar",
    baz: "quux"
  });
});


var app = express();

app.use(expressPino)
sub1.use(expressPino)
sub2.use(expressPino)





app.use(function (req, res, next) {
    const parent = opentelemetry.getSpan(opentelemetry.context.active());
    const mainSpan = tracer.startSpan('middleware example span');
    const child = pino.child({ trace_id: mainSpan.spanContext.traceId }, {parent: parent})
    child.info("middleware - start of request")
    next()
    mainSpan.end()
    child.info("middleware - end of request")
});

sub1.use(function (req, res, next) {
  console.log("here")
  const parent = opentelemetry.getSpan(opentelemetry.context.active());
  const mainSpan = tracer.startSpan('middleware example span');
  const child = pino.child({ trace_id: mainSpan.spanContext.traceId }, {parent: parent})
  child.info("middleware - start of request - sub1")
  next()
  mainSpan.end()
  child.info("middleware - end of request")
});

sub2.use(function (req, res, next) {
  console.log("here")

  const parent = opentelemetry.getSpan(opentelemetry.context.active());
  const mainSpan = tracer.startSpan('middleware example span');
  const child = pino.child({ trace_id: mainSpan.spanContext.traceId }, {parent: parent})
  child.info("middleware - start of request - sub2")
  next()
  mainSpan.end()
  child.info("middleware - end of request")
});

app.use(sub2);
app.use(sub1);

app.get("/", (req, res) => {
    const parent = opentelemetry.getSpan(opentelemetry.context.active());
    const span = tracer.startSpan("custom span for a unit of work", {parent: parent});
    // poor man's nodejs sleep

    for (let i = 0; i < 50000000; i++) {
        // noop
    }

    // sample request using monkeypatched request lib    
    // request('http://www.google.com', function (error, response, body) {
    //   console.error('error:', "ignore"); // Print the error if one occurred
    //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    //   console.log('request:', "ok"); // Print the HTML for the Google homepage.
    // });

    // sample instrumented http request
    // https://wardbekker.grafana.net/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22grafanacloud-wardbekker-traces%22,%7B%22query%22:%225ec05b97c9f98c8cae541e720f8152d0%22%7D%5D
    const options = {
        hostname: 'example.com',
        port: 443,
        path: '/',
        method: 'GET'
    }

    // const r = https.request(options, res => {
    //     console.log(`statusCode: ${res.statusCode}`)
      
    //     res.on('data', d => {
    //       //process.stdout.write(d)
    //     })
    //   })
      
    //   r.on('error', error => {
    //     //console.error(error)
    //   });
      
    // r.end();

    span.end()
  
    pino.info("inside request handler ")
    res.send("Hello World!");    
});

app.listen(port, () => {
  pino.info(`Example app listening at http://localhost:${port}`);
});
