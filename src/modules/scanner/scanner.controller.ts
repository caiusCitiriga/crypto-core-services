import { Body, Controller, Post } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ApiTags } from '@nestjs/swagger';
import { ScannerConfigDto } from './dto/scanner-config.dto';

@Controller('scanner')
@ApiTags('scanner')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Post('action/start')
  startScannerFromConfig(@Body() dto: ScannerConfigDto) {
    this.scanner.setScannerConfig(dto);
    this.scanner.start();
    return true;
  }
}
