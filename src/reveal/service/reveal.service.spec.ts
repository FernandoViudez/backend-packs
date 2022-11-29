import { Test, TestingModule } from '@nestjs/testing';
import { encodeUint64, makeLogicSig } from 'algosdk';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { NFTs } from '../../utils/NFTs.utils';
import { AccountUtils } from '../../../test/utils/account.utils';
import { PackUtils } from '../../../test/utils/pack.utils';
import { TxnUtils } from '../../../test/utils/txn.utils';
import { RevealService } from './reveal.service';
import { cloneDeep } from 'lodash';
import {
  exportLogicSig,
} from '../../utils/logic-sign.utils';
import { LogicSig } from 'algosdk/dist/types/src/logicsig';
import { getProgram } from '../teal/delegated-teal.utils';
import { Account } from '../../../test/interface/account.interface';
import { Deps } from '../../../test/interface/deps.interface';

const initializeAccount = async (
  deps: Deps,
  mnemonic?: string,
): Promise<Account> => {
  const acc = new AccountUtils(deps.algoDaemonService, mnemonic);
  if (!mnemonic) {
    await acc.fund();
  }
  return {
    self: acc,
    pack: new PackUtils(deps.algoDaemonService, deps.indexerService, acc),
    txn: new TxnUtils(deps.algoDaemonService, acc),
  };
};

const createPack = async (acc: Account) => {
  const params = await acc.pack.getTrantorianOfficialPackParams(
    acc.pack.getPlaceholderCID(),
  );
  const assetCreateTxn = await acc.txn.assetCreateTxn(params);
  const signedTx = acc.txn.signTxn(assetCreateTxn);
  const result = await acc.txn.sendTxns([signedTx]);
  return parseInt(result['asset-index']);
};

const transferAsa = async (from: Account, to: Account, asaId: number) => {
  await to.self.receiveAsset(asaId);

  const asaSendTxn = await from.txn.assetSendTxn(
    from.self.addr,
    to.self.addr,
    asaId,
  );

  const signedTx = from.txn.signTxn(asaSendTxn);
  await from.txn.sendTxns([signedTx]);
};

describe('RevealService', () => {
  let service: RevealService;
  let deps: Deps;
  let client: Account;
  let creator: Account;
  let program: {result: string, hash: string}; 
  const tmpStorage = cloneDeep(NFTs);
  let assetsId = {
    valid: 0,
    invalid: 0,
  };
  let logicSig: LogicSig;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevealService, AlgoDaemonService, IndexerService],
    }).compile();

    service = module.get<RevealService>(RevealService);
    deps = {
      algoDaemonService: module.get<AlgoDaemonService>(AlgoDaemonService),
      indexerService: module.get<IndexerService>(IndexerService),
    };

    service['pickAndRemoveRandomNFT'] = () => {
      const idx = Math.floor(Math.random() * tmpStorage.length);
      return tmpStorage[idx].ipfs_uri;
    };

    client = await initializeAccount(deps);
    creator = await initializeAccount(deps, process.env.PACK_CREATOR_MNEMONIC);

    assetsId = {
      valid: await createPack(creator),
      invalid: await createPack(client),
    };

    await transferAsa(creator, client, assetsId.valid);
    program = await getProgram(deps.algoDaemonService);
  });

  beforeEach(async () => {
    logicSig = makeLogicSig(Buffer.from(program.result, 'base64'), [
      encodeUint64(assetsId.valid),
    ]);
  })

  describe('NFT reveal process', () => {
    test('Should pass when reveal asa from client', async () => {
      logicSig.sign(client.self.sk);

      const ipfs_cid = await service['reveal'](
        {
          address: client.self.addr,
        },
        {
          assetId: assetsId.valid,
          logicSig: exportLogicSig(logicSig),
        },
      );

      expect(ipfs_cid).toBeDefined();
    });
    
    test('Should fail when not sign logic program', async () => {
      try {
        await service['reveal'](
          {
            address: client.self.addr,
          },
          {
            assetId: assetsId.valid,
            logicSig: exportLogicSig(logicSig),
          },
        );  
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });
    
    test('Should fail when invalid addr passed', async () => {
      try {
        await service['reveal'](
          {
            address: deps.algoDaemonService.serverAddr,
          },
          {
            assetId: assetsId.valid,
            logicSig: exportLogicSig(logicSig),
          },
        );
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });
    
    test('Should fail when invalid asset-id', async () => {
      try {
        await service['reveal'](
          {
            address: client.self.addr,
          },
          {
            assetId: assetsId.invalid,
            logicSig: exportLogicSig(logicSig),
          },
        );
        
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }

    });
  });
});
