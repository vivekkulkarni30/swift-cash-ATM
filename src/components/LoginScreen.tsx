import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/lib/database';
import { CreditCard, QrCode, Landmark } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (accountNumber: number) => void;
  onQRCash: () => void;
}

export const LoginScreen = ({ onLogin, onQRCash }: LoginScreenProps) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!accountNumber || !pin) {
      toast({
        title: "Error",
        description: "Please enter both account number and PIN",
        variant: "destructive"
      });
      return;
    }

    const accountNum = parseInt(accountNumber);
    const pinNum = parseInt(pin);

    if (isNaN(accountNum) || isNaN(pinNum)) {
      toast({
        title: "Error", 
        description: "Please enter valid numbers",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate database connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = await DatabaseConnector.authenticateUser(accountNum, pinNum.toString());
      
      if (user) {
        toast({
          title: "Login Successful",
          description: `Welcome, ${user.holder_name}!`,
          variant: "default"
        });
        onLogin(accountNum);
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid account number or PIN",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Database Error",
        description: "Unable to connect to ATM system. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-atm flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <Card className="w-full max-w-md bg-atm-white shadow-atm border-0 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-atm rounded-full flex items-center justify-center">
            <Landmark className="w-8 h-8 text-atm-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-atm-primary">Swift Cash</CardTitle>
          <CardDescription className="text-atm-gray-500">
            Secure Banking Solutions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-atm-gray-700 font-medium">
                Account Number
              </Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="Enter your account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-center text-lg font-mono bg-atm-white border-atm-gray-300 focus:border-atm-primary focus:ring-atm-primary"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-atm-gray-700 font-medium">
                PIN
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-center text-lg font-mono bg-atm-white border-atm-gray-300 focus:border-atm-primary focus:ring-atm-primary"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-atm-primary hover:bg-atm-primary-light text-atm-white font-semibold shadow-atm-button transition-all duration-300"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isLoading ? 'Authenticating...' : 'Login'}
            </Button>

            <Button
              onClick={onQRCash}
              variant="outline"
              className="w-full h-12 border-atm-primary text-atm-primary hover:bg-atm-primary hover:text-atm-white font-semibold transition-all duration-300"
            >
              <QrCode className="w-5 h-5 mr-2" />
              QR Cash
            </Button>
          </div>

          <div className="text-center text-sm text-atm-gray-500 space-y-1">
            <p>Demo Accounts:</p>
            <p className="font-mono">1234567890 / PIN: 1234</p>
            <p className="font-mono">9876543210 / PIN: 5678</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};