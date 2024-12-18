import { Injectable } from '@nestjs/common';

import {
  CategoryV5,
  RestClientV5,
  WebsocketClient,
  SpotInstrumentInfoV5,
  LinearInverseInstrumentInfoV5,
} from 'bybit-api';

import { BybitFactory } from '../factories/bybit.factory';
import { BaseExchange, ExchangesMarkets } from '@models';

@Injectable()
export class ByBitExchangeService extends BaseExchange<
  RestClientV5,
  WebsocketClient
> {
  constructor() {
    super(BybitFactory.getRestClient(), BybitFactory.getWebsocketClient());
  }

  async getTradableSymbolsList(exchangeMarket: ExchangesMarkets) {
    const info = await this.restClient.getInstrumentsInfo({
      category: this.getCategory(exchangeMarket),
    });

    let list: SpotInstrumentInfoV5[] | LinearInverseInstrumentInfoV5[];
    if (exchangeMarket === 'bybit_spot') {
      list = info.result.list as SpotInstrumentInfoV5[];
      return list
        .filter((s) => s.status === 'Trading')
        .map((instrument) => ({
          exchangeMarket,
          baseAsset: instrument.baseCoin,
          quoteAsset: instrument.quoteCoin,
        }));
    }

    if (exchangeMarket === 'bybit_linear') {
      list = info.result.list as LinearInverseInstrumentInfoV5[];
      return list
        .filter((s) => s.status === 'Trading')
        .map((instrument) => ({
          exchangeMarket,
          baseAsset: instrument.baseCoin,
          quoteAsset: instrument.quoteCoin,
        }));
    }
  }

  private getCategory(exchangeMarket: ExchangesMarkets): CategoryV5 {
    if (exchangeMarket === 'bybit_spot') return 'spot';
    if (exchangeMarket === 'bybit_linear') return 'linear';
    throw new Error(
      `Invalid bybit exchange market. Expected something like bybit_market`,
    );
  }
}
