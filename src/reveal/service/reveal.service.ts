import { Injectable } from '@nestjs/common';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { fromIpfsCidToAlgorandAddress } from '../../utils/ipfs.utils';
import { pickAndRemoveRandomNFT } from '../../utils/NFTs.utils';
import { RevealDto } from '../dto/reveal.dto';
import { RevealUtils } from './reveal.utils';

@Injectable()
export class RevealService {
  _utils: RevealUtils;
  constructor(
    private readonly algoDaemonService: AlgoDaemonService,
    private readonly indexerService: IndexerService,
  ) {
    this._utils = new RevealUtils(this.algoDaemonService, this.indexerService);
  }

  async reveal(user: { address: string }, body: RevealDto) {
    await this.processBodyBeforeReveal(user.address, body);

    const ipfsCid = this.pickAndRemoveRandomNFT();

    const reserveAddress = fromIpfsCidToAlgorandAddress(ipfsCid);

    await this.signAndSendTxns(
      user.address,
      reserveAddress,
      body.assetId,
      body.logicSig,
    );

    return ipfsCid;
  }

  async processBodyBeforeReveal(sender: string, body: RevealDto) {
    const assetInfo = await this._utils.checkIfNftExists(body.assetId);

    await this._utils.checkIfValidNFT(assetInfo);

    await this._utils.checkRevealDelegatedProgram(sender, body);

    await this._utils.checkNftHolds(sender, body.assetId);
  }

  private pickAndRemoveRandomNFT() {
    return pickAndRemoveRandomNFT();
  }

  async signAndSendTxns(
    address: string,
    reserveAddress: string,
    assetId: number,
    logicSign: string,
  ) {
    const txns = await this._utils.buildAtomicTxn(
      address,
      reserveAddress,
      assetId,
      logicSign,
    );
    await this.algoDaemonService.sendSignedTxns(txns);
  }
}
