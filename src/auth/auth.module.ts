import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './service/jwt-strategy.service';
import { IndexerService } from '../services/indexer.service';
import { ConfigService } from '@nestjs/config';
import { AlgoDaemonService } from '../services/algo-daemon.service';
@Module({
  providers: [AuthService, JwtStrategy, AlgoDaemonService, IndexerService],
  controllers: [AuthController],
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION'),
          },
        };
      },
    }),
  ],
})
export class AuthModule {}
