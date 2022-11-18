import {
  Account,
  makeAssetCreateTxnWithSuggestedParamsFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  Transaction,
} from 'algosdk';
import { delay, from, lastValueFrom } from 'rxjs';
import { AlgoDaemonService } from '../../services/algo-daemon.service';

export class TxnUtils {
  constructor(
    private readonly algoDaemonService: AlgoDaemonService,
    private readonly account: Account,
  ) {}

  async authPaymentTxn() {
    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
      from: this.account.addr,
      to: this.account.addr,
    });
    return paymentTxn;
  }

  async paymentTxn(from: string, to: string, amount: number) {
    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
      from,
      to,
      amount,
    });
    return paymentTxn;
  }
  
  async assetOptInTxn(assetId: number) {
    const assetSendTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
      from: this.account.addr,
      to: this.account.addr,
      assetIndex: assetId,
      amount: 0,
    });
    return assetSendTxn;
  }

  async assetCreateTxn(obj: any) {
    const assetCreateTxn = makeAssetCreateTxnWithSuggestedParamsFromObject({
        suggestedParams: await this.algoDaemonService.getSuggestedParams(),
        from: this.account.addr,
        ...obj,
    })
    return assetCreateTxn;
  }
  
  async assetSendTxn(from: string, to: string, assetId: number) {
    const assetSendTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams: await this.algoDaemonService.getSuggestedParams(),
        from,
        to,
        amount: 1,
        assetIndex: assetId
    })
    return assetSendTxn;
  }

  async sendTxns(txns: Uint8Array[]): Promise<Record<string, any>> {
    const result = await this.algoDaemonService.sendSignedTxns(txns);
    await this.delay(2000);
    return result;
  }

  signTxn(txn: Transaction) {
    return txn.signTxn(this.account.sk);    
  }

  private async delay(miliseconds: number) {
    await lastValueFrom(from([1]).pipe(delay(miliseconds)));
  }
}
