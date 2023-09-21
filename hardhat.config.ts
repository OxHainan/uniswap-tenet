import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

const privateKeyDev = '0x4ea6e2fe44efce7c729e9c6f350be6c7b7270e1d96cce1e0c012b445114302d6';
const privateKeyDev2 = '0xfe96e55fc5ac05bee29c6410c9994389d8abc2d075a800cddb728094fbd7407a';

module.exports = {
  defaultNetwork: 'hardhat',

  networks: {
    tenet: {
      url: 'http://127.0.0.1:9933',
      accounts: [privateKeyDev, privateKeyDev2],
      chainId: 1337,
    },
  },

  solidity: {
    compilers: [
      {
        version: '0.8.7',
      },
      {
        version: '0.4.22',
      },
    ],
  },
};