export interface Quote {
	id: string;
	fromChain?: string;
	fromAsset?: string;
	fromAmount?: bigint | number | string;
	toChain?: string;
	toAsset?: string;
	toAmount?: bigint | number | string;
	rate?: string;
	feeBps?: number;
	expiresAt?: string;
}

export default {};
