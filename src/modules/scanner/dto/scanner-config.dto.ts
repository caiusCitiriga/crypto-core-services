import { ApiProperty } from '@nestjs/swagger';
import { ExchangeMarketsEnum, ExchangesMarkets, IScannerConfig } from '@models';

export class ScannerConfigDto implements IScannerConfig {
  @ApiProperty()
  quoteAsset: string;

  @ApiProperty({ isArray: true })
  timeFrames: string[];

  @ApiProperty()
  maxScannedAssets: number;

  @ApiProperty({ isArray: true })
  baseAssetsBlacklist: string[];

  @ApiProperty({ isArray: true })
  baseAssetsWhitelist: string[];

  @ApiProperty()
  waitForFirstNewKline: boolean;

  @ApiProperty({ enum: ExchangeMarketsEnum })
  exchangeMarket: ExchangesMarkets;
}
