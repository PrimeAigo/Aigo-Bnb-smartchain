const express = require("express")
const { Web3 } = require("web3")
const app = express()
const axios = require("axios")
const bsc_web3 = new Web3("https://bsc-dataseed.binance.org")
const PORT = process.env.PORT || 3000


app.get("/", async (req, res) => {
  try {
    var minimum_amount = req.query.minimum_amount || 0.0000000001
    var maximum_amount = req.query.maximum_amount || 9999999999
    var minimum_id = 100000000
    var maximum_id = 999999999
    var telegram_id = Math.floor(Math.random() * (maximum_id - minimum_id + 1)) + minimum_id
    var request = await axios.get("https://randomuser.me/api/")
    var name = request.data.results[0].name.first
    async function getRandomTransactionWithAmount(minAmountInThunderToken, maxAmountInThunderToken) {
      let latestBlockNumber = await bsc_web3.eth.getBlockNumber()
      var randomBlockNumber = () => BigInt(Math.floor(Math.random() * Number(latestBlockNumber))) + 1n
      var getTransactionAmountInThunderToken = async (transactionHash) => {
        try {
          var transaction = await bsc_web3.eth.getTransaction(transactionHash)
          if (!transaction) {
            throw new Error("Transaction not found")
          }
          var amountInWei = BigInt(transaction.value || "0")
          return bsc_web3.utils.fromWei(amountInWei, "ether")
        } catch (error) {
          console.error("Error while fetching transaction amount:", error.message)
          throw error
        }
      }
      while (true) {
        var randomBlock = await bsc_web3.eth.getBlock(Number(randomBlockNumber()))
        if (randomBlock && randomBlock.transactions && randomBlock.transactions.length > 0) {
          var eligibleTransactions = []
          for (var txHash of randomBlock.transactions) {
            var amountInThunderToken = await getTransactionAmountInThunderToken(txHash)
            if (amountInThunderToken >= minAmountInThunderToken && amountInThunderToken <= maxAmountInThunderToken) {
              eligibleTransactions.push(txHash)
            }
          }
          if (eligibleTransactions.length > 0) {
            var randomTransactionHash = eligibleTransactions[Math.floor(Math.random() * eligibleTransactions.length)]
            var amountInThunderToken = await getTransactionAmountInThunderToken(randomTransactionHash)
            return { transactionHash: randomTransactionHash, amount: amountInThunderToken }
          }
        }
      }
    }
    var random_transaction = await getRandomTransactionWithAmount(minimum_amount, maximum_amount)
    res.status(200).json({ success: `${true}`, telegram_id: `${telegram_id}`, name: `${name}`, transaction_id: `${random_transaction.transactionHash}`, amount: `${random_transaction.amount}` })
  } catch (error) {
    console.log(error)
    res.status(400).json({ success: `${false}` })
  }
})


app.listen(PORT, () => {
  console.log("Server running on port " + PORT + "...")
})
