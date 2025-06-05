const express = require('express');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const Router = express.Router();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// Route: Lấy lịch sử giao dịch của ví
Router.get('/wallet/:address/txs', async (req, res) => {
  const address = req.params.address;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Địa chỉ ví không hợp lệ' });
  }

  try {
    const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

    const response = await axios.get(url);
    const txs = response.data.result;

    res.json({ address, transactions: txs });
  } catch (err) {
    console.error('Lỗi lấy lịch sử giao dịch:', err.message);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử giao dịch' });
  }
});
Router.get('/tx/:hash', async (req, res) => {
  const txHash = req.params.hash;

  if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    return res.status(400).json({ error: 'TxHash không hợp lệ' });
  }

  try {
    // 1. Lấy transaction
    const txUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
    const txRes = await axios.get(txUrl);
    const tx = txRes.data.result;

    if (!tx || !tx.blockNumber) {
      return res.status(404).json({ error: 'Giao dịch chưa được xác nhận hoặc không tồn tại' });
    }

    // 2. Lấy receipt để có gasUsed
    const receiptUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
    const receiptRes = await axios.get(receiptUrl);
    const receipt = receiptRes.data.result;

    const gasUsed = receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : null;
    const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) : null;
    const feeEth = gasUsed && gasPrice ? (gasUsed * gasPrice) / 1e18 : null;

    // 3. Lấy block hiện tại
    const latestBlockUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;
    const latestBlockRes = await axios.get(latestBlockUrl);
    const latestBlock = parseInt(latestBlockRes.data.result, 16);

    // 4. Lấy timestamp từ block chứa tx
    const blockNumberHex = tx.blockNumber;
    const blockUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumberHex}&boolean=false&apikey=${ETHERSCAN_API_KEY}`;
    const blockRes = await axios.get(blockUrl);
    const timestampHex = blockRes.data.result?.timestamp;
    const timestamp = timestampHex ? parseInt(timestampHex, 16) : null;

    const confirmations = latestBlock - parseInt(blockNumberHex, 16) + 1;

    res.json({
      transaction: {
        ...tx,
        blockNumber: parseInt(tx.blockNumber, 16),
        confirmations,
        timestamp,
        datetime: timestamp ? new Date(timestamp * 1000).toISOString() : null,
        gasUsed,
        feeEth // Số ETH bị trừ cho phí
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy giao dịch:', err.message);
    res.status(500).json({ error: 'Lỗi khi truy vấn giao dịch' });
  }
});



module.exports = Router;