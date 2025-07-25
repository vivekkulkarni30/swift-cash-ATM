import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { ArrowUpDown, CheckCircle, ArrowRight } from 'lucide-react';

interface DenominationExchangeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DenominationExchange = ({ open, onOpenChange }: DenominationExchangeProps) => {
  const [fromDenomination, setFromDenomination] = useState<string>('');
  const [toDenomination, setToDenomination] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [atmMachine, setAtmMachine] = useState<any[]>([]);
  const [availableDenominations, setAvailableDenominations] = useState<number[]>([]);
  
  useEffect(() => {
    const fetchAtmCash = async () => {
      const cash = await DatabaseConnector.getATMCash();
      setAtmMachine(cash);
      setAvailableDenominations(cash.map(note => note.denomination));
    };
    if (open) {
      fetchAtmCash();
    }
  }, [open]);

  const handleExchange = async () => {
    const fromDenom = parseInt(fromDenomination);
    const toDenom = parseInt(toDenomination);
    const qty = parseInt(quantity);

    if (!fromDenom || !toDenom || !qty || qty <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields with valid values",
        variant: "destructive"
      });
      return;
    }

    if (fromDenom === toDenom) {
      toast({
        title: "Invalid Exchange",
        description: "Cannot exchange to the same denomination",
        variant: "destructive"
      });
      return;
    }

    const exchangeValue = fromDenom * qty;
    if (exchangeValue % toDenom !== 0) {
      toast({
        title: "Invalid Exchange",
        description: `₹${exchangeValue} cannot be evenly exchanged for ₹${toDenom} notes`,
        variant: "destructive"
      });
      return;
    }

    const requiredToNotes = exchangeValue / toDenom;

    // Check availability
    const fromNote = atmMachine.find(note => note.denomination === fromDenom);
    const toNote = atmMachine.find(note => note.denomination === toDenom);

    if (!fromNote || !toNote) {
      toast({
        title: "Denomination Not Available",
        description: "Selected denomination is not available in this ATM",
        variant: "destructive"
      });
      return;
    }

    if (fromNote.count < qty) {
      toast({
        title: "Insufficient Notes",
        description: `ATM has only ${fromNote.count} notes of ₹${fromDenom}. Required: ${qty}`,
        variant: "destructive"
      });
      return;
    }

    if (toNote.count < requiredToNotes) {
      toast({
        title: "Insufficient Notes",
        description: `ATM has only ${toNote.count} notes of ₹${toDenom}. Required: ${requiredToNotes}`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use the denomination exchange function
      const result = await DatabaseConnector.exchangeDenominations(fromDenom, toDenom, qty);

      if (result.success) {
        toast({
          title: "Exchange Successful",
          description: `Exchanged ${qty} x ₹${fromDenom} for ${requiredToNotes} x ₹${toDenom}`,
          variant: "default"
        });

        // Refresh ATM cash inventory
        const updatedCash = await DatabaseConnector.getATMCash();
        setAtmMachine(updatedCash);
        setAvailableDenominations(updatedCash.map(note => note.denomination));

        // Reset form
        setFromDenomination('');
        setToDenomination('');
        setQuantity('');
        onOpenChange(false);
      } else {
        toast({
          title: "Exchange Failed",
          description: "Failed to update ATM inventory. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "An error occurred during exchange. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateExchange = () => {
    const fromDenom = parseInt(fromDenomination);
    const toDenom = parseInt(toDenomination);
    const qty = parseInt(quantity);

    if (fromDenom && toDenom && qty) {
      const exchangeValue = fromDenom * qty;
      if (exchangeValue % toDenom === 0) {
        return exchangeValue / toDenom;
      }
    }
    return null;
  };

  const exchangeResult = calculateExchange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-atm-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-atm-warning/10 rounded-full flex items-center justify-center mb-4">
            <ArrowUpDown className="w-6 h-6 text-atm-warning" />
          </div>
          <DialogTitle className="text-xl text-atm-primary">Denomination Exchange</DialogTitle>
          <DialogDescription className="text-atm-gray-600">
            Exchange your notes for different denominations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current ATM Inventory */}
          <div className="bg-atm-gray-100 p-4 rounded-lg">
            <Label className="text-sm font-medium text-atm-gray-700 mb-2 block">
              Available Notes
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {atmMachine.map(note => (
                <div key={note.denomination} className="flex justify-between text-sm">
                  <span>₹{note.denomination}:</span>
                  <span className="font-semibold">{note.count} notes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exchange Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDenom">From Denomination</Label>
                <Select value={fromDenomination} onValueChange={setFromDenomination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDenominations.map(denom => (
                      <SelectItem key={denom} value={denom.toString()}>
                        ₹{denom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDenom">To Denomination</Label>
                <Select value={toDenomination} onValueChange={setToDenomination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDenominations.map(denom => (
                      <SelectItem key={denom} value={denom.toString()}>
                        ₹{denom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Exchange</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter number of notes"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="text-center"
              />
            </div>

            {/* Exchange Preview */}
            {fromDenomination && toDenomination && quantity && (
              <div className="bg-atm-primary/5 p-4 rounded-lg border border-atm-primary/20">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span className="font-semibold">
                    {quantity} x ₹{fromDenomination}
                  </span>
                  <ArrowRight className="w-4 h-4 text-atm-primary" />
                  <span className="font-semibold">
                    {exchangeResult ? `${exchangeResult} x ₹${toDenomination}` : 'Invalid exchange'}
                  </span>
                </div>
                <div className="text-center text-xs text-atm-gray-600 mt-2">
                  Total Value: ₹{parseInt(fromDenomination) * parseInt(quantity)}
                </div>
              </div>
            )}
          </div>

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
              onClick={handleExchange}
              disabled={!exchangeResult || exchangeResult <= 0 || isProcessing}
              className="flex-1 bg-atm-warning hover:bg-atm-warning/90 text-atm-white"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Exchange
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};