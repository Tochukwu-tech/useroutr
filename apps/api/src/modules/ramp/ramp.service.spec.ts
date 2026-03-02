import { Test, TestingModule } from '@nestjs/testing';
import { RampService } from './ramp.service';

describe('RampService', () => {
  let service: RampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RampService],
    }).compile();

    service = module.get<RampService>(RampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
