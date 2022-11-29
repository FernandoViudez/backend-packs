Prev vars:
ADDR_A = your address
ADDR_B = back address
ADDR_C = Trantorian collection addr

Smart signature details:

- authorize txn if following conditions are met:

  1. gtx 0 is a payment txn from ADDR_A to ADDR_B, amount: 1000 microalgos, fee: 1000 microalgos
  2. gtx 1 is a asset cfg txn from ADDR_B

- args
  1. asa-id to config
