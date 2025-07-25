import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { DatabaseConnector, TransactionHistory } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Receipt
} from 'lucide-react';

interface MiniStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNumber: number;
}

export const MiniStatementDialog = ({ open, onOpenChange, accountNumber }: MiniStatementDialogProps) => {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open, accountNumber]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await DatabaseConnector.getTransactionHistory(accountNumber, 10);
      setTransactions(result);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
      case 'qr_withdrawal':
        return <ArrowUp className="w-4 h-4 text-atm-error" />;
      case 'deposit':
        return <ArrowDown className="w-4 h-4 text-atm-success" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-atm-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'withdrawal' || type === 'qr_withdrawal' ? '-' : '+';
    return `${sign}₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDescription = (transaction: TransactionHistory) => {
    if (transaction.transaction_type === 'qr_withdrawal' && transaction.description) {
      const tokenMatch = transaction.description.match(/Token: ([A-Z0-9]+)/);
      if (tokenMatch) {
        return (
          <div>
            <span className="block">QR Cash Withdrawal</span>
            <span className="text-xs bg-atm-primary/10 text-atm-primary px-2 py-1 rounded mt-1 inline-block">
              Token: {tokenMatch[1]}
            </span>
          </div>
        );
      }
    }
    return transaction.description || transaction.transaction_type.replace('_', ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-atm-white border-0">
        <DialogHeader>
          <DialogTitle className="text-atm-primary flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>Mini Statement</span>
          </DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Recent transactions for account {accountNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-atm-gray-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-atm-gray-500">
              No recent transactions found
            </div>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id} className="bg-atm-gray-50 border border-atm-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <div className="font-medium text-atm-gray-900 capitalize">
                          {formatDescription(transaction)}
                        </div>
                        <div className="flex items-center text-xs text-atm-gray-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'qr_withdrawal' 
                          ? 'text-atm-error' 
                          : 'text-atm-success'
                      }`}>
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </p>
                      <p className="text-xs text-atm-gray-500">
                        Bal: ₹{transaction.balance_after.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};