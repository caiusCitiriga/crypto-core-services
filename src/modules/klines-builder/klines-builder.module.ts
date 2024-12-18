import { Module } from '@nestjs/common';
import { KlinesBuilderService } from './klines-builder.service';

@Module({
  exports: [KlinesBuilderService],
  providers: [KlinesBuilderService],
})
export class KlinesBuilderModule {}
