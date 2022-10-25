const { network, ethers } = require("hardhat")
const { networkConfig, developementChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const FUND_AMOUNT = ethers.utils.parseEther("1")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatoreV2Address, subscriptionId, vrfCoordinatoreV2Mock
    if (developementChains.includes(network.name)) {
        vrfCoordinatoreV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatoreV2Address = vrfCoordinatoreV2Mock.address
        const transactionResponse = await vrfCoordinatoreV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId

        await vrfCoordinatoreV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatoreV2Address = networkConfig[chainId]["vrfCoordinatoreV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const enteranceFee = networkConfig[chainId]["enteranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const args = [
        vrfCoordinatoreV2Address,
        enteranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // await vrfCoordinatoreV2Mock.addConsumer(subscriptionId, lottery.address)

    if (!developementChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(lottery.address, args)
    }
    log("--------------------------------------------------------")
}
module.exports.tags = ["all", "lottery"]
