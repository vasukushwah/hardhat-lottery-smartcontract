const { run } = require("hardhat")

const verify = async (contractAddresss, args) => {
    console.log("Verifying Contract....")
    try {
        await run("verify:verify", {
            address: contractAddresss,
            constructorArguments: args,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.error("Already Verified!")
        } else {
            console.error(error)
        }
    }
}

module.exports = { verify }
