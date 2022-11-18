import { Test, TestingModule } from '@nestjs/testing';
import { RevealService } from './reveal.service';

describe('RevealService', () => {
  let service: RevealService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevealService],
    }).compile();

    service = module.get<RevealService>(RevealService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
