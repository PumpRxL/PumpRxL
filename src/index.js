const readline = require('readline');
const { log } = require('./utils/logger');
const { createPrimaryWallet, generateAutomatedWallets, distributeSOL } = require('./modules/walletManager');
const { executeBuySellOrders, dumpAll: dumpBuySell, holdersAmountBoost } = require('./modules/buySellModule');
const { createToken, launchBundle, dumpAll: dumpPumpFun } = require('./modules/pumpFunModule');
const { getConfig } = require('./utils/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let primaryWallet = null;
let wallets = [];

async function start() {
  primaryWallet = createPrimaryWallet();
  wallets = generateAutomatedWallets(5);
  await distributeSOL(primaryWallet, wallets, 1); // Distribute 1 SOL per wallet

  rl.on('SIGINT', () => {
    rl.question('Are you sure you want to exit? [y/n] ', (answer) => {
      if (answer.match(/^y(es)?$/i)) rl.close();
    });
  });

  rl.on('SIGTSTP', () => {
    rl.question('Do you want to dump all tokens and exit? [y/n] ', (answer) => {
      if (answer.match(/^y(es)?$/i)) dumpAllAction();
    });
  });

  showMenu();
}

async function dumpAllAction() {
  const config = getConfig();
  await dumpBuySell(primaryWallet, wallets, config.jitoTips, config.briberyAmount, config.slippage, config.priorityFee);
}

function showMenu() {
  rl.question(`
  Select a module to run:
  1. Wallet Manager
  2. Buy and Sell Module
  3. Pump Fun Module
  4. Exit
  `, async (choice) => {
    switch (choice.trim()) {
      case '1':
        walletManagerMenu();
        break;
      case '2':
        buySellMenu();
        break;
      case '3':
        pumpFunMenu();
        break;
      case '4':
        rl.close();
        break;
      default:
        log('Invalid choice. Please try again.', 'error');
        showMenu();
    }
  });
}

function walletManagerMenu() {
  rl.question(`
  Wallet Manager Options:
  1. Primary Wallet Creator
  2. Automated Wallet Generator
  3. Automated SOL Distribution
  4. Back to Main Menu
  `, async (choice) => {
    switch (choice.trim()) {
      case '1':
        primaryWallet = createPrimaryWallet();
        walletManagerMenu();
        break;
      case '2':
        const count = parseInt(await askQuestion('Enter number of wallets to generate: '), 10);
        wallets = generateAutomatedWallets(count);
        walletManagerMenu();
        break;
      case '3':
        const totalAmount = parseFloat(await askQuestion('Enter total SOL amount to distribute: '), 10);
        await distributeSOL(primaryWallet, wallets, totalAmount);
        walletManagerMenu();
        break;
      case '4':
        showMenu();
        break;
      default:
        log('Invalid choice. Please try again.', 'error');
        walletManagerMenu();
    }
  });
}

function buySellMenu() {
  rl.question(`
  Buy and Sell Module Options:
  1. Perpetual Buy and Sell Orders
  2. Dump All
  3. Holders Amount Boost
  4. Back to Main Menu
  `, async (choice) => {
    switch (choice.trim()) {
      case '1':
        executeBuySellOrders(primaryWallet, wallets);
        break;
      case '2':
        const config = getConfig();
        await dumpBuySell(primaryWallet, wallets, config.jitoTips, config.briberyAmount, config.slippage, config.priorityFee);
        break;
      case '3':
        holdersAmountBoost(wallets);
        buySellMenu();
        break;
      case '4':
        showMenu();
        break;
      default:
        log('Invalid choice. Please try again.', 'error');
        buySellMenu();
    }
  });
}

function pumpFunMenu() {
  rl.question(`
  Pump Fun Module Options:
  1. Token Creation
  2. Pump.fun Bundle Launcher
  3. Dump All
  4. Back to Main Menu
  `, async (choice) => {
    switch (choice.trim()) {
      case '1':
        const tokenAddress = await createToken();
        if (tokenAddress) {
          rl.question(`Enter number of wallets to launch bundle: `, async (count) => {
            const walletsForBundle = generateAutomatedWallets(parseInt(count, 10));
            await launchBundle(tokenAddress, walletsForBundle);
            pumpFunMenu();
          });
        } else {
          pumpFunMenu();
        }
        break;
      case '2':
        rl.question(`Enter token address to launch bundle: `, async (tokenAddress) => {
          await launchBundle(tokenAddress, wallets);
          pumpFunMenu();
        });
        break;
      case '3':
        const config = getConfig();
        await dumpPumpFun(primaryWallet, wallets, config.jitoTips, config.briberyAmount, config.slippage, config.priorityFee);
        break;
      case '4':
        showMenu();
        break;
      default:
        log('Invalid choice. Please try again.', 'error');
        pumpFunMenu();
    }
  });
}

async function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

start();
