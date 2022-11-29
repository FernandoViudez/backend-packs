import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  generateAccount,
  isValidAddress, makePaymentTxnWithSuggestedParamsFromObject,
} from 'algosdk';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { AuthService } from './auth.service';

const getAuthOfflineTxn = (corrupt = false) => {
  const acc = generateAccount();
  const otherAcc = generateAccount();
  const payTx = makePaymentTxnWithSuggestedParamsFromObject({
    amount: 0,
    from: corrupt ? otherAcc.addr : acc.addr,
    to: corrupt ? otherAcc.addr : acc.addr,
    suggestedParams: {
      fee: 0,
      firstRound: 1,
      lastRound: 1,
      genesisHash: 'test',
      genesisID: ' test',
    },
  });
  return Buffer.from(payTx.signTxn(acc.sk)).toString("base64");
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, AlgoDaemonService],
      imports: [
        JwtModule.register({
          secret: 'my_secret_key',
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should not fail when verifying signed txn', async () => {
    const validTxn = getAuthOfflineTxn();
    const response = await service.validateUser(validTxn);
    expect(isValidAddress(response as string)).toBe(true);
  });

  it('should fail because of corrupt txn', async () => {
    const validTxn = getAuthOfflineTxn(true);
    try {
      await service.validateUser(validTxn);
    } catch (error) {
      expect(typeof error).toBe("object");
    }
  });

  it('should return correct jwt', async () => {
    const validTxn = getAuthOfflineTxn();
    const response = await service.login({
      signedTxn: validTxn
    })
    const payload: any = jwtService.decode(response.access_token);
    expect(isValidAddress(payload.address)).toBe(true);
    expect(payload.iat).toBeDefined();
  });

  it('should fail because of corrupt txn', async () => {
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
