import { useState } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { MainMenu } from '@/components/MainMenu';
import { QRCashDialog } from '@/components/QRCashDialog';

const Index = () => {
  const [loggedInAccount, setLoggedInAccount] = useState<number | null>(null);
  const [showQRCash, setShowQRCash] = useState(false);

  const handleLogin = (accountNumber: number) => {
    setLoggedInAccount(accountNumber);
  };

  const handleLogout = () => {
    setLoggedInAccount(null);
  };

  const handleQRCash = () => {
    setShowQRCash(true);
  };

  if (loggedInAccount) {
    return <MainMenu accountNumber={loggedInAccount} onLogout={handleLogout} />;
  }

  return (
    <>
      <LoginScreen onLogin={handleLogin} onQRCash={handleQRCash} />
      <QRCashDialog open={showQRCash} onOpenChange={setShowQRCash} />
    </>
  );
};

export default Index;
