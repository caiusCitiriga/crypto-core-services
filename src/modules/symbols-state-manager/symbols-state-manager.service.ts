import { tap, filter } from 'rxjs';
import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { APP_ERRORS } from '@errors';
import { KlinesUtils } from '@utils';
import { ISSMConfig, ISymbolState, IKlinesBuildResult, OHLCV } from '@models';

import { ScannerService } from '../scanner/scanner.service';
import { SymbolsStateManagerGateway } from './symbols-state-manager.gateway';
import { HistoryLoaderService } from '../history-loader/services/history-loader.service';

@Injectable()
export class SymbolsStateManagerService {
  private pendingHistoriesLoadUIDs: string[] = [];

  private started = false;
  private config: ISSMConfig;
  private readonly IK_THROTTLING_TIME_MS = 100;
  private readonly state: { [symbol: string]: ISymbolState } = {};

  private readonly logger = new Logger(SymbolsStateManagerService.name);
  private readonly IKLastEmissionTimes: {
    [symAndTf: string]: number;
  } = {};

  constructor(
    private readonly scanner: ScannerService,
    private readonly historyLoader: HistoryLoaderService,
    private readonly SSMWsGateway: SymbolsStateManagerGateway,
  ) {}

  isStarted() {
    return this.started;
  }

  start(config: ISSMConfig) {
    if (this.started) return true;
    if (!this.scanner.scannerStarted)
      throw new BadRequestException(APP_ERRORS.ssm.scanner_service_not_started);

    this.config = config;
    this.subscribeHistoriesLoaded();
    this.connectScanner();

    this.started = true;
    return true;
  }

  getSymbolState(symbol: string): ISymbolState | null {
    const sym = this.state[symbol];
    if (!sym) return null;
    return sym;
  }

  handleNewKlinesUpdate(update: IKlinesBuildResult) {
    if (!this.started) return;
    if (!this.isInterestedInUpdate(update)) return;

    const filteredUpdate = this.removeUnwantedTimeFrames(update);
    if (!this.state[filteredUpdate.symbol]) {
      this.initStateInternal(filteredUpdate.symbol);
    }

    this.requestHistoryLoadIfMissing(filteredUpdate);
    this.updateHistories(filteredUpdate);
  }

  private updateHistories(update: IKlinesBuildResult) {
    const { histories: timeFramesHistories } = this.getSymStateOrThrow(
      update.symbol,
    );

    update.timeFrames.forEach((tf) => {
      const newKline = update.klines[tf] as OHLCV;
      const lastKline = timeFramesHistories[tf].history.at(-1);

      if (!lastKline) {
        timeFramesHistories[tf].history.push(newKline);
        return;
      }

      const isNewKline = !lastKline || lastKline[0] !== newKline[0];

      if (isNewKline) {
        // FK update
        timeFramesHistories[tf].history.push(
          ...this.getFilledKlines(lastKline, newKline, tf),
        );

        timeFramesHistories[tf].history = this.trimHistory(
          timeFramesHistories[tf].history,
        );

        if (!timeFramesHistories[tf].loaded) return;
        this.SSMWsGateway.emitNewFKUpdate({
          tf,
          sym: update.symbol,
          xm: update.exchangeMarket,
          history: timeFramesHistories[tf].history,
        });
      } else {
        // IK update
        const lastKlineIndex = timeFramesHistories[tf].history.findIndex(
          (k) => k[0] === newKline[0],
        );
        timeFramesHistories[tf].history[lastKlineIndex] = newKline;

        if (!timeFramesHistories[tf].loaded) return;
        if (!this.canDispatchIKUpdate(update.symbol, tf)) return;

        if (!this.IKLastEmissionTimeMapExists(update.symbol, tf)) {
          this.initIKLastEmissionTimeMap(update.symbol, tf);
          this.SSMWsGateway.emitNewIKUpdate({
            tf,
            sym: update.symbol,
            xm: update.exchangeMarket,
            history: timeFramesHistories[tf].history,
          });
        } else {
          this.IKLastEmissionTimes[`${update.symbol}:${tf}`] = Date.now();
          this.SSMWsGateway.emitNewIKUpdate({
            tf,
            sym: update.symbol,
            xm: update.exchangeMarket,
            history: timeFramesHistories[tf].history,
          });
        }
      }
    });
  }

  private trimHistory(klines: OHLCV[]) {
    return klines.splice(-this.config.historyLen) as OHLCV[];
  }

  private canDispatchIKUpdate(symbol: string, tf: string): boolean {
    if (!this.IKLastEmissionTimes[`${symbol}:${tf}`]) {
      this.IKLastEmissionTimes[`${symbol}:${tf}`] = Date.now();
      return true;
    }
    return (
      Date.now() - this.IKLastEmissionTimes[`${symbol}:${tf}`] >=
      this.IK_THROTTLING_TIME_MS
    );
  }

  private IKLastEmissionTimeMapExists(symbol: string, tf: string): boolean {
    return !!this.IKLastEmissionTimes[`${symbol}:${tf}`];
  }

  private initIKLastEmissionTimeMap(symbol: string, tf: string) {
    this.IKLastEmissionTimes[`${symbol}:${tf}`] = Date.now();
  }

  private getFilledKlines(
    lastHistoryKline: OHLCV,
    newKline: OHLCV,
    tf: string,
  ): OHLCV[] {
    const filledKlines = KlinesUtils.fillMissingKlines(
      [lastHistoryKline, newKline],
      tf,
    ) as OHLCV[];
    filledKlines.shift(); // remove the first kline since overlaps with history last kline
    return filledKlines;
  }

  private removeUnwantedTimeFrames(
    update: IKlinesBuildResult,
  ): IKlinesBuildResult {
    const clone = structuredClone(update);
    const tfsToRemove = update.timeFrames.filter(
      (tf) => !this.config.timeFrames.includes(tf),
    );
    tfsToRemove.forEach((tf) => {
      delete clone.klines[tf];
      clone.timeFrames = clone.timeFrames.filter((_tf) => _tf != tf);
    });
    return clone;
  }

  private isInterestedInUpdate(update: IKlinesBuildResult): boolean {
    const workTFs = this.config.timeFrames;
    const { exchangeMarket: scannerExchangeMarket } =
      this.scanner.scannerConfig;
    const { klines, symbol, exchangeMarket, timeFrames } = update;

    const allRequiredTFsArePresent = workTFs.every(
      (tf) => timeFrames.includes(tf) && !!klines[tf],
    );

    if (scannerExchangeMarket !== exchangeMarket) return false;
    if (this.config.blacklist.includes(symbol)) return false;
    if (this.config.whitelist.length && !this.config.whitelist.includes(symbol))
      return false;
    if (!allRequiredTFsArePresent) return false;
    return true;
  }

  private requestHistoryLoadIfMissing(update: IKlinesBuildResult) {
    const { symbol } = update;
    const { exchangeMarket } = this.scanner.scannerConfig;
    update.timeFrames.forEach(async (tf) => {
      const symState = this.state[symbol];
      const isUntrackedHistory =
        !symState.histories[tf].loaded && !symState.histories[tf].loading;

      if (isUntrackedHistory) {
        symState.histories[tf].loading = true;

        const historyLoadReqId = randomUUID();
        this.pendingHistoriesLoadUIDs.push(historyLoadReqId);

        this.historyLoader.addJobToQueue({
          reqId: historyLoadReqId,
          len: this.config.historyLen,
          referenceKlineTime: update.klines[tf][0],
          ticker: `${exchangeMarket}~${symbol}~${tf}`,
        });
      }
    });
  }

  private initStateInternal(symbol: string) {
    this.state[symbol] = {
      symbol,
      histories: {},
    };

    this.config.timeFrames.forEach((tf) => {
      this.state[symbol].histories[tf] = {
        tf,
        history: [],
        loaded: false,
        loading: false,
      };
    });
  }

  private subscribeHistoriesLoaded() {
    this.historyLoader
      .subscribeHistoriesLoaded()
      .pipe(
        filter(
          ({ reqId }) =>
            !!reqId && this.pendingHistoriesLoadUIDs.includes(reqId),
        ),
        tap(({ reqId }) => {
          this.pendingHistoriesLoadUIDs = this.pendingHistoriesLoadUIDs.filter(
            (id) => id !== reqId,
          );
        }),
        tap((event) => {
          const { ticker, history } = event;
          const [, symbol, tf] = ticker.split('~');
          const symState = this.state[symbol];
          if (
            history[history.length - 1][0] ===
            symState.histories[tf].history[0][0]
          ) {
            // If the state has the same tracked kline as the last one returned from
            // the history load, trust the one that is in the state since it comes from
            // the scanner, and is sure to be a kline that has been tracked since the beginning
            history.pop();
          }
          symState.histories[tf].loaded = true;
          symState.histories[tf].loading = false;
          symState.histories[tf].history.unshift(...history);
        }),
      )
      .subscribe();
  }

  private getSymStateOrThrow(symbol: string): ISymbolState {
    const symState = this.state[symbol];
    if (!symState) {
      throw 'SymbolStateUntrackedError';
    }
    return symState;
  }

  private connectScanner() {
    this.scanner.symbolsUpdates
      .pipe(tap((event) => this.handleNewKlinesUpdate(event)))
      .subscribe();
  }
}
