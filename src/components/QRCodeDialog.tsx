import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { QrCode, Download, Copy } from 'lucide-react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNumber: number;
  currentBalance: number;
}

export const QRCodeDialog = ({ open, onOpenChange, accountNumber, currentBalance }: QRCodeDialogProps) => {
  const [amount, setAmount] = useState('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (withdrawAmount > currentBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Amount exceeds available balance",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await DatabaseConnector.createQRTransaction(accountNumber, withdrawAmount);
      
      if (result.success && result.token) {
        setQrToken(result.token);
        toast({
          title: "QR Code Generated",
          description: `QR code for ₹${withdrawAmount} withdrawal created successfully. Valid for 5 minutes.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      toast({
        title: "Copied",
        description: "QR token copied to clipboard",
        variant: "default"
      });
    }
  };

  const resetForm = () => {
    setAmount('');
    setQrToken(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="sm:max-w-md bg-atm-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-atm-primary-light/10 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-atm-primary-light" />
          </div>
          <DialogTitle className="text-xl text-atm-primary">Generate QR Code</DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Create a QR code for mobile withdrawal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!qrToken ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="qrAmount">Withdrawal Amount</Label>
                <Input
                  id="qrAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-center text-lg font-mono"
                  max={currentBalance}
                />
              </div>

              <Button 
                onClick={generateQRCode}
                disabled={!amount || parseFloat(amount) <= 0 || isGenerating}
                className="w-full bg-atm-primary-light hover:bg-atm-primary"
              >
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-atm-gray-100 p-8 rounded-lg">
                <div className="w-32 h-32 mx-auto bg-atm-primary-light/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-atm-primary-light" />
                </div>
                <p className="text-sm text-atm-gray-600 mt-4">
                  QR Code for ₹{amount} withdrawal
                </p>
              </div>

              <div className="bg-atm-primary/5 p-3 rounded-lg">
                <p className="text-xs text-atm-gray-600 mb-2">Token:</p>
                <p className="font-mono text-sm break-all">{qrToken}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyToken} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Token
                </Button>
                <Button onClick={resetForm} className="flex-1">
                  Generate New
                </Button>
              </div>

              <p className="text-xs text-atm-warning">
                ⚠️ QR code expires in 5 minutes
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};