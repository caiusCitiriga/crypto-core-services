import { Injectable } from '@nestjs/common';

import { MainClient, WebsocketClient as BinanceWebsocket } from 'binance';
import { RestClientV5, WebsocketClient as BybitWebsocket } from 'bybit-api';

import { ExchangesMarkets } from '@models';

import { ByBitExchangeService } from './bybit-exchange-scanner.service';
import { BinanceExchangeService } from './binance-exchange-scanner.service';

@Injectable()
export class ExchangeService {
  constructor(
    private readonly bybitExchange: ByBitExchangeService,
    private readonly binanceExchange: BinanceExchangeService,
  ) {}

  getRestClient<ClientType = MainClient | RestClientV5>(
    exchange: 'binance' | 'bybit',
  ): ClientType {
    if (exchange === 'bybit')
      return this.bybitExchange.getRestClient() as ClientType;
    if (exchange === 'binance')
      return this.binanceExchange.getRestClient() as ClientType;
  }

  getWebsocketClient<ClientType = BinanceWebsocket | BybitWebsocket>(
    exchange: 'binance' | 'bybit',
  ): ClientType {
    if (exchange === 'bybit')
      return this.bybitExchange.getWebsocketClient() as ClientType;
    if (exchange === 'binance')
      return this.binanceExchange.getWebsocketClient() as ClientType;
  }

  async getTradableSymbols(xm: ExchangesMarkets) {
    if (xm.startsWith('binance'))
      return this.binanceExchange.getTradableSymbolsList(xm);

    if (xm.startsWith('bybit'))
      return this.bybitExchange.getTradableSymbolsList(xm);
  }
}
