import { Injectable, Logger } from '@nestjs/common';

import {
  OHLCV,
  ITrade,
  IExchangeSymbol,
  ExchangesMarkets,
  IKlinesBuildResult,
} from '@models';
import { KlinesUtils, MiscUtils } from '@utils';

export interface ISymbolsReferenceKlines {
  [symbol: string]: { [timeFrame: string]: OHLCV };
}
export interface ISymbolsBuildStartTime {
  [symbol: string]: { [timeFrame: string]: number };
}

@Injectable()
export class KlinesBuilderService {
  private readonly logger = new Logger(KlinesBuilderService.name);

  private referenceKlines: ISymbolsReferenceKlines = {};
  private symbolsBuildStartTimes: ISymbolsBuildStartTime = {};

  buildKlines(
    trade: ITrade,
    exchangeMarket: ExchangesMarkets,
  ): IKlinesBuildResult {
    const tfs = Object.keys(this.referenceKlines[trade.sym]);
    const result: IKlinesBuildResult = {
      klines: {},
      exchangeMarket,
      timeFrames: tfs,
      symbol: trade.sym,
    };

    for (const tf of tfs) {
      if (this.symbolsBuildStartTimes[trade.sym][tf] > trade.ts) continue;

      const buildResult = KlinesUtils.buildKline(
        trade,
        tf,
        this.referenceKlines[trade.sym][tf],
      );
      this.referenceKlines[trade.sym][tf] = buildResult;
      result.klines[tf] = buildResult;
    }

    return result;
  }

  /**
   * Initializes the build start time for each symbol on each time frame.
   * Delaying the build start according to the time frame unit & value.
   * This is done in order to prevent starting to scan during an already begun
   * kline, but wait for nth next kline/s before starting to build.
   * @param symbols the symbols that will be scanned & built
   */
  initializeSymbolsBuildStartTimes(
    symbols: IExchangeSymbol[],
    verbose = false,
  ) {
    symbols.forEach((sym) => {
      const symId = `${sym.baseAsset}${sym.quoteAsset}`;
      this.referenceKlines[symId] = {};
      this.symbolsBuildStartTimes[symId] = {};
      sym.timeFrames.forEach((tf) => {
        const multiplier: number = this.getStartTimeMultiplier(tf);

        // For non deferred builds, just set the value to 0
        const deferredBuildTime =
          KlinesUtils.getNthNextKlineOpeningTimeFromTimestamp(
            Date.now(),
            tf,
            multiplier,
          );

        this.symbolsBuildStartTimes[symId][tf] = deferredBuildTime;
        if (verbose)
          this.logger.verbose(
            `${symId}-${tf} deferred at: "${new Date(deferredBuildTime).toLocaleString()}"`,
          );

        this.referenceKlines[symId][tf] = null;
      });
    });
  }

  /**
   * Returns a number that is the multiplier to use
   * to calculate the symbol build time start. Based on
   * the time frame unit and amount will return different
   * multiplier values to use.
   *
   * @param tf the input tf
   * @returns number the multiplier
   */
  private getStartTimeMultiplier(tf: string): number {
    const tfMeta = MiscUtils.getTfMetadata(tf);
    if (tfMeta.unit === 's' && tfMeta.amount <= 15) {
      return 10;
    }
    if (tfMeta.unit === 'm' && tfMeta.amount <= 5) {
      return 2;
    }

    return 0;
  }
}
