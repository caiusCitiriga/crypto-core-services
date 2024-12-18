import { ApiProperty } from '@nestjs/swagger';
import { ISSMConfig } from 'src/shared/models/ssm/ssm-config.model';

export class SSMConfigDto implements ISSMConfig {
  @ApiProperty({ isArray: true })
  timeFrames: string[];

  @ApiProperty({ isArray: true })
  whitelist: string[];

  @ApiProperty({ isArray: true })
  blacklist: string[];

  @ApiProperty()
  historyLen: number;
}
