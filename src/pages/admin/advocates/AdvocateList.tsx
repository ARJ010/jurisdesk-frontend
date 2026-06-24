import React, { useState } from 'react';
import type { OfficePosition } from '@/types';
import { useMockDB } from '@/contexts/MockDBContext';
import { usePaymentService } from '@/hooks/usePaymentService';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RegisterWizard } from './RegisterWizard';
import { BulkImport } from './BulkImport';
import { Search, Plus, Filter, FileSpreadsheet, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdvocateList: React.FC = () => {
  const { advocates, users, officePositions, officeTerms, currentUser } = useMockDB();
  const { getAdvocateDueBalance } = usePaymentService();
  const navigate = useNavigate();

  // Dialog Toggles
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bloodFilter, setBloodFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [duesFilter, setDuesFilter] = useState('ALL');

  // Toggle Filters Panel
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique enrollment years dynamically to populate year selector
  const enrolmentYears = Array.from(
    new Set(
      advocates.map((a) => {
        const year = new Date(a.date_of_enrolment).getFullYear();
        return isNaN(year) ? null : year;
      }).filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  // Filter Advocates
  const filteredAdvocates = advocates.filter((adv) => {
    const user = users.find((u) => u.id === adv.user_id);
    const fullName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : '';
    const kawf = adv.kawf_no ? adv.kawf_no.toLowerCase() : '';
    
    // Find positions of this advocate
    const advTerms = officeTerms.filter(t => t.advocate === adv.id && t.is_current);
    const advPositionsList = advTerms
      .map(t => officePositions.find(p => p.id === t.position))
      .filter((p): p is OfficePosition => p !== undefined && p.is_active);
    const positionNamesStr = advPositionsList.map(p => p.name).join(' ').toLowerCase();

    const isUserAdmin = currentUser?.user_permissions?.includes('manage_settings');
    const internalNotesStr = (isUserAdmin && adv.internal_notes) ? adv.internal_notes.toLowerCase() : '';

    const bloodGroupStr = adv.blood_group ? adv.blood_group.toLowerCase() : '';
    const addressStr = adv.address ? adv.address.toLowerCase() : '';

    // 1. Text Search matching
    const query = searchTerm.toLowerCase();
    const matchSearch =
      fullName.includes(query) ||
      adv.enrolment_no.toLowerCase().includes(query) ||
      adv.mobile_number.includes(query) ||
      kawf.includes(query) ||
      positionNamesStr.includes(query) ||
      bloodGroupStr.includes(query) ||
      addressStr.includes(query) ||
      internalNotesStr.includes(query);

    // 2. Status Filter
    const matchStatus = statusFilter === 'ALL' || adv.status === statusFilter;

    // 3. Blood Group Filter
    const matchBlood = bloodFilter === 'ALL' || adv.blood_group === bloodFilter;

    // 4. Enrolment Year Filter
    const advYear = new Date(adv.date_of_enrolment).getFullYear().toString();
    const matchYear = yearFilter === 'ALL' || advYear === yearFilter;

    // 5. Dues Range Filter
    const balance = getAdvocateDueBalance(adv.id);
    let matchDues = true;
    if (duesFilter === 'ZERO') {
      matchDues = balance === 0;
    } else if (duesFilter === 'HAS_DUES') {
      matchDues = balance > 0;
    } else if (duesFilter === 'HIGH_ARREARS') {
      matchDues = balance > 1000;
    }

    return matchSearch && matchStatus && matchBlood && matchYear && matchDues;
  });

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setBloodFilter('ALL');
    setYearFilter('ALL');
    setDuesFilter('ALL');
    setSearchTerm('');
  };

  const isFilterActive =
    statusFilter !== 'ALL' || bloodFilter !== 'ALL' || yearFilter !== 'ALL' || duesFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Registry Title and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Advocate Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage bar member profiles, registration welfare details, and ledger balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-xs h-9 flex items-center gap-1.5 border-slate-200"
            onClick={() => setIsImportOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            Bulk Import (CSV)
          </Button>
          <Button
            variant="secondary"
            className="text-xs h-9 flex items-center gap-1.5"
            onClick={() => setIsRegisterOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Register New
          </Button>
        </div>
      </div>

      {/* Directory Table Controls */}
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-4 bg-slate-50/40">
          <div className="flex items-center justify-between gap-4">
            {/* Real-time search */}
            <div className="w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="local-search"
                type="text"
                placeholder="Search by name, enrolment no, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Clear Filters
                </button>
              )}
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                className="text-xs h-9 px-3 flex items-center gap-1.5 border-slate-200"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3.5 w-3.5" /> Filters
                {isFilterActive && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200/60 transition-all duration-300">
              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DECEASED">Deceased</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              {/* Dues Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Ledger Dues
                </label>
                <select
                  value={duesFilter}
                  onChange={(e) => setDuesFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Balances</option>
                  <option value="ZERO">Clear Balance (₹0)</option>
                  <option value="HAS_DUES">Pending Arrears (&gt; ₹0)</option>
                  <option value="HIGH_ARREARS">High Arrears (&gt; ₹1000)</option>
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Enrolment Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Years</option>
                  {enrolmentYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blood Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodFilter}
                  onChange={(e) => setBloodFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardHeader>

        {/* Directory Data Grid Table */}
        <CardContent className="p-0">
          {filteredAdvocates.length === 0 ? (
            <EmptyState
              title="No Advocates Found"
              description="Try modifying your query text or active filters."
              icon={Search}
              actionLabel={isFilterActive ? "Clear Filters" : undefined}
              onAction={isFilterActive ? handleResetFilters : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">Roll No</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Mobile</th>
                    <th className="px-6 py-3">KAWF No</th>
                    <th className="px-6 py-3">Due Balance</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdvocates.map((adv) => {
                    const user = users.find((u) => u.id === adv.user_id);
                    const name = user ? `${user.first_name} ${user.last_name}` : 'Unknown';
                    const balance = getAdvocateDueBalance(adv.id);

                    // Find positions of this advocate
                    const advTerms = officeTerms.filter(t => t.advocate === adv.id && t.is_current);
                    const advPositionsList = advTerms
                      .map(t => officePositions.find(p => p.id === t.position))
                      .filter((p): p is OfficePosition => p !== undefined && p.is_active)
                      .sort((a, b) => a.display_order - b.display_order);

                    return (
                      <tr
                        key={adv.id}
                        onClick={() => navigate(`/admin/advocates/${adv.id}`)}
                        className="hover:bg-slate-50/50 cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {adv.enrolment_no}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                          <div>{name}</div>
                          {advPositionsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {advPositionsList.map(pos => (
                                <span key={pos.id} className="inline-block bg-emerald-50 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {pos.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {adv.mobile_number}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {adv.kawf_no || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ₹{balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={adv.status === 'ACTIVE' ? 'paid' : 'unpaid'}>
                            {adv.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            className="text-[10px] h-7 px-2 font-semibold border-slate-200 flex items-center gap-0.5 justify-end ml-auto"
                            onClick={() => navigate(`/admin/advocates/${adv.id}`)}
                          >
                            Workspace <ChevronRight className="h-3 w-3" />
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

      {/* Register Wizard Overlay Modal */}
      <RegisterWizard
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* CSV Bulk Import Overlay Modal */}
      <BulkImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
};
