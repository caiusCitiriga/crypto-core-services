import { Module } from '@nestjs/common';

import { ScannerModule } from '../scanner/scanner.module';
import { HistoryLoaderModule } from '../history-loader/history-loader.module';

import { SymbolsStateManagerService } from './symbols-state-manager.service';
import { SymbolsStateManagerGateway } from './symbols-state-manager.gateway';
import { SymbolsStateManagerController } from './symbols-state-manager.controller';

@Module({
  imports: [ScannerModule, HistoryLoaderModule],
  controllers: [SymbolsStateManagerController],
  providers: [SymbolsStateManagerService, SymbolsStateManagerGateway],
})
export class SymbolsStateManagerModule {}
