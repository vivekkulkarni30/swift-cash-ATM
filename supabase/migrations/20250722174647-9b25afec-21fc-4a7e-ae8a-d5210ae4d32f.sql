-- accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number BIGINT NOT NULL UNIQUE,
  pin VARCHAR(6) NOT NULL,
  holder_name TEXT NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  daily_withdrawal_limit DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  daily_withdrawal_used DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  daily_deposit_limit DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  daily_deposit_used DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ATM cash inventory table
CREATE TABLE public.atm_cash (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  denomination INTEGER NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QR transactions table
CREATE TABLE public.qr_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(10) NOT NULL UNIQUE,
  account_number BIGINT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- transaction history table
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number BIGINT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atm_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow all operations on accounts" ON public.accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on atm_cash" ON public.atm_cash FOR ALL USING (true);
CREATE POLICY "Allow all operations on qr_transactions" ON public.qr_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_history" ON public.transaction_history FOR ALL USING (true);


INSERT INTO public.accounts (account_number, pin, holder_name, balance) VALUES
(1234567890, '1234', 'John Doe', 25000.00),
(9876543210, '5678', 'Jane Smith', 15000.00),
(5555666677, '9999', 'Alice Johnson', 30000.00);

-- ATM cash denominations
INSERT INTO public.atm_cash (denomination, count) VALUES
(2000, 50),
(500, 100),
(200, 150),
(100, 200),
(50, 100),
(20, 200),
(10, 300);


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atm_cash_updated_at
  BEFORE UPDATE ON public.atm_cash
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.accounts 
  SET 
    daily_withdrawal_used = 0.00,
    daily_deposit_used = 0.00,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.clean_expired_qr_transactions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.qr_transactions 
  WHERE expires_at < now() AND is_used = false;
END;
$$ LANGUAGE plpgsql;