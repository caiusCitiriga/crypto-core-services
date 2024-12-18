export interface IHistoryLoadRequest {
  /**
   * How much look back to load backwards
   * starting from the referenceKlineTime
   *
   * AKA: Total klines to load backwards
   */
  len: number;

  /**
   * A unique id that will allow you to recognize
   * this request among others.
   */
  reqId: string;

  /**
   * In form of:
   *
   * exchange_market~symbol~tf
   */
  ticker: string;

  /**
   * The kline time (ts in milliseconds)
   * from which to start the history back loading
   * according to "len" look back
   */
  referenceKlineTime: number;
}
