import { resampleOhlcvArray } from 'ohlc-resample';
import { filter, interval, Subject, tap } from 'rxjs';

import { Injectable, Logger } from '@nestjs/common';

import { KlinesUtils, MiscUtils } from '@utils';
import { isBybitExchange, isBinanceExchange } from '@typeguards';
import { IHistoryLoadRequest, OHLCV, ExchangesMarkets } from '@models';

import { BaseHistoryLoader } from './base-history-loader';
import { BybitHistoryLoaderService } from './bybit-history-loader.service';
import { BinanceHistoryLoaderService } from './binance-history-loader.service';

@Injectable()
export class HistoryLoaderService {
  private readonly logger = new Logger(HistoryLoaderService.name);

  private newJobsRequests = new Subject<IHistoryLoadRequest>();

  private busy = false;
  private jobsQueue: IHistoryLoadRequest[] = [];

  private readonly historyLoaded$ = new Subject<{
    reqId: string;
    ticker: string;
    history: OHLCV[];
  }>();

  constructor(
    private readonly bybitHistoryLoader: BybitHistoryLoaderService,
    private readonly binanceHistoryLoader: BinanceHistoryLoaderService,
  ) {
    this.newJobsRequests
      .pipe(tap((req) => this.jobsQueue.push(req)))
      .subscribe();

    interval(1000)
      .pipe(
        filter(() => !this.busy && !!this.jobsQueue[0]),
        tap(() => this.processNextQueuedJob()),
      )
      .subscribe();
  }

  get queuedJobsLen() {
    return this.jobsQueue.length;
  }

  get busyStatus() {
    return this.busy;
  }

  subscribeHistoriesLoaded() {
    return this.historyLoaded$.asObservable();
  }

  addJobToQueue(job: IHistoryLoadRequest) {
    this.newJobsRequests.next(job);
  }

  private async processNextQueuedJob() {
    this.busy = true;
    const job = this.jobsQueue[0];
    if (!job) {
      this.busy = false;
      return;
    }

    const [exchange, sym, tf] = job.ticker.split('~');

    let klines = await this.collectKlines(
      exchange as ExchangesMarkets,
      sym,
      tf,
      job.referenceKlineTime,
      job.len,
    );
    if (
      klines.length &&
      klines[klines.length - 1][0] === job.referenceKlineTime
    ) {
      // if last collected kline overlaps reference kline,
      // remove the collected overlapping kline
      klines.pop();
    }

    this.historyLoaded$.next({
      reqId: job.reqId,
      ticker: job.ticker,
      history: klines.slice(-job.len),
    });

    this.logger.warn(
      `[${job.ticker}](${klines.length}) processing ended. QL: ${this.queuedJobsLen}`,
    );

    klines = null;

    this.jobsQueue.shift();
    this.busy = false;
  }

  private async collectKlines(
    xm: ExchangesMarkets,
    sym: string,
    tf: string,
    referenceKlineTime: number,
    len: number,
  ): Promise<OHLCV[]> {
    if (this.timeFrameCannotBeResampledFromKlines(xm, tf)) {
      // TODO: in this case we should load the trades history and
      // build the klines from that. For now return an array with a null element
      return [null];
    }

    const loader = this.getHistoryLoader(xm);

    const targetKlineTime =
      KlinesUtils.getNthPreviousKlineOpeningTimeFromTimestamp(
        referenceKlineTime,
        tf,
        len,
      );

    const tfMeta = MiscUtils.getTfMetadata(tf);
    const klines = await loader.fetchKlinesBackwardsUntilKlineOpenTime(
      sym.replace('/', ''),
      tf,
      targetKlineTime,
      referenceKlineTime,
      xm,
    );

    if (this.TfNeedsResampling(tf, xm)) {
      const meta = MiscUtils.getTfMetadata(tf);
      if (['d', 'w', 'M', 'y'].includes(meta.unit)) {
        throw new Error(
          `Resampling of "${meta.unit}" time frames is not supported yet`,
        );
      }
      return resampleOhlcvArray(klines, 1, tfMeta.amount);
    }

    return klines;
  }

  private timeFrameCannotBeResampledFromKlines(
    xm: ExchangesMarkets,
    tf: string,
  ) {
    const meta = MiscUtils.getTfMetadata(tf);
    if (isBybitExchange(xm)) {
      if (meta.unit == 'y') return true;
      return false;
    }
    return false;
  }

  private TfNeedsResampling(tf: string, xm: ExchangesMarkets): boolean {
    const meta = MiscUtils.getTfMetadata(tf);
    if (isBinanceExchange(xm)) {
      const secs = [1];
      const weeks = [1];
      const months = [1];
      const days = [1, 3];
      const mins = [1, 3, 5, 15, 30];
      const hours = [1, 2, 4, 6, 8, 12];
      if (meta.unit === 's' && !secs.includes(meta.amount)) return true;
      if (meta.unit === 'm' && !mins.includes(meta.amount)) return true;
      if (meta.unit === 'h' && !hours.includes(meta.amount)) return true;
      if (meta.unit === 'd' && !days.includes(meta.amount)) return true;
      if (meta.unit === 'w' && !weeks.includes(meta.amount)) return true;
      if (meta.unit === 'M' && !months.includes(meta.amount)) return true;
      return false;
    }
    if (isBybitExchange(xm)) {
      const secs = [1];
      const days = [1];
      const weeks = [1];
      const months = [1];
      const mins = [1, 3, 5, 15, 30];
      const hours = [1, 2, 4, 6, 12];
      if (meta.unit === 's' && !secs.includes(meta.amount)) return true;
      if (meta.unit === 'm' && !mins.includes(meta.amount)) return true;
      if (meta.unit === 'h' && !hours.includes(meta.amount)) return true;
      if (meta.unit === 'd' && !days.includes(meta.amount)) return true;
      if (meta.unit === 'w' && !weeks.includes(meta.amount)) return true;
      if (meta.unit === 'M' && !months.includes(meta.amount)) return true;
      return false;
    }
  }

  static CCSTimeFrameToExchangeTimeFrame(
    tf: string,
    xm: ExchangesMarkets,
  ): string {
    const meta = MiscUtils.getTfMetadata(tf);
    if (isBinanceExchange(xm)) {
      if (meta.unit === 's') return '1s';
      return tf;
    }

    if (isBybitExchange(xm)) {
      if (meta.unit === 's') return '1s';
      if (meta.unit === 'y')
        throw new Error(
          `Bybit does not support time frames bigger than 1 month. And build from trades is not supported yet`,
        );
      if (meta.unit === 'm') {
        if ([1, 3, 5, 15, 30].includes(meta.amount)) {
          return meta.amount.toString();
        }
        return '1'; // will be then resampled to the desired resolution
      }
      if (meta.unit === 'h') {
        const minutes = 60 * meta.amount;
        if ([120, 240, 360, 720].includes(minutes) || minutes === 60) {
          return minutes.toString();
        }
        if (minutes > 720) {
          return '720';
        }

        return '1';
      }
      if (meta.unit === 'd') {
        return 'D'; // will be then resampled to the desired resolution
      }
      if (meta.unit === 'w') {
        return 'W'; // will be then resampled to the desired resolution
      }
      if (meta.unit === 'M') {
        return 'M'; // will be then resampled to the desired resolution
      }
    }
  }

  private getHistoryLoader(xm: ExchangesMarkets): BaseHistoryLoader {
    if (isBinanceExchange(xm)) {
      return this.binanceHistoryLoader;
    } else if (isBybitExchange(xm)) {
      return this.bybitHistoryLoader;
    } else {
      throw Error(`Exchange market not supported for history loading: "${xm}"`);
    }
  }
}
