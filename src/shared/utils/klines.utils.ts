import * as moment from 'moment';

import { MiscUtils } from '@utils';
import { OHLCV, ITrade, OHLCVPositions } from '@models';

export class KlinesUtils {
  /**
   * Returns the kline opening time using the given ts respecting
   * the given tf. If you already have a parsedTimeFrameToMs, you
   * can provide it as third parameter, and it will prevent the
   * internal calculation of that same parameter, improving
   * performances.
   * @param ts the timestamp to use for starting the calculation
   * @param tf the time frame to respect in the calculation
   * @param ms optional already parsed tf to ms
   * @returns number the open time of the kline respecting the tf
   */
  static getKlineOpeningTimeFromTimestamp(
    ts: number,
    tf: string,
    ms?: number,
  ): number {
    ms = ms ? ms : MiscUtils.parseTimeFrameToMs(tf);
    return Math.floor(ts / ms) * ms; // shift to the edge of m/h/d (but not M)
  }

  /**
   * Returns the (nth) PREVIOUS kline opening time using the given ts respecting
   * the given tf. If you already have a parsedTimeFrameToMs, you
   * can provide it as third parameter, and it will prevent the
   * internal calculation of that same parameter, improving
   * performances.
   * @param ts the timestamp to use for starting the calculation
   * @param tf the time frame to respect in the calculation
   * @param nthKline the nth PREVIOUS kline number of which you want the opening time
   * @param ms optional already parsed tf to ms
   * @returns number the open time of the previous nth kline respecting the tf
   */
  static getNthPreviousKlineOpeningTimeFromTimestamp(
    ts: number,
    tf: string,
    nthKline: number,
    ms?: number,
  ): number {
    ms = ms ? ms : MiscUtils.parseTimeFrameToMs(tf);
    return this.getKlineOpeningTimeFromTimestamp(ts, tf, ms) - ms * nthKline;
  }

  /**
   * Returns the (nth) NEXT kline opening time using the given ts respecting
   * the given tf. If you already have a parsedTimeFrameToMs, you
   * can provide it as third parameter, and it will prevent the
   * internal calculation of that same parameter, improving
   * performances.
   * @param ts the timestamp to use for starting the calculation
   * @param tf the time frame to respect in the calculation
   * @param nthKline the nth NEXT kline number of which you want the opening time
   * @param ms optional already parsed tf to ms
   * @returns number the open time of the nth kline respecting the tf
   */
  static getNthNextKlineOpeningTimeFromTimestamp(
    ts: number,
    tf: string,
    nthKline: number,
    ms?: number,
  ): number {
    ms = ms ? ms : MiscUtils.parseTimeFrameToMs(tf);
    return this.getKlineOpeningTimeFromTimestamp(ts, tf, ms) + ms * nthKline;
  }

  /**
   * Fills existing gaps in a given OHLCV list provided.
   * @param list the OHLCV klines list
   * @param tf the time frame of the list
   * @returns a filled copy of the given input list
   */
  static fillMissingKlines(list: OHLCV[], tf: string): OHLCV[] {
    const clone = structuredClone(list);
    for (let i = 0; i < clone.length; i++) {
      const k = clone[i];
      if (i === 0) continue;

      const previousKline = clone[i - 1] as OHLCV;
      const klinesGap = this.klinesHasGaps(
        previousKline[OHLCVPositions.TIME],
        k[OHLCVPositions.TIME],
        tf,
      );
      if (klinesGap) {
        const gapsCount = this.getKlineGapsCount(
          previousKline[OHLCVPositions.TIME],
          k[OHLCVPositions.TIME],
          tf,
        );
        const gapsFilledKlines = this.generateMissingKlines(
          previousKline,
          gapsCount,
          tf,
        );
        clone.splice(i, 0, ...(gapsFilledKlines as any));
      }
    }
    return clone;
  }

  /**
   * Fills the gaps in the klines list with n "gaps".
   * Returns a list with the missing klines
   *
   * @param lastKline OHLCV
   * @param gaps the gaps count (how many klines to generate)
   * @param tf the time frame
   * @returns a list containing the generated OHLCV klines
   */
  static generateMissingKlines(
    lastKline: OHLCV,
    gaps: number,
    tf: string,
  ): OHLCV[] {
    if (gaps === 0) return [];
    const klinesToFill: OHLCV[] = [];
    const tfMeta = MiscUtils.getTfMetadata(tf);
    for (let i = 0; i < gaps; i++) {
      const fillKline = [...lastKline] as OHLCV;

      const fillKlineTime = moment(lastKline[OHLCVPositions.TIME])
        .add(tfMeta.amount, tfMeta.unit as any)
        .toDate()
        .getTime();

      fillKline[OHLCVPositions.TIME] = fillKlineTime;
      fillKline[OHLCVPositions.OPEN] = lastKline[OHLCVPositions.CLOSE];
      fillKline[OHLCVPositions.HIGH] = lastKline[OHLCVPositions.CLOSE];
      fillKline[OHLCVPositions.LOW] = lastKline[OHLCVPositions.CLOSE];
      fillKline[OHLCVPositions.CLOSE] = lastKline[OHLCVPositions.CLOSE];
      fillKline[OHLCVPositions.VOLUME] = 0;

      klinesToFill.push(fillKline);
      lastKline = fillKline;
    }

    return klinesToFill;
  }

  /**
   * Returns the number of missing klines between a previous and next kline
   * @param previousKlineTime the previous kline time
   * @param nextKlineTime the next kline open time
   * @param tf the time frame
   * @returns the number of missing klines between the previous and next kline
   */
  static getKlineGapsCount(
    previousKlineTime: number,
    nextKlineTime: number,
    tf: string,
  ): number {
    const newKlineDateTime = moment(nextKlineTime);
    const lastClosedKlineDateTime = moment(previousKlineTime);

    const tfMeta = MiscUtils.getTfMetadata(tf);
    const klinesDiff = newKlineDateTime.diff(
      lastClosedKlineDateTime,
      tfMeta.unit as any,
    );
    return klinesDiff / tfMeta.amount - 1;
  }

  /**
   * Check if there are any gaps between the previous kline and the next kline time
   * @param previousKlineTime the previous kline time
   * @param nextKlineTime the next kline open time
   * @param tf the time frame
   * @returns true if there are any gaps, false otherwise
   */
  static klinesHasGaps(
    previousKlineTime: number,
    nextKlineTime: number,
    tf: string,
  ): boolean {
    return this.getKlineGapsCount(previousKlineTime, nextKlineTime, tf) > 0;
  }

  /**
   * Using the given trade, builds a kline on the given time frame.
   *
   * If a reference kline is given it will be updated and returned,
   * if the trade time matches the given reference kline.
   * If not, two klines will be returned.
   *
   * If no reference kline is given, a new kline generated from the given trade
   * will be returned.
   *
   * @param trade the input trade
   * @param tf the time frame you want to use when building the kline
   * @param klineReference optional, OHLCV the reference kline to use.
   * If passed, will update the kline if the time matches
   * @returns a list of OHLCV klines. It will have 1 element if is a new kline,
   * or if the trade given is on the same kline time as the reference kline. It will have 2 elements if the given
   * trade is of another's kline time, in that case the reference kline & the new kline are returned
   */
  static buildKline(trade: ITrade, tf: string, klineReference?: OHLCV): OHLCV {
    const tfInMs = MiscUtils.parseTimeFrameToMs(tf);
    const openingTime = Math.floor(trade.ts / tfInMs) * tfInMs;

    if (klineReference && klineReference[OHLCVPositions.TIME] === openingTime) {
      return this.buildKlineUsingKlineReference(trade, klineReference);
    }

    return [
      openingTime, // Time
      trade.price, // Open
      trade.price, // High
      trade.price, // Low
      trade.price, // Close
      trade.amt, // Volume
    ];
  }

  private static buildKlineUsingKlineReference(
    trade: ITrade,
    klineRef: OHLCV,
  ): OHLCV {
    const newKline: OHLCV = structuredClone(klineRef);

    newKline[OHLCVPositions.LOW] = Math.min(
      newKline[OHLCVPositions.LOW],
      trade.price,
    );
    newKline[OHLCVPositions.HIGH] = Math.max(
      newKline[OHLCVPositions.HIGH],
      trade.price,
    );
    newKline[OHLCVPositions.CLOSE] = trade.price;
    newKline[OHLCVPositions.VOLUME] += trade.amt;

    return newKline;
  }
}
