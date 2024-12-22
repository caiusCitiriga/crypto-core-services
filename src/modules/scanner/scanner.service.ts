import { BehaviorSubject, filter, map, tap } from 'rxjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { APP_ERRORS } from '@errors';
import { IExchangeSymbol, IKlinesBuildResult, IScannerConfig } from '@models';

import { ExchangeService } from '../exchange/services/exchange.service';
import { KlinesBuilderService } from '../klines-builder/klines-builder.service';
import { TradesWatcherService } from '../trades-watcher/trades-watcher.service';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  private config: IScannerConfig;
  private scannedSymbols: IExchangeSymbol[] = [];

  private readonly scannedSymbolsUpdates$ =
    new BehaviorSubject<IKlinesBuildResult>(null);

  constructor(
    private readonly exchange: ExchangeService,
    private readonly tradesWatcher: TradesWatcherService,
    private readonly klinesBuilder: KlinesBuilderService,
  ) {}

  get scannerStarted() {
    // TODO: change this to make it independent of the scanner config
    return !!this.scannerConfig;
  }

  get scannerConfig() {
    return this.config;
  }

  get symbolsState() {
    return this.scannedSymbols;
  }

  get symbolsUpdates() {
    return this.scannedSymbolsUpdates$.asObservable();
  }

  setScannerConfig(config: IScannerConfig) {
    this.config = config;
  }

  start() {
    if (!this.config)
      throw new BadRequestException(APP_ERRORS.scanner.config_not_initialized);

    this.subscribeTradesUpdates();
    this.scan();
  }

  private subscribeTradesUpdates(): void {
    const { quoteAsset, exchangeMarket } = this.config;

    this.tradesWatcher
      .subscribeTradesUpdates(exchangeMarket)
      .pipe(
        map((trade) => this.klinesBuilder.buildKlines(trade, exchangeMarket)),
        filter((builtKlines) => !!Object.keys(builtKlines.klines).length),
        tap((builtKlines) => {
          // CCS ecosystem expects the symbol to be symBase/symQuote
          builtKlines.symbol = builtKlines.symbol.replace(
            quoteAsset,
            `/${quoteAsset}`,
          );
          this.dispatchUpdate(builtKlines);
        }),
      )
      .subscribe();
  }

  private dispatchUpdate(builtKlines: IKlinesBuildResult) {
    this.scannedSymbolsUpdates$.next(builtKlines);
  }

  // TODO: needs redesign, I don't like this approach
  //   private setupNewListingCronJob(scannersCount: number) {
  //     const newListingCronString = `${scannersCount} 23 * * *`;
  //     const jobName = 'new-listings-check-job';

  //     const job = new CronJob(newListingCronString, () => {
  //       // TODO: improve once there will be two scanners on same exchange.
  //       // this would collide. Need to implement markets freezing mechanism
  //       // to prevent two scanners from scanning the same market on same tf
  //       this.scan();
  //     });

  //     this.schedulerRegistry.addCronJob(jobName, job);
  //     job.start();

  //     this.logger.warn(
  //       `job "${jobName}" added for ${newListingCronString} cron string`,
  //     );
  //   }

  async scan() {
    this.logger.verbose(`Scanning for new symbols...`);
    const scannableSymbols = await this.getScannableSymbols();

    if (
      scannableSymbols.length &&
      scannableSymbols.length + this.scannedSymbols.length >
        this.config.maxScannedAssets
    ) {
      this.logger.error(
        `Found ${scannableSymbols.length} scannable symbols, but max scannable symbols quota has been reached. Consider spawning a new scanner`,
      );
      return;
    }

    const newSymbolsToScan: IExchangeSymbol[] = [];
    for (const s of scannableSymbols) {
      const sCompare = `${s.baseAsset}/${s.quoteAsset}`;
      if (
        !this.scannedSymbols.find(
          (_s) => `${_s.baseAsset}/${_s.quoteAsset}` === sCompare,
        )
      ) {
        newSymbolsToScan.push(s);
      }
    }

    if (!newSymbolsToScan.length) {
      this.logger.verbose(`No new scannable symbols found`);
      return;
    }

    for (const symToScan of newSymbolsToScan) {
      this.scannedSymbols.push(symToScan);
    }

    // Do NOT re-initialize already initialized symbols build start times by
    // passing the scannedSymbols array. Always pass the newSymbolsToScan
    // array instead
    this.klinesBuilder.initializeSymbolsBuildStartTimes(newSymbolsToScan, true);

    // Do NOT re-scan already scanned symbols by passing the scannedSymbols array.
    // Always pass the newSymbolsToScan array instead
    this.tradesWatcher.watchTrades(newSymbolsToScan);
  }

  async getScannableSymbols(): Promise<IExchangeSymbol[]> {
    const {
      blacklist,
      whitelist,
      quoteAsset,
      timeFrames,
      exchangeMarket,
      maxScannedAssets,
    } = this.config;

    const allExchangeSymbols = await this.exchange.getTradableSymbols(
      this.config.exchangeMarket,
    );

    let validExchangeSymbols = allExchangeSymbols.filter((s) => {
      const isSameQuoteAsset =
        s.quoteAsset.toLowerCase() === quoteAsset.toLowerCase();
      const isNotBlacklisted = !blacklist.includes(s.baseAsset);
      const isNotShortingPair =
        !s.baseAsset.toLowerCase().endsWith('up') &&
        !s.baseAsset.toLowerCase().endsWith('down');

      return isSameQuoteAsset && isNotBlacklisted && isNotShortingPair;
    });

    const validWhitelist = whitelist && whitelist.length && whitelist[0] !== '';

    if (validWhitelist)
      validExchangeSymbols = validExchangeSymbols.filter((s) =>
        whitelist.includes(s.baseAsset),
      );

    const scannableSymbols: IExchangeSymbol[] = [];
    for (const symbol of validExchangeSymbols) {
      const currentSymbol: IExchangeSymbol = {
        timeFrames: timeFrames,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        exchangeMarket: exchangeMarket,
      };

      if (currentSymbol.timeFrames.length) {
        scannableSymbols.push(currentSymbol);
      }
    }

    return scannableSymbols.slice(-maxScannedAssets);
  }
}
