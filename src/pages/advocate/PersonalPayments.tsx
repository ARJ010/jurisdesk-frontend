import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  CalendarCheck, 
  ShieldAlert, 
  X, 
  Printer, 
  AlertCircle
} from 'lucide-react';
import type { PaymentTransaction } from '@/types';
import { usePaymentService } from '@/hooks/usePaymentService';
import { useReportService } from '@/hooks/useReportService';
import { EmptyState } from '@/components/ui/EmptyState';

export const PersonalPayments: React.FC = () => {
  const { 
    currentUser, 
    advocates, 
    paymentLines,
    users
  } = useMockDB();

  const { getAdvocateDues } = usePaymentService();
  const { getAdvocateReceipts } = useReportService();

  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);

  const advocate = advocates.find((a) => a.user_id === currentUser?.id);
  const dues = advocate ? getAdvocateDues(advocate.id) : [];
  const receipts = advocate ? getAdvocateReceipts(advocate.id) : [];
  const unpaidDues = dues.filter((d) => d.status === 'UNPAID');

  if (!currentUser || !advocate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <AlertCircle className="h-10 w-10 text-slate-300 animate-pulse" />
        <p className="mt-2 text-xs">Advocate profile record not found. Please contact administration.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get lines for selected transaction
  const selectedTxLines = selectedTx 
    ? paymentLines.filter((l) => l.transaction_id === selectedTx.id) 
    : [];

  // Get collector name
  const getCollectorName = (collectorId: string) => {
    const collector = users.find((u) => u.id === collectorId);
    return collector ? `${collector.first_name} ${collector.last_name}` : 'Bar Association Cashier';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold font-heading text-slate-900">
          Personal Ledger & Payments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your official accounting ledger, inspect outstanding arrears, and preview or print receipt vouchers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Outstanding Arrears */}
        <Card className="lg:col-span-1 border-rose-100 bg-rose-50/10">
          <CardHeader className="border-b border-rose-50 bg-rose-50/30">
            <h2 className="text-sm font-bold font-heading text-rose-950 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Outstanding Arrears
            </h2>
          </CardHeader>
          <CardContent className="py-4">
            {unpaidDues.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                  No Outstanding Dues
                </span>
                <p className="text-xs text-slate-400 mt-3">
                  Your account ledger is completely clear.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {unpaidDues.map((due) => (
                  <div
                    key={due.id}
                    className="p-3 bg-white border border-rose-100 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        {due.month}/{due.year}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                        <span>Subscription: ₹{due.base_due_amount}</span>
                        {due.special_due_amount > 0 && (
                          <span className="block">Additional Fee: ₹{due.special_due_amount}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-rose-600">
                      ₹{due.total_due_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Receipts History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-slate-400" />
              Receipt Collections History
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {receipts.length === 0 ? (
              <EmptyState
                title="No Receipts Issued"
                description="You have no payments recorded in the digital ledger."
                icon={FileText}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Receipt No</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Payment Mode</th>
                      <th className="px-6 py-3">Total Paid</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipts.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {tx.receipt_no}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {formatDate(tx.payment_date)}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral">{tx.payment_mode}</Badge>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">
                          ₹{tx.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button 
                            onClick={() => setSelectedTx(tx)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline"
                          >
                            View Voucher
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Receipt Voucher Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:static print:overflow-visible">
            
            {/* Modal Actions Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Receipt Voucher Details</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  id="print-trigger"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Voucher
                </Button>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Pane */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:bg-white print:p-0 print:overflow-visible">
              
              {/* Receipt Voucher Sheet */}
              <div 
                id="printable-receipt"
                className="bg-white border-2 border-slate-800 p-8 w-full max-w-xl shadow-md flex flex-col justify-between text-slate-800 font-sans print:shadow-none print:border-2 print:p-4"
              >
                
                {/* Header */}
                <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                  <h2 className="text-lg font-bold tracking-wide text-slate-900">
                    HOSDURG BAR ASSOCIATION
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Court Road, Kanhangad, Kasaragod, Kerala - 671315
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Phone: +91 467 220 1234 | Email: office@hosdurgbar.org
                  </p>
                </div>

                {/* Sub-Header & Metadata */}
                <div className="py-4 space-y-4">
                  <h3 className="text-center text-xs font-bold tracking-wider text-slate-950 uppercase bg-slate-100 py-1.5 rounded">
                    OFFICIAL RECEIPTS VOUCHER
                  </h3>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Receipt No</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedTx.receipt_no}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Date & Time</span>
                      <span className="font-semibold text-slate-850">{formatDateTime(selectedTx.payment_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Member Name</span>
                      <span className="font-semibold text-slate-850">Adv. {currentUser.first_name} {currentUser.last_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Enrolment Roll No</span>
                      <span className="font-semibold text-slate-850">{advocate.enrolment_no}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-2">
                  <table className="w-full text-left text-xs border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="px-3 py-2 border-r border-slate-200">Billing Period</th>
                        <th className="px-3 py-2 border-r border-slate-200">Fee Component</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedTxLines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 border-r border-slate-200 font-medium text-slate-800">
                            {line.month}/{line.year}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-500">
                            {line.fee_component === 'SUBSCRIPTION' ? 'Monthly Subscription' : 'Onam contribution'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            ₹{line.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                        <td colSpan={2} className="px-3 py-2 text-right border-r border-slate-200 text-slate-900">Total Paid:</td>
                        <td className="px-3 py-2 text-right text-emerald-700 text-sm">₹{selectedTx.total_amount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Voucher Remarks */}
                <div className="py-3 text-[11px] space-y-1.5 border-b border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Payment Mode:</span>
                    <span className="font-semibold text-slate-800">{selectedTx.payment_mode}</span>
                  </div>
                  {selectedTx.transaction_ref && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Transaction Ref:</span>
                      <span className="font-semibold text-slate-800">{selectedTx.transaction_ref}</span>
                    </div>
                  )}
                  {selectedTx.remarks && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Remarks:</span>
                      <span className="font-semibold text-slate-800">{selectedTx.remarks}</span>
                    </div>
                  )}
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between pt-8 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block mb-4">Issued By:</span>
                    <span className="font-semibold text-slate-900 border-t border-slate-300 pt-1 block">{getCollectorName(selectedTx.collected_by_id)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block mb-4">Authorized Signature:</span>
                    <span className="font-semibold text-slate-900 border-t border-slate-300 pt-1 px-4 block">Treasurer / Cashier</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Global Print Media styles injecting */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: auto;
                margin: 20mm;
              }
              body {
                background: white !important;
              }
              #printable-receipt {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 0 !important;
                border: 2px solid #1e293b !important;
                box-shadow: none !important;
                background: white !important;
              }
            }
          `}} />
        </div>
      )}
    </div>
  );
};
