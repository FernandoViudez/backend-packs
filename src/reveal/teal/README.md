Template vars:

- TMPL_ADDRA: address for receiving the payment txn
- TMPL_ADDRB: address for the new manager address of the asset
- TMPL_PAY_AMNT: amount required for reveal the pack (for paying fees)

References:

- ADDR_A: your address
- ADDR_B: back address
- ADDR_C: Trantorian collection addr

Smart signature details:

- authorize txn if following conditions are met:

  1. gtx 0 is a payment txn from ADDR_A to ADDR_B, amount: 1000 microalgos, fee: 1000 microalgos
  2. gtx 1 is a asset cfg txn from ADDR_B

- args
  1. asa-id to config
