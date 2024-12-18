import { ExchangesMarkets } from '@models';

export interface IExchangeSymbol {
  baseAsset: string;
  quoteAsset: string;
  timeFrames?: string[];
  exchangeMarket: ExchangesMarkets;
}
