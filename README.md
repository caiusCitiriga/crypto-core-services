# Crypto Core Services (CCS)

CCS is a REST and websocket API that standardize communication, data fetching,
and realtime updates across multiple exchanges.

It enables you to:

- fetch historical data
- build realtime candles from first category data (realtime trades)
- receive realtime prices updates for any supported symbol
- create custom time frames candles
- track hundreds of symbols updates simultaneously on one or more time frames
- receive realtime updates at each new tick
- receive realtime updates at each new candle
- define a sliding window of "n" candles that you want to always have in history with each update

CCS aims to cover the major use cases when it comes to interact with a crypto exchange, like
Binance, Bybit etc, by abstracting the communication interface, and hiding all the background
exchange specific implementation details.

It is designed to be robust, flexible, and resilient. Based on the battle tested
and super stable SDK connectors created by [@tiagosiebler](https://github.com/tiagosiebler),
that are used and trusted by thousands.
Thanks to this, CCS provides a stable, resilient and auto healing reconnection mechanism,
guaranteed to be in line with the exchange specific requirements.

You can run and use CCS in multiple ways. It can be ran locally from the source code, or more conveniently using the
already built docker image, which is the suggested approach.

Either way you can then choose how to communicate with the service:

- You can use the Swagger interface exposed for the REST endpoints at `/swagger`
- Write your own connector for both REST and websocket endpoints, since the interface is so simple and intuitive
- Use the CCS language specific SDKs, since CCS is language agnostic, any language
  can be used to implement an SDK and publish it as a library. (at the moment there are no official SDKs, but plans
  are to publish a TypeScript and Python SDK soon)

# Getting started

Run the docker container of the service, for simplicity sake, we'll run it with default configurations. You can
find all the configurations available on the docker section below.

```
docker run @caiuscitiriga/ccs
```

```ts
// Start the scanner
// Start the SSM

// How to get a symbol realtime snapshot from SSM
// How to subscribe to IK events
// How to subscribe to FK events
// How to request history loads
```

# Docker

CCS is designed to be ran as a Docker container, on one or more servers concurrently. We provide an already
built docker image on DockerHub, but you can also build your own from source.

The official image accepts the following configuration environment variables:

| Parameter                      | Description                                       | Type   | Default |
| ------------------------------ | ------------------------------------------------- | ------ | ------- |
| `CCS_PORT`                     | the service port                                  | number | 3000    |
| `CCS_ENABLE_SWAGGER`           | enable Swagger docs at `/swagger`                 | bool   | true    |
| `CCS_ALLOWED_REST_ORIGINS`     | CORS allowed REST origins. Comma separated values | string | \*      |
| `CCS_ACCEPT_UNKNOWN_ORIGINS`   | accept or not requests from undefined origins     | bool   | true    |
| `CCS_VERBOSE_REQUESTS_LOGGING` | enables or disables verbose console logging       | bool   | true    |

Run a container specifying some environment variables:

```sh
docker run @caiuscitiriga/ccs --name ccs \
-p 5000:5000 \
-e CCS_PORT=5000 \
-e CCS_ALLOWED_REST_ORIGINS=http://localhost:4200 \
-e CCS_ACCEPT_UNKNOWN_ORIGINS=false
```

This will spawn a CCS container exposing the port 5000, assigning the same port to the CCS
service itself, opening CORS only to requests coming from `http://localhost:4200`, and refusing
to process requests coming from undefined origins.

It is always suggested to limit the origins that are allowed to call the service, if you
plan to deploy this in a production environment.

# Architecture overview

CCS's architecture is composed by:

- A scanner
- A symbols state manager (SSM)
- An history loader

The scanner connects to the specific exchange, and using the provided configuration will subscribe to realtime
trades updates. These updates are used to build candles, according to the configuration.
It acts as the core source of events, providing vital realtime updates to the SSM.

The Symbols State Manager (SSM) is likely to be the service with which you will interact most of the times.
Like the Scanner, it receives a configuration and acts as a central manager, keeping track of the changes on any tracked symbol.

From the SSM you can get the snapshot of any tracked symbol, which includes all the tracked time frames, and historic candles
with a look back period according to the configuration. You can also subscribe to the SSM websocket to get realtime updates
of any new ticks or any new candles for all the tracked symbols.

The history loader is used under the hood by the SSM to load the look back period for any symbol it tracks.
But you can use this service too, it exposes a websocket communication channel for loading symbols history.

## Scanner

## Symbols State Manager (SSM)

## History Loader

# TODO:

- scanner: implement a reset mechanism to clean the current scanning and restart fresh. This will imply some cleanup procedure on the trades watcher too
- dto: add validators on DTOs
- ws: validate payloads for required properties
- ws: document websocket interactions
- REST: document REST interactions
- SDK: implement nodejs SDK and document it

# TODO (docs):

### Scanner

- describe scanner role
- describe first category data concept
- describe deferred build start time concept for low time frames
- describe realtime klines build vs exchange OHLCV delayed subscription

### History loader

- describe history loader role

### SSM

- describe SSM role
