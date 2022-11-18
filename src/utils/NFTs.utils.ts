import { InternalServerErrorException } from "@nestjs/common";

const fs = require('fs');
const path = require('path');
export const NFTs = require('../storage/NFTs.json');

export const getNFTPlaceholder = (): string => {
  return NFTs.placeholder.ipfs_uri;
};

export const pickAndRemoveRandomNFT = (): string => {
  if(!NFTs.others.length) {
    throw new InternalServerErrorException("No NFTs left");
  }
  const idx = Math.floor(Math.random() * NFTs.others.length);
  removeNFTFromList(idx);
  return NFTs.others[idx].ipfs_uri;
};

const removeNFTFromList = (nftIdx: number) => {
  (NFTs.others as any[]).splice(nftIdx, 1);
  fs.writeFileSync(
    path.resolve(__dirname, '../storage/NFTs.json'),
    JSON.stringify(NFTs),
  );
};
