import { solidityPackedKeccak256, getAddress } from 'ethers';
import { DeployFunction } from "hardhat-deploy/types";
import {
    abi as FACTORY_ABI,
    bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'

import {
    abi as SWAP_ROUTER_ABI,
    bytecode as SWAP_ROUTER_BYTECODE,
} from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
    abi as NFTDescriptor_ABI, bytecode as NFTDescriptor_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'

import {
    abi as NFTPositionManager_ABI, bytecode as NFTPositionManager_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'

import {
    abi as NFTPositionDescriptor_ABI, bytecode as NFTPositionDescriptor_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers } = hre
    const deployer = await ethers.getSigners()

    // Uniswap

    const WETH9 = await deployments.deploy("WETH9", {
        from: deployer[0].address
    })
    console.log("WETH9 addr:", WETH9.address);

    const factory = await deployments.deploy("UniV3Factory", {
        from: deployer[0].address,
        contract: {
            bytecode: FACTORY_BYTECODE,
            abi: FACTORY_ABI
        },
    })
    console.log("UniV3Factory addr:", factory.address);

    const swaprouter = await deployments.deploy("UniV3SwapRouter", {
        from: deployer[0].address,
        contract: {
            abi: SWAP_ROUTER_ABI,
            bytecode: SWAP_ROUTER_BYTECODE
        },
        args: [factory.address, WETH9.address]
    })
    console.log("UniV3SwapRouter addr:", swaprouter.address);

    const NFTDescriptorlibrary = await deployments.deploy('NFTDescriptorLibrary', {
        from: deployer[0].address,
        contract: {
            abi: NFTDescriptor_ABI,
            bytecode: NFTDescriptor_BYTECODE
        }
    })

    const linkedBytecode = linkLibrary(NFTPositionDescriptor_BYTECODE,
        {
            ['contracts/libraries/NFTDescriptor.sol:NFTDescriptor']: NFTDescriptorlibrary.address
        }
    )

    const positionDescriptor = await deployments.deploy('NFTPositionDescriptor', {
        from: deployer[0].address,
        contract: {
            abi: NFTPositionDescriptor_ABI,
            bytecode: linkedBytecode
        },
        args: [
            WETH9.address,
            // 'ETH' as a bytes32 string
            '0x4554480000000000000000000000000000000000000000000000000000000000'
        ]
    })

    await deployments.deploy('NFTPositionManager', {
        from: deployer[0].address,
        contract: {
            abi: NFTPositionManager_ABI,
            bytecode: NFTPositionManager_BYTECODE
        },
        args: [factory.address, WETH9.address, positionDescriptor.address]
    })


    // ERC-20

    const DAI = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [1000000, "DAI", 6, "DAI"]
    })
    console.log("DAI addr:", DAI.address);

    const USDT = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [1000000, "USDT", 6, "USDT"]
    })
    console.log("USDT addr:", USDT.address);

    const USDC = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [1000000, "USDC", 6, "USDC"]
    })
    console.log("USDC addr:", USDC.address);

    // TENET_L2
    const TENET_L2 = await deployments.deploy("Tenet_L2", {
        from: deployer[1].address,
    })
    console.log("TENET_L2 addr:", TENET_L2.address);
}

function linkLibrary(bytecode: string, libraries: {
    [name: string]: string
} = {}): string {
    let linkedBytecode = bytecode
    for (const [name, address] of Object.entries(libraries)) {
        const placeholder = `__\$${solidityPackedKeccak256(['string'], [name]).slice(2, 36)}\$__`
        const formattedAddress = getAddress(address).toLowerCase().replace('0x', '')
        if (linkedBytecode.indexOf(placeholder) === -1) {
            throw new Error(`Unable to find placeholder for library ${name}`)
        }
        while (linkedBytecode.indexOf(placeholder) !== -1) {
            linkedBytecode = linkedBytecode.replace(placeholder, formattedAddress)
        }
    }
    return linkedBytecode
}

export default func;