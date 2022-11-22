import { Account } from "algosdk";
import { AlgoDaemonService } from "../../services/algo-daemon.service";
import { IndexerService } from "../../services/indexer.service";
import { fromIpfsCidToAlgorandAddress } from "../ipfs.utils";
import { getNFTPlaceholder } from "../NFTs.utils"

export class PackUtils {

    constructor(
        private readonly algoDaemonService: AlgoDaemonService,
        private readonly account: Account
    ){}

    async getTrantorianOfficialPackParams(indexerService: IndexerService, cid: string) {
        const length = await indexerService.getTotalAssetsForAccount(process.env.PACK_CREATOR_ADDR);
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

    getPlaceholderCID() {
        return getNFTPlaceholder();
    }

    
}