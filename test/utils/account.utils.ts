import { Account, generateAccount, mnemonicToSecretKey } from 'algosdk';
import { AlgoDaemonService } from '../../src/services/algo-daemon.service';
import { TxnUtils } from './txn.utils';

export class AccountUtils {
  private txnUtils: TxnUtils;
  account: Account;

  get addr() {
    return this.account.addr;
  }

  get sk() {
    return this.account.sk;
  }

  constructor(private readonly algoDaemonService: AlgoDaemonService, mnemonic?: string) {
    if(!mnemonic) {
      this.createAccount();
    } else {
      this.account = mnemonicToSecretKey(mnemonic);
    }
    this.txnUtils = new TxnUtils(algoDaemonService, this.account);
  }

  private async createAccount() {
    this.account = generateAccount();
  }

  async fund() {
    const txn = await this.txnUtils.paymentTxn(
      this.algoDaemonService.serverAddr,
      this.account.addr,
      1000000,
    );
    const signedTxn = this.algoDaemonService.signTxn(txn);
    await this.txnUtils.sendTxns([signedTxn]);
  }

  async receiveAsset(assetId: number) {
    const optInTxn = await this.txnUtils.assetOptInTxn(assetId);
    const signedOptInTxn = this.txnUtils.signTxn(optInTxn);
    await this.txnUtils.sendTxns([signedOptInTxn]);
  }
}
