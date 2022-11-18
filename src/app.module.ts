import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RevealModule } from './reveal/reveal.module';
import { IndexerService } from './services/indexer.service';
import { AuthModule } from './auth/auth.module';
import { AlgoDaemonService } from './services/algo-daemon.service';
import { BlockchainService } from './services/blockchain.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RevealModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, IndexerService, AlgoDaemonService, BlockchainService],
})
export class AppModule {}
