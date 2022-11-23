import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AlgoDaemonService } from '../../services/algo-daemon.service';
import { IndexerService } from '../../services/indexer.service';
import { AccountUtils } from '../../utils/tests/account.utils';
import { PackUtils } from '../../utils/tests/pack.utils';
import { TxnUtils } from '../../utils/tests/txn.utils';
import { RevealDto } from '../dto/reveal.dto';
import { RevealService } from '../service/reveal.service';
import { RevealController } from './reveal.controller';

describe('RevealController', () => {
  let controller: RevealController;
  let algoDaemonService: AlgoDaemonService;
  let indexerService: IndexerService;

  let tmpAccount: {
    account: AccountUtils,
    pack: PackUtils,
    txn: TxnUtils,
  };

  function setupAccount() {
    const account = new AccountUtils(algoDaemonService);
    tmpAccount = {
      account,
      txn: new TxnUtils(algoDaemonService, account),
      pack: new PackUtils(algoDaemonService, indexerService, account),
    };
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevealController],
      providers: [RevealService, AlgoDaemonService, IndexerService],
    }).compile();

    controller = module.get<RevealController>(RevealController);
    algoDaemonService = module.get<AlgoDaemonService>(AlgoDaemonService);
    indexerService = module.get<IndexerService>(IndexerService);

    setupAccount();
  })

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass when providing valid DTO', async () => {
    const payTxn = await tmpAccount.txn.paymentTxn(
      tmpAccount.account.addr,
      algoDaemonService.serverAddr,
      1000
    );
    const signedTxn = tmpAccount.txn.signTxn(payTxn);

    const revealDto: RevealDto = {
      assetId: 1,
      logicSig: Buffer.from(signedTxn).toString("base64"),
    };
    const plainDto = plainToInstance(RevealDto, revealDto);
    const errors = await validate(plainDto);
    expect(errors.length).toBe(0);
  });
});
