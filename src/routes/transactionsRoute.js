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

module.exports = Router;