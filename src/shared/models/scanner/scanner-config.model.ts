import { ExchangesMarkets } from '@models';

export interface IScannerConfig {
  quoteAsset: string;
  timeFrames: string[];
  maxScannedAssets: number;
  baseAssetsBlacklist: string[];
  baseAssetsWhitelist: string[];
  waitForFirstNewKline: boolean;
  exchangeMarket: ExchangesMarkets;
}
