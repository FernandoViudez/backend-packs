import { AlgoDaemonService } from "../../src/services/algo-daemon.service";
import { IndexerService } from "../../src/services/indexer.service";

export interface Deps {
  algoDaemonService: AlgoDaemonService;
  indexerService: IndexerService;
}
