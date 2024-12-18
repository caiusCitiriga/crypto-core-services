import { ExchangesMarkets, OHLCV } from '@models';

export interface IFKEvent {
  tf: string;
  sym: string;
  history: OHLCV[];
  xm: ExchangesMarkets;
}
