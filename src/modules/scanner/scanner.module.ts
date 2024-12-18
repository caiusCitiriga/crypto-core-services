import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ScannerService } from './scanner.service';

import { ExchangeModule } from '../exchange/exchange.module';
import { KlinesBuilderModule } from '../klines-builder/klines-builder.module';
import { TradesWatcherModule } from '../trades-watcher/trades-watcher.module';
import { ScannerController } from './scanner.controller';

@Module({
  providers: [ScannerService],
  exports: [ScannerService],
  imports: [
    ScheduleModule,
    ExchangeModule,
    TradesWatcherModule,
    KlinesBuilderModule,
  ],
  controllers: [ScannerController],
})
export class ScannerModule {}
