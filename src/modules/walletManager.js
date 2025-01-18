const { Keypair } = require('@solana/web3.js');
const { log } = require('../utils/logger');
const { generateRandomAmount } = require('../utils/helpers');

function createPrimaryWallet() {
  const wallet = Keypair.generate();
  log(`Primary wallet created: ${wallet.publicKey.toBase58()}`, 'success');
  return wallet;
}

function generateAutomatedWallets(count) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = Keypair.generate();
    wallets.push(wallet);
    log(`Generated wallet: ${wallet.publicKey.toBase58()}`, 'info');
  }
  return wallets;
}

async function distributeSOL(primaryWallet, wallets, totalAmount) {
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
  const amountPerWallet = totalAmount / wallets.length;

  for (const wallet of wallets) {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: primaryWallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports: amountPerWallet * 1e9, // Convert SOL to lamports
      })
    );

    try {
      await sendAndConfirmTransaction(connection, transaction, [primaryWallet]);
      log(`Transferred ${amountPerWallet} SOL to wallet ${wallet.publicKey.toBase58()}`, 'success');
    } catch (err) {
      log(`Failed to transfer SOL to wallet ${wallet.publicKey.toBase58()}: ${err.message}`, 'error');
    }
  }
}

module.exports = { createPrimaryWallet, generateAutomatedWallets, distributeSOL };