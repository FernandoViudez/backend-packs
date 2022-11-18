import { Test, TestingModule } from '@nestjs/testing';
import { assignGroupID, isValidAddress } from 'algosdk';
import { Asset } from '../../interfaces/asset.interface';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { NFTs } from '../../utils/NFTs.utils';
import { AccountUtils } from '../../utils/tests/account.utils';
import { PackUtils } from '../../utils/tests/pack.utils';
import { TxnUtils } from '../../utils/tests/txn.utils';
import { RevealService } from './reveal.service';
import { cloneDeep } from 'lodash';

describe('RevealService', () => {
  jest.setTimeout(1000000);

  let service: RevealService;
  let algoDaemonService: AlgoDaemonService;

  let assetCreatorAccount: {
    pack: PackUtils;
    txn: TxnUtils;
    account: AccountUtils;
  };

  let clientAccount: {
    pack: PackUtils;
    txn: TxnUtils;
    account: AccountUtils;
  };

  const tmpStorage = cloneDeep(NFTs);

  const packInMemory: {
    id: number;
    info: Asset;
  } = {} as any;

  function setTmpAccount(mnemonic?: string) {
    const account = new AccountUtils(algoDaemonService, mnemonic);
    return {
      account: account,
      pack: new PackUtils(algoDaemonService, account),
      txn: new TxnUtils(algoDaemonService, account),
    };
  }

  async function createPack() {
    const params = assetCreatorAccount.pack.getTrantorianOfficialPackParams(
      assetCreatorAccount.pack.getPlaceholderCID(),
    );
    const createTxn = await assetCreatorAccount.txn.assetCreateTxn(params);
    const signedTxn = assetCreatorAccount.txn.signTxn(createTxn);
    const result = await assetCreatorAccount.txn.sendTxns([signedTxn]);
    packInMemory.id = result['asset-index'];
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevealService, AlgoDaemonService, IndexerService],
    }).compile();

    service = module.get<RevealService>(RevealService);
    algoDaemonService = module.get<AlgoDaemonService>(AlgoDaemonService);

    service['pickAndRemoveRandomNFT'] = () => {
      const idx = Math.floor(Math.random() * tmpStorage.others.length);
      return tmpStorage.others[idx].ipfs_uri;
    };

    assetCreatorAccount = setTmpAccount(process.env.PACK_CREATOR_MNEMONIC);

    clientAccount = setTmpAccount();
    await clientAccount.account.fund();

    await createPack();
  });

  describe('NFT validations', () => {
    it('should check if NFT exists', async () => {
      packInMemory.info = await service['checkIfNftExists'](packInMemory.id);
      expect(packInMemory.info).toBeDefined();
    });

    it('should check if NFT is official pack', async () => {
      const isValid: boolean = await service['checkIfValidNFT'](
        packInMemory.info,
      );
      expect(isValid).toBe(true);
    });
  });

  describe('Txn off-chain validations', () => {
    it('should check if payment txn is valid', async () => {
      const payTxn = await clientAccount.txn.paymentTxn(
        clientAccount.account.addr,
        algoDaemonService.serverAddr,
        1000,
      );
      const signedTxn = clientAccount.txn.signTxn(payTxn);
      const senderAddr = await service['checkRevealPaymentTxn'](
        Buffer.from(signedTxn).toString('base64'),
      );

      expect(isValidAddress(senderAddr)).toBe(true);
    });
  });

  describe('On chain validations', () => {
    it('should check if sender holds the created NFT', async () => {
      const optInTxn = await clientAccount.txn.assetOptInTxn(packInMemory.id);
      const sendAssetTxn = await assetCreatorAccount.txn.assetSendTxn(
        assetCreatorAccount.account.addr,
        clientAccount.account.addr,
        packInMemory.id,
      );
      assignGroupID([optInTxn, sendAssetTxn]);
      const optInSigned = clientAccount.txn.signTxn(optInTxn);
      const sendAsaSigned = assetCreatorAccount.txn.signTxn(sendAssetTxn);

      await clientAccount.txn.sendTxns([optInSigned, sendAsaSigned]);

      await service['checkNftHolds'](
        clientAccount.account.addr,
        packInMemory.id,
      );
    });
  });

  describe('Complete reveal process', () => {
    it('Should return the updated ipfs_cid', async () => {
      const payTxn = await clientAccount.txn.paymentTxn(
        clientAccount.account.addr,
        algoDaemonService.serverAddr,
        1000,
      );
      const signedTxn = clientAccount.txn.signTxn(payTxn);

      const ipfs_cid = await service['reveal']({
        assetId: packInMemory.id,
        signedTxn: Buffer.from(signedTxn).toString('base64'),
      });

      expect(ipfs_cid).toBeDefined();
      // TODO: Mock NFTs.json updates
    });
  });
});
