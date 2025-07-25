import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { QrCode, CheckCircle } from 'lucide-react';

interface QRCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QRCashDialog = ({ open, onOpenChange }: QRCashDialogProps) => {
  const [qrToken, setQrToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleQRCash = async () => {
    if (!qrToken.trim()) {
      toast({
        title: "Invalid Token",
        description: "Please enter a valid QR token",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await DatabaseConnector.processQRCash(qrToken.trim());
      
      if (result.success && result.amount) {
        toast({
          title: "QR Cash Successful",
          description: `₹${result.amount.toLocaleString('en-IN')} withdrawn successfully`,
          variant: "default"
        });
        setQrToken('');
        onOpenChange(false);
      } else {
        toast({
          title: "Transaction Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-atm-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-atm-primary/10 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-atm-primary" />
          </div>
          <DialogTitle className="text-xl text-atm-primary">QR Cash Withdrawal</DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Enter your QR token to withdraw cash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qrToken">QR Token</Label>
            <Input
              id="qrToken"
              placeholder="Enter QR token"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleQRCash}
              disabled={!qrToken.trim() || isProcessing}
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
      </DialogContent>
    </Dialog>
  );
};