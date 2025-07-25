import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { PiggyBank, CheckCircle, Plus } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNumber: number;
  onSuccess: () => void;
}

export const DepositDialog = ({ 
  open, 
  onOpenChange, 
  accountNumber, 
  onSuccess 
}: DepositDialogProps) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > 200000) {
      toast({
        title: "Limit Exceeded",
        description: "Daily deposit limit is ₹2,00,000. Please deposit a smaller amount.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await DatabaseConnector.processDeposit(accountNumber, depositAmount);
      
      if (result.success) {
        toast({
          title: "Deposit Successful",
          description: `₹${depositAmount.toLocaleString('en-IN')} deposited successfully. New balance: ₹${result.newBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          variant: "default"
        });

        onSuccess();
        onOpenChange(false);
        setAmount('');
      } else {
        toast({
          title: "Deposit Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "An error occurred during deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-atm-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-atm-success/10 rounded-full flex items-center justify-center mb-4">
            <PiggyBank className="w-6 h-6 text-atm-success" />
          </div>
          <DialogTitle className="text-xl text-atm-primary">Cash Deposit</DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Enter the amount you wish to deposit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-atm-success/5 p-4 rounded-lg border border-atm-success/20">
            <div className="flex items-center text-sm text-atm-success">
              <Plus className="w-4 h-4 mr-2" />
              <span>Daily deposit limit: ₹2,00,000</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount" className="text-atm-gray-700">
              Deposit Amount
            </Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-lg font-mono"
              min="1"
              max="200000"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-atm-gray-700">Quick Amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="text-atm-success border-atm-success hover:bg-atm-success hover:text-atm-white"
                >
                  ₹{quickAmount.toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>

          {amount && (
            <div className="bg-atm-success/5 p-3 rounded-lg">
              <div className="text-sm text-atm-gray-700">
                {parseFloat(amount) > 0 && parseFloat(amount) <= 200000
                  ? `₹${parseFloat(amount).toLocaleString('en-IN')} will be added to your account`
                  : parseFloat(amount) > 200000
                  ? 'Amount exceeds daily limit'
                  : 'Please enter a valid amount'
                }
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > 200000 || isProcessing}
              className="flex-1 bg-atm-success hover:bg-atm-success/90"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Deposit
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};