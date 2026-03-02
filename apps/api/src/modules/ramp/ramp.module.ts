import { Module } from '@nestjs/common';
import { RampService } from './ramp.service';

@Module({
  providers: [RampService],
})
export class RampModule {}
