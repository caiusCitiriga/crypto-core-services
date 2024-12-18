import { ExchangesMarkets, ITrade, OHLCV } from '@models';

export interface BaseHistoryLoader {
  /**
   * Backward fetches trades starting from targetTime and incrementally proceeding towards endTime.
   * @param symbol string
   * @param targetTime the open time of the kline that will be used to start the fetch incrementally towards "endTime"
   * @param endTime the open time of the kline on which to stop fetching. This is the time of the first registered kline in the history
   * @param xm exchange market
   */
  fetchTradesBackwardsUntilTradeOpenTime(
    symbol: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
  ): Promise<ITrade[]>;

  fetchTradesBackwardsUntilTradeOpenTimeInChunks(
    symbol: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
    onTradesChunk: (trades: ITrade[]) => void,
  ): Promise<void>;

  /**
   * Backward fetches klines starting from targetTime and incrementally proceeding towards endTime.
   * @param symbol string
   * @param tf string
   * @param targetTime the open time of the kline that will be used to start the fetch incrementally towards "endTime"
   * @param endTime the open time of the kline on which to stop fetching. This is the time of the first registered kline in the history
   * @param xm exchange market
   */
  fetchKlinesBackwardsUntilKlineOpenTime(
    symbol: string,
    tf: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
  ): Promise<OHLCV[]>;
}
