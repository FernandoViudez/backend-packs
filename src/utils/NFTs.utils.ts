import fs from 'fs';
import path from 'path';
import NFTs from '../storage/NFTs.json';

export const pickAndRemoveRandomNFT = (): string => {
  const idx = Math.floor(Math.random() * NFTs.length);
  removeNFTFromList(idx);
  return NFTs[idx].ipfs_cid;
};

const removeNFTFromList = (nftIdx: number) => {
  (NFTs as any[]).splice(nftIdx, 1);
  fs.writeFileSync(
    path.resolve(__dirname, '../storage/NFTs.json'),
    JSON.stringify(NFTs),
  );
};
