import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { BaseResponseInterceptor, LoggingInterceptor } from '@core';

import { ScannerModule } from './modules/scanner/scanner.module';
import { HistoryLoaderModule } from './modules/history-loader/history-loader.module';
import { SymbolsStateManagerModule } from './modules/symbols-state-manager/symbols-state-manager.module';

@Module({
  imports: [
    ScannerModule,
    HistoryLoaderModule,
    SymbolsStateManagerModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BaseResponseInterceptor,
    },
  ],
})
export class AppModule {}
