export interface Payout {
	id: string;
	merchantId?: string;
	recipientName?: string;
	destination?: Record<string, any>;
	amount: bigint | number | string;
	currency?: string;
	status?: string;
	scheduledAt?: string;
	completedAt?: string;
}

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export default {};
