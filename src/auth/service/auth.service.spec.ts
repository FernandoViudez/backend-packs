import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  isValidAddress,
} from 'algosdk';
import { getAuthOfflineTxn } from '../../utils/tests.utils';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
      imports: [
        JwtModule.register({
          secret: 'my_secret_key',
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[validateUser] should not fail when verifying signed txn', async () => {
    const validTxn = getAuthOfflineTxn();
    const response = await service.validateUser(validTxn);
    expect(isValidAddress(response as string)).toBe(true);
  });

  it('[validateUser] should fail because of corrupt txn', async () => {
    const validTxn = getAuthOfflineTxn(true);
    try {
      await service.validateUser(validTxn);
    } catch (error) {
      expect(typeof error).toBe("object");
    }
  });

  it('[login] should return correct jwt', async () => {
    const validTxn = getAuthOfflineTxn();
    const response = await service.login({
      signedTxn: validTxn
    })
    const payload: any = jwtService.decode(response.access_token);
    expect(isValidAddress(payload.address)).toBe(true);
    expect(payload.iat).toBeDefined();
  });

  it('[login] should fail because of corrupt txn', async () => {
    const validTxn = getAuthOfflineTxn(true);
    try {
      await service.login({
        signedTxn: validTxn,
      });
    } catch (error) {
      expect(typeof error).toBe('object');
    }
  });
});
