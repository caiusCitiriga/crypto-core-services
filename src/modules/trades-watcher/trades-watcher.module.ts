import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ExchangeModule } from '../exchange/exchange.module';
import { TradesWatcherService } from './trades-watcher.service';

import { ConnectionsManager } from './helpers/connections-manager.helper';
import { ByBitExchangeTradesWatcherService } from './helpers/bybit-trades-watcher.service';
import { BinanceExchangeTradesWatcherService } from './helpers/binance-trades-watcher.service';

@Module({
  imports: [ScheduleModule, ExchangeModule],
  exports: [TradesWatcherService],
  providers: [
    ConnectionsManager,
    TradesWatcherService,
    ByBitExchangeTradesWatcherService,
    BinanceExchangeTradesWatcherService,
  ],
})
export class TradesWatcherModule {}
