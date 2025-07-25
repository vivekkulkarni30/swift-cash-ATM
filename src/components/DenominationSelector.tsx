import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { DatabaseConnector } from '@/lib/database';

interface DenominationSelectorProps {
  amount: number;
  onSelectionChange: (selection: { [denomination: number]: number }) => void;
  mode: 'withdrawal' | 'exchange';
}

export const DenominationSelector = ({ amount, onSelectionChange, mode }: DenominationSelectorProps) => {
  const [atmCash, setAtmCash] = useState<any[]>([]);
  const [selection, setSelection] = useState<{ [denomination: number]: number }>({});

  useEffect(() => {
    const fetchAtmCash = async () => {
      const cash = await DatabaseConnector.getATMCash();
      setAtmCash(cash.filter(c => c.count > 0).sort((a, b) => b.denomination - a.denomination));
    };
    fetchAtmCash();
  }, []);

  useEffect(() => {
    // Auto-calculate optimal distribution
    if (atmCash.length > 0) {
      const optimal = calculateOptimalDistribution(amount, atmCash);
      setSelection(optimal);
      onSelectionChange(optimal);
    }
  }, [amount, atmCash]);

  const calculateOptimalDistribution = (targetAmount: number, availableCash: any[]) => {
    const result: { [denomination: number]: number } = {};
    let remaining = targetAmount;

    // Sort by denomination descending for greedy approach
    const sortedCash = [...availableCash].sort((a, b) => b.denomination - a.denomination);

    for (const cash of sortedCash) {
      if (remaining === 0) break;
      
      const notesNeeded = Math.floor(remaining / cash.denomination);
      const notesToUse = Math.min(notesNeeded, cash.count);
      
      if (notesToUse > 0) {
        result[cash.denomination] = notesToUse;
        remaining -= notesToUse * cash.denomination;
      }
    }

    return result;
  };

  const handleDenominationChange = (denomination: number, change: number) => {
    const newSelection = { ...selection };
    const current = newSelection[denomination] || 0;
    const newValue = Math.max(0, current + change);
    
    // Check if we have enough notes available
    const availableNotes = atmCash.find(c => c.denomination === denomination)?.count || 0;
    if (newValue <= availableNotes) {
      if (newValue === 0) {
        delete newSelection[denomination];
      } else {
        newSelection[denomination] = newValue;
      }
      setSelection(newSelection);
      onSelectionChange(newSelection);
    }
  };

  const getTotalValue = () => {
    return Object.entries(selection).reduce((total, [denom, count]) => {
      return total + (parseInt(denom) * count);
    }, 0);
  };

  const resetToOptimal = () => {
    const optimal = calculateOptimalDistribution(amount, atmCash);
    setSelection(optimal);
    onSelectionChange(optimal);
  };

  const totalValue = getTotalValue();
  const isExactAmount = totalValue === amount;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-atm-primary">
            Choose Your Denominations
          </CardTitle>
          <Button
            onClick={resetToOptimal}
            variant="outline"
            size="sm"
            className="text-atm-primary border-atm-primary hover:bg-atm-primary hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
        <div className="text-sm text-atm-gray-600">
          Target: ₹{amount.toLocaleString('en-IN')} | Selected: ₹{totalValue.toLocaleString('en-IN')}
          {!isExactAmount && (
            <span className="text-atm-error ml-2">
              (₹{Math.abs(amount - totalValue).toLocaleString('en-IN')} {totalValue > amount ? 'over' : 'short'})
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {atmCash.map((cash) => {
          const selectedCount = selection[cash.denomination] || 0;
          const selectedValue = selectedCount * cash.denomination;
          
          return (
            <div key={cash.denomination} className="bg-atm-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Label className="font-semibold text-atm-gray-900">
                    ₹{cash.denomination}
                  </Label>
                  <span className="text-sm text-atm-gray-500">
                    ({cash.count} available)
                  </span>
                </div>
                <div className="text-sm text-atm-gray-700">
                  ₹{selectedValue.toLocaleString('en-IN')}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => handleDenominationChange(cash.denomination, -1)}
                  disabled={selectedCount === 0}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 text-center">
                  <span className="text-lg font-mono font-semibold">
                    {selectedCount}
                  </span>
                  <span className="text-sm text-atm-gray-500 ml-1">notes</span>
                </div>
                
                <Button
                  onClick={() => handleDenominationChange(cash.denomination, 1)}
                  disabled={selectedCount >= cash.count}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {!isExactAmount && (
          <div className="bg-atm-warning/10 border border-atm-warning/20 p-3 rounded-lg">
            <p className="text-sm text-atm-warning font-medium">
              ⚠️ Selected amount doesn't match target amount
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};