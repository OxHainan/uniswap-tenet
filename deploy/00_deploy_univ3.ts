import { solidityPackedKeccak256, getAddress, Transaction } from 'ethers';
import { DeployFunction } from "hardhat-deploy/types";
import {
    abi as FACTORY_ABI,
    bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'

import {
    abi as FACTORY2_ABI,
    bytecode as FACTORY2_BYTECODE,
} from '@uniswap/v2-core/build/UniswapV2Factory.json'

import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
    abi as NFTDescriptor_ABI, bytecode as NFTDescriptor_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'

import {
    abi as NFTPositionManager_ABI, bytecode as NFTPositionManager_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'

import {
    abi as UniswapInterfaceMulticall_ABI, bytecode as UniswapInterfaceMulticall_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'

import {
    abi as NFTPositionDescriptor_ABI, bytecode as NFTPositionDescriptor_BYTECODE
} from '@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'

// import { abi as Permit2_ABI, bytecode as Permit2_BYTECODE } from '../test/Permit2.json'
import { abi as UniversalRouter_ABI, bytecode as UniversalRouter_BYTECODE } from '@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json'
import { abi as UnsupportedProtocol_ABI, bytecode as UnsupportedProtocol_BYTECODE } from '@uniswap/universal-router/artifacts/contracts/deploy/UnsupportedProtocol.sol/UnsupportedProtocol.json'
import { abi as SwapRouter02_ABI, bytecode as SwapRouter02_BYTECODE } from '@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json'
import { abi as Quoter_ABI, bytecode as Quoter_BYTECODE } from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import { abi as TickLens_ABI, bytecode as TickLens_BYTECODE } from '@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json'
import { abi as V3Migrator_ABI, bytecode as V3Migrator_BYTECODE } from '@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import Permit from '../test/deployment.json'
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers } = hre
    const deployer = await ethers.getSigners()
    console.log("Uniswap deployer: ", deployer[0].address);
    console.log("Token deployer: ", deployer[1].address)

    const WETH9 = await deployments.deploy("WETH9", {
        from: deployer[1].address
    })
    console.log("WETH9 addr:", WETH9.address);

    // ERC-20
    const DAI = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [100000000000000, "DAI", 6, "DAI"]
    })
    console.log("DAI addr:", DAI.address);

    const USDT = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [100000000000000, "USDT", 6, "USDT"]
    })
    console.log("USDT addr:", USDT.address);

    const USDC = await deployments.deploy("ERC20", {
        from: deployer[1].address,
        args: [100000000000000, "USDC", 6, "USDC"]
    })
    console.log("USDC addr:", USDC.address);

    // TENET_L2
    const TENET_L2 = await deployments.deploy("Tenet_L2", {
        from: deployer[1].address,
    })
    console.log("TENET_L2 addr:", TENET_L2.address);

    const factory_2 = await deployments.deploy("UniV2Factory", {
        from: deployer[0].address,
        contract: {
            bytecode: FACTORY2_BYTECODE,
            abi: FACTORY2_ABI
        },
        args: [
            deployer[0].address
        ]
    })
    console.log("UniV2Factory addr:", factory_2.address);

    const factory = await deployments.deploy("UniV3Factory", {
        from: deployer[0].address,
        contract: {
            bytecode: FACTORY_BYTECODE,
            abi: FACTORY_ABI
        },
    })
    console.log("UniV3Factory addr:", factory.address);


    const uniswapInterfaceMulticall = await deployments.deploy("UniswapInterfaceMulticall", {
        from: deployer[0].address,
        contract: {
            bytecode: UniswapInterfaceMulticall_BYTECODE,
            abi: UniswapInterfaceMulticall_ABI
        },
    })
    console.log("UniswapInterfaceMulticall addr:", uniswapInterfaceMulticall.address);

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

    const nFTPositionManager = await deployments.deploy('NFTPositionManager', {
        from: deployer[0].address,
        contract: {
            abi: NFTPositionManager_ABI,
            bytecode: NFTPositionManager_BYTECODE
        },
        args: [factory.address, WETH9.address, positionDescriptor.address]
    })

    console.log("NFTPositionManager addr:", nFTPositionManager.address);

    const quoter = await deployments.deploy('QuoterV2', {
        from: deployer[0].address,
        contract: {
            abi: Quoter_ABI,
            bytecode: Quoter_BYTECODE
        },
        args: [factory.address, WETH9.address]
    })

    console.log("Quoter addr:", quoter.address);

    const tickLens = await deployments.deploy('TickLens', {
        from: deployer[0].address,
        contract: {
            abi: TickLens_ABI,
            bytecode: TickLens_BYTECODE
        },
    })

    console.log("TickLens addr:", tickLens.address);

    const swapRouter02 = await deployments.deploy('SwapRouter02', {
        from: deployer[0].address,
        contract: {
            abi: SwapRouter02_ABI,
            bytecode: SwapRouter02_BYTECODE
        },
        args: [factory_2.address, factory.address, nFTPositionManager.address, WETH9.address]
    })

    console.log("SwapRouter02 addr:", swapRouter02.address);

    const v3Migrator = await deployments.deploy('V3Migrator', {
        from: deployer[0].address,
        contract: {
            abi: V3Migrator_ABI,
            bytecode: V3Migrator_BYTECODE
        },
        args: [factory.address, WETH9.address, nFTPositionManager.address,]
    })

    console.log("V3Migrator addr:", v3Migrator.address);


    const unsupportedProtocol = await deployments.deploy('UnsupportedProtocol', {
        from: deployer[0].address,
        contract: {
            abi: UnsupportedProtocol_ABI,
            bytecode: UnsupportedProtocol_BYTECODE
        },
    })

    console.log("UnsupportedProtocol addr:", unsupportedProtocol.address);

    // await deployer[1].sendTransaction({
    //     value: '10000000000000000',
    //     to: Permit.deterministic.signerAddress
    // })

    // await ethers.provider.broadcastTransaction(Permit.deterministic.transaction);
   
    // let res = await deployer[0].sendTransaction({
    //     to: Permit.deterministic.address,
    //     data: Permit.permit2.data
    // })

    let signer = await deployments.getSigner(deployer[0].address)

    let res = await signer.sendTransaction({
        to: Permit.deterministic.address,
        data: Permit.permit2.data
    })

    let receipt = await res.wait(3) 

    const universalRouter = await deployments.deploy('UniversalRouter', {
        from: deployer[0].address,
        contract: {
            abi: UniversalRouter_ABI,
            bytecode: UniversalRouter_BYTECODE
        },
        args: [[
            '0x000000000022d473030f116ddee9f6b43ac78ba3',
            WETH9.address, // weth9
            unsupportedProtocol.address, // seaportV1_5
            unsupportedProtocol.address, // seaportV1_4
            unsupportedProtocol.address, // openseaConduit
            unsupportedProtocol.address, // nftxZap
            unsupportedProtocol.address, // x2y2
            unsupportedProtocol.address, //foundation
            unsupportedProtocol.address, // sudoswap
            unsupportedProtocol.address, //elementMarket
            unsupportedProtocol.address, //nft20Zap
            unsupportedProtocol.address, //cryptopunks
            unsupportedProtocol.address, //looksRareV2
            unsupportedProtocol.address, // routerRewardsDistributor
            unsupportedProtocol.address, //looksRareRewardsDistributor
            unsupportedProtocol.address, //looksRareToken
            factory_2.address, // v2Factory
            factory.address, // v3Factory
            '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
            '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'
        ]]
    })

    console.log("UniversalRouter addr:", universalRouter.address);
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