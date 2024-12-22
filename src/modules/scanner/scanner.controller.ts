import { Body, Controller, Post } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScannerConfigDto } from './dto/scanner-config.dto';

@ApiTags('Scanner')
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Post('action/start')
  @ApiOperation({
    summary: 'Starts the scanner with a given configuration if not started',
    description:
      'Once started, calling this endpoint again will have no effect.<br>' +
      'See the full CCS docs under the scanner section for all the details.',
  })
  startScannerFromConfig(@Body() dto: ScannerConfigDto) {
    this.scanner.setScannerConfig(dto);
    this.scanner.start();
    return true;
  }
}
