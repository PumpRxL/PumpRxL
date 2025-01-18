const { Connection, clusterApiUrl, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { log } = require('../utils/logger');
const { getConfig } = require('../utils/config');
const { generateRandomAmount, delay } = require('../utils/helpers');
const { createPrimaryWallet, generateAutomatedWallets, distributeSOL } = require('./walletManager');

async function executeBuySellOrders(primaryWallet, wallets) {
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
  const config = getConfig();

  while (true) {
    const buyCount = wallets.length + 1;
    const sellCount = wallets.length;

    for (let i = 0; i < buyCount; i++) {
      const wallet = wallets[i % wallets.length];
      const buyAmount = generateRandomAmount(0.1, 1); // Random buy amount between 0.1 and 1 SOL

      // Simulate buy order
      log(`Executing buy order for ${buyAmount} SOL from wallet ${wallet.publicKey.toBase58()}`, 'info');
      await delay(generateRandomAmount(1000, 5000)); // Random delay between 1 and 5 seconds
    }

    for (let i = 0; i < sellCount; i++) {
      const wallet = wallets[i % wallets.length];
      const sellAmount = generateRandomAmount(0.1, 1); // Random sell amount between 0.1 and 1 SOL

      // Simulate sell order
      log(`Executing sell order for ${sellAmount} SOL from wallet ${wallet.publicKey.toBase58()}`, 'info');
      await delay(generateRandomAmount(1000, 5000)); // Random delay between 1 and 5 seconds
    }

    // Return funds to primary wallet
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

        try {
          await sendAndConfirmTransaction(connection, transaction, [wallet]);
          log(`Transferred ${balance} SOL back to primary wallet from ${wallet.publicKey.toBase58()}`, 'success');
        } catch (err) {
          log(`Failed to transfer SOL back to primary wallet from ${wallet.publicKey.toBase58()}: ${err.message}`, 'error');
        }
      }
    }

    // Regenerate wallets and distribute SOL
    const newWallets = generateAutomatedWallets(wallets.length);
    await distributeSOL(primaryWallet, newWallets, 1); // Distribute 1 SOL per wallet

    await delay(30000); // Wait for 30 seconds before repeating the cycle
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

async function holdersAmountBoost(wallets) {
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

  for (const wallet of wallets) {
    const buyAmount = generateRandomAmount(0.01, 0.1); // Random micro buy amount between 0.01 and 0.1 SOL

    // Simulate micro buy order
    log(`Executing micro buy order for ${buyAmount} SOL from wallet ${wallet.publicKey.toBase58()}`, 'info');
    await delay(generateRandomAmount(1000, 5000)); // Random delay between 1 and 5 seconds
  }
}

module.exports = { executeBuySellOrders, dumpAll, holdersAmountBoost };
