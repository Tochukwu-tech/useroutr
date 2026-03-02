import { AddressDetectionResult } from "./chain.types";

export function detectAddressChain(address: string): AddressDetectionResult {
  // EVM: 0x + 40 hex chars (all EVM chains share this format)
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return {
      possibleChains: [
        "ethereum",
        "base",
        "bnb",
        "polygon",
        "arbitrum",
        "avalanche",
      ],
      format: "evm",
      requiresChainSelection: true, // Must ask merchant which EVM chain
    };
  }

  // Starknet: 0x + 63 or 64 hex chars (longer than EVM)
  if (/^0x[0-9a-fA-F]{63,64}$/.test(address)) {
    return {
      possibleChains: ["starknet"],
      format: "starknet",
      requiresChainSelection: false,
    };
  }

  // Stellar: G + 55 alphanumeric (base32)
  if (/^G[A-Z2-7]{55}$/.test(address)) {
    return {
      possibleChains: ["stellar"],
      format: "stellar",

      requiresChainSelection: false,
    };
  }

  // Solana: base58, 32–44 chars
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return {
      possibleChains: ["solana"],
      format: "solana",
      requiresChainSelection: false,
    };
  }

  return {
    possibleChains: [],
    format: "unknown",
    requiresChainSelection: true,
  };
}

// Usage in merchant onboarding:
// const result = detectAddressChain("0x742d35Cc...");
// if (result.requiresChainSelection) {
//   Show chain selector: [ETH] [Base] [BNB] [Polygon] [Arbitrum] [Avalanche]
// }
