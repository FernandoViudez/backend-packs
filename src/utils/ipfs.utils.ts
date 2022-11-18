import { encodeAddress } from "algosdk";
import { CID } from "multiformats/cid";


export const fromIpfsCidToAlgorandAddress = (cid: string): string => {
    const _cid = CID.parse(cid);
    const reserveAddress = encodeAddress(_cid.multihash.digest);
    return reserveAddress; 
}