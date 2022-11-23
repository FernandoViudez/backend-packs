# Delegated reveal program (local|dev|test|prd)

If env change, then addresses SHOULD change too

- back addr ~> algorand address of this backend
- client addr ~> algorand address of user with pack NFT to reveal
- tt addr ~> algorand address of Trantorian account which created all the packs

* Signature for payment txn
  Conditions to met: (algorand guidelines not included here)
  - gtx 0 is payment txn
    - from client addr
    - to back addr
    - amount: 1000
  - gtx 1 is asset cfg
    - from back addr
    - for specific asset id, previously checked by the backend
    - new manager addr MUST be tt addr
