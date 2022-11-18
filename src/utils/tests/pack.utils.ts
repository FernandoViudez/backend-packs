import { Account } from "algosdk";
import { AlgoDaemonService } from "../../services/algo-daemon.service";
import { fromIpfsCidToAlgorandAddress } from "../ipfs.utils";
import { getNFTPlaceholder } from "../NFTs.utils"

export class PackUtils {

    constructor(
        private readonly algoDaemonService: AlgoDaemonService,
        private readonly account: Account
    ){}

    getTrantorianOfficialPackParams(cid: string) {
        return {
          decimals: 0,
          total: 1,
          defaultFrozen: false,
          // TODO: length of the assets from this.account.addr + 1
          assetName: `Pack #${new Date().getMilliseconds()}`,
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