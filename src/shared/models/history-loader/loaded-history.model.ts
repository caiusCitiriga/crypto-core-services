import { OHLCV } from '@models';

export interface ILoadedHistory {
  reqId: string;
  ticker: string;
  history: OHLCV[];
}
