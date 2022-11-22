import { BadRequestException } from "@nestjs/common";
import { assignGroupID, decodeAddress, decodeUint64, makeAssetConfigTxnWithSuggestedParamsFromObject, makePaymentTxnWithSuggestedParamsFromObject, signLogicSigTransactionObject } from "algosdk";
import { AssetHolding } from "../../interfaces/asset-holding.interface";
import { Asset } from "../../interfaces/asset.interface";
import { AlgoDaemonService } from "../../services/algo-daemon.service";
import { IndexerService } from "../../services/indexer.service";
import {
  fromStringToLogicSign,
} from '../../utils/logic-sign.utils';
import { RevealDto } from "../dto/reveal.dto";

export class RevealUtils {
  constructor(
    private readonly algoDaemonService: AlgoDaemonService,
    private readonly indexerService: IndexerService,
  ) {}

  async checkIfNftExists(assetId: number) {
    try {
      return await this.indexerService.getAssetInfo(assetId);
    } catch (error) {
      throw new BadRequestException('Asset not exists');
    }
  }

  async checkIfValidNFT(asset: Asset) {
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

  async checkNftHolds(address: string, assetId: number) {
    const asset: AssetHolding =
      await this.indexerService.getAssetHoldingForAccount(address, assetId);
    if (asset.amount != 1) {
      throw new BadRequestException();
    }
  }

  async checkRevealDelegatedProgram(sender: string, body: RevealDto) {
    const signed = fromStringToLogicSign(body.logicSig);
    console.log(signed.args[0]);
    // const assetIdFromLogicSig = Buffer.from(signed.args[0], "base64");
    if (
      !signed.verify(decodeAddress(sender).publicKey) 
      // ||
      // body.assetId != assetIdFromLogicSig
    ) { 
      throw new BadRequestException();
    }
  }

  async buildAtomicTxn(
    sender: string,
    reserveAddress: string, 
    assetId: number,
    logicSign: string,
  ) {
    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      amount: 1000,
      from: sender,
      to: this.algoDaemonService.serverAddr,
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
    });

    const assetCfgTxn = makeAssetConfigTxnWithSuggestedParamsFromObject({
      assetIndex: assetId,
      from: this.algoDaemonService.serverAddr,
      strictEmptyAddressChecking: false,
      suggestedParams: await this.algoDaemonService.getSuggestedParams(),
      manager: process.env.PACK_CREATOR_ADDR,
      reserve: reserveAddress,
    });

    assignGroupID([paymentTxn, assetCfgTxn]);

    const lsig = fromStringToLogicSign(logicSign);

    const paymentTxnSigned = signLogicSigTransactionObject(
      paymentTxn,
      lsig,
    ).blob;
    const assetCfgSignedTxn = this.algoDaemonService.signTxn(assetCfgTxn);

    return [paymentTxnSigned, assetCfgSignedTxn];
  }
} 