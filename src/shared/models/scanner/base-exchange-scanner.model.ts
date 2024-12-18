import { MainClient, WebsocketClient as BinanceWSClient } from 'binance';
import { RestClientV5, WebsocketClient as BybitWSClient } from 'bybit-api';

import { ExchangesMarkets, IExchangeSymbol } from '@models';

export abstract class BaseExchange<
  RestClientType extends MainClient | RestClientV5,
  WebsocketClientType extends BinanceWSClient | BybitWSClient,
> {
  protected readonly restClient: RestClientType;
  protected readonly websocketClient: WebsocketClientType;

  abstract getTradableSymbolsList(
    exchangeMarket: ExchangesMarkets,
  ): Promise<IExchangeSymbol[]>;

  constructor(
    restClient: RestClientType,
    websocketClient: WebsocketClientType,
  ) {
    this.restClient = restClient;
    this.websocketClient = websocketClient;
  }

  getWebsocketClient(): WebsocketClientType {
    return this.websocketClient;
  }

  getRestClient(): RestClientType {
    return this.restClient;
  }
}
