import { Account } from "algosdk";
import { AlgoDaemonService } from "../../src/services/algo-daemon.service";
import { IndexerService } from "../../src/services/indexer.service";
import { fromIpfsCidToAlgorandAddress } from "../../src/utils/ipfs.utils";
import { getNFTPlaceholder } from "../../src/utils/NFTs.utils";

export class PackUtils {

    constructor(
        private readonly algoDaemonService: AlgoDaemonService,
        private readonly indexerService: IndexerService,
        private readonly account: Account
    ){}

    async getTrantorianOfficialPackParams(cid: string) {
        const length = await this.indexerService.getTotalAssetsForAccount(process.env.PACK_CREATOR_ADDR);
        return {
          decimals: 0,
          total: 1,
          defaultFrozen: false,
          assetName: `Pack #${length}`,
          manager: this.algoDaemonService.serverAddr,
          reserve: fromIpfsCidToAlgorandAddress(cid),
          unitName: process.env.PACK_UNIT_NAME,
          assetURL: process.env.PACK_URL,
        };
    }

    async getPack(packId: number) {
        return await this.indexerService.getAssetInfo(packId)
    }

    getPlaceholderCID() {
        return getNFTPlaceholder();
    }

    
}