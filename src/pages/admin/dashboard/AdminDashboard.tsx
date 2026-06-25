import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useReportService } from '@/hooks/useReportService';
import { useTreasuryService } from '@/hooks/useTreasuryService';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Coins,
  Users,
  Activity,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Info,
  X,
  ArrowRightLeft,
  Briefcase,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { currentUser, advocates, transactions, dues, employeeProfiles } = useMockDB();
  const { getOperationalNotifications } = useReportService();
  const { treasuryTransactions, addTreasuryTransaction, canAddTransactions } = useTreasuryService();
  const navigate = useNavigate();
  const alerts = getOperationalNotifications();

  // Dialog and formula states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [showCashFormula, setShowCashFormula] = useState(false);
  const [showBankFormula, setShowBankFormula] = useState(false);

  // Form states for adding treasury transaction
  const [txMode, setTxMode] = useState<'ADJUSTMENT' | 'TRANSFER'>('ADJUSTMENT');
  const [txAccount, setTxAccount] = useState<'CASH' | 'BANK'>('CASH');
  const [txAdjType, setTxAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [txSource, setTxSource] = useState<'CASH' | 'BANK'>('CASH');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txCustomCategory, setTxCustomCategory] = useState('');
  const [txRemarks, setTxRemarks] = useState('');
  const [txRefNumber, setTxRefNumber] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);

  // Helper to check if a date string is today
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // 1. PRIMARY KPI CALCULATIONS
  // Today's Collections
  const todayCollections = transactions
    .filter((t) => isToday(t.payment_date))
    .reduce((sum, t) => sum + t.total_amount, 0);

  // Today's Transactions count
  const todayTransactionsCount = transactions.filter((t) => isToday(t.payment_date)).length;

  // Outstanding Amount (Sum of all UNPAID dues)
  const outstandingAmount = dues
    .filter((d) => d.status === 'UNPAID')
    .reduce((sum, d) => sum + d.total_due_amount, 0);

  // Active members in arrears (active advocates with at least one unpaid due)
  const membersInArrearsCount = advocates
    .filter((a) => a.status === 'ACTIVE')
    .filter((a) => dues.some((d) => d.advocate_id === a.id && d.status === 'UNPAID'))
    .length;

  // 2. REDESIGNED SECTIONS DATA DERIVATIONS
  // Collections by Payment Method (Today)
  const todayCashCollections = transactions
    .filter((t) => isToday(t.payment_date) && t.payment_mode === 'CASH')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const todayUPICollections = transactions
    .filter((t) => isToday(t.payment_date) && t.payment_mode === 'UPI')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const todayChequeCollections = transactions
    .filter((t) => isToday(t.payment_date) && t.payment_mode === 'CHEQUE')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const todayBankTransferCollections = transactions
    .filter((t) => isToday(t.payment_date) && t.payment_mode === 'BANK_TRANSFER')
    .reduce((sum, t) => sum + t.total_amount, 0);

  // Treasury Accounts derived balances (Cumulative)
  // Cash Drawer Balance
  const cashCollections = transactions
    .filter((t) => t.payment_mode === 'CASH')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const cashAdjustmentCredits = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'ADJUSTMENT' && tx.account === 'CASH' && tx.adjustment_type === 'CREDIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cashAdjustmentDebits = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'ADJUSTMENT' && tx.account === 'CASH' && tx.adjustment_type === 'DEBIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cashTransfersOut = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'TRANSFER' && tx.source_account === 'CASH')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cashTransfersIn = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'TRANSFER' && tx.destination_account === 'CASH')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cashDrawerBalance = cashCollections + cashAdjustmentCredits - cashAdjustmentDebits - cashTransfersOut + cashTransfersIn;

  // Bank Account Balance
  const bankCollections = transactions
    .filter((t) => t.payment_mode === 'UPI' || t.payment_mode === 'CHEQUE' || t.payment_mode === 'BANK_TRANSFER')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const bankAdjustmentCredits = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'ADJUSTMENT' && tx.account === 'BANK' && tx.adjustment_type === 'CREDIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const bankAdjustmentDebits = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'ADJUSTMENT' && tx.account === 'BANK' && tx.adjustment_type === 'DEBIT')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const bankTransfersOut = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'TRANSFER' && tx.source_account === 'BANK')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const bankTransfersIn = treasuryTransactions
    .filter((tx) => tx.transaction_mode === 'TRANSFER' && tx.destination_account === 'BANK')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const bankAccountBalance = bankCollections + bankAdjustmentCredits - bankAdjustmentDebits + bankTransfersIn - bankTransfersOut;


  // 3. CHART DATA DERIVATIONS
  // A. Monthly Collections Trend (Area Chart)
  const getCollectionsTrendData = () => {
    const monthlyMap: Record<string, number> = {};
    transactions.forEach((tx) => {
      const date = new Date(tx.payment_date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + tx.total_amount;
    });

    return Object.keys(monthlyMap)
      .sort()
      .map((key) => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short' });
        return {
          month: `${monthName} '${year.slice(2)}`,
          amount: monthlyMap[key],
        };
      });
  };

  // B. Payment Mode Distribution (Pie Chart)
  const getPaymentModeData = () => {
    const modes: Record<string, number> = { CASH: 0, UPI: 0, BANK_TRANSFER: 0, CHEQUE: 0 };
    transactions.forEach((tx) => {
      modes[tx.payment_mode] = (modes[tx.payment_mode] || 0) + tx.total_amount;
    });
    return Object.keys(modes).map((key) => ({
      name: key === 'BANK_TRANSFER' ? 'Bank Transfer' : key === 'UPI' ? 'UPI Digital' : key === 'CHEQUE' ? 'Cheque' : 'Cash Drawer',
      value: modes[key],
    }));
  };

  // C. Outstanding Dues by Month (Bar Chart)
  const getOutstandingData = () => {
    const monthlyMap: Record<string, number> = {};
    dues
      .filter((d) => d.status === 'UNPAID')
      .forEach((d) => {
        const monthKey = `${d.year}-${d.month.padStart(2, '0')}`;
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + d.total_due_amount;
      });

    return Object.keys(monthlyMap)
      .sort()
      .slice(-12) // Last 12 months with outstanding dues
      .map((key) => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short' });
        return {
          month: `${monthName} '${year.slice(2)}`,
          amount: monthlyMap[key],
        };
      });
  };

  const trendData = getCollectionsTrendData();
  const paymentModeData = getPaymentModeData();
  const outstandingData = getOutstandingData();

  // Recharts colors
  const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444']; // emerald, indigo, amber, rose

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    setTxSuccess(false);

    const parsedAmount = parseFloat(txAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTxError('Please enter a valid amount greater than zero.');
      return;
    }

    const selectedCategory = txCategory === 'Other' ? txCustomCategory.trim() : txCategory;
    if (!selectedCategory) {
      setTxError('Please specify a category.');
      return;
    }

    if (!txRemarks.trim()) {
      setTxError('Remarks are mandatory.');
      return;
    }

    try {
      if (txMode === 'ADJUSTMENT') {
        addTreasuryTransaction({
          transaction_mode: 'ADJUSTMENT',
          transaction_date: txDate,
          account: txAccount,
          adjustment_type: txAdjType,
          amount: parsedAmount,
          category: selectedCategory,
          remarks: txRemarks.trim(),
          reference_number: txRefNumber.trim() || undefined,
        });
      } else {
        const destAccount = txSource === 'CASH' ? 'BANK' : 'CASH';
        addTreasuryTransaction({
          transaction_mode: 'TRANSFER',
          transaction_date: txDate,
          source_account: txSource,
          destination_account: destAccount,
          amount: parsedAmount,
          category: selectedCategory,
          remarks: txRemarks.trim(),
          reference_number: txRefNumber.trim() || undefined,
        });
      }

      setTxSuccess(true);
      setTxAmount('');
      setTxRemarks('');
      setTxRefNumber('');
      setTxCategory('');
      setTxCustomCategory('');
      setTimeout(() => {
        setIsTransactionModalOpen(false);
        setTxSuccess(false);
      }, 1000);
    } catch (err: any) {
      setTxError(err.message || 'An error occurred.');
    }
  };

  const totalEmployees = employeeProfiles.length;
  const activeEmployees = employeeProfiles.filter((e) => e.status === 'ACTIVE').length;
  const suspendedEmployees = employeeProfiles.filter((e) => e.status === 'SUSPENDED').length;
  const retiredEmployees = employeeProfiles.filter((e) => e.status === 'RETIRED').length;

  return (
    <div className="space-y-6">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Today's Collections"
          value={`₹${todayCollections.toFixed(2)}`}
          icon={ArrowUpRight}
          className="border-l-4 border-emerald-600 bg-white"
          iconClassName="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          label="Today's Transactions"
          value={`${todayTransactionsCount} ${todayTransactionsCount === 1 ? 'Receipt' : 'Receipts'}`}
          icon={Activity}
          className="border-l-4 border-indigo-600 bg-white"
          iconClassName="text-indigo-650 bg-indigo-50"
        />

        <StatCard
          label="Outstanding Amount"
          value={`₹${outstandingAmount.toFixed(2)}`}
          icon={AlertCircle}
          className="border-l-4 border-rose-500 bg-white"
          iconClassName="text-rose-500 bg-rose-50"
        />

        <StatCard
          label="Members in Arrears"
          value={`${membersInArrearsCount} ${membersInArrearsCount === 1 ? 'Member' : 'Members'}`}
          icon={Users}
          className="border-l-4 border-amber-500 bg-white"
          iconClassName="text-amber-700 bg-amber-55/60"
        />
      </div>

      {/* Employee Statistics Row */}
      <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
          Office Employees Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Employees"
            value={`${totalEmployees} ${totalEmployees === 1 ? 'Employee' : 'Employees'}`}
            icon={Users}
            className="border-l-4 border-emerald-600 bg-white shadow-none"
            iconClassName="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            label="Active Employees"
            value={`${activeEmployees} Active`}
            icon={Activity}
            className="border-l-4 border-indigo-650 bg-white shadow-none"
            iconClassName="text-indigo-655 bg-indigo-50"
          />
          <StatCard
            label="Suspended Employees"
            value={`${suspendedEmployees} Suspended`}
            icon={AlertCircle}
            className="border-l-4 border-rose-500 bg-white shadow-none"
            iconClassName="text-rose-500 bg-rose-50"
          />
          <StatCard
            label="Retired Employees"
            value={`${retiredEmployees} Retired`}
            icon={Briefcase}
            className="border-l-4 border-slate-450 bg-white shadow-none"
            iconClassName="text-slate-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Collections by Payment Method */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-heading">
          Collections by Payment Method (Today)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-3.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cash</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">₹{todayCashCollections.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-3.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">UPI</span>
              <span className="text-sm font-bold text-emerald-700 mt-1 block">₹{todayUPICollections.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-3.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cheque</span>
              <span className="text-sm font-bold text-amber-700 mt-1 block">₹{todayChequeCollections.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-slate-200/60 shadow-none">
            <CardContent className="p-3.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Bank Transfer</span>
              <span className="text-sm font-bold text-indigo-700 mt-1 block">₹{todayBankTransferCollections.toFixed(2)}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Treasury Accounts */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
              Treasury Accounts
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Derived balances across physical Cash Drawer and Bank Account.
            </p>
          </div>
          {canAddTransactions && (
            <Button
              onClick={() => {
                setTxError(null);
                setTxSuccess(false);
                setIsTransactionModalOpen(true);
              }}
              variant="outline"
              className="text-xs flex items-center gap-1.5 h-8 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-indigo-650" /> Add Treasury Transaction
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Drawer Card */}
          <Card className="bg-slate-50 border-slate-200/60 shadow-none relative overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-650">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-450 uppercase tracking-wider font-bold block">Cash Drawer Balance</span>
                    <span className="text-xl font-bold text-slate-800 mt-0.5 block">₹{cashDrawerBalance.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCashFormula(!showCashFormula)}
                  variant="ghost"
                  className="text-[10px] text-slate-500 hover:text-slate-700 underline flex items-center gap-1 p-1 bg-transparent hover:bg-slate-150 rounded"
                >
                  <Info className="h-3.5 w-3.5 text-slate-400" /> {showCashFormula ? 'Hide Formula' : 'Explain Balance'}
                </Button>
              </div>
              
              {showCashFormula && (
                <div className="bg-white border border-slate-200/70 p-3.5 rounded-lg text-[11px] text-slate-600 space-y-1.5 transition-all">
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Collections received as Cash:</span>
                    <span className="font-semibold text-emerald-600">+₹{cashCollections.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Manual Credits (Adjustments):</span>
                    <span className="font-semibold text-emerald-600">+₹{cashAdjustmentCredits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Manual Debits (Adjustments):</span>
                    <span className="font-semibold text-rose-600">-₹{cashAdjustmentDebits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Cash &rarr; Bank Transfers:</span>
                    <span className="font-semibold text-rose-600">-₹{cashTransfersOut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Bank &rarr; Cash Transfers:</span>
                    <span className="font-semibold text-emerald-600">+₹{cashTransfersIn.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-850 pt-1.5 border-t border-slate-200">
                    <span>Current Cash Balance:</span>
                    <span>₹{cashDrawerBalance.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Card */}
          <Card className="bg-slate-50 border-slate-200/60 shadow-none relative overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-450 uppercase tracking-wider font-bold block">Bank Account Balance</span>
                    <span className="text-xl font-bold text-emerald-700 mt-0.5 block">₹{bankAccountBalance.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBankFormula(!showBankFormula)}
                  variant="ghost"
                  className="text-[10px] text-slate-500 hover:text-slate-700 underline flex items-center gap-1 p-1 bg-transparent hover:bg-slate-150 rounded"
                >
                  <Info className="h-3.5 w-3.5 text-slate-400" /> {showBankFormula ? 'Hide Formula' : 'Explain Balance'}
                </Button>
              </div>
              
              {showBankFormula && (
                <div className="bg-white border border-slate-200/70 p-3.5 rounded-lg text-[11px] text-slate-600 space-y-1.5 transition-all">
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Collections (UPI, Cheques, Bank):</span>
                    <span className="font-semibold text-emerald-600">+₹{bankCollections.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Manual Credits (Adjustments):</span>
                    <span className="font-semibold text-emerald-600">+₹{bankAdjustmentCredits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Manual Debits (Adjustments):</span>
                    <span className="font-semibold text-rose-600">-₹{bankAdjustmentDebits.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Cash &rarr; Bank Transfers:</span>
                    <span className="font-semibold text-emerald-600">+₹{cashTransfersOut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-slate-100">
                    <span>Bank &rarr; Cash Transfers:</span>
                    <span className="font-semibold text-rose-600">-₹{bankTransfersOut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-850 pt-1.5 border-t border-slate-200">
                    <span>Current Bank Balance:</span>
                    <span>₹{bankAccountBalance.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operational Workspace Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Priority operational alerts and actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action alerts panel */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Active Alerts Dashboard
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No active operational alerts. The registry complies with all criteria.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-semibold text-slate-700 block">
                          {alert.type.toUpperCase()} alert
                        </span>
                        <p className="text-slate-500 mt-0.5">{alert.text}</p>
                      </div>
                      {alert.link && (
                        <Button
                          variant="ghost"
                          className="h-8 text-[11px] p-2 flex items-center gap-1 font-bold text-slate-700"
                          onClick={() => navigate(alert.link!)}
                        >
                          Resolve <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Front-Desk Shortcuts */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold font-heading text-slate-900">
                Front-Desk Shortcuts
              </h2>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex-col h-20 text-center border-slate-200"
                onClick={() => navigate('/admin/advocates')}
              >
                <Users className="h-5 w-5 mb-1.5 text-slate-500" />
                <span className="text-xs font-semibold">Advocate List</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col h-20 text-center border-slate-200"
                onClick={() => navigate('/admin/ledgers/collections')}
              >
                <Coins className="h-5 w-5 mb-1.5 text-slate-500" />
                <span className="text-xs font-semibold">Collections Ledger</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col h-20 text-center border-slate-200"
                onClick={() => navigate('/admin/ledgers/outstanding')}
              >
                <AlertCircle className="h-5 w-5 mb-1.5 text-slate-500" />
                <span className="text-xs font-semibold">Arrears Ledger</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Recent Transactions Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-sm font-bold font-heading text-slate-900">
              Recent Transactions Feed
            </h2>
          </CardHeader>
          <CardContent className="py-4">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                No checkout receipts issued.
              </p>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {tx.receipt_no}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.payment_date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        ₹{tx.total_amount.toFixed(2)}
                      </span>
                      <Badge variant="neutral" className="text-[9px] px-1 py-0 mt-0.5">
                        {tx.payment_mode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Analytics Panels & Charts */}
      {currentUser?.user_permissions.includes('view_reports') && (
        <div className="space-y-6">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-heading">
              Administrative Analytics Panels
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Collections Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-xs font-bold font-heading text-slate-900 uppercase tracking-wide">
                  Monthly Collections Trend
                </h3>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Collected']} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Mode Distribution */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <h3 className="text-xs font-bold font-heading text-slate-900 uppercase tracking-wide">
                  Payment Mode Distribution
                </h3>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-between">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentModeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentModeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} formatter={(val: any) => `₹${Number(val).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold px-4 pb-2">
                  {paymentModeData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="truncate">{entry.name}: ₹{entry.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outstanding Dues by Month */}
          <div className="grid grid-cols-1">
            <Card>
              <CardHeader>
                <h3 className="text-xs font-bold font-heading text-slate-900 uppercase tracking-wide">
                  Outstanding Arrears Distribution by Billing Month
                </h3>
              </CardHeader>
              <CardContent className="h-72">
                {outstandingData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-24">No outstanding arrears recorded in system.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outstandingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Arrears']} />
                      <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Treasury Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden animate-none">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-55/40">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4 text-indigo-650 animate-pulse" /> Add Treasury Transaction
              </h3>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitTransaction} className="flex-1 overflow-y-auto p-5 space-y-4">
              {txError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200 text-xs">
                  {txError}
                </div>
              )}
              {txSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-250 text-xs flex items-center gap-1.5">
                  Transaction recorded successfully!
                </div>
              )}

              {/* Radio buttons for Adjustment vs Transfer */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                  Transaction Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all ${txMode === 'ADJUSTMENT' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-bold' : 'border-slate-205 hover:bg-slate-50 text-slate-600'}`}>
                    <input
                      type="radio"
                      name="txMode"
                      value="ADJUSTMENT"
                      checked={txMode === 'ADJUSTMENT'}
                      onChange={() => {
                        setTxMode('ADJUSTMENT');
                        setTxCategory('');
                        setTxError(null);
                      }}
                      className="sr-only"
                    />
                    Adjustment
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all ${txMode === 'TRANSFER' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-bold' : 'border-slate-205 hover:bg-slate-50 text-slate-600'}`}>
                    <input
                      type="radio"
                      name="txMode"
                      value="TRANSFER"
                      checked={txMode === 'TRANSFER'}
                      onChange={() => {
                        setTxMode('TRANSFER');
                        setTxCategory('');
                        setTxError(null);
                      }}
                      className="sr-only"
                    />
                    Transfer
                  </label>
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Mode-specific Fields */}
              {txMode === 'ADJUSTMENT' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                        Target Account
                      </label>
                      <select
                        value={txAccount}
                        onChange={(e) => setTxAccount(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="CASH">Cash Drawer</option>
                        <option value="BANK">Bank Account</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                        Adjustment Type
                      </label>
                      <select
                        value={txAdjType}
                        onChange={(e) => setTxAdjType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="CREDIT">Credit (Add Funds)</option>
                        <option value="DEBIT">Debit (Subtract Funds)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    >
                      <option value="">Select Category...</option>
                      <option value="Opening balance correction">Opening balance correction</option>
                      <option value="Refunds">Refunds</option>
                      <option value="Bank charges">Bank charges</option>
                      <option value="Miscellaneous income">Miscellaneous income</option>
                      <option value="Miscellaneous expenses">Miscellaneous expenses</option>
                      <option value="Other">Other (Specify below)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                        From Account (Source)
                      </label>
                      <select
                        value={txSource}
                        onChange={(e) => setTxSource(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="CASH">Cash Drawer</option>
                        <option value="BANK">Bank Account</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider font-semibold">
                        To Account (Destination)
                      </label>
                      <input
                        type="text"
                        value={txSource === 'CASH' ? 'Bank Account' : 'Cash Drawer'}
                        disabled
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    >
                      <option value="">Select Category...</option>
                      <option value="Cash deposited into bank">Cash deposited into bank</option>
                      <option value="Cash withdrawn from bank">Cash withdrawn from bank</option>
                      <option value="UPI settlement">UPI settlement</option>
                      <option value="Other">Other (Specify below)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Other Category custom input */}
              {txCategory === 'Other' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                    Specify Custom Category
                  </label>
                  <input
                    type="text"
                    value={txCustomCategory}
                    onChange={(e) => setTxCustomCategory(e.target.value)}
                    placeholder="Enter custom category name..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Slip, Journal, Cheque No..."
                    value={txRefNumber}
                    onChange={(e) => setTxRefNumber(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                  Remarks (Mandatory)
                </label>
                <textarea
                  value={txRemarks}
                  onChange={(e) => setTxRemarks(e.target.value)}
                  placeholder="Explain the reason for this manual treasury transaction..."
                  className="w-full min-h-[70px] p-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="text-xs border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  className="text-xs cursor-pointer font-semibold"
                >
                  Record Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
