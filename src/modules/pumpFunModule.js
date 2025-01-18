const { log } = require('../utils/logger');
const { getConfig } = require('../utils/config');
const { generateRandomAmount, delay } = require('../utils/helpers');
const { createPrimaryWallet, generateAutomatedWallets, distributeSOL } = require('./walletManager');
const PumpFunSDK = require('pumpfun-sdk'); // Assuming this is the SDK for Pump.fun

const pumpFunSDK = new PumpFunSDK({ apiKey: 'YOUR_API_KEY' });

async function createToken() {
  try {
    const token = await pumpFunSDK.createToken({
      name: 'Test Token',
      symbol: 'TTK',
      decimals: 6,
      initialSupply: 1000000,
    });
    log(`Token created: ${token.address}`, 'success');
    return token.address;
  } catch (err) {
    log(`Failed to create token: ${err.message}`, 'error');
    return null;
  }
}

async function launchBundle(tokenAddress, wallets) {
  const config = getConfig();
  const buyAmount = generateRandomAmount(1, 10); // Random buy amount between 1 and 10 SOL

  for (const wallet of wallets) {
    try {
      await pumpFunSDK.buyToken({
        wallet: wallet.publicKey.toBase58(),
        tokenAddress: tokenAddress,
        amount: buyAmount,
      });
      log(`Bought ${buyAmount} SOL worth of token from wallet ${wallet.publicKey.toBase58()}`, 'success');
    } catch (err) {
      log(`Failed to buy token from wallet ${wallet.publicKey.toBase58()}: ${err.message}`, 'error');
    }
  }
}

async function dumpAll(primaryWallet, wallets, jitoTips, briberyAmount, slippage, priorityFee) {
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

  for (const wallet of wallets) {
    const balance = await getSolBalance(wallet);
    if (balance > 0) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: primaryWallet.publicKey,
          lamports: balance * 1e9, // Convert SOL to lamports
        })
      );

      // Set transaction fees and tips
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      transaction.sign(wallet);

      try {
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature);
        log(`Transferred ${balance} SOL back to primary wallet from ${wallet.publicKey.toBase58()} with signature ${signature}`, 'success');
      } catch (err) {
        log(`Failed to transfer SOL back to primary wallet from ${wallet.publicKey.toBase58()}: ${err.message}`, 'error');
      }
    }
  }

  process.exit(0);
}

module.exports = { createToken, launchBundle, dumpAll };