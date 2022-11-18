import { BadRequestException, Injectable } from '@nestjs/common';
import {
  assignGroupID,
  computeGroupID,
  decodeSignedTransaction,
  encodeAddress,
  makeAssetConfigTxnWithSuggestedParamsFromObject,
  TransactionType,
} from 'algosdk';
import { AssetHolding } from '../../interfaces/asset-holding.interface';
import { Asset } from '../../interfaces/asset.interface';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { fromIpfsCidToAlgorandAddress } from '../../utils/ipfs.utils';
import { pickAndRemoveRandomNFT } from '../../utils/NFTs.utils';
import { verifySignedTxn } from '../../utils/verify.utils';
import { RevealDto } from '../dto/reveal.dto';

@Injectable()
export class RevealService {
  constructor(
    private readonly algoDaemonService: AlgoDaemonService,
    private readonly indexerService: IndexerService,
  ) {}

  async reveal(body: RevealDto) {
    await this.processBodyBeforeReveal(body);

    const ipfsCid = this.pickAndRemoveRandomNFT();

    const reserveAddress = fromIpfsCidToAlgorandAddress(ipfsCid);

    const assetCfgSignedTxn = await this.buildAndSignAssetCfg(
      reserveAddress,
      body.assetId,
    );

    await this.algoDaemonService.sendSignedTxns([
      Buffer.from(body.signedTxn, 'base64'),
    ]);
    await this.algoDaemonService.sendSignedTxns([assetCfgSignedTxn]);

    return ipfsCid;
  }

  private pickAndRemoveRandomNFT() {
    return pickAndRemoveRandomNFT()
  }

  private async buildAndSignAssetCfg(reserveAddress: string, assetId: number) {
    const assetCfgTxn = makeAssetConfigTxnWithSuggestedParamsFromObject({
      assetIndex: assetId,
      from: this.algoDaemonService.serverAddr,
      strictEmptyAddressChecking: false,
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
      manager: process.env.PACK_CREATOR_ADDR,
      reserve: reserveAddress,
    });

    const assetCfgSignedTxn = this.algoDaemonService.signTxn(assetCfgTxn);

    return assetCfgSignedTxn;
  }

  private async processBodyBeforeReveal(body: RevealDto) {
    const assetInfo = await this.checkIfNftExists(body.assetId);

    await this.checkIfValidNFT(assetInfo);

    const sender = await this.checkRevealPaymentTxn(body.signedTxn);

    await this.checkNftHolds(sender, body.assetId);
  }

  private async checkIfNftExists(assetId: number) {
    try {
      return await this.indexerService.getAssetInfo(assetId);
    } catch (error) {
      throw new BadRequestException('Asset not exists');
    }
  }

  private async checkIfValidNFT(asset: Asset) {
    if (
      !asset.deleted &&
      asset.total == 1 &&
      asset.decimals == 0 &&
      asset.creator == process.env.PACK_CREATOR_ADDR &&
      asset.manager == this.algoDaemonService.serverAddr &&
      asset.reserve != '' &&
      asset.unitName == process.env.PACK_UNIT_NAME
    ) {
      return true;
    } else {
      throw new BadRequestException();
    }
  }

  private async checkRevealPaymentTxn(signedTxn: string) {
    const address = verifySignedTxn(signedTxn);
    const { txn } = decodeSignedTransaction(
      new Uint8Array(Buffer.from(signedTxn, 'base64')),
    );
    if (
      txn.amount >= parseInt(process.env.REQUIRED_FEE_FOR_REVEAL) &&
      encodeAddress(txn.to.publicKey) == this.algoDaemonService.serverAddr &&
      txn.type == TransactionType.pay &&
      txn.fee == 1000
    ) {
      return address as string;
    } else {
      throw new BadRequestException('Invalid txn');
    }
  }

  private async checkNftHolds(address: string, assetId: number) {
    const asset: AssetHolding =
      await this.indexerService.getAssetHoldingForAccount(address, assetId);
    if (asset.amount != 1) {
      throw new BadRequestException();
    }
  }
}
