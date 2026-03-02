export interface Payment {
	id: string;
	merchantId?: string;
	amount: bigint | number | string;
	currency?: string;
	status?: string;
	createdAt?: string;
}

export type PaymentStatus =
	| 'PENDING'
	| 'QUOTE_LOCKED'
	| 'SOURCE_LOCKED'
	| 'STELLAR_LOCKED'
	| 'PROCESSING'
	| 'COMPLETED'
	| 'REFUNDING'
	| 'REFUNDED'
	| 'EXPIRED'
	| 'FAILED';

export default {};
