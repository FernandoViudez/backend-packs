import { AccountUtils } from "../utils/account.utils";
import { PackUtils } from "../utils/pack.utils";
import { TxnUtils } from "../utils/txn.utils";

export interface Account {
  self: AccountUtils;
  txn: TxnUtils;
  pack: PackUtils;
}