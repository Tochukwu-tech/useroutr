import { Injectable } from '@nestjs/common';
import { AccountKeypair, Wallet } from '@stellar/typescript-wallet-sdk';
import { Sep24PostParams } from '@stellar/typescript-wallet-sdk/lib/walletSdk/Types';

@Injectable()
export class RampService {
  private wallet: Wallet;
  constructor() {
    this.wallet = Wallet.TestNet(); // swap to Wallet.MainNet() for production
  }

  // Step 1: Authenticate with MoneyGram using SEP-10
  async authenticate(userPublicKey: AccountKeypair) {
    const anchor = this.wallet.anchor({
      homeDomain: 'extstellar.moneygram.com', // testnet
      // homeDomain: "stellar.moneygram.com" // mainnet
    });

    const auth = await anchor.sep10();
    // For custodial: use merchant signing key
    // For non-custodial: user signs with their own key
    const token = await auth.authenticate({ accountKp: userPublicKey });
    return token;
  }

  // Step 2: Initiate an on-ramp (cash-in) transaction
  async initiateOnRamp(params: {
    token: Sep24PostParams['authToken'];
    amount: string;
    userPublicKey: string;
  }) {
    const anchor = this.wallet.anchor({
      homeDomain: 'extstellar.moneygram.com',
    });
    const sep24 = anchor.sep24();

    const deposit = await sep24.deposit({
      authToken: params.token,
      assetCode: 'USDC',
      account: params.userPublicKey,
      extraFields: { amount: params.amount },
    });

    // Open this URL in a webview (iframe or redirect)
    return { interactiveUrl: deposit.url, transactionId: deposit.id };
  }

  // Step 3: Initiate an off-ramp (cash-out) transaction
  async initiateOffRamp(params: {
    token: Sep24PostParams['authToken'];
    amount: string;
    userPublicKey: string;
  }) {
    const anchor = this.wallet.anchor({
      homeDomain: 'extstellar.moneygram.com',
    });
    const sep24 = anchor.sep24();

    const withdrawal = await sep24.withdraw({
      authToken: params.token,
      assetCode: 'USDC',
      account: params.userPublicKey,
      extraFields: { amount: params.amount },
    });

    return { interactiveUrl: withdrawal.url, transactionId: withdrawal.id };
  }

  // Step 4: Poll transaction status until complete
  async pollStatus(token: Sep24PostParams['authToken'], transactionId: string) {
    const anchor = this.wallet.anchor({
      homeDomain: 'extstellar.moneygram.com',
    });
    const sep24 = anchor.sep24();

    // Poll every 5 seconds until terminal state
    const result = await sep24.getTransactionBy({
      authToken: token,
      id: transactionId,
    });

    // Status: pending_user_transfer_start = ready for user to send USDC
    //         completed = funds received/sent
    //         error = failed
    return result;
  }
}
