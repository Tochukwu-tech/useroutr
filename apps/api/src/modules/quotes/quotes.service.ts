import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { StellarService } from '../stellar/stellar.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    // private readonly prisma: PrismaService,
    private readonly stellar: StellarService,
  ) {}
}
