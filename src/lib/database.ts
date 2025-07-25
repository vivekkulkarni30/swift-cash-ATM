import { supabase } from '@/integrations/supabase/client';

export interface Account {
  id: string;
  account_number: number;
  pin: string;
  holder_name: string;
  balance: number;
  daily_withdrawal_limit: number;
  daily_withdrawal_used: number;
  daily_deposit_limit: number;
  daily_deposit_used: number;
  last_reset_date: string;
  is_active: boolean;
}

interface ATMCash {
  id: string;
  denomination: number;
  count: number;
}

interface QRTransaction {
  id: string;
  token: string;
  account_number: number;
  amount: number;
  expires_at: string;
  is_used: boolean;
}

export interface TransactionHistory {
  id: string;
  account_number: number;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

export class DatabaseConnector {
  // Authenticate user
  static async authenticateUser(accountNumber: number, pin: string): Promise<Account | null> {
    try {
      // First reset daily limits if needed
      await this.resetDailyLimitsIfNeeded();
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .eq('pin', pin)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Authentication error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Get account by account number
  static async getAccount(accountNumber: number): Promise<Account | null> {
    try {
      await this.resetDailyLimitsIfNeeded();
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .single();

      if (error) {
        console.error('Get account error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get account error:', error);
      return null;
    }
  }

  // Reset daily limits if needed
  private static async resetDailyLimitsIfNeeded(): Promise<void> {
    try {
      await supabase.rpc('reset_daily_limits');
    } catch (error) {
      console.error('Error resetting daily limits:', error);
    }
  }

  // Get ATM cash inventory
  static async getATMCash(): Promise<ATMCash[]> {
    try {
      const { data, error } = await supabase
        .from('atm_cash')
        .select('*')
        .order('denomination', { ascending: false });

      if (error) {
        console.error('Get ATM cash error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get ATM cash error:', error);
      return [];
    }
  }

  // Check if withdrawal is possible
  static async canWithdraw(accountNumber: number, amount: number): Promise<{ canWithdraw: boolean; message: string }> {
    const account = await this.getAccount(accountNumber);
    if (!account) {
      return { canWithdraw: false, message: 'Account not found' };
    }

    if (account.balance < amount) {
      return { canWithdraw: false, message: 'Insufficient balance' };
    }

    if (account.daily_withdrawal_used + amount > account.daily_withdrawal_limit) {
      return { canWithdraw: false, message: 'Daily withdrawal limit exceeded' };
    }

    return { canWithdraw: true, message: 'Withdrawal allowed' };
  }

  // Check ATM cash availability for withdrawal
  static async checkATMCashAvailability(amount: number): Promise<{ available: boolean; dispensed?: { [key: number]: number }; message: string }> {
    try {
      const atmCash = await this.getATMCash();
      const dispensed: { [key: number]: number } = {};
      let remainingAmount = amount;

      // Sort denominations in descending order
      const sortedDenominations = atmCash
        .filter(cash => cash.count > 0)
        .sort((a, b) => b.denomination - a.denomination);

      for (const cash of sortedDenominations) {
        if (remainingAmount === 0) break;

        const notesNeeded = Math.floor(remainingAmount / cash.denomination);
        const notesToDispense = Math.min(notesNeeded, cash.count);

        if (notesToDispense > 0) {
          dispensed[cash.denomination] = notesToDispense;
          remainingAmount -= notesToDispense * cash.denomination;
        }
      }

      if (remainingAmount > 0) {
        return { 
          available: false, 
          message: `Cannot dispense ₹${amount}. ATM doesn't have sufficient cash or exact change.` 
        };
      }

      return { available: true, dispensed, message: 'Cash available' };
    } catch (error) {
      console.error('Check ATM cash availability error:', error);
      return { available: false, message: 'Error checking ATM cash availability' };
    }
  }

  // Process withdrawal
  static async processWithdrawal(accountNumber: number, amount: number): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      const canWithdrawResult = await this.canWithdraw(accountNumber, amount);
      if (!canWithdrawResult.canWithdraw) {
        return { success: false, message: canWithdrawResult.message };
      }

      const cashCheck = await this.checkATMCashAvailability(amount);
      if (!cashCheck.available) {
        return { success: false, message: cashCheck.message };
      }

      // Update account balance and daily limit
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .single();

      if (accountError || !account) {
        return { success: false, message: 'Account not found' };
      }

      const newBalance = account.balance - amount;
      const newDailyUsed = account.daily_withdrawal_used + amount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          daily_withdrawal_used: newDailyUsed 
        })
        .eq('account_number', accountNumber);

      if (updateError) {
        console.error('Update account error:', updateError);
        return { success: false, message: 'Failed to update account' };
      }

      // Update ATM cash inventory
      if (cashCheck.dispensed) {
        for (const [denomination, count] of Object.entries(cashCheck.dispensed)) {
          const { data: cashData, error: cashFetchError } = await supabase
            .from('atm_cash')
            .select('count')
            .eq('denomination', parseInt(denomination))
            .single();

          if (cashFetchError || !cashData) continue;

          const { error: cashUpdateError } = await supabase
            .from('atm_cash')
            .update({ count: cashData.count - count })
            .eq('denomination', parseInt(denomination));

          if (cashUpdateError) {
            console.error('Update ATM cash error:', cashUpdateError);
          }
        }
      }

      // Add to transaction history
      await supabase
        .from('transaction_history')
        .insert({
          account_number: accountNumber,
          transaction_type: 'withdrawal',
          amount,
          balance_after: newBalance,
          description: 'ATM Withdrawal'
        });

      return { success: true, message: 'Withdrawal successful', newBalance };
    } catch (error) {
      console.error('Process withdrawal error:', error);
      return { success: false, message: 'Withdrawal failed' };
    }
  }

  // Process deposit
  static async processDeposit(accountNumber: number, amount: number): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      const account = await this.getAccount(accountNumber);
      if (!account) {
        return { success: false, message: 'Account not found' };
      }

      if (account.daily_deposit_used + amount > account.daily_deposit_limit) {
        return { success: false, message: 'Daily deposit limit exceeded' };
      }

      const newBalance = account.balance + amount;
      const newDailyUsed = account.daily_deposit_used + amount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          daily_deposit_used: newDailyUsed 
        })
        .eq('account_number', accountNumber);

      if (updateError) {
        console.error('Update account error:', updateError);
        return { success: false, message: 'Failed to update account' };
      }

      // Add to transaction history
      await supabase
        .from('transaction_history')
        .insert({
          account_number: accountNumber,
          transaction_type: 'deposit',
          amount,
          balance_after: newBalance,
          description: 'Cash Deposit'
        });

      return { success: true, message: 'Deposit successful', newBalance };
    } catch (error) {
      console.error('Process deposit error:', error);
      return { success: false, message: 'Deposit failed' };
    }
  }

  // Create QR transaction
  static async createQRTransaction(accountNumber: number, amount: number): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const canWithdrawResult = await this.canWithdraw(accountNumber, amount);
      if (!canWithdrawResult.canWithdraw) {
        return { success: false, message: canWithdrawResult.message };
      }

      // Generate unique token
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error } = await supabase
        .from('qr_transactions')
        .insert({
          token,
          account_number: accountNumber,
          amount,
          expires_at: expiresAt.toISOString(),
          is_used: false
        });

      if (error) {
        console.error('Create QR transaction error:', error);
        return { success: false, message: 'Failed to create QR transaction' };
      }

      return { success: true, token, message: 'QR transaction created' };
    } catch (error) {
      console.error('Create QR transaction error:', error);
      return { success: false, message: 'Failed to create QR transaction' };
    }
  }

  // Process QR cash withdrawal
  static async processQRCash(token: string): Promise<{ success: boolean; message: string; amount?: number }> {
    try {
      const { data: transaction, error: fetchError } = await supabase
        .from('qr_transactions')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !transaction) {
        return { success: false, message: 'Invalid QR token' };
      }

      if (transaction.is_used) {
        return { success: false, message: 'QR token already used' };
      }

      if (new Date() > new Date(transaction.expires_at)) {
        return { success: false, message: 'QR token expired' };
      }

      // Check if withdrawal is still valid
      const canWithdrawResult = await this.canWithdraw(transaction.account_number, transaction.amount);
      if (!canWithdrawResult.canWithdraw) {
        return { success: false, message: canWithdrawResult.message };
      }

      const cashCheck = await this.checkATMCashAvailability(transaction.amount);
      if (!cashCheck.available) {
        return { success: false, message: cashCheck.message };
      }

      // Get current account data
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', transaction.account_number)
        .single();

      if (accountError || !account) {
        return { success: false, message: 'Account not found' };
      }

      const newBalance = account.balance - transaction.amount;
      const newDailyUsed = account.daily_withdrawal_used + transaction.amount;

      // Update account balance and daily limit
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          daily_withdrawal_used: newDailyUsed 
        })
        .eq('account_number', transaction.account_number);

      if (updateError) {
        console.error('Update account error:', updateError);
        return { success: false, message: 'Failed to update account' };
      }

      // Update ATM cash inventory
      if (cashCheck.dispensed) {
        for (const [denomination, count] of Object.entries(cashCheck.dispensed)) {
          const { data: cashData, error: cashFetchError } = await supabase
            .from('atm_cash')
            .select('count')
            .eq('denomination', parseInt(denomination))
            .single();

          if (cashFetchError || !cashData) continue;

          const { error: cashUpdateError } = await supabase
            .from('atm_cash')
            .update({ count: cashData.count - count })
            .eq('denomination', parseInt(denomination));

          if (cashUpdateError) {
            console.error('Update ATM cash error:', cashUpdateError);
          }
        }
      }

      // Mark QR transaction as used
      const { error: qrUpdateError } = await supabase
        .from('qr_transactions')
        .update({ 
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('token', token);

      if (qrUpdateError) {
        console.error('Update QR transaction error:', qrUpdateError);
      }

      // Add single transaction history entry for QR withdrawal
      await supabase
        .from('transaction_history')
        .insert({
          account_number: transaction.account_number,
          transaction_type: 'qr_withdrawal',
          amount: transaction.amount,
          balance_after: newBalance,
          description: `QR Cash Withdrawal - Token: ${token}`
        });

      return { success: true, message: 'QR cash withdrawal successful', amount: transaction.amount };
    } catch (error) {
      console.error('Process QR cash error:', error);
      return { success: false, message: 'QR cash withdrawal failed' };
    }
  }

  // Exchange denominations (Using Edge Function for Java-like backend logic)
  static async exchangeDenominations(fromDenom: number, toDenom: number, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('denomination-exchange', {
        body: {
          fromDenomination: fromDenom,
          toDenomination: toDenom,
          quantity
        }
      });

      if (error) {
        console.error('Exchange denominations error:', error);
        return { success: false, message: error.message || 'Exchange failed' };
      }

      return { success: true, message: 'Denomination exchange successful' };
    } catch (error) {
      console.error('Exchange denominations error:', error);
      return { success: false, message: 'Exchange failed' };
    }
  }

  // Get all denominations
  static async getDenominations(): Promise<number[]> {
    try {
      const atmCash = await this.getATMCash();
      return atmCash.map(cash => cash.denomination).sort((a, b) => b - a);
    } catch (error) {
      console.error('Get denominations error:', error);
      return [];
    }
  }

  // Get transaction history
  static async getTransactionHistory(accountNumber: number, limit: number = 10): Promise<TransactionHistory[]> {
    try {
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('account_number', accountNumber)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get transaction history error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  }
}