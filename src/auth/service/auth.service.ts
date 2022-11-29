import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { verifySignedTxn } from '../../utils/verify.utils';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { getProgram } from '../../reveal/teal/delegated-teal.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService, 
    private readonly algoDaemonService: AlgoDaemonService,
  ) {}

  async validateUser(signedTxn: string) {
    try {
      const sender = verifySignedTxn(signedTxn);
      return sender;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async login(body: LoginDto) {
    const address = await this.validateUser(body.signedTxn);
    const payload = { address };
    return {
      access_token: this.jwtService.sign(payload),
      program: (await getProgram(this.algoDaemonService)).result,
    };
  }
}
