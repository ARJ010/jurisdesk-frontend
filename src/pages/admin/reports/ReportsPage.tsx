import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useMockDB } from '@/contexts/MockDBContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Coins } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { transactions } = useMockDB();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-slate-900">
          Financial Reports Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review overall receipt collection vouchers, transaction receipts, and pending arrears logs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-600" />
              Receipt Collections Ledger
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <EmptyState
                title="No Transactions"
                description="No payment collections recorded on the system."
                icon={FileText}
              />
            ) : (
              <div className="table-responsive">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Receipt No</th>
                      <th className="px-6 py-3">Collected Date</th>
                      <th className="px-6 py-3">Payment Mode</th>
                      <th className="px-6 py-3">Total Amount</th>
                      <th className="px-6 py-3 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {tx.receipt_no}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {new Date(tx.payment_date).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral">{tx.payment_mode}</Badge>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-950">
                          ₹{tx.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-500 italic">
                          {tx.remarks}
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
  );
};
