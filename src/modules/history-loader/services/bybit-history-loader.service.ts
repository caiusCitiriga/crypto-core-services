import { KlineIntervalV3, OHLCVKlineV5, RestClientV5 } from 'bybit-api';

import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

import { MiscUtils } from '@utils';
import { isBybitLinearMarket } from '@typeguards';
import { ExchangesMarkets, OHLCV, ITrade } from '@models';

import { BaseHistoryLoader } from './base-history-loader';
import { HistoryLoaderService } from './history-loader.service';
import { ExchangeService } from 'src/modules/exchange/services/exchange.service';

@Injectable()
export class BybitHistoryLoaderService implements BaseHistoryLoader {
  private readonly logger = new Logger(BybitHistoryLoaderService.name);

  private readonly restClient: RestClientV5;

  constructor(private readonly exchangeService: ExchangeService) {
    this.restClient = this.exchangeService.getRestClient<RestClientV5>('bybit');
  }

  async fetchKlinesBackwardsUntilKlineOpenTime(
    symbol: string,
    tf: string,
    startTime: number,
    endTime: number,
    xm: ExchangesMarkets,
  ): Promise<OHLCV[]> {
    const collectedKlines: OHLCV[] = [];
    let keepFetching = true;
    let lastCollectedKlineTime = startTime;

    do {
      let klines: OHLCVKlineV5[];
      try {
        await this.waitForIPLimitCoolDown();
        const res = await this.restClient.getKline({
          category: isBybitLinearMarket(xm) ? 'linear' : 'spot',
          interval: HistoryLoaderService.CCSTimeFrameToExchangeTimeFrame(
            tf,
            xm,
          ) as KlineIntervalV3,
          symbol: symbol.replace('/', ''),
          limit: 200,
          start: lastCollectedKlineTime,
        });
        klines = res.result.list.reverse();
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

      if (
        !!collectedKlines.length &&
        !!klines.length &&
        collectedKlines.at(-1)[0] === +klines[0][0]
      ) {
        keepFetching = false;
        klines = this.removeOverflowingKlines(klines, endTime);
      } else {
        collectedKlines.push(
          ...klines.map(
            (k) => [+k[0], +k[1], +k[2], +k[3], +k[4], +k[5]] as OHLCV,
          ),
        );
        lastCollectedKlineTime = klines.length
          ? +klines[klines.length - 1][0] + MiscUtils.parseTimeFrameToMs(tf) // adds the next kline time, since binance returns also the kline time you request
          : +lastCollectedKlineTime;
      }
    } while (keepFetching);

    return collectedKlines;
  }

  fetchTradesBackwardsUntilTradeOpenTime(
    symbol: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
  ): Promise<ITrade[]> {
    throw new NotImplementedException();
  }

  fetchTradesBackwardsUntilTradeOpenTimeInChunks(
    symbol: string,
    targetTime: number,
    endTime: number,
    xm: ExchangesMarkets,
    onTradesChunk: (trades: ITrade[]) => void,
  ): Promise<void> {
    throw new NotImplementedException();
  }

  private lastKlineTimeIsPastEndTime(klines: OHLCVKlineV5[], endTime: number) {
    if (!klines.length) return false;
    return +klines[klines.length - 1][0] >= endTime;
  }

  private removeOverflowingKlines(klines: OHLCVKlineV5[], endTime: number) {
    while (this.lastKlineTimeIsPastEndTime(klines, endTime)) {
      klines.pop();
    }
    return klines;
  }

  private async waitForIPLimitCoolDown(): Promise<void> {
    // TODO: actually handle this, like binance history loader does
    await MiscUtils.sleepMs(50);
  }
}
