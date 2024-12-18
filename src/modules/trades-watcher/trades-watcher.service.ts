import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';

import { ExchangesMarkets, ITrade, IExchangeSymbol } from '@models';

import { ByBitExchangeTradesWatcherService } from './helpers/bybit-trades-watcher.service';
import { BinanceExchangeTradesWatcherService } from './helpers/binance-trades-watcher.service';

@Injectable()
export class TradesWatcherService {
  constructor(
    private readonly bybitTradesWAtcher: ByBitExchangeTradesWatcherService,
    private readonly binanceTradesWatcher: BinanceExchangeTradesWatcherService,
  ) {}

  subscribeTradesUpdates(exchangeMarket: ExchangesMarkets): Observable<ITrade> {
    if (exchangeMarket.startsWith('binance'))
      return this.binanceTradesWatcher.subscribeTradesUpdates();

    if (exchangeMarket.startsWith('bybit'))
      return this.bybitTradesWAtcher.subscribeTradesUpdates();
  }

  watchTrades(symbols: IExchangeSymbol[]) {
    const xm = symbols[0].exchangeMarket;
    if (xm.startsWith('binance'))
      return this.binanceTradesWatcher.watchTrades(symbols);

    if (xm.startsWith('bybit'))
      return this.bybitTradesWAtcher.watchTrades(symbols);
  }
}
