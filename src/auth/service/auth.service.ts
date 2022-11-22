import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { verifySignedTxn } from '../../utils/verify.utils';
import { getDelegatedRevealProgramBytes } from '../../utils/logic-sign.utils';
import { AlgoDaemonService } from '../../services/algo-daemon.service';

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
    const program = await this.algoDaemonService.compile(getDelegatedRevealProgramBytes());
    return {
      access_token: this.jwtService.sign(payload),
      program: program.result,
    };
  }
}
