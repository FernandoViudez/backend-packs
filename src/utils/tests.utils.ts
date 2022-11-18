import { Account, assignGroupID, generateAccount, makeAssetCreateTxnWithSuggestedParamsFromObject, makeAssetTransferTxnWithSuggestedParamsFromObject, makePaymentTxnWithSuggestedParamsFromObject, SuggestedParams } from "algosdk";
import { delay, from, lastValueFrom } from "rxjs";
import { AlgoDaemonService } from "../services/algo-daemon.service";
import { fromIpfsCidToAlgorandAddress } from "./ipfs.utils";
import { getNFTPlaceholder } from "./NFTs.utils";

export const getAuthOfflineTxn = (isCorrupt = false) => {
  const acc1 = generateAccount();
  const acc2 = generateAccount();
  const txn = makePaymentTxnWithSuggestedParamsFromObject({
    amount: 0,
    from: isCorrupt ? acc2.addr : acc1.addr,
    to: acc1.addr,
    suggestedParams: {
      fee: 0,
      firstRound: 1,
      lastRound: 1,
      genesisHash: 'test',
      genesisID: 'test',
    },
  });
  const signedTxn = txn.signTxn(acc1.sk);
  return Buffer.from(signedTxn).toString('base64');
};

export const createAndFundAccount = async (daemon: AlgoDaemonService) => {
  const newAcc = generateAccount();
  const payTxn = makePaymentTxnWithSuggestedParamsFromObject({
    from: daemon.serverAddr,
    to: newAcc.addr,
    amount: 10000000,
    suggestedParams: await daemon.getSuggestedParams(),
  })
  const signedTxn = daemon.signTxn(payTxn);
  await daemon.sendSignedTxns([
    signedTxn
  ])
  return newAcc;
}

export const buildPaymentTxn = async (
  daemon: AlgoDaemonService,
  amount: number, 
  isCorrupt = false,
) => {
  const acc1 = generateAccount();
  const txn = makePaymentTxnWithSuggestedParamsFromObject({
    from: isCorrupt ? daemon.serverAddr : acc1.addr,
    to: daemon.serverAddr,
    amount,
    suggestedParams: await daemon.getSuggestedParams(),
  });
  assignGroupID([txn]);
  const signedTxn = txn.signTxn(acc1.sk);
  return Buffer.from(signedTxn).toString('base64');
};

export const createPack = async (client: AlgoDaemonService) => {
  const newAcc = await createAndFundAccount(client);
  const assetPlaceholderCID = getNFTPlaceholder();
  const assetCreate = makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams: await client.getSuggestedParams(),
    decimals: 0,
    total: 1,
    defaultFrozen: false,
    from: newAcc.addr,
    assetName: 'Pack #1',
    reserve: fromIpfsCidToAlgorandAddress(assetPlaceholderCID),
    manager: client.serverAddr,
    unitName: process.env.PACK_UNIT_NAME,
  });
  const signedAssetCreate = assetCreate.signTxn(newAcc.sk);
  const result = await client.sendSignedTxns([signedAssetCreate]);
  const assetId = result['asset-index'];
  await lastValueFrom(from([assetId]).pipe(delay(5000)));
  return {
    creator: newAcc,
    assetId: assetId,
  };
}

export const optinAssetFromAccount = (params: SuggestedParams, account: Account, assetId: number) => {
  const optinTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    amount: 0,
    from: account.addr,
    to: account.addr,
    assetIndex: assetId,
    suggestedParams: params,
  });
  return optinTxn.signTxn(account.sk);
}

export const transferPackToRandomAccount = async (daemon: AlgoDaemonService, pack: { creator: Account, assetId: number }) => {
  const randomAcc = await createAndFundAccount(daemon);
  const optinSignedTxn = optinAssetFromAccount(
    await daemon.getSuggestedParams(),
    randomAcc, 
    pack.assetId
  )
  await daemon.sendSignedTxns([optinSignedTxn]);
  
  const sendAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    amount: 1,
    assetIndex: pack.assetId,
    from: pack.creator.addr,
    to: randomAcc.addr,
    suggestedParams: await daemon.getSuggestedParams(),
  });
  const signedTxn = sendAssetTxn.signTxn(pack.creator.sk);
  await daemon.sendSignedTxns([signedTxn]);
  await lastValueFrom(from([pack.assetId]).pipe(delay(5000)));
  return randomAcc;
}