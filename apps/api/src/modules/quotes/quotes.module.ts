import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';

@Module({
  providers: [QuotesService],
})
export class QuotesModule {}
