import { Injectable, Logger } from '@nestjs/common';
import { MainClient, KlineInterval, Kline, AggregateTrade } from 'binance';

import { MiscUtils } from '@utils';
import { ExchangesMarkets, ITrade, OHLCV } from '@models';

import { BaseHistoryLoader } from './base-history-loader';
import { HistoryLoaderService } from './history-loader.service';
import { ExchangeService } from 'src/modules/exchange/services/exchange.service';

@Injectable()
export class BinanceHistoryLoaderService implements BaseHistoryLoader {
  private readonly logger = new Logger(BinanceHistoryLoaderService.name);

  private abortTradesFetch = false;
  private readonly restClient: MainClient;

  constructor(private readonly exchangeService: ExchangeService) {
    this.restClient = this.exchangeService.getRestClient<MainClient>('binance');
  }

  abortFetch(type: 'trades' | 'klines') {
    if (type === 'trades') this.abortTradesFetch = true;
    else return;
  }

  async fetchTradesBackwardsUntilTradeOpenTime(
    symbol: string,
    targetTime: number,
    endTime: number,
  ): Promise<ITrade[]> {
    const collectedTrades: ITrade[] = [];
    let keepFetching = true;
    let lastCollectedTradeId: number;

    do {
      let trades: AggregateTrade[];
      try {
        await this.waitForIPLimitCoolDown();
        trades = await this.restClient.getAggregateTrades({
          symbol: symbol.replace('/', ''),
          limit: 1000,
          fromId: lastCollectedTradeId,
          startTime: lastCollectedTradeId ? undefined : targetTime,
        });
      } catch (e) {
        this.logger.error(
          `${this.fetchTradesBackwardsUntilTradeOpenTime.name}: ${e['message']}`,
        );
        continue;
      }

      this.logPercentageProgress(targetTime, endTime, +trades.at(-1).T);

      if (
        trades.length &&
        this.lastTradeTimeIsPastEndTime(trades[trades.length - 1].T, endTime)
      ) {
        keepFetching = false;
        trades = this.removeOverflowingTrades(trades, endTime);
      }

      if (!trades.length) {
        keepFetching = false;
        continue;
      }

      collectedTrades.push(
        ...trades.map(
          (t) =>
            ({
              ts: +t.T,
              amt: +t.q,
              price: +t.p,
              sym: symbol,
              id: t.a.toString(),
            }) as ITrade,
        ),
      );
      lastCollectedTradeId = trades[trades.length - 1].a;
    } while (keepFetching && !this.abortTradesFetch);

    if (this.abortTradesFetch) {
      this.logger.warn(`Trades fetching forcefully aborted`);
      this.abortTradesFetch = false;
      return;
    }

    return collectedTrades;
  }

  async fetchTradesBackwardsUntilTradeOpenTimeInChunks(
    symbol: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
    onTradesChunk: (trades: ITrade[]) => void,
  ): Promise<void> {
    let keepFetching = true;
    let lastCollectedTradeId: number;

    do {
      let trades: AggregateTrade[];
      try {
        await this.waitForIPLimitCoolDown();
        trades = await this.restClient.getAggregateTrades({
          symbol: symbol.replace('/', ''),
          limit: 1000,
          fromId: lastCollectedTradeId,
          startTime: lastCollectedTradeId ? undefined : targetTime,
        });
      } catch (e) {
        this.logger.error(
          `${this.fetchTradesBackwardsUntilTradeOpenTime.name}: ${e['message']}`,
        );
        continue;
      }

      this.logPercentageProgress(targetTime, endTime, +trades.at(-1).T);

      if (
        trades.length &&
        this.lastTradeTimeIsPastEndTime(trades[trades.length - 1].T, endTime)
      ) {
        keepFetching = false;
        trades = this.removeOverflowingTrades(trades, endTime);
      }

      if (!trades.length) {
        keepFetching = false;
        continue;
      }

      onTradesChunk(
        trades.map(
          (t) =>
            ({
              ts: +t.T,
              amt: +t.q,
              price: +t.p,
              sym: symbol,
              id: t.a.toString(),
            }) as ITrade,
        ),
      );

      lastCollectedTradeId = trades[trades.length - 1].a;
    } while (keepFetching && !this.abortTradesFetch);

    if (this.abortTradesFetch) {
      this.logger.warn(`Trades fetching forcefully aborted`);
      this.abortTradesFetch = false;
      return;
    }
  }

  private logPercentageProgress(
    startTime: number,
    endTime: number,
    currentTime: number,
  ) {
    const progress = ((currentTime - startTime) / (endTime - startTime)) * 100;
    this.logger.debug(`Trades fetch progress: ${progress.toFixed(2)}%`);
  }

  async fetchKlinesBackwardsUntilKlineOpenTime(
    symbol: string,
    tf: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
  ): Promise<OHLCV[]> {
    const collectedKlines: OHLCV[] = [];
    let keepFetching = true;
    let lastCollectedKlineTime = targetTime;

    do {
      let klines: Kline[];
      try {
        await this.waitForIPLimitCoolDown();
        klines = await this.restClient.getKlines({
          limit: 1000,
          symbol: MiscUtils.removeSymbolSlash(symbol),
          interval: HistoryLoaderService.CCSTimeFrameToExchangeTimeFrame(
            tf,
            xm,
          ) as KlineInterval,
          startTime: lastCollectedKlineTime,
        });
      } catch (e) {
        this.logger.error(
          `${this.fetchKlinesBackwardsUntilKlineOpenTime.name}: ${e['message']}`,
        );
        continue;
      }

      if (!klines?.length) {
        keepFetching = false;
        continue;
      }

      if (this.lastKlineTimeIsPastEndTime(klines, endTime)) {
        keepFetching = false;
        klines = this.removeOverflowingKlines(klines, endTime);
      }

      collectedKlines.push(
        ...klines.map(
          (k) => [k[0], +k[1], +k[2], +k[3], +k[4], +k[5]] as OHLCV,
        ),
      );
      lastCollectedKlineTime = klines.length
        ? klines[klines.length - 1][0] + MiscUtils.parseTimeFrameToMs(tf) // adds the next kline time, since binance returns also the kline time you request
        : lastCollectedKlineTime;
    } while (keepFetching);

    return collectedKlines;
  }

  private lastKlineTimeIsPastEndTime(klines: Kline[], endTime: number) {
    if (!klines.length) return false;
    return klines[klines.length - 1][0] >= endTime;
  }

  private removeOverflowingKlines(klines: Kline[], endTime: number) {
    while (this.lastKlineTimeIsPastEndTime(klines, endTime)) {
      klines.pop();
    }
    return klines;
  }

  private lastTradeTimeIsPastEndTime(tradeTime: number, endTime: number) {
    return tradeTime >= endTime;
  }

  private removeOverflowingTrades(trades: AggregateTrade[], endTime: number) {
    if (trades[trades.length - 1].T >= endTime) {
      const clone = [...trades];
      while (
        this.lastTradeTimeIsPastEndTime(clone[clone.length - 1].T, endTime)
      ) {
        clone.pop();
      }
      return clone;
    }
    return trades;
  }

  private async waitForIPLimitCoolDown(): Promise<void> {
    if (this.restClient.getRateLimitStates()['x-mbx-used-weight-1m'] >= 1195) {
      await MiscUtils.sleepS(30);
    }
  }
}
