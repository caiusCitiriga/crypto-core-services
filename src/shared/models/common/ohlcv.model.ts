export enum OHLCVPositions {
  TIME = 0,
  OPEN,
  HIGH,
  LOW,
  CLOSE,
  VOLUME,
  TRADE_TIME,
}

/**
 * Timestamp
 * Open
 * High
 * Low
 * Close
 */
export type OHLCV = [number, number, number, number, number, number];
