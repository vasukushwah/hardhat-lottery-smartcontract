const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developementChains, networkConfig } = require("../../helper-hardhat-config")
developementChains.includes(network.name)
    ? describe.skip
    : describe("Lottery statging test", () => {
          let lottery, chainId, lotteryEntranceFee, deployer
          chainId = network.config.chainId
          const sendValue = ethers.utils.parseEther("0.01") // 1ETh
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
          })
          describe("fulfillRandomWords", () => {
              it("works with live Chainlink keepers and Chainlink VRF, we get a random winner", async () => {
                  const startingTimeStamp = await lottery.getLastTimeStamp()
                  const accounts = await ethers.getSigners()
                  await new Promise(async (resolve, reject) => {
                      // setting up listner
                      lottery.once("WinnerPicked", async () => {
                          console.log("Winnerpicked Event fired!")
                          try {
                              const recentWinner = await lottery.getRecentWinner()
                              const lotterState = await lottery.getLotteryState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await lottery.getLastTimeStamp()
                              await expect(lottery.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(lotterState.toString(), 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(lotteryEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      // then entering the lottery
                      console.log("Entering to Lottery")
                      const tx = await lottery.enterLottery({ value: lotteryEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
