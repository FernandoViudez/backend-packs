import { JwtService } from '@nestjs/jwt';
import { generateAccount, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../service/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  beforeEach(async () => {
    const jwtService = new JwtService();
    const algoDaemonService = new AlgoDaemonService();
    service = new AuthService(jwtService, algoDaemonService);
    controller = new AuthController(service);
    jest.spyOn(service, "login").mockImplementation(async (body: LoginDto) => {
        return {
          accessToken: 'some-jwt',
          program: 'some-program-result-b64'
        };
    })
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  type Response = { 
    accessToken: string;
    program: string;
  }
  it('should return access_token and program result', async () => {
    const randomAddress = generateAccount();
    const txn = makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: randomAddress.addr,
      to: randomAddress.addr,
      suggestedParams: {
        fee: 0,
        firstRound: 1,
        lastRound: 1,
        genesisHash: 'test',
        genesisID: 'test',
      },
    });
    const signedTxn = txn.signTxn(randomAddress.sk);
    const loginDto: LoginDto = {
      signedTxn: Buffer.from(signedTxn).toString("base64"),
    };

    const result: Response = await controller.login(loginDto);
    expect(typeof result.accessToken).toBe("string")
    expect(typeof result.program).toBe('string');
  });

  it('should pass because of passing correct body', async () => {
    const randomAddress = generateAccount();
    const txn = makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: randomAddress.addr,
      to: randomAddress.addr,
      suggestedParams: {
        fee: 0,
        firstRound: 1,
        lastRound: 1,
        genesisHash: 'test',
        genesisID: 'test',
      },
    });
    const signedTxn = txn.signTxn(randomAddress.sk);
    const loginDto: any = {
      signedTxn: Buffer.from(signedTxn).toString('base64'),
    };
    const errors = await validate(plainToInstance(LoginDto, loginDto));
    expect(errors.length).toBe(0);
  });
  
});
