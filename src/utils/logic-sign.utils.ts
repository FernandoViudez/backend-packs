import { logicSigFromByte } from "algosdk";

const fs = require('fs');
const path = require('path');

export const fromStringToLogicSign = (
  logicSignature: string,
) => {
  const logicSignBytes = new Uint8Array(Buffer.from(logicSignature, 'base64'));
  return logicSigFromByte(logicSignBytes);
};

export const getDelegatedRevealProgramBytes = () => {
  const filePath = path.resolve(__dirname, `../../src/storage/delegated-reveal/${process.env.ENV}.delegated-reveal.teal`);
  return fs.readFileSync(filePath);
}