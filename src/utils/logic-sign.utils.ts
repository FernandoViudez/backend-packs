import { logicSigFromByte } from "algosdk";
import { LogicSig } from "algosdk/dist/types/src/logicsig";

export const fromStringToLogicSign = (
  logicSignature: string,
) => {
  const logicSignBytes = new Uint8Array(Buffer.from(logicSignature, 'base64'));
  return logicSigFromByte(logicSignBytes);
};

export const exportLogicSig = (logicSig: LogicSig) => {
  return Buffer.from(logicSig.toByte()).toString('base64');
}