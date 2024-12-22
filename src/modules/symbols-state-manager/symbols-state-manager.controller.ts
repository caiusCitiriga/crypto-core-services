import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { ApiBaseResponseDto, ApiBooleanBaseResponseDto } from '@core';

import { SSMConfigDto } from './dto/ssm-config.dto';
import { SymbolStateDto } from './dto/symbol-state.dto';
import { SymbolsStateManagerService } from './symbols-state-manager.service';

@ApiTags('SSM')
@Controller('ssm')
export class SymbolsStateManagerController {
  constructor(private readonly SSMService: SymbolsStateManagerService) {}

  @Get('started')
  @ApiOperation({ summary: 'Checks whether the SSM service is started or not' })
  @ApiBooleanBaseResponseDto()
  getStartedStatus() {
    return this.SSMService.isStarted();
  }

  @Get('symbol/state')
  @ApiBaseResponseDto(SymbolStateDto)
  @ApiOperation({
    summary: 'Retrieve a tracked symbol full state from the SSM',
  })
  getSymbolState(@Query('symbol') symbol: string) {
    return this.SSMService.getSymbolState(symbol);
  }

  @Post('action/start')
  @ApiOperation({
    summary: 'Starts the SSM with a given configuration, if not started',
    description:
      'Once started, calling this endpoint again will have no effect.<br>' +
      'See the full CCS docs under the SSM section for all the details.',
  })
  @ApiBaseResponseDto(SymbolStateDto)
  startSSM(@Body() dto: SSMConfigDto) {
    return this.SSMService.start(dto);
  }
}
