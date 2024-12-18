import { ISymbolHistory, OHLCV } from '@models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SymbolHistoryDto implements ISymbolHistory {
  @ApiProperty()
  tf: string;

  @ApiProperty({
    type: Number,
    isArray: true,
  })
  history: OHLCV[];

  @ApiPropertyOptional()
  loaded?: boolean;

  @ApiPropertyOptional()
  loading?: boolean;
}

export class SymbolStateDto {
  @ApiProperty()
  symbol: string;

  @ApiProperty({ type: SymbolHistoryDto, isArray: true })
  histories: SymbolHistoryDto[];
}
