import { Module } from '@nestjs/common';

import { ExchangeService } from './services/exchange.service';
import { ByBitExchangeService } from './services/bybit-exchange-scanner.service';
import { BinanceExchangeService } from './services/binance-exchange-scanner.service';

@Module({
  exports: [ExchangeService],
  providers: [ExchangeService, ByBitExchangeService, BinanceExchangeService],
})
export class ExchangeModule {}
