import { InternalServerErrorException } from "@nestjs/common";

const fs = require('fs');
const path = require('path');
export const NFTs = require('../storage/NFTs.json');
export const placeholderPack = require('../storage/placeholder-nft.json');

export const getNFTPlaceholder = (): string => {
  return placeholderPack.ipfs_uri;
};

export const pickAndRemoveRandomNFT = (): string => {
  if(!NFTs.length) {
    throw new InternalServerErrorException("No NFTs left");
  }
  const idx = Math.floor(Math.random() * NFTs.length);
  const aux = NFTs[idx].ipfs_uri;
  removeNFTFromList(idx);
  return aux;
};

const removeNFTFromList = (nftIdx: number) => {
  (NFTs as any[]).splice(nftIdx, 1);
  fs.writeFileSync(
    path.resolve(__dirname, '../storage/NFTs.json'),
    JSON.stringify(NFTs),
  );
};
