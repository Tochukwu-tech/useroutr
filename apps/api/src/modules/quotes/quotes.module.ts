import { Module } from '@nestjs/common';
import { StellarModule } from '../stellar/stellar.module.js';
import { QuotesService } from './quotes.service';

@Module({
  imports: [StellarModule],
  providers: [QuotesService],
})
export class QuotesModule {}
