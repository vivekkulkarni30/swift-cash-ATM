import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { DenominationSelector } from './DenominationSelector';
import { CreditCard, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNumber: number;
  currentBalance: number;
  onSuccess: () => void;
}

export const WithdrawDialog = ({ 
  open, 
  onOpenChange, 
  accountNumber, 
  currentBalance, 
  onSuccess 
}: WithdrawDialogProps) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDenominations, setCustomDenominations] = useState(false);
  const [denominationSelection, setDenominationSelection] = useState<{ [denomination: number]: number }>({});
  const { toast } = useToast();

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    if (withdrawAmount > currentBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Your account balance is insufficient for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    // If custom denominations are enabled, validate the selection
    if (customDenominations) {
      const totalSelected = Object.entries(denominationSelection).reduce((total, [denom, count]) => {
        return total + (parseInt(denom) * count);
      }, 0);

      if (totalSelected !== withdrawAmount) {
        toast({
          title: "Denomination Mismatch",
          description: "Selected denominations don't match the withdrawal amount",
          variant: "destructive"
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const result = await DatabaseConnector.processWithdrawal(accountNumber, withdrawAmount);
      
      if (result.success) {
        toast({
          title: "Withdrawal Successful",
          description: `₹${withdrawAmount.toLocaleString('en-IN')} withdrawn successfully.`,
          variant: "default"
        });

        onSuccess();
        onOpenChange(false);
        setAmount('');
        setCustomDenominations(false);
        setDenominationSelection({});
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "An error occurred during withdrawal. Please try again.",
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
      <DialogContent className="sm:max-w-md bg-atm-white max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="text-center shrink-0 p-6 pb-4">
          <div className="mx-auto w-12 h-12 bg-atm-primary/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-atm-primary" />
          </div>
          <DialogTitle className="text-xl text-atm-primary">Cash Withdrawal</DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Enter the amount you wish to withdraw
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-4 p-6 pt-0">
          <div className="bg-atm-gray-100 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-atm-gray-600">Available Balance:</span>
              <span className="font-semibold text-atm-gray-900">
                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-atm-gray-700">
              Withdrawal Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-lg font-mono"
              min="1"
              max={currentBalance}
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
                  className="text-atm-primary border-atm-primary hover:bg-atm-primary hover:text-atm-white"
                  disabled={quickAmount > currentBalance}
                >
                  ₹{quickAmount.toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>

          {amount && (
            <div className="bg-atm-primary/5 p-3 rounded-lg">
              <div className="flex items-center text-sm text-atm-gray-700">
                <AlertCircle className="w-4 h-4 mr-2 text-atm-warning" />
                <span>
                  {parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance 
                    ? `You will receive ₹${parseFloat(amount).toLocaleString('en-IN')} in available denominations`
                    : 'Please enter a valid amount'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Custom Denomination Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-atm-gray-50 rounded-lg">
            <Settings className="w-4 h-4 text-atm-primary" />
            <Label htmlFor="custom-denominations" className="flex-1 text-sm font-medium">
              Choose my denominations
            </Label>
            <Switch
              id="custom-denominations"
              checked={customDenominations}
              onCheckedChange={setCustomDenominations}
            />
          </div>

          {/* Denomination Selector */}
          {customDenominations && amount && parseFloat(amount) > 0 && (
            <DenominationSelector
              amount={parseFloat(amount)}
              onSelectionChange={setDenominationSelection}
              mode="withdrawal"
            />
          )}

          <div className="flex gap-3 pt-4 pb-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdraw}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance || isProcessing}
              className="flex-1 bg-atm-primary hover:bg-atm-primary-light"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Withdraw
                </div>
              )}
            </Button>
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};