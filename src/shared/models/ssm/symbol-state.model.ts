import { OHLCV } from '@models';

export interface ISymbolHistory {
  tf: string;
  history: OHLCV[];
  loaded?: boolean;
  loading?: boolean;
}

export interface ISymbolState {
  symbol: string;
  histories: { [tf: string]: ISymbolHistory };
}
