import { Injectable } from '@nestjs/common';
import { mnemonicToSecretKey } from 'algosdk';

@Injectable()
export class BlockchainService {
    private account = mnemonicToSecretKey(process.env.MNEMONIC);
    get serverAddr() {
        return this.account.addr;
    }
    protected get serverSk() {
        return this.account.sk;
    }
}
