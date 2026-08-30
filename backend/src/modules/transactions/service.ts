import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';

export async function getCommissionConfig() {
  const result = await query('SELECT * FROM commission_config WHERE active = TRUE LIMIT 1');
  if (result.rows.length === 0) {
    // Default config
    return { type: 'percentage', value: 10 };
  }
  return result.rows[0];
}

export async function calculateCommission(amount: number) {
  const config = await getCommissionConfig();
  let platformFee: number;

  if (config.type === 'percentage') {
    platformFee = amount * (config.value as number) / 100;
  } else {
    platformFee = config.value as number;
  }

  return {
    amount,
    platformFee: Math.round(platformFee * 100) / 100,
    providerAmount: Math.round((amount - platformFee) * 100) / 100,
  };
}

export async function createTransaction(
  payerId: string,
  payeeId: string,
  amount: number,
  rentalId?: string,
  buddySessionId?: string
) {
  const commission = await calculateCommission(amount);

  const result = await query(
    `INSERT INTO transactions (payer_id, payee_id, amount, commission_amount, platform_fee, rental_id, buddy_session_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [payerId, payeeId, amount, commission.platformFee, commission.platformFee, rentalId || null, buddySessionId || null]
  );
  return result.rows[0];
}

export async function getTransactionStats() {
  const result = await query(
    `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount, COALESCE(SUM(platform_fee), 0) as total_commission
     FROM transactions WHERE status = 'completed'`
  );
  return result.rows[0];
}
