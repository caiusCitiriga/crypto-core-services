import { Injectable } from '@nestjs/common';

import { MainClient, WebsocketClient } from 'binance';
import { BaseExchange } from 'src/shared/models/scanner/base-exchange-scanner.model';
import { ExchangesMarkets } from 'src/shared/models/types/exchanges-markets.type';
import { BinanceFactory } from '../factories/binance.factory';

@Injectable()
export class BinanceExchangeService extends BaseExchange<
  MainClient,
  WebsocketClient
> {
  constructor() {
    super(BinanceFactory.getRestClient(), BinanceFactory.getWebsocketClient());
  }

  async getTradableSymbolsList(exchangeMarket: ExchangesMarkets) {
    const info = await this.restClient.getExchangeInfo();
    return info.symbols
      .filter((s) => s.status === 'TRADING')
      .map((s) => ({
        exchangeMarket,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
  }
}
