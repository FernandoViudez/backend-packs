import { JwtService } from '@nestjs/jwt';
import { generateAccount, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../service/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  beforeEach(async () => {
    const jwtService = new JwtService();
    service = new AuthService(jwtService);
    controller = new AuthController(service);
    jest.spyOn(service, "login").mockImplementation(async (body: LoginDto) => {
        return {
          access_token: 'some-jwt',
        };
    })
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  type Response = { 
    access_token: string;
  }
  it('should return access_token as object', async () => {
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
    expect(typeof result.access_token).toBe("string")
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
