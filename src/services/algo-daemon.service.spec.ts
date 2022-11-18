import { Test, TestingModule } from '@nestjs/testing';
import { AlgoDaemonService } from './algo-daemon.service';

describe('AlgoDaemonService', () => {
  let service: AlgoDaemonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlgoDaemonService],
    }).compile();

    service = module.get<AlgoDaemonService>(AlgoDaemonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
