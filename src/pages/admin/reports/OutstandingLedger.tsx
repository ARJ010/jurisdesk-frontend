import React, { useState } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import type { OfficePosition } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, AlertTriangle, ArrowRight, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OutstandingLedger: React.FC = () => {
  const { dues, advocates, users, transactions, officePositions, officeTerms, currentUser } = useMockDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | '3' | '6' | '12'>('ALL');
  const navigate = useNavigate();

  // Calculate outstanding arrears details for all active advocates
  const arrearsList = advocates
    .filter((adv) => adv.status === 'ACTIVE')
    .map((adv) => {
      const user = users.find((u) => u.id === adv.user_id);
      const advocateDues = dues.filter((d) => d.advocate_id === adv.id && d.status === 'UNPAID');
      
      const unpaidMonths = advocateDues.length;
      const totalArrears = advocateDues.reduce((sum, d) => sum + d.total_due_amount, 0);

      // Find last payment date
      const memberReceipts = transactions.filter((t) => t.advocate_id === adv.id);
      const lastPayment = memberReceipts.length > 0
        ? new Date(Math.max(...memberReceipts.map((r) => new Date(r.payment_date).getTime())))
        : null;

      return {
        id: adv.id,
        name: user ? `${user.first_name} ${user.last_name}` : 'Unknown Advocate',
        enrolment: adv.enrolment_no,
        mobile: adv.mobile_number,
        unpaidMonths,
        totalArrears,
        lastPaymentDate: lastPayment,
      };
    })
    .filter((item) => {
      // Find the advocate profile for search criteria
      const adv = advocates.find((a) => a.id === item.id);
      if (!adv) return false;

      const kawf = adv.kawf_no ? adv.kawf_no.toLowerCase() : '';
      
      const advTerms = officeTerms.filter(t => t.advocate === adv.id && t.is_current);
      const advPositionsList = advTerms
        .map(t => officePositions.find(p => p.id === t.position))
        .filter((p): p is OfficePosition => p !== undefined && p.is_active);
      const positionNamesStr = advPositionsList.map(p => p.name).join(' ').toLowerCase();

      const isUserAdmin = currentUser?.user_permissions?.includes('manage_settings');
      const internalNotesStr = (isUserAdmin && adv.internal_notes) ? adv.internal_notes.toLowerCase() : '';

      const bloodGroupStr = adv.blood_group ? adv.blood_group.toLowerCase() : '';
      const addressStr = adv.address ? adv.address.toLowerCase() : '';

      // 1. Search term filter
      const query = searchTerm.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(query) ||
        item.enrolment.toLowerCase().includes(query) ||
        item.mobile.includes(query) ||
        kawf.includes(query) ||
        positionNamesStr.includes(query) ||
        bloodGroupStr.includes(query) ||
        addressStr.includes(query) ||
        internalNotesStr.includes(query);

      if (searchTerm && !matchSearch) return false;

      // 2. Only show advocates who actually have arrears
      if (item.unpaidMonths === 0) return false;

      // 3. Severity filter (>3, >6, >12 months)
      if (severityFilter === '3' && item.unpaidMonths <= 3) return false;
      if (severityFilter === '6' && item.unpaidMonths <= 6) return false;
      if (severityFilter === '12' && item.unpaidMonths <= 12) return false;

      return true;
    })
    .sort((a, b) => b.totalArrears - a.totalArrears); // Sort highest debtor first

  // Sum total outstanding arrears
  const totalArrearsSum = arrearsList.reduce((sum, item) => sum + item.totalArrears, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Outstanding Arrears Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze outstanding balances, age duration severity, and process prompt payment collections.
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 px-5 text-right flex flex-col justify-center">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Total Arrears Balance</span>
          <span className="text-lg font-extrabold text-rose-700 mt-0.5">₹{totalArrearsSum.toFixed(2)}</span>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Search Advocate
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="local-search"
                type="text"
                placeholder="Search Advocate Name, Roll No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800 focus:border-transparent transition-all animate-none"
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Arrears Age Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            >
              <option value="ALL">Show All Overdue Members</option>
              <option value="3">More than 3 months overdue</option>
              <option value="6">More than 6 months overdue</option>
              <option value="12">More than 12 months overdue (Critical)</option>
            </select>
          </div>

          {(searchTerm || severityFilter !== 'ALL') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('ALL');
              }}
              className="h-10 text-xs px-4 text-rose-600 hover:bg-rose-50"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Outstanding list */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {arrearsList.length === 0 ? (
            <EmptyState
              title="No Arrears Found"
              description="All members match clear outstanding status."
              icon={UserMinus}
              actionLabel={searchTerm || severityFilter !== 'ALL' ? "Clear Filters" : undefined}
              onAction={searchTerm || severityFilter !== 'ALL' ? () => {
                setSearchTerm('');
                setSeverityFilter('ALL');
              } : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">Advocate</th>
                    <th className="px-6 py-3">Mobile Number</th>
                    <th className="px-6 py-3">Last Payment Date</th>
                    <th className="px-6 py-3">Overdue Months</th>
                    <th className="px-6 py-3">Arrears Balance</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {arrearsList.map((item) => {
                    const critical = item.unpaidMonths >= 12;

                    const advTerms = officeTerms.filter(t => t.advocate === item.id && t.is_current);
                    const advPositionsList = advTerms
                      .map(t => officePositions.find(p => p.id === t.position))
                      .filter((p): p is OfficePosition => p !== undefined && p.is_active)
                      .sort((a, b) => a.display_order - b.display_order);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-slate-900 block">{item.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{item.enrolment}</span>
                            {advPositionsList.map(pos => (
                              <span key={pos.id} className="inline-block bg-emerald-50 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {pos.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-650 font-medium">
                          {item.mobile}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {item.lastPaymentDate ? (
                            item.lastPaymentDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-rose-505 font-semibold italic">Never Paid</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            critical ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {critical && <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />}
                            {item.unpaidMonths} {item.unpaidMonths === 1 ? 'Month' : 'Months'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-extrabold text-rose-600 text-sm">₹{item.totalArrears.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            variant="secondary"
                            className="text-[11px] h-8 font-bold flex items-center gap-1 ml-auto cursor-pointer"
                            onClick={() => navigate(`/admin/advocates/${item.id}?tab=checkout`)}
                          >
                            Collect Dues <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
