import { replace } from 'lodash';
import { AlgoDaemonService } from '../../services/algo-daemon.service';

const path = require('path');
const fs = require('fs');

export const getDelegatedRevealProgramBytes = () => {
  const filePath = path.resolve(__dirname, `delegated-reveal.teal`);
  return fs.readFileSync(filePath);
};

export const getProgram = async (
  algoDaemonService: AlgoDaemonService,
): Promise<{
  result: string;
  hash: string;
}> => {
  const templateVars = {
    TMPL_ADDRA: algoDaemonService.serverAddr,
    TMPL_ADDRB: process.env.PACK_CREATOR_ADDR,
    TMPL_PAY_AMNT: process.env.REQUIRED_FEE_FOR_REVEAL,
  };

  let sourceCode = Buffer.from(getDelegatedRevealProgramBytes()).toString();
  Object.keys(templateVars).forEach(key => {
    sourceCode = replace(sourceCode, key, templateVars[key]);
  })

  const program = await algoDaemonService.compile(sourceCode);
  return program;
};
