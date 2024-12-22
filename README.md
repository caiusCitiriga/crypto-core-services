# Crypto Core Services (CCS)

CCS is a REST and websocket API that standardize communication, data fetching,
and realtime updates across multiple exchanges.

It enables you to:

- fetch historical data
- build realtime candles from first category data (realtime trades)
- receive realtime prices updates for any symbol
- create custom time frames candles
- track hundreds of symbols updates simultaneously on one or more time frames
- receive realtime updates at each new tick
- receive realtime updates at each new candle
- define a sliding window of "n" candles that you want to always have in history
  with each update

CCS aims to cover the major use cases when it comes to interact with a crypto
exchange, like Binance, Bybit etc, by abstracting the communication interface,
and hiding all the background exchange specific implementation details.

It is designed to be robust, flexible, and resilient. Based on the battle tested
and super stable SDK connectors created by [@tiagosiebler](https://github.com/tiagosiebler),
that are used and trusted by thousands.
Thanks to this, CCS provides a stable, resilient and auto healing reconnection
mechanism, guaranteed to be in line with the exchange specific requirements.

You can run and use CCS in multiple ways. It can be ran locally from the source
code, or more conveniently using the already built docker image, which is the
suggested approach.

Either way you can then choose how to communicate with the service:

- You can use the Swagger interface exposed for the REST endpoints at `/swagger`
- Write your own connector for both REST and websocket endpoints, since the
  interface is so simple and intuitive
- Use the CCS language specific SDKs, since CCS is language agnostic, any language
  can be used to implement an SDK and publish it as a library.
  (at the moment there are no official SDKs, but plans are to publish a
  TypeScript and Python SDK soon)

# Getting started

Run the docker container of the service, for simplicity sake, we'll run it with
default configurations. You can find all the configurations available on the
docker section below.

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

CCS is designed to be ran as a Docker container, on one or more servers
concurrently. We provide an already built docker image on DockerHub, but you can
also build your own from source.

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

This will spawn a CCS container exposing the port 5000, assigning the same port
to the CCS service itself, opening CORS only to requests coming from
`http://localhost:4200`, and refusing to process requests coming from undefined
origins.

It is always suggested to limit the origins that are allowed to call the service,
if you plan to deploy this in a production environment.

# Architecture overview

CCS's architecture is composed by:

- A scanner
- A symbols state manager (SSM)
- An history loader

The scanner connects to the specific exchange, and using the provided
configuration will subscribe to realtime trades updates. These updates are used
to build candles, according to the configuration. It acts as the core source of
events, providing vital realtime updates to the SSM.

The Symbols State Manager (SSM) is likely to be the service with which you will
interact most of the times. Like the Scanner, it receives a configuration and
acts as a central manager, keeping track of the changes on any tracked symbol.

From the SSM you can get the snapshot of any tracked symbol, which includes all
the tracked time frames, and historic candles with a look back period according
to the configuration. You can also subscribe to the SSM websocket to get
realtime updates of any new ticks or any new candles for all the tracked symbols.

The history loader is used under the hood by the SSM to load the look back period
for any symbol it tracks. But you can use this service too, it exposes a
websocket communication channel for loading symbols history.

# Scanner

The scanner is the core part that connects with the exchanges, and is responsible
for providing realtime trades information that will be used to build the candles
according to the user configured time frames, and other properties.

To ensure data integrity, the scanner uses a "deferred candles build time" concept,
meaning that it will defer the first candle building until a nth next kline,
to ensure that it doesn't start the building process at the middle of a candle
lifespan. This deferring process depends on the time frame:

For `seconds` and `minutes` time frames, lower or equal to `15 seconds` or
`5 minutes`, the build will be deferred by 1. Meaning that will wait for the
next candle before starting the build.

For other time frames, the same deferring is applied as for `seconds` and `minutes`
but this will soon change, since it is not ideal for higher time frames.

**IMPORTANT:** For example, if you have a `1h` time frame, in the
worst case scenario you will have to wait 1 hour before receiving updates for
that time frame. In an upcoming release this will be changed, and a
"_first candle merging system_" will be used, combining the first scanner built
candle with the same historically retrieved candle. This will maintain the
candle data integrity and will be way faster than waiting for the next candle to spawn.

### Why the need of a Scanner?

If you've worked with exchanges in the past, you might know that most of them
offers a way to directly subscribe to the OHLCV candles stream for a given list
of symbols and time frames. But this comes with a few limitations and trade offs:

- in most cases you will receive second category data, throttled by the exchange
  at a given time rate that most of the times is around a couple of seconds, which
  in time critical applications is a lot of delay.

- you cannot use custom time frames, but only the ones provided and built by the
  exchange

The scanner solves these two issues by:

- actually building candles in realtime and dispatching updates immediately
- allowing the user to choose the time frames it wants to build, even ones that
  are not provided by the exchange, for example `3s` or `11m` etc...

### Configuring the Scanner

To work, the scanner has to be started first. Whether you're directly calling its
endpoint, or using the sdk to start it, it will take the following configuration:

| Parameter          | Type             | Required |
| ------------------ | ---------------- | -------- |
| `quoteAsset`       | string           | false    |
| `timeFrames`       | string[]         | true     |
| `maxScannedAssets` | number           | true     |
| `blacklist`        | string[]         | false    |
| `whitelist`        | string[]         | false    |
| `exchangeMarket`   | ExchangesMarkets | true     |

Below, you can find a detailed description of all the parameters.

- `quoteAsset`: If set, the scanner will consider only assets that has the given
  quote asset.<br>
  Only the quote asset should be specified.<br>
  **Example**: if you want to scan only for pairs with "USDT" as quote asset, you
  should declare: "USDT"

- `timeFrames`: The time frames list you want to build for each scanned symbol.<br>
  The time frame format is standardized like follows: <br/><br/>
  {amount}{unit}<br/><br/>
  where amount is a number indicating the amount of time in unit, which represents
  the unit of time.<br/>
  Available units of time are: <br/>

  - `s`: second
  - `m`: minute
  - `h`: hour
  - `d`: day
  - `w`: weeks
  - `M`: month
  - `y`: year

  **Example**: `["3s", "15s", "1m", "12m", ...]`<br/>
  **Note**: you cannot have an amount value lower than 1 for any unit, and you
  cannot go lower than 1s time frame.

  Although there are no enforced limits on
  how many time frames you can use, a long list might impact system performances

- `maxScannedAssets`: The maximum number of total scanned assets.<br>
  It is not suggested to go over 250 assets on the same IP address, since you may
  hit some rate limits imposed by the exchange. To be sure of how many websocket
  subscriptions you can have concurrently active, check your exchange specific
  documentation

- `blacklist`: If you want to exclude specific assets from the scan, declare
  them here.<br/>
  In case you are using the `quoteAsset` parameter, you should specify the assets
  only by the base asset name.<br/><br/>

  **Example**: if you are using a `quoteAsset` (like "USDT"), and want to exclude
  `BTC/USDT` and `ETH/USDT` pairs, you will declare the list using only the base
  assets, like this: `["BTC", "ETH"]`<br>
  Since the scanner will scan only pairs that has "USDT" as quote asset.<br/>

  **Example**: if you are not using the `quoteAsset` parameter, you have to specify
  the full assets names.<br>
  Let's say you want to exclude `BTC/USDT` and `ETH/USDT`
  pairs, you will declare the list like this: `["BTC/USDT", "ETH/USDT"]`<br>
  Since the scanner is not looking for a particular quote asset, you have to be
  specific about the assets you want to exclude

- `whitelist`: If you only want to scan specific assets declare them here.<br/>
  The whitelist is exclusive, meaning that only what is declared inside this list
  will be scanned. This is likely the most used scenario, where you want to scan
  a limited amount of symbols from an exchange. But in case you want to go beyond
  the `maximumScannedAssets` safely, it is suggested to spawn more instances
  across different IPs, each one with the configurations you need, and then
  subscribe to all the SSMs streams from your script.<br>

  In case you are using the `quoteAsset` parameter, you should specify the assets
  only by the base asset name.<br/>

  **Example**: if you are using a `quoteAsset` (like "USDT"), and want to scan
  only `BTC/USDT` and `ETH/USDT` pairs, you will declare the list using only
  the base assets, like this: `["BTC", "ETH"]`<br>
  Since the scanner will scan only pairs that has "USDT" as quote asset.<br/>

  **Example**: if you are not using the `quoteAsset` parameter, you have to specify
  the full assets names.<br>
  Let's say you want to scan only for `BTC/USDT` and `ETH/USDT` pairs, you will
  declare the list like this: `["BTC/USDT", "ETH/USDT"]`<br>
  Since the scanner is not looking for a particular quote asset, you have to be
  specific about the assets you want to scan

- `exchangeMarket`: Enum string defining the combination of exchange and market
  on that exchange on which to run the scan. Possible values are:

  - `bybit_linear`: for Bybit linear market
  - `bybit_spot`: for Bybit spot market
  - `binance_spot`: for Binance spot market

  All the up to date possible values can be found in Swagger docs at `/swagger`.

# Symbols State Manager (SSM)

- describe SSM role

# History Loader

- describe history loader role
