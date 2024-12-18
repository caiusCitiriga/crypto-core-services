import { Module } from '@nestjs/common';

import { ExchangeModule } from '../exchange/exchange.module';
import { HistoryLoaderGateway } from './history-loader.gateway';

import { HistoryLoaderService } from './services/history-loader.service';
import { BybitHistoryLoaderService } from './services/bybit-history-loader.service';
import { BinanceHistoryLoaderService } from './services/binance-history-loader.service';

@Module({
  imports: [ExchangeModule],
  exports: [
    HistoryLoaderService,
    BybitHistoryLoaderService,
    BinanceHistoryLoaderService,
  ],
  providers: [
    HistoryLoaderService,
    HistoryLoaderGateway,
    BybitHistoryLoaderService,
    BinanceHistoryLoaderService,
  ],
})
export class HistoryLoaderModule {}
