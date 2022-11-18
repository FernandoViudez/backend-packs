import { Module } from '@nestjs/common';
import { AlgoDaemonService } from '../services/algo-daemon.service';
import { IndexerService } from '../services/indexer.service';
import { RevealController } from './controller/reveal.controller';
import { RevealService } from './service/reveal.service';

@Module({
  controllers: [RevealController],
  providers: [RevealService, AlgoDaemonService, IndexerService],
})
export class RevealModule {}
