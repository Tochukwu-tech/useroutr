import { Test, TestingModule } from '@nestjs/testing';
import { BridgeRouterService } from './bridge-router.service';

describe('BridgeService', () => {
  let service: BridgeRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BridgeRouterService],
    }).compile();

    service = module.get<BridgeRouterService>(BridgeRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
