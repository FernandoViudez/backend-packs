import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Algodv2, Transaction, waitForConfirmation } from 'algosdk';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class AlgoDaemonService extends BlockchainService {
  private client: Algodv2;
  constructor() {
    super();
    this.client = new Algodv2(
      process.env.DAEMON_TOKEN,
      process.env.DAEMON_SERVER,
      process.env.DAEMON_PORT,
    );
  }

  async getSuggestedParams() {
    return await this.client.getTransactionParams().do();
  }

  signTxn(txn: Transaction) {
    return txn.signTxn(this.serverSk);
  }

  async sendSignedTxns(txns: Uint8Array[]) {
    try {
      const { txId } = await this.client.sendRawTransaction(txns).do();
      await waitForConfirmation(this.client, txId, 3);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
