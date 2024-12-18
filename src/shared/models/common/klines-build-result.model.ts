import { ExchangesMarkets, OHLCV } from '@models';

export interface IKlinesBuildResult {
  symbol: string;
  timeFrames: string[];
  exchangeMarket: ExchangesMarkets;
  klines: { [timeFrame: string]: OHLCV };
}
