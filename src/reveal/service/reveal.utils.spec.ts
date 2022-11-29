import { encodeUint64, makeLogicSig } from 'algosdk';
import { LogicSig } from 'algosdk/dist/types/src/logicsig';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import {
  exportLogicSig,
} from '../../utils/logic-sign.utils';
import { AccountUtils } from '../../../test/utils/account.utils';
import { PackUtils } from '../../../test/utils/pack.utils';
import { TxnUtils } from '../../../test/utils/txn.utils';
import { RevealUtils } from './reveal.utils';
import { getProgram } from '../teal/delegated-teal.utils';

interface Deps {
  algoDaemonService: AlgoDaemonService;
  indexerService: IndexerService;
}

interface Account {
  self: AccountUtils;
  txn: TxnUtils;
  pack: PackUtils;
}

const initializeDeps = (deps: Deps) => {
  deps.algoDaemonService = new AlgoDaemonService();
  deps.indexerService = new IndexerService();
  return new RevealUtils(deps.algoDaemonService, deps.indexerService);
};

const initializeAccount = async (
  deps: Deps,
  mnemonic?: string,
): Promise<Account> => {
  const newAcc = new AccountUtils(deps.algoDaemonService, mnemonic);
  if (!mnemonic) {
    await newAcc.fund();
  }
  return {
    self: newAcc,
    txn: new TxnUtils(deps.algoDaemonService, newAcc),
    pack: new PackUtils(deps.algoDaemonService, deps.indexerService, newAcc),
  };
};

const createAsset = async (
  acc: Account,
  corruptManagerAddr = false,
): Promise<number> => {
  const placeholderCID = acc.pack.getPlaceholderCID();
  const packParams = await acc.pack.getTrantorianOfficialPackParams(
    placeholderCID,
  );
  if (corruptManagerAddr) {
    packParams.manager = acc.self.addr;
  }
  const txn = await acc.txn.assetCreateTxn(packParams);
  const signedTxn = acc.txn.signTxn(txn);
  const result = await acc.txn.sendTxns([signedTxn]);
  return parseInt(result['asset-index']);
};

describe('Reveal utils', () => {
  let revealUtils: RevealUtils;
  let deps: Deps;
  let assetsId = {
    invalid: 0,
    valid: 0,
  };

  let clientAccount: Account;
  let creatorAccount: Account;

  beforeAll(async () => {
    deps = {} as any;
    revealUtils = initializeDeps(deps);

    clientAccount = await initializeAccount(deps);
    creatorAccount = await initializeAccount(
      deps,
      process.env.PACK_CREATOR_MNEMONIC,
    );

    assetsId = {
      invalid: await createAsset(clientAccount),
      valid: await createAsset(creatorAccount),
    };
  });

  describe('Validate if asset exists', () => {
    test('should pass when passing valid asset id', async () => {
      const result = await revealUtils.checkIfNftExists(assetsId.valid);
      expect(result.id).toBeDefined();
    });

    test('should fail when passing incorrect asset id', async () => {
      try {
        await revealUtils.checkIfNftExists(-1);
      } catch (error) {
        expect(error.response.statusCode).toBe(404);
        expect(error.response.message).toMatch('Asset not found');
      }
    });
  });

  describe('Validate if is official NFT', () => {
    test('should pass when all conditions are met', async () => {
      const asset = await deps.indexerService.getAssetInfo(assetsId.valid);
      const result = revealUtils.checkIfValidNFT(asset);
      expect(result).toBe(true);
    });

    test('should fail when created from another account different from Trantorian official account', async () => {
      const asset = await deps.indexerService.getAssetInfo(assetsId.invalid);
      try {
        revealUtils.checkIfValidNFT(asset);
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });

    test('should fail when created from Trantorian but manager is not this back addr', async () => {
      const invalidAsset = await createAsset(creatorAccount, true);
      const asset = await deps.indexerService.getAssetInfo(invalidAsset);
      try {
        revealUtils.checkIfValidNFT(asset);
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });
  });

  describe('Validate if account holds NFT', () => {
    beforeAll(async () => {
      await clientAccount.self.receiveAsset(assetsId.valid);

      const asaSendTxn = await creatorAccount.txn.assetSendTxn(
        creatorAccount.self.addr,
        clientAccount.self.addr,
        assetsId.valid,
      );
      const asaSendSignedTxn = asaSendTxn.signTxn(creatorAccount.self.sk);
      await creatorAccount.txn.sendTxns([asaSendSignedTxn]);
    });

    test('should pass when client account has the NFT', async () => {
      const result = await revealUtils.checkNftHolds(
        clientAccount.self.addr,
        assetsId.valid,
      );
      expect(result).not.toBeDefined();
    });

    test('should fail when creator account has not the NFT', async () => {
      try {
        await revealUtils.checkNftHolds(
          creatorAccount.self.addr,
          assetsId.valid,
        );
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });
  });

  describe('Validate if smart signature is valid', () => {
    let logicSig: LogicSig;
    let program: { result: string; hash: string };

    beforeAll(async () => {
      program = await getProgram(deps.algoDaemonService);
    });

    beforeEach(async () => {
      const progr = new Uint8Array(Buffer.from(program.result, 'base64'));
      logicSig = makeLogicSig(progr, [encodeUint64(assetsId.valid)]);
    });

    test('should pass when logic signature has valid signature & asset id', () => {
      logicSig.sign(clientAccount.self.sk);

      const result = revealUtils.checkRevealDelegatedProgram(
        clientAccount.self.addr,
        {
          assetId: assetsId.valid,
          logicSig: exportLogicSig(logicSig),
        },
      );
      expect(result).not.toBeDefined();
    });

    test('should fail when logic signature was not signed', () => {
      try {
        revealUtils.checkRevealDelegatedProgram(clientAccount.self.addr, {
          assetId: assetsId.valid,
          logicSig: exportLogicSig(logicSig),
        });
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });

    test('should fail when logic signature has invalid asset-id', () => {
      try {
        logicSig.sign(clientAccount.self.sk);

        revealUtils.checkRevealDelegatedProgram(clientAccount.self.addr, {
          assetId: assetsId.invalid,
          logicSig: exportLogicSig(logicSig),
        });
      } catch (error) {
        expect(error.response.statusCode).toBe(400);
      }
    });
  });
});
