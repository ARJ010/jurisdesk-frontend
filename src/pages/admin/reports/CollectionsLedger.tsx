import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Printer, X, FileText, ChevronRight } from 'lucide-react';
import type { PaymentTransaction, OfficePosition } from '@/types';

export const CollectionsLedger: React.FC = () => {
  const { transactions, advocates, users, paymentLines, officePositions, officeTerms, currentUser, treasuryTransactions, settings } = useMockDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'collections' | 'adjustments' | 'transfers' | 'activity'>('collections');
  
  // Selected receipt for the preview modal
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  // Derive unique Financial Years from collections and adjustments
  const derivedYears = Array.from(new Set([
    ...transactions.map(t => {
      const date = new Date(t.payment_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      return month >= 3 ? `${year}-${year+1}` : `${year-1}-${year}`;
    }),
    ...treasuryTransactions.map(tx => tx.financial_year)
  ])).sort();

  // Helper to lookup collector info
  const getCollectorName = (collectorId: string) => {
    const user = users.find((u) => u.id === collectorId);
    return user ? `${user.first_name} ${user.last_name}` : 'System';
  };

  // 1. FILTERED MEMBERSHIP COLLECTIONS
  const filteredTransactions = transactions.filter((tx) => {
    const advocate = advocates.find((a) => a.id === tx.advocate_id);
    const user = advocate ? users.find((u) => u.id === advocate.user_id) : null;
    
    const query = searchTerm.toLowerCase();
    const nameMatch = user ? `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) : false;
    const enrolmentMatch = advocate ? advocate.enrolment_no.toLowerCase().includes(query) : false;
    const receiptMatch = tx.receipt_no.toLowerCase().includes(query);
    
    const kawf = advocate && advocate.kawf_no ? advocate.kawf_no.toLowerCase() : '';
    const bloodGroupStr = advocate && advocate.blood_group ? advocate.blood_group.toLowerCase() : '';
    const addressStr = advocate && advocate.address ? advocate.address.toLowerCase() : '';

    let positionNamesStr = '';
    if (advocate) {
      const advTerms = officeTerms.filter(t => t.advocate === advocate.id && t.is_current);
      const advPositionsList = advTerms
        .map(t => officePositions.find(p => p.id === t.position))
        .filter((p): p is OfficePosition => p !== undefined && p.is_active);
      positionNamesStr = advPositionsList.map(p => p.name).join(' ').toLowerCase();
    }

    const isUserAdmin = currentUser?.user_permissions?.includes('manage_settings');
    const internalNotesStr = (isUserAdmin && advocate && advocate.internal_notes) ? advocate.internal_notes.toLowerCase() : '';

    const matchSearch =
      nameMatch ||
      enrolmentMatch ||
      receiptMatch ||
      kawf.includes(query) ||
      positionNamesStr.includes(query) ||
      bloodGroupStr.includes(query) ||
      addressStr.includes(query) ||
      internalNotesStr.includes(query);
    
    if (searchTerm && !matchSearch) return false;

    // Payment mode filter
    if (selectedMode !== 'ALL' && tx.payment_mode !== selectedMode) return false;

    // Date range filters
    const txDate = new Date(tx.payment_date);
    if (startDate && txDate < new Date(startDate)) return false;
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      if (txDate > endLimit) return false;
    }

    // Financial Year filter
    if (selectedFinancialYear !== 'ALL') {
      const year = txDate.getFullYear();
      const month = txDate.getMonth();
      const txFY = month >= 3 ? `${year}-${year+1}` : `${year-1}-${year}`;
      if (txFY !== selectedFinancialYear) return false;
    }

    return true;
  }).sort((a, b) => b.id - a.id);

  // 2. FILTERED TREASURY ADJUSTMENTS
  const filteredAdjustments = treasuryTransactions.filter((tx) => {
    if (tx.transaction_mode !== 'ADJUSTMENT') return false;

    const query = searchTerm.toLowerCase();
    const categoryMatch = tx.category.toLowerCase().includes(query);
    const remarksMatch = tx.remarks.toLowerCase().includes(query);
    const creatorMatch = tx.created_by.toLowerCase().includes(query);
    const refMatch = tx.reference_number ? tx.reference_number.toLowerCase().includes(query) : false;

    const matchSearch = categoryMatch || remarksMatch || creatorMatch || refMatch;
    if (searchTerm && !matchSearch) return false;

    // Account filter
    if (selectedMode !== 'ALL') {
      if (selectedMode === 'CASH' && tx.account !== 'CASH') return false;
      if (selectedMode === 'BANK_TRANSFER' && tx.account !== 'BANK') return false;
      if (selectedMode !== 'CASH' && selectedMode !== 'BANK_TRANSFER') return false;
    }

    // Date range filters
    const txDate = new Date(tx.transaction_date);
    if (startDate && txDate < new Date(startDate)) return false;
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      if (txDate > endLimit) return false;
    }

    // Financial Year filter
    if (selectedFinancialYear !== 'ALL' && tx.financial_year !== selectedFinancialYear) return false;

    return true;
  }).sort((a, b) => b.id.localeCompare(a.id));

  // 3. FILTERED ACCOUNT TRANSFERS
  const filteredTransfers = treasuryTransactions.filter((tx) => {
    if (tx.transaction_mode !== 'TRANSFER') return false;

    const query = searchTerm.toLowerCase();
    const categoryMatch = tx.category.toLowerCase().includes(query);
    const remarksMatch = tx.remarks.toLowerCase().includes(query);
    const creatorMatch = tx.created_by.toLowerCase().includes(query);
    const refMatch = tx.reference_number ? tx.reference_number.toLowerCase().includes(query) : false;

    const matchSearch = categoryMatch || remarksMatch || creatorMatch || refMatch;
    if (searchTerm && !matchSearch) return false;

    // Account filter
    if (selectedMode !== 'ALL') {
      if (selectedMode === 'CASH' && tx.source_account !== 'CASH' && tx.destination_account !== 'CASH') return false;
      if (selectedMode === 'BANK_TRANSFER' && tx.source_account !== 'BANK' && tx.destination_account !== 'BANK') return false;
      if (selectedMode !== 'CASH' && selectedMode !== 'BANK_TRANSFER') return false;
    }

    // Date range filters
    const txDate = new Date(tx.transaction_date);
    if (startDate && txDate < new Date(startDate)) return false;
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      if (txDate > endLimit) return false;
    }

    // Financial Year filter
    if (selectedFinancialYear !== 'ALL' && tx.financial_year !== selectedFinancialYear) return false;

    return true;
  }).sort((a, b) => b.id.localeCompare(a.id));

  // 4. CONSOLIDATED TREASURY ACTIVITY TIMELINE
  interface ActivityRow {
    id: string;
    date: string;
    activity_type: 'Collection' | 'Adjustment' | 'Transfer';
    type_detail: string;
    account_or_method: string;
    amount: number;
    operator: string;
    ref_number?: string;
    remarks: string;
    timestamp: number;
  }

  const activityRows: ActivityRow[] = [];

  // Add Collections
  transactions.forEach((t) => {
    activityRows.push({
      id: `col-${t.id}`,
      date: t.payment_date,
      activity_type: 'Collection',
      type_detail: 'Membership Receipt',
      account_or_method: t.payment_mode,
      amount: t.total_amount,
      operator: getCollectorName(t.collected_by_id),
      remarks: t.remarks || `Membership collection checkout`,
      ref_number: t.receipt_no,
      timestamp: new Date(t.payment_date).getTime(),
    });
  });

  // Add Adjustments and Transfers
  treasuryTransactions.forEach((tx) => {
    if (tx.transaction_mode === 'ADJUSTMENT') {
      activityRows.push({
        id: tx.id,
        date: `${tx.transaction_date}T${new Date(tx.created_at).toISOString().split('T')[1]}`,
        activity_type: 'Adjustment',
        type_detail: tx.adjustment_type || '',
        account_or_method: tx.account || '',
        amount: tx.amount,
        operator: tx.created_by,
        remarks: tx.remarks,
        ref_number: tx.reference_number,
        timestamp: new Date(tx.created_at).getTime(),
      });
    } else {
      activityRows.push({
        id: tx.id,
        date: `${tx.transaction_date}T${new Date(tx.created_at).toISOString().split('T')[1]}`,
        activity_type: 'Transfer',
        type_detail: `${tx.source_account} \u2192 ${tx.destination_account}`,
        account_or_method: `${tx.source_account} \u2192 ${tx.destination_account}`,
        amount: tx.amount,
        operator: tx.created_by,
        remarks: tx.remarks,
        ref_number: tx.reference_number,
        timestamp: new Date(tx.created_at).getTime(),
      });
    }
  });

  const filteredActivity = activityRows.filter((row) => {
    const query = searchTerm.toLowerCase();
    const matchSearch =
      row.activity_type.toLowerCase().includes(query) ||
      row.type_detail.toLowerCase().includes(query) ||
      row.account_or_method.toLowerCase().includes(query) ||
      row.operator.toLowerCase().includes(query) ||
      row.remarks.toLowerCase().includes(query) ||
      (row.ref_number ? row.ref_number.toLowerCase().includes(query) : false);

    if (searchTerm && !matchSearch) return false;

    // Account/Mode filter
    if (selectedMode !== 'ALL') {
      if (selectedMode === 'CASH') {
        const hasCash = row.account_or_method.includes('CASH') || row.account_or_method === 'CASH';
        if (!hasCash) return false;
      } else if (selectedMode === 'UPI') {
        if (row.account_or_method !== 'UPI') return false;
      } else if (selectedMode === 'CHEQUE') {
        if (row.account_or_method !== 'CHEQUE') return false;
      } else if (selectedMode === 'BANK_TRANSFER') {
        const hasBank = row.account_or_method.includes('BANK') || row.account_or_method === 'BANK' || row.account_or_method === 'BANK_TRANSFER';
        if (!hasBank) return false;
      }
    }

    // Date range filters
    const rowDate = new Date(row.date);
    if (startDate && rowDate < new Date(startDate)) return false;
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      if (rowDate > endLimit) return false;
    }

    // Financial Year filter
    if (selectedFinancialYear !== 'ALL') {
      const year = rowDate.getFullYear();
      const month = rowDate.getMonth();
      const rowFY = month >= 3 ? `${year}-${year+1}` : `${year-1}-${year}`;
      if (rowFY !== selectedFinancialYear) return false;
    }

    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  // Helper to lookup advocate info
  const getAdvocateInfo = (advocateId: string) => {
    const advocate = advocates.find((a) => a.id === advocateId);
    const user = advocate ? users.find((u) => u.id === advocate.user_id) : null;
    return {
      name: user ? `${user.first_name} ${user.last_name}` : 'Unknown Advocate',
      enrolment: advocate ? advocate.enrolment_no : 'N/A',
    };
  };

  // Get lines for selected receipt in modal
  const selectedReceiptLines = selectedReceipt
    ? paymentLines.filter((line) => line.transaction_id === selectedReceipt.id)
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Financial Ledger Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor and audit membership collections, manual adjustments, transfers, and complete activity history.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="text-xs flex items-center gap-1.5 h-8 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" /> Print Active Ledger
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('collections');
            setSearchTerm('');
          }}
          className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
            activeTab === 'collections'
              ? 'border-indigo-650 text-indigo-750 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Membership Collections
        </button>
        <button
          onClick={() => {
            setActiveTab('adjustments');
            setSearchTerm('');
          }}
          className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
            activeTab === 'adjustments'
              ? 'border-indigo-650 text-indigo-750 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Treasury Adjustments
        </button>
        <button
          onClick={() => {
            setActiveTab('transfers');
            setSearchTerm('');
          }}
          className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-indigo-650 text-indigo-750 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Account Transfers
        </button>
        <button
          onClick={() => {
            setActiveTab('activity');
            setSearchTerm('');
          }}
          className={`px-4 py-2 text-xs font-bold -mb-px transition-all border-b-2 cursor-pointer ${
            activeTab === 'activity'
              ? 'border-indigo-650 text-indigo-750 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Treasury Activity
        </button>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] relative w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Search Ledger
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="local-search"
                type="text"
                placeholder={
                  activeTab === 'collections'
                    ? 'Search Receipt No, Roll, Name, KAWF...'
                    : 'Search Category, Remarks, Operator, Ref No...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800 focus:border-transparent transition-all animate-none"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {activeTab === 'collections' ? 'Payment Mode' : 'Account Filter'}
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            >
              <option value="ALL">All Modes / Accounts</option>
              {(activeTab === 'collections' || activeTab === 'activity') ? (
                <>
                  <option value="CASH">Cash Drawer</option>
                  <option value="UPI">UPI Digital Drawer</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque Collection</option>
                </>
              ) : (
                <>
                  <option value="CASH">Cash Drawer</option>
                  <option value="BANK_TRANSFER">Bank Account</option>
                </>
              )}
            </select>
          </div>

          <div className="w-full lg:w-40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Financial Year
            </label>
            <select
              value={selectedFinancialYear}
              onChange={(e) => setSelectedFinancialYear(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            >
              <option value="ALL">All Years</option>
              {derivedYears.map(fy => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          <div className="w-full lg:w-40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {(searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setSelectedMode('ALL');
                setSelectedFinancialYear('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="h-10 text-xs px-4 text-rose-600 hover:bg-rose-50 w-full lg:w-auto"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {activeTab === 'collections' && (
            filteredTransactions.length === 0 ? (
              <EmptyState
                title="No Collections Found"
                description="Adjust search terms or reset filters."
                icon={FileText}
                actionLabel={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? "Clear Filters" : undefined}
                onAction={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? () => {
                  setSearchTerm('');
                  setSelectedMode('ALL');
                  setSelectedFinancialYear('ALL');
                  setStartDate('');
                  setEndDate('');
                } : undefined}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Receipt No</th>
                      <th className="px-6 py-3">Collected Date</th>
                      <th className="px-6 py-3">Advocate</th>
                      <th className="px-6 py-3">Collected By</th>
                      <th className="px-6 py-3">Payment Mode</th>
                      <th className="px-6 py-3">Total Amount</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => {
                      const advInfo = getAdvocateInfo(tx.advocate_id);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-slate-800">{tx.receipt_no}</td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {new Date(tx.payment_date).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="font-semibold text-slate-900 block">{advInfo.name}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">{advInfo.enrolment}</span>
                              {(() => {
                                const advTerms = officeTerms.filter(t => t.advocate === tx.advocate_id && t.is_current);
                                const advPositionsList = advTerms
                                  .map(t => officePositions.find(p => p.id === t.position))
                                  .filter((p): p is OfficePosition => p !== undefined && p.is_active)
                                  .sort((a, b) => a.display_order - b.display_order);
                                return advPositionsList.map(pos => (
                                  <span key={pos.id} className="inline-block bg-emerald-50 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {pos.name}
                                  </span>
                                ));
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 font-medium">
                            {getCollectorName(tx.collected_by_id)}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge variant="neutral">{tx.payment_mode}</Badge>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-955">₹{tx.total_amount.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedReceipt(tx)}
                              className="text-emerald-600 hover:underline font-semibold cursor-pointer flex items-center gap-1.5 ml-auto text-right hover:text-emerald-700 transition-colors"
                            >
                              View Receipt <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'adjustments' && (
            filteredAdjustments.length === 0 ? (
              <EmptyState
                title="No Adjustments Found"
                description="Adjust search terms or reset filters."
                icon={FileText}
                actionLabel={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? "Clear Filters" : undefined}
                onAction={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? () => {
                  setSearchTerm('');
                  setSelectedMode('ALL');
                  setSelectedFinancialYear('ALL');
                  setStartDate('');
                  setEndDate('');
                } : undefined}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Account</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Reference No</th>
                      <th className="px-6 py-3">Operator</th>
                      <th className="px-6 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                          {new Date(adj.transaction_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" className="uppercase font-bold text-[9px]">
                            {adj.account}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`font-bold ${adj.adjustment_type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-650'}`}>
                            {adj.adjustment_type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-semibold">{adj.category}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">₹{adj.amount.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono">{adj.reference_number || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-slate-650 font-medium">{adj.created_by}</td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={adj.remarks}>{adj.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'transfers' && (
            filteredTransfers.length === 0 ? (
              <EmptyState
                title="No Transfers Found"
                description="Adjust search terms or reset filters."
                icon={FileText}
                actionLabel={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? "Clear Filters" : undefined}
                onAction={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? () => {
                  setSearchTerm('');
                  setSelectedMode('ALL');
                  setSelectedFinancialYear('ALL');
                  setStartDate('');
                  setEndDate('');
                } : undefined}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Source Account</th>
                      <th className="px-6 py-3">Destination Account</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Reference No</th>
                      <th className="px-6 py-3">Operator</th>
                      <th className="px-6 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransfers.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                          {new Date(tx.transaction_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" className="uppercase font-bold text-[9px] bg-slate-100 text-slate-800">
                            {tx.source_account}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" className="uppercase font-bold text-[9px] bg-indigo-55/60 text-indigo-850">
                            {tx.destination_account}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-semibold">{tx.category}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">₹{tx.amount.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono">{tx.reference_number || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-slate-650 font-medium">{tx.created_by}</td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={tx.remarks}>{tx.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'activity' && (
            filteredActivity.length === 0 ? (
              <EmptyState
                title="No Activity Logs Found"
                description="Adjust search terms or reset filters."
                icon={FileText}
                actionLabel={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? "Clear Filters" : undefined}
                onAction={searchTerm || selectedMode !== 'ALL' || selectedFinancialYear !== 'ALL' || startDate || endDate ? () => {
                  setSearchTerm('');
                  setSelectedMode('ALL');
                  setSelectedFinancialYear('ALL');
                  setStartDate('');
                  setEndDate('');
                } : undefined}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Date &amp; Time</th>
                      <th className="px-6 py-3">Activity Type</th>
                      <th className="px-6 py-3">Account / Payment Method</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Operator</th>
                      <th className="px-6 py-3">Reference No</th>
                      <th className="px-6 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivity.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-850">
                          {new Date(row.date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`font-bold uppercase text-[10px] ${
                            row.activity_type === 'Collection' ? 'text-emerald-700 font-extrabold' :
                            row.activity_type === 'Adjustment' ? 'text-blue-700 font-extrabold' : 'text-indigo-700 font-extrabold'
                          }`}>
                            {row.activity_type}
                          </span>
                          {row.activity_type !== 'Collection' && (
                            <span className="text-[9px] text-slate-400 block font-semibold">({row.type_detail})</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" className="uppercase font-bold text-[9px]">
                            {row.account_or_method}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">₹{row.amount.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-slate-655 font-medium">{row.operator}</td>
                        <td className="px-6 py-3.5 text-slate-550 font-mono">{row.ref_number || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={row.remarks}>{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>
      </div>

      {/* Printable Receipt Voucher Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 relative flex flex-col max-h-[90vh] print:shadow-none print:border-none print:w-full print:max-w-none print:max-h-none print:static print:overflow-visible print:p-0">
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-slate-500" />
                Voucher Invoice Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="print-trigger"
                  onClick={handlePrint}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Voucher printable content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1 animate-none" id="printable-voucher">
              <div className="border border-slate-150 rounded-xl p-6 bg-slate-50/20 space-y-6">
                {/* Letterhead */}
                <div className="text-center pb-4 border-b border-slate-150">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide font-heading text-slate-955 flex items-center justify-center gap-2">
                    {settings.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="w-5 h-5 object-contain" />
                    )}
                    {settings.association_name}
                  </h2>
                  <p className="text-[10px] text-slate-450 mt-0.5">{settings.address}</p>
                  <span className="inline-block mt-3 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Official Payment Voucher
                  </span>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Receipt Number</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedReceipt.receipt_no}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Date</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {new Date(selectedReceipt.payment_date).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Advocate Roll No &amp; Name</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {getAdvocateInfo(selectedReceipt.advocate_id).name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {getAdvocateInfo(selectedReceipt.advocate_id).enrolment}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Channel</span>
                    <Badge variant="neutral" className="mt-1">{selectedReceipt.payment_mode}</Badge>
                    {selectedReceipt.transaction_ref && (
                      <span className="text-[10px] text-slate-400 block mt-1">Ref ID: {selectedReceipt.transaction_ref}</span>
                    )}
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="border-t border-slate-150 pt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itemized Payment Lines</h4>
                  <div className="space-y-1.5">
                    {selectedReceiptLines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {line.fee_component === 'SUBSCRIPTION' ? 'Monthly Dues Subscription' : 'Onam Contribution Fee'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Period: {line.month}/{line.year}</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{line.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voucher Grand Total */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs font-extrabold text-slate-955">
                  <span className="uppercase tracking-wide">Total Voucher Amount</span>
                  <span className="text-sm font-extrabold text-emerald-700">₹{selectedReceipt.total_amount.toFixed(2)}</span>
                </div>

                {/* Auditor Signature */}
                <div className="flex justify-between items-end pt-6 text-[10px] text-slate-400">
                  <div>
                    <span className="block font-medium">Collected By:</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{getCollectorName(selectedReceipt.collected_by_id)}</span>
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-b border-slate-300 mx-auto mb-1 h-8"></div>
                    <span className="block font-semibold text-slate-800">Authorized Signature</span>
                    <span className="text-[9px]">{settings.association_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable ledger for print layouts */}
      <div id="printable-ledger" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #ccc' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1a202c' }}>
            {settings.association_name}
          </h2>
          <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>{settings.address}</p>
          <span style={{ display: 'inline-block', marginTop: '12px', backgroundColor: '#1a202c', color: 'white', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '9999px' }}>
            {activeTab === 'collections' && 'Membership Collections Ledger'}
            {activeTab === 'adjustments' && 'Treasury Adjustments Ledger'}
            {activeTab === 'transfers' && 'Account Transfers Ledger'}
            {activeTab === 'activity' && 'Treasury Activity Ledger'}
          </span>
        </div>

        <div style={{ margin: '16px 0', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#4a5568' }}>
          <div>
            <strong>Report Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div>
            <strong>Financial Year:</strong> {selectedFinancialYear === 'ALL' ? 'All Years' : selectedFinancialYear}
          </div>
          <div>
            <strong>Filter Mode:</strong> {selectedMode === 'ALL' ? 'All' : selectedMode}
          </div>
          {(startDate || endDate) && (
            <div>
              <strong>Date Range:</strong> {startDate || 'Beginning'} to {endDate || 'Present'}
            </div>
          )}
        </div>

        <table style={{ width: '100%', textAlign: 'left', fontSize: '10px', borderCollapse: 'collapse', border: '1px solid #cbd5e0' }}>
          <thead>
            {activeTab === 'collections' && (
              <tr style={{ backgroundColor: '#edf2f7', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Receipt No</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Advocate</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Roll No</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Collected By</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Mode</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Amount</th>
              </tr>
            )}
            {activeTab === 'adjustments' && (
              <tr style={{ backgroundColor: '#edf2f7', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Account</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Type</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Category</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Amount</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Ref No</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Operator</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Remarks</th>
              </tr>
            )}
            {activeTab === 'transfers' && (
              <tr style={{ backgroundColor: '#edf2f7', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Source</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Destination</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Category</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Amount</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Ref No</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Operator</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Remarks</th>
              </tr>
            )}
            {activeTab === 'activity' && (
              <tr style={{ backgroundColor: '#edf2f7', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Date &amp; Time</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Activity Type</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Account / Method</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Amount</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Operator</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Reference No</th>
                <th style={{ border: '1px solid #cbd5e0', padding: '8px' }}>Remarks</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'collections' && filteredTransactions.map((tx) => {
              const advInfo = getAdvocateInfo(tx.advocate_id);
              return (
                <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>{tx.receipt_no}</td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>
                    {new Date(tx.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{advInfo.name}</td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontFamily: 'monospace' }}>{advInfo.enrolment}</td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{getCollectorName(tx.collected_by_id)}</td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{tx.payment_mode}</td>
                  <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>₹{tx.total_amount.toFixed(2)}</td>
                </tr>
              );
            })}
            {activeTab === 'adjustments' && filteredAdjustments.map((adj) => (
              <tr key={adj.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>
                  {new Date(adj.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', textTransform: 'uppercase' }}>{adj.account}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>{adj.adjustment_type}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{adj.category}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>₹{adj.amount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontFamily: 'monospace' }}>{adj.reference_number || 'N/A'}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{adj.created_by}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adj.remarks}</td>
              </tr>
            ))}
            {activeTab === 'transfers' && filteredTransfers.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>
                  {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', textTransform: 'uppercase' }}>{tx.source_account}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', textTransform: 'uppercase' }}>{tx.destination_account}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{tx.category}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>₹{tx.amount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontFamily: 'monospace' }}>{tx.reference_number || 'N/A'}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{tx.created_by}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.remarks}</td>
              </tr>
            ))}
            {activeTab === 'activity' && filteredActivity.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>
                  {new Date(row.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>{row.activity_type} ({row.type_detail})</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', textTransform: 'uppercase' }}>{row.account_or_method}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontWeight: 'bold' }}>₹{row.amount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px' }}>{row.operator}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', fontFamily: 'monospace' }}>{row.ref_number || 'N/A'}</td>
                <td style={{ border: '1px solid #cbd5e0', padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'end', marginTop: '48px', fontSize: '10px', color: '#a0aec0' }}>
          <div>
            <span>Generated By:</span>
            <span style={{ fontWeight: 'bold', color: '#2d3748', marginTop: '2px', display: 'block' }}>
              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System'}
            </span>
          </div>
          <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
            <div style={{ width: '96px', borderBottom: '1px solid #e2e8f0', margin: '0 auto 4px auto', height: '32px' }}></div>
            <span style={{ fontWeight: 'bold', color: '#2d3748', display: 'block' }}>Treasurer / Cashier Signature</span>
            <span style={{ fontSize: '9px' }}>{settings.association_name}</span>
          </div>
        </div>
      </div>

      {/* Global print styles injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background: white !important;
          }
          ${selectedReceipt ? `
            #printable-voucher {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
            }
          ` : `
            #printable-ledger {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
          `}
        }
      `}} />
    </div>
  );
};
