import { logicSigFromByte } from "algosdk";
import { LogicSig } from "algosdk/dist/types/src/logicsig";

const fs = require('fs');
const path = require('path');

export const fromStringToLogicSign = (
  logicSignature: string,
) => {
  const logicSignBytes = new Uint8Array(Buffer.from(logicSignature, 'base64'));
  return logicSigFromByte(logicSignBytes);
};

export const exportLogicSig = (logicSig: LogicSig) => {
  return Buffer.from(logicSig.toByte()).toString('base64');
}

export const getDelegatedRevealProgramBytes = () => {
  const filePath = path.resolve(__dirname, `../../src/storage/delegated-reveal/${process.env.ENV}.delegated-reveal.teal`);
  return fs.readFileSync(filePath);
}