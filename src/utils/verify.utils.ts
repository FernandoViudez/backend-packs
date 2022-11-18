import { decodeSignedTransaction, encodeAddress, encodeObj } from "algosdk";
import nacl from "tweetnacl";

export const verifySignedTxn = (signedTxn) => {
    const decodedTxn = decodeSignedTransaction(
      new Uint8Array(Buffer.from(signedTxn, 'base64')),
    );

    if (decodedTxn.sig === undefined) return false;

    const pk_bytes = decodedTxn.txn.from.publicKey;

    const sig_bytes = new Uint8Array(decodedTxn.sig);
    
    const txn_bytes = encodeObj(decodedTxn.txn.get_obj_for_encoding());
    const msg_bytes = new Uint8Array(txn_bytes.length + 2);
    msg_bytes.set(Buffer.from('TX'));
    msg_bytes.set(txn_bytes, 2);

    if(nacl.sign.detached.verify(msg_bytes, sig_bytes, pk_bytes)) {
        return encodeAddress(pk_bytes);
    } else {
        throw new Error("Invalid signature");
    }

}