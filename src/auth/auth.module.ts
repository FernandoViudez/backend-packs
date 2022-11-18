import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './service/jwt-strategy.service';
import { IndexerService } from '../services/indexer.service';
import { ConfigService } from '@nestjs/config';
@Module({
  providers: [AuthService, JwtStrategy, IndexerService],
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
