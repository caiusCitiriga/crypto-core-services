import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { ApiBaseResponseDto, ApiBooleanBaseResponseDto } from '@core';

import { SSMConfigDto } from './dto/ssm-config.dto';
import { SymbolStateDto } from './dto/symbol-state.dto';
import { SymbolsStateManagerService } from './symbols-state-manager.service';

@ApiTags('ssm')
@Controller('ssm')
export class SymbolsStateManagerController {
  constructor(private readonly SSMService: SymbolsStateManagerService) {}

  @Get('started')
  @ApiBooleanBaseResponseDto()
  getStartedStatus() {
    return this.SSMService.isStarted();
  }

  @Get('symbol/state')
  @ApiBaseResponseDto(SymbolStateDto)
  getSymbolState(@Query('symbol') symbol: string) {
    return this.SSMService.getSymbolState(symbol);
  }

  @Post('action/start')
  @ApiBaseResponseDto(SymbolStateDto)
  startSSM(@Body() dto: SSMConfigDto) {
    return this.SSMService.start(dto);
  }
}
