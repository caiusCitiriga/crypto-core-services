export interface IByBitRawTrade {
  /**
   * TS
   */
  T: number;
  /**
   * SYM (eg: BTCUSDT)
   */
  s: string;
  /**
   * SIDE
   */
  S: string;
  /**
   * TRADE SIZE (VOLUME)
   */
  v: string;
  /**
   * TRADE PRICE (PRICE)
   */
  p: string;
  /**
   * DIRECTION PRICE CHANGE (PlusTick, MinusTick...)
   */
  L: string;
  /**
   * TRADE ID
   */
  i: string;
  /**
   * BLOCK TRADE OR NOT
   */
  BT: boolean;
}

export class ByBitRawTradeMessage {
  ts: number;
  type: string;
  topic: string;
  data: IByBitRawTrade[];
}
