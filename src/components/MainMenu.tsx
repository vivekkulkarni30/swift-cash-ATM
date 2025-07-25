import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseConnector, Account } from '@/lib/database';
import { UserPreferencesManager } from '@/lib/user-preferences';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  PiggyBank, 
  Banknote, 
  ArrowUpDown, 
  QrCode, 
  LogOut,
  DollarSign,
  TrendingUp,
  Wallet,
  Eye,
  EyeOff
} from 'lucide-react';
import { WithdrawDialog } from './WithdrawDialog';
import { DepositDialog } from './DepositDialog';
import { DenominationExchange } from './DenominationExchange';
import { QRCodeDialog } from './QRCodeDialog';
import { MiniStatementDialog } from './MiniStatementDialog';

interface MainMenuProps {
  accountNumber: number;
  onLogout: () => void;
}

export const MainMenu = ({ accountNumber, onLogout }: MainMenuProps) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [atmCash, setAtmCash] = useState<any[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMiniStatement, setShowMiniStatement] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [accountData, cashData] = await Promise.all([
        DatabaseConnector.getAccount(accountNumber),
        DatabaseConnector.getATMCash()
      ]);
      if (accountData) setAccount(accountData);
      setAtmCash(cashData);
    };

    // Load user preferences
    const preferences = UserPreferencesManager.getPreferences(accountNumber);
    setShowBalance(preferences.showBalance);

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [accountNumber]);


  const toggleBalanceVisibility = () => {
    const newShowBalance = !showBalance;
    setShowBalance(newShowBalance);
    UserPreferencesManager.updatePreference(accountNumber, 'showBalance', newShowBalance);
  };

  const refreshAccount = async () => {
    const updatedAccount = await DatabaseConnector.getAccount(accountNumber);
    if (updatedAccount) {
      setAccount(updatedAccount);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-atm flex items-center justify-center">
        <div className="text-atm-white text-xl">Loading account data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-atm p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-atm-primary mb-2">
                    Welcome, {account.holder_name}
                  </CardTitle>
                  <CardDescription className="text-atm-gray-600">
                    Account: {account.account_number}
                  </CardDescription>
                </div>
                <Button 
                  onClick={onLogout}
                  variant="outline"
                  className="border-atm-error text-atm-error hover:bg-atm-error hover:text-atm-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
              
              <div className="bg-gradient-atm p-4 rounded-lg mt-4">
                <div className="flex items-center justify-between text-atm-white">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm opacity-90">Available Balance</p>
                      <Button
                        onClick={toggleBalanceVisibility}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-atm-white hover:bg-atm-white/20"
                      >
                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-3xl font-bold">
                      {showBalance 
                        ? `₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '₹••••••••'
                      }
                    </p>
                  </div>
                  <div className="bg-atm-white/20 p-3 rounded-full">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm-button hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowWithdraw(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-atm-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-atm-primary" />
                </div>
                <h3 className="font-semibold text-atm-gray-900 mb-2">Withdraw</h3>
                <p className="text-sm text-atm-gray-600">Withdraw cash from your account</p>
              </CardContent>
            </Card>

            <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm-button hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowDeposit(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-atm-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-atm-success" />
                </div>
                <h3 className="font-semibold text-atm-gray-900 mb-2">Deposit</h3>
                <p className="text-sm text-atm-gray-600">Deposit cash to your account</p>
              </CardContent>
            </Card>

            <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm-button hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowExchange(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-atm-warning/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpDown className="w-8 h-8 text-atm-warning" />
                </div>
                <h3 className="font-semibold text-atm-gray-900 mb-2">Denomination Exchange</h3>
                <p className="text-sm text-atm-gray-600">Exchange notes for different denominations</p>
              </CardContent>
            </Card>

            <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm-button hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowQRCode(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-atm-primary-light/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-atm-primary-light" />
                </div>
                <h3 className="font-semibold text-atm-gray-900 mb-2">Generate QR</h3>
                <p className="text-sm text-atm-gray-600">Generate QR code for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="bg-atm-white/95 backdrop-blur-sm border-0 shadow-atm-button hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowMiniStatement(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-atm-gray-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-atm-gray-500" />
                </div>
                <h3 className="font-semibold text-atm-gray-900 mb-2">Mini Statement</h3>
                <p className="text-sm text-atm-gray-600">View recent transactions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <WithdrawDialog 
        open={showWithdraw}
        onOpenChange={setShowWithdraw}
        accountNumber={accountNumber}
        currentBalance={account.balance}
        onSuccess={refreshAccount}
      />
      
      <DepositDialog
        open={showDeposit}
        onOpenChange={setShowDeposit}
        accountNumber={accountNumber}
        onSuccess={refreshAccount}
      />

      <DenominationExchange
        open={showExchange}
        onOpenChange={setShowExchange}
      />

      <QRCodeDialog
        open={showQRCode}
        onOpenChange={setShowQRCode}
        accountNumber={accountNumber}
        currentBalance={account.balance}
      />

      <MiniStatementDialog
        open={showMiniStatement}
        onOpenChange={setShowMiniStatement}
        accountNumber={accountNumber}
      />
    </>
  );
};