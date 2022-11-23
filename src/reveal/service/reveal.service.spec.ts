import { Test, TestingModule } from '@nestjs/testing';
import { makeLogicSig } from 'algosdk';
import { Asset } from '../../interfaces/asset.interface';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { NFTs } from '../../utils/NFTs.utils';
import { AccountUtils } from '../../utils/tests/account.utils';
import { PackUtils } from '../../utils/tests/pack.utils';
import { TxnUtils } from '../../utils/tests/txn.utils';
import { RevealService } from './reveal.service';
import { cloneDeep } from 'lodash';
import { getDelegatedRevealProgramBytes } from '../../utils/logic-sign.utils';

describe('RevealService', () => {
  let service: RevealService;
  let algoDaemonService: AlgoDaemonService;
  let indexerService: IndexerService;

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
      pack: new PackUtils(algoDaemonService, indexerService, account),
      txn: new TxnUtils(algoDaemonService, account),
    };
  }

  async function createPack() {
    const params =
      await assetCreatorAccount.pack.getTrantorianOfficialPackParams(
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
    indexerService = module.get<IndexerService>(IndexerService);

    service['pickAndRemoveRandomNFT'] = () => {
      const idx = Math.floor(Math.random() * tmpStorage.others.length);
      return tmpStorage.others[idx].ipfs_uri;
    };

    assetCreatorAccount = setTmpAccount(process.env.PACK_CREATOR_MNEMONIC);

    clientAccount = setTmpAccount();
    await clientAccount.account.fund();

    await createPack();
  });

  describe('Complete reveal process', () => {
    it('Should return the updated ipfs_cid', async () => {
      const programSourceCode = getDelegatedRevealProgramBytes();
      const result = await algoDaemonService.compile(
        programSourceCode
      );

      const logicSig = makeLogicSig(
        Buffer.from(result.result, 'base64'), 
        [
          Buffer.from(packInMemory.id.toString())
        ]
      );
      logicSig.sign(clientAccount.account.sk);

      const ipfs_cid = await service['reveal'](
        {
          address: clientAccount.account.addr,
        },
        {
          assetId: packInMemory.id,
          logicSig: Buffer.from(logicSig.toByte()).toString("base64"),
        },
      );

      expect(ipfs_cid).toBeDefined();
    });
  });
});
