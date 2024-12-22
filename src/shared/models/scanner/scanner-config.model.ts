import { ExchangesMarkets } from '@models';

export interface IScannerConfig {
  quoteAsset?: string;
  timeFrames: string[];
  maxScannedAssets: number;
  blacklist?: string[];
  whitelist?: string[];
  exchangeMarket: ExchangesMarkets;
}
