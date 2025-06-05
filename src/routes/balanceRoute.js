const { ethers } = require('ethers');
const express = require('express');
const Router = express.Router();
require('dotenv').config();

// RPC Provider từ Infura hoặc Alchemy
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Route: Lấy số dư và nonce
Router.get('/wallet/:address', async (req, res) => {
  const address = req.params.address;
  console.log(address)
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Địa chỉ ví không hợp lệ' });
  }

  try {
    const balanceWei = await provider.getBalance(address);
    const balanceEther = ethers.formatEther(balanceWei);
    const nonce = await provider.getTransactionCount(address);

    res.json({ address, balance: balanceEther, nonce });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy số dư' });
  }
});

module.exports = Router;
