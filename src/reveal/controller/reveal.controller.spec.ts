import { Test, TestingModule } from '@nestjs/testing';
import { RevealController } from './reveal.controller';

describe('RevealController', () => {
  let controller: RevealController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevealController],
    }).compile();

    controller = module.get<RevealController>(RevealController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
