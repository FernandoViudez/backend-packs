import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { LoginDto } from '../src/auth/dto/login.dto';
import { TxnUtils } from './utils/txn.utils';
import { PackUtils } from './utils/pack.utils';
import { AccountUtils } from './utils/account.utils';
import { Account } from './interface/account.interface';
import { Deps } from './interface/deps.interface';
import { AlgoDaemonService } from '../src/services/algo-daemon.service';
import { IndexerService } from '../src/services/indexer.service';
import { RevealDto } from '../src/reveal/dto/reveal.dto';
import { encodeUint64, makeLogicSig } from 'algosdk';
import { exportLogicSig } from '../src/utils/logic-sign.utils';
import { RevealService } from '../src/reveal/service/reveal.service';
import { cloneDeep } from 'lodash';
import { delay, from, lastValueFrom, of } from 'rxjs';
const NFTs = require('../src/storage/NFTs.json');

const setAccount = async (deps: Deps, mnemonic?: string): Promise<Account> => {
  const account = new AccountUtils(deps.algoDaemonService, mnemonic);
  if (!mnemonic) {
    await account.fund();
  }
  return {
    self: account,
    pack: new PackUtils(deps.algoDaemonService, deps.indexerService, account),
    txn: new TxnUtils(deps.algoDaemonService, account),
  };
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let client: Account;
  let creator: Account;
  let authResponse: {
    accessToken: string;
    program: string;
  };
  const tmpStorage = cloneDeep(NFTs);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [AlgoDaemonService, IndexerService, RevealService],
    }).compile();

    app = moduleFixture.createNestApplication();
    const algoDaemonService =
      moduleFixture.get<AlgoDaemonService>(AlgoDaemonService);
    const indexerService = moduleFixture.get<IndexerService>(IndexerService);
    const revealService = moduleFixture.get<RevealService>(RevealService);

    revealService['pickAndRemoveRandomNFT'] = () => {
      const idx = Math.floor(Math.random() * tmpStorage.length);
      return tmpStorage[idx].ipfs_uri;
    };

    await app.init();

    client = await setAccount({
      algoDaemonService,
      indexerService,
    });

    creator = await setAccount(
      {
        algoDaemonService,
        indexerService,
      },
      process.env.PACK_CREATOR_MNEMONIC,
    );
  });

  test('/auth (POST)', async () => {
    const authTxn = await client.txn.authPaymentTxn();
    const signedAuthTx = client.txn.signTxn(authTxn);
    const res = await request(app.getHttpServer())
      .post('/auth')
      .send({
        signedTxn: Buffer.from(signedAuthTx).toString('base64'),
      } as LoginDto)
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.program).toBeDefined();
    authResponse = res.body;
  });

  test('/reveal (POST)', async () => {
    const assetId = await createAsset(creator);
    await receiveAsset(creator, client, assetId);
    const logicSig = signProgram(client, authResponse.program, assetId);

    const res = await request(app.getHttpServer())
      .post('/reveal')
      .set('Authorization', `Bearer ${authResponse.accessToken}`)
      .send({
        assetId: assetId,
        logicSig: exportLogicSig(logicSig),
      } as RevealDto);
    expect(res.error).toBe(false);
    expect(res.text).toBeDefined();
    await lastValueFrom(from([1]).pipe(delay(6000))); // wait for the next block
    const asaInfo = await client.pack.getPack(assetId);
    expect(asaInfo.manager).toBe(creator.self.addr);
    expect(asaInfo.reserve).not.toBe('');
    expect(asaInfo.creator).toBe(creator.self.addr);
  });
});

const createAsset = async (account: Account) => {
  const params = await account.pack.getTrantorianOfficialPackParams(
    account.pack.getPlaceholderCID(),
  );
  const txn = await account.txn.assetCreateTxn(params);
  const signedTxn = account.txn.signTxn(txn);
  const result = await account.txn.sendTxns([signedTxn]);
  return result['asset-index'];
};

const receiveAsset = async (
  creator: Account,
  account: Account,
  asaId: number,
) => {
  const sendAsaTxn = await creator.txn.assetSendTxn(
    creator.self.addr,
    account.self.addr,
    asaId,
  );
  const sendAsaSigned = creator.txn.signTxn(sendAsaTxn);

  await account.self.receiveAsset(asaId);
  await creator.txn.sendTxns([sendAsaSigned]);
};

const signProgram = (client: Account, programResult: string, asaId: number) => {
  const program = new Uint8Array(Buffer.from(programResult, 'base64'));
  const logicSig = makeLogicSig(program, [encodeUint64(asaId)]);
  logicSig.sign(client.self.sk);
  return logicSig;
};
