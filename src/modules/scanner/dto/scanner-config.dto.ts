import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeMarketsEnum, ExchangesMarkets, IScannerConfig } from '@models';
import { IsNumber, Min } from 'class-validator';

export class ScannerConfigDto implements IScannerConfig {
  @ApiPropertyOptional({
    description:
      'If set, the scanner will consider only assets that has the given quote asset.<br/>' +
      'Only the quote asset should be specified.<br/>' +
      'For example, if you want to scan only for pairs with "USDT" as quote asset, you ' +
      'should declare: "USDT"',
  })
  quoteAsset?: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description:
      'The time frames list you want to build for each scanned symbol.<br/>' +
      'The scanner uses first category data for building klines, enabling ' +
      'the user to build any custom time frame, and not depend ' +
      'only on those provided by the exchange. ' +
      'The time frame format is standardized like follows: <br/><br/>' +
      '{amount}{unit}<br/><br/>' +
      'where amount is a number indicating the amount of time in ' +
      'unit, which represents the unit of time.<br/>' +
      'Available units of time are: <br/>' +
      '<ul>' +
      '<li>s: second </li>' +
      '<li>m: minute </li>' +
      '<li>h: hour </li>' +
      '<li>d: day </li>' +
      '<li>w: weeks </li>' +
      '<li>M: month </li>' +
      '<li>y: year </li>' +
      '</ul>' +
      'An example of time frames could be: <br/>' +
      '["5s", "5m", "10h", "3d", "4M",...]<br/><br/>' +
      'Note: you cannot have an amount value lower than 1 for any unit, and you cannot ' +
      'go lower than 1s time frame',
    examples: ['5s', '5m', '3d', '4M'],
  })
  timeFrames: string[];

  @ApiProperty({
    description:
      'The maximum number of total scanned assets.<br>' +
      'It is not suggested to go over 250 assets on the same IP address, since ' +
      'you may hit some rate limits imposed by the exchange. To be sure of how ' +
      'many websocket subscriptions you can have concurrently active, check your ' +
      'exchange specific documentation',
  })
  @IsNumber()
  @Min(0)
  maxScannedAssets: number;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description:
      'If you want to exclude specific assets from the scan, ' +
      'declare them here.<br/>' +
      'In case you are using the "quoteAsset" parameter, ' +
      'you should specify the assets only by the base asset name.<br/><br/>' +
      'For example, if you are using "USDT" as "quoteAsset", and want to exclude ' +
      'BTC/USDT and ETH/USDT pairs, you will just have to declare the list like so:<br/>' +
      '["BTC", "ETH"]: since the scanner will scan only pairs that has "USDT" as quote asset.<br/><br/>' +
      'If you are not using the "quoteAsset" parameter, you should specify the full assets names.<br/>' +
      'For example if you want to exclude "BTC/USDT" and "ETH/USDT" pairs you should declare the list like so:<br/>' +
      '["BTC/USDT", "ETH/USDT"]',
  })
  blacklist?: string[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description:
      'If you only want to scan specific assets declare them here.<br/>' +
      'The whitelist is exclusive, meaning that only what is declared inside ' +
      'this list will be scanned. This is likely the most used scenario, where ' +
      'you want to scan a limited amount of symbols from an exchange. But in case ' +
      'you want to go beyond the "maximumScannedAssets" safely, it is suggested ' +
      'to spawn more instances across different IPs, each one with the configurations ' +
      'you need, and then subscribe to all the SSMs streams from your script.' +
      'In case you are using the "quoteAsset" parameter, ' +
      'you should specify the assets only by the base asset name.<br/><br/>' +
      'For example, if you are using "USDT" as "quoteAsset", and want to scan only ' +
      'BTC/USDT and ETH/USDT pairs, you will just have to declare the list like so:<br/>' +
      '["BTC", "ETH"]: since the scanner will scan only pairs that has "USDT" as quote asset.<br/><br/>' +
      'If you are not using the "quoteAsset" parameter, you should specify the full assets names.<br/>' +
      'For example if you want to scan only "BTC/USDT" and "ETH/USDT" pairs you should declare the list like so:<br/>' +
      '["BTC/USDT", "ETH/USDT"]<br/><br/>' +
      'Note: the same asset declared both in the blacklist and whitelist will be treated as blacklisted',
  })
  whitelist?: string[];

  @ApiProperty({
    enum: ExchangeMarketsEnum,
    description:
      'Enum string defining the combination of exchange and market on that exchange on which to run the scan',
  })
  exchangeMarket: ExchangesMarkets;
}
