import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMockDB } from '@/contexts/MockDBContext';
import { useSettingsService } from '@/hooks/useSettingsService';
import { GROUP_PERMISSIONS } from '@/config/permissions';
import { 
  Shield, 
  Building, 
  Coins, 
  Search, 
  X,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Plus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { User, AssociationSettings, AdditionalFeeRule, OfficePosition, AdditionalFeeFrequency, AdditionalFeeAppliesTo } from '@/types';

// Human-friendly labels for permissions
const PERMISSION_METADATA: Record<string, { label: string; desc: string }> = {
  view_personal_profile: {
    label: 'View Personal Profile',
    desc: 'Access personal advocate dashboard and profile details.',
  },
  view_personal_payments: {
    label: 'Access Personal Payments',
    desc: 'Inspect personal ledger, unpaid outstanding list, and receipt history.',
  },
  download_certificate: {
    label: 'Download Certificate',
    desc: 'Generate and print Experience Certificate (locks apply).',
  },
  view_operational_dashboard: {
    label: 'View Operational Dashboard',
    desc: 'Access admin panel home page, alerts list, and activity logs.',
  },
  manage_advocates: {
    label: 'Manage Member Profiles',
    desc: 'Create, modify, suspend, or update advocate profile records.',
  },
  collect_payments: {
    label: 'Collect Payments (Checkout)',
    desc: 'Process dues checkouts and issue receipt vouchers to advocates.',
  },
  view_reports: {
    label: 'View Accounting Reports',
    desc: 'Inspect association financial ledger logs and balance statistics.',
  },
  manage_settings: {
    label: 'Manage Association Settings',
    desc: 'Configure billing parameters, general settings, and staff credentials.',
  },
};

export const SettingsPage: React.FC = () => {
  const { users } = useMockDB();
  const { 
    settings, 
    updateSettings, 
    updateUser,
    officePositions,
    additionalFeeRules,
    addPos,
    updatePos,
    deletePos,
    reorderPos,
    addFee,
    updateFee,
    deleteFee
  } = useSettingsService();

  // Redesigned Tab Selection: 'general' | 'financial' | 'positions' | 'staff'
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'positions' | 'staff'>(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    if (queryTab && ['general', 'financial', 'positions', 'staff'].includes(queryTab)) {
      return queryTab as any;
    }
    return 'general';
  });

  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    if (queryTab && ['general', 'financial', 'positions', 'staff'].includes(queryTab)) {
      setActiveTab(queryTab as any);
    }
  }, [window.location.search]);

  // Success Notification banner state
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // General Settings Form States
  const [assocName, setAssocName] = useState('');
  const [assocAddress, setAssocAddress] = useState('');
  const [assocPhone, setAssocPhone] = useState('');
  const [assocEmail, setAssocEmail] = useState('');
  const [assocLogo, setAssocLogo] = useState('');

  // Financial Settings Form States (Monthly base dues)
  const [subFee, setSubFee] = useState(0);
  const [accountingStart, setAccountingStart] = useState('2024-01-01');

  // Staff & Permissions States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal Edit States for Staff
  const [userIsActive, setUserIsActive] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<('Advocate' | 'Office Staff' | 'Admin Advocate')[]>([]);
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([]);

  // Special Fees Modals/Forms States
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<AdditionalFeeRule | null>(null);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState(0);
  const [feeFrequency, setFeeFrequency] = useState<AdditionalFeeFrequency>('YEARLY');
  const [feeMonth, setFeeMonth] = useState<string>('09');
  const [feeAppliesTo, setFeeAppliesTo] = useState<AdditionalFeeAppliesTo>('ALL_ACTIVE_MEMBERS');
  const [feeEffectiveFrom, setFeeEffectiveFrom] = useState('2024-01-01');
  const [feeEffectiveUntil, setFeeEffectiveUntil] = useState('');
  const [feeMandatory, setFeeMandatory] = useState(true);
  const [feeActive, setFeeActive] = useState(true);
  const [feeDescription, setFeeDescription] = useState('');

  // Office Positions Modals/Forms States
  const [showPosModal, setShowPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<OfficePosition | null>(null);
  const [posName, setPosName] = useState('');
  const [posDesc, setPosDesc] = useState('');
  const [posActive, setPosActive] = useState(true);

  // Initialize form fields when settings load
  useEffect(() => {
    if (settings) {
      setAssocName(settings.association_name || '');
      setAssocAddress(settings.address || '');
      setAssocPhone(settings.phone || '');
      setAssocEmail(settings.email || '');
      setAssocLogo(settings.logo_url || '');

      setSubFee(settings.monthly_subscription_fee || 0);
      setAccountingStart(settings.accounting_start_date || '2024-01-01');
    }
  }, [settings]);

  const showToast = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4000);
  };

  // Submit General Settings
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: AssociationSettings = {
      ...settings,
      association_name: assocName,
      address: assocAddress,
      phone: assocPhone,
      email: assocEmail,
      logo_url: assocLogo || null,
    };
    updateSettings(newSettings);
    showToast('General configuration updated successfully.');
  };

  // Submit Base Financial settings (Base Monthly sub)
  const handleSaveBaseFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: AssociationSettings = {
      ...settings,
      monthly_subscription_fee: Number(subFee),
      accounting_start_date: accountingStart,
    };
    updateSettings(newSettings);
    showToast('Base Monthly Subscription fee updated successfully.');
  };

  // Handle Special Fee Save
  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    const feeData = {
      name: feeName,
      amount: Number(feeAmount),
      frequency: feeFrequency,
      month: feeFrequency === 'YEARLY' ? feeMonth : null,
      applies_to: feeAppliesTo,
      effective_from: feeEffectiveFrom,
      effective_until: feeEffectiveUntil || null,
      mandatory: feeMandatory,
      active: feeActive,
      description: feeDescription,
    };

    if (editingFee) {
      updateFee(editingFee.id, feeData);
      showToast(`Additional fee rule "${feeName}" updated successfully.`);
    } else {
      addFee(feeData);
      showToast(`Additional fee rule "${feeName}" created successfully.`);
    }

    setShowFeeModal(false);
    setEditingFee(null);
  };

  const openAddFeeModal = () => {
    setEditingFee(null);
    setFeeName('');
    setFeeAmount(0);
    setFeeFrequency('YEARLY');
    setFeeMonth('09');
    setFeeAppliesTo('ALL_ACTIVE_MEMBERS');
    setFeeEffectiveFrom('2024-01-01');
    setFeeEffectiveUntil('');
    setFeeMandatory(true);
    setFeeActive(true);
    setFeeDescription('');
    setShowFeeModal(true);
  };

  const openEditFeeModal = (fee: AdditionalFeeRule) => {
    setEditingFee(fee);
    setFeeName(fee.name);
    setFeeAmount(fee.amount);
    setFeeFrequency(fee.frequency);
    setFeeMonth(fee.month || '09');
    setFeeAppliesTo(fee.applies_to);
    setFeeEffectiveFrom(fee.effective_from);
    setFeeEffectiveUntil(fee.effective_until || '');
    setFeeMandatory(fee.mandatory);
    setFeeActive(fee.active);
    setFeeDescription(fee.description);
    setShowFeeModal(true);
  };

  // Handle Position Save
  const handleSavePos = (e: React.FormEvent) => {
    e.preventDefault();
    const posData = {
      name: posName,
      description: posDesc,
      is_active: posActive,
    };

    if (editingPos) {
      updatePos(editingPos.id, posData);
      showToast(`Position "${posName}" updated successfully.`);
    } else {
      addPos({
        ...posData,
        display_order: officePositions.length + 1
      });
      showToast(`Position "${posName}" created successfully.`);
    }

    setShowPosModal(false);
    setEditingPos(null);
  };

  const openAddPosModal = () => {
    setEditingPos(null);
    setPosName('');
    setPosDesc('');
    setPosActive(true);
    setShowPosModal(true);
  };

  const openEditPosModal = (pos: OfficePosition) => {
    setEditingPos(pos);
    setPosName(pos.name);
    setPosDesc(pos.description);
    setPosActive(pos.is_active);
    setShowPosModal(true);
  };

  // Move Position display_order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const sorted = [...officePositions].sort((a, b) => a.display_order - b.display_order);
    const newIds = sorted.map(p => p.id);
    const temp = newIds[index];
    newIds[index] = newIds[index - 1];
    newIds[index - 1] = temp;
    reorderPos(newIds);
  };

  const handleMoveDown = (index: number) => {
    const sorted = [...officePositions].sort((a, b) => a.display_order - b.display_order);
    if (index === sorted.length - 1) return;
    const newIds = sorted.map(p => p.id);
    const temp = newIds[index];
    newIds[index] = newIds[index + 1];
    newIds[index + 1] = temp;
    reorderPos(newIds);
  };

  // Open Privileges Modal
  const openManagePrivileges = (user: User) => {
    setSelectedUser(user);
    setUserIsActive(user.is_active);
    setSelectedGroups(user.groups);
    
    if (user.additional_permissions) {
      setSelectedAdditional(user.additional_permissions);
    } else {
      const groupPerms = new Set<string>();
      user.groups.forEach((g) => {
        const perms = GROUP_PERMISSIONS[g] || [];
        perms.forEach((p) => groupPerms.add(p));
      });
      const overrides = user.user_permissions.filter((p) => !groupPerms.has(p));
      setSelectedAdditional(overrides);
    }
  };

  // Save User Privileges
  const handleSaveUserPrivileges = () => {
    if (!selectedUser) return;
    updateUser(selectedUser.id, {
      is_active: userIsActive,
      groups: selectedGroups,
      additional_permissions: selectedAdditional,
    });
    setSelectedUser(null);
    showToast(`Account privileges updated for ${selectedUser.first_name} ${selectedUser.last_name}.`);
  };

  // Compute live Effective Permissions based on current Modal selections
  const getLiveEffectivePermissions = () => {
    const liveEffective = new Set<string>();
    selectedGroups.forEach((g) => {
      const perms = GROUP_PERMISSIONS[g] || [];
      perms.forEach((p) => liveEffective.add(p));
    });
    selectedAdditional.forEach((p) => liveEffective.add(p));
    return Array.from(liveEffective);
  };

  const liveEffectiveList = getLiveEffectivePermissions();

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const allSystemPermissions = Object.keys(PERMISSION_METADATA);

  const sortedPositions = [...officePositions].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            System Settings & Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure bar metadata credentials, financial subscription schedules, and manage staff access.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-800">{saveSuccess}</span>
        </div>
      )}

      {/* Four-Tabged Navigation header */}
      <div className="flex border-b border-slate-200 flex-wrap">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 font-sans font-semibold text-xs tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building className="h-4 w-4" />
          General Association
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 font-sans font-semibold text-xs tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'financial'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coins className="h-4 w-4" />
          Financial Rules & Special Fees
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2.5 font-sans font-semibold text-xs tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'positions'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Office Positions
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 font-sans font-semibold text-xs tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="h-4 w-4" />
          Staff & Permissions
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        
        {/* Tab 1: General Association Configs */}
        {activeTab === 'general' && (
          <Card className="border-slate-100 max-w-3xl">
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                Association Profile Settings
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Association Name</label>
                    <input
                      type="text"
                      value={assocName}
                      onChange={(e) => setAssocName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Contact Phone Number</label>
                    <input
                      type="text"
                      value={assocPhone}
                      onChange={(e) => setAssocPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Physical Address</label>
                  <input
                    type="text"
                    value={assocAddress}
                    onChange={(e) => setAssocAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Official Support Email</label>
                    <input
                      type="email"
                      value={assocEmail}
                      onChange={(e) => setAssocEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Logo URL (Optional)</label>
                    <input
                      type="text"
                      value={assocLogo}
                      onChange={(e) => setAssocLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="text-xs font-semibold">
                    Save General Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Financial Rules & Special Fees */}
        {activeTab === 'financial' && (
          <div className="space-y-6 max-w-4xl">
            {/* Base Dues Settings */}
            <Card className="border-slate-100">
              <CardHeader>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-slate-400" />
                  Base Subscription Configuration
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBaseFinancial} className="space-y-4 text-xs">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3.5 flex gap-2.5 text-amber-800 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <p>
                      <strong>Accounting Integrity Rule:</strong> Modifying base monthly subscription fee affects only newly onboarding advocate records or future billing periods. Historical dues will <strong>never</strong> be recalculated retroactively.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Base Monthly Subscription Fee (₹)</label>
                      <input
                        type="number"
                        value={subFee}
                        onChange={(e) => setSubFee(Number(e.target.value))}
                        required
                        min={0}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Baseline Accounting Start Date</label>
                      <input
                        type="date"
                        value={accountingStart}
                        onChange={(e) => setAccountingStart(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" className="text-xs font-semibold">
                      Save Base Configurations
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Special Fees CRUD */}
            <Card className="border-slate-100">
              <CardHeader className="flex justify-between items-center flex-row">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-slate-400" />
                  Additional Fee Rules & Contribution Fees
                </h2>
                <Button 
                  onClick={openAddFeeModal}
                  className="text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Additional Fee Rule
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-6 py-3">Fee Name</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Schedule</th>
                        <th className="px-6 py-3">Applies To</th>
                        <th className="px-6 py-3">Active</th>
                        <th className="px-6 py-3">Mandatory</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {additionalFeeRules.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                            No additional fee rules configured.
                          </td>
                        </tr>
                      ) : (
                        additionalFeeRules.map((fee) => (
                          <tr key={fee.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-semibold text-slate-800">
                              <div>{fee.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">{fee.description}</div>
                            </td>
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700">
                              ₹{fee.amount}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500">
                              <Badge variant="neutral" className="uppercase font-semibold">
                                {fee.frequency} {fee.frequency === 'YEARLY' && fee.month ? `(Month ${fee.month})` : ''}
                              </Badge>
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              {fee.applies_to === 'ALL_ACTIVE_MEMBERS' ? 'All Members' : 
                               fee.applies_to === 'NEW_MEMBERS' ? 'New Members Only' : 'Custom'}
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge variant={fee.active ? 'paid' : 'unpaid'}>
                                {fee.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge variant={fee.mandatory ? 'neutral' : 'unpaid'}>
                                {fee.mandatory ? 'Mandatory' : 'Optional'}
                              </Badge>
                            </td>
                            <td className="px-6 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => openEditFeeModal(fee)}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete additional fee rule "${fee.name}"?`)) {
                                    deleteFee(fee.id);
                                    showToast(`Additional fee rule "${fee.name}" deleted.`);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Office Positions */}
        {activeTab === 'positions' && (
          <Card className="border-slate-100 max-w-4xl">
            <CardHeader className="flex justify-between items-center flex-row">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Office Positions Configuration
                </h2>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                  Manage administrative and committee positions. Use the Arrow keys to arrange display order hierarchy.
                </p>
              </div>
              <Button 
                onClick={openAddPosModal}
                className="text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Position
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3">Position Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPositions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                          No office positions configured.
                        </td>
                      </tr>
                    ) : (
                      sortedPositions.map((pos, idx) => (
                        <tr key={pos.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-bold text-slate-500 font-mono">
                            {pos.display_order}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-800">
                            {pos.name}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {pos.description}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge variant={pos.is_active ? 'paid' : 'unpaid'}>
                              {pos.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer inline-block p-1"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === sortedPositions.length - 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer inline-block p-1"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEditPosModal(pos)}
                              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete position "${pos.name}"?`)) {
                                  deletePos(pos.id);
                                  showToast(`Position "${pos.name}" deleted.`);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Staff & Permissions Control */}
        {activeTab === 'staff' && (
          <Card className="border-slate-100">
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Staff Authorization Controls
                </h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="local-search"
                  type="text"
                  placeholder="Search user name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">User Name</th>
                      <th className="px-6 py-3">Username / Roll</th>
                      <th className="px-6 py-3">Assigned Groups</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-800">
                            {u.first_name} {u.last_name}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono">
                            {u.username}
                          </td>
                          <td className="px-6 py-3.5 space-x-1">
                            {u.groups.map((group) => (
                              <Badge key={group} variant={group === 'Admin Advocate' ? 'paid' : 'neutral'}>
                                {group}
                              </Badge>
                            ))}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge variant={u.is_active ? 'paid' : 'unpaid'}>
                              {u.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => openManagePrivileges(u)}
                              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline"
                            >
                              Manage Privileges
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Special Fee Add/Edit Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800 text-sm">
                {editingFee ? 'Edit Additional Fee Rule' : 'Create Additional Fee Rule'}
              </span>
              <button onClick={() => setShowFeeModal(false)} className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFee} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Fee Name</label>
                <input
                  type="text"
                  required
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="e.g. Onam Contribution, Building Fund"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Billing Schedule</label>
                  <select
                    value={feeFrequency}
                    onChange={(e) => setFeeFrequency(e.target.value as AdditionalFeeFrequency)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  >
                    <option value="YEARLY">Yearly Recurring</option>
                    <option value="MONTHLY">Monthly Recurring</option>
                    <option value="QUARTERLY">Quarterly Recurring</option>
                    <option value="ONE_TIME">One-Time Dues</option>
                    <option value="MANUAL">Manual/Ad-hoc Billing</option>
                  </select>
                </div>
              </div>

              {feeFrequency === 'YEARLY' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Billing Month (Yearly only)</label>
                  <select
                    value={feeMonth}
                    onChange={(e) => setFeeMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Applies To</label>
                  <select
                    value={feeAppliesTo}
                    onChange={(e) => setFeeAppliesTo(e.target.value as AdditionalFeeAppliesTo)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  >
                    <option value="ALL_ACTIVE_MEMBERS">All Active Members</option>
                    <option value="NEW_MEMBERS">New Members Only</option>
                    <option value="CUSTOM">Custom Select (Ad-hoc)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Effective From</label>
                  <input
                    type="date"
                    required
                    value={feeEffectiveFrom}
                    onChange={(e) => setFeeEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Effective Until (Optional)</label>
                  <input
                    type="date"
                    value={feeEffectiveUntil}
                    onChange={(e) => setFeeEffectiveUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1 flex items-center justify-around pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeMandatory}
                      onChange={(e) => setFeeMandatory(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Mandatory Fee</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeActive}
                      onChange={(e) => setFeeActive(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active Status</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Fee Description</label>
                <textarea
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowFeeModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Fee Structure
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Position Add/Edit Modal */}
      {showPosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800 text-sm">
                {editingPos ? 'Edit Office Position' : 'Create Office Position'}
              </span>
              <button onClick={() => setShowPosModal(false)} className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSavePos} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Position Name</label>
                <input
                  type="text"
                  required
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                  placeholder="e.g. Executive Committee Member, President"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Description</label>
                <textarea
                  value={posDesc}
                  onChange={(e) => setPosDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1 flex items-center pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={posActive}
                    onChange={(e) => setPosActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active Status</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowPosModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Position
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Privileges Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">
                  Manage Privileges: {selectedUser.first_name} {selectedUser.last_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
              
              {/* Account Status Toggle */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">Account Access Status</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toggle to enable or temporarily suspend login access for this account.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userIsActive}
                    onChange={(e) => setUserIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    {userIsActive ? 'Active' : 'Suspended'}
                  </span>
                </label>
              </div>

              {/* Group Assignment Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Assigned Groups (Django Role Classes)</h4>
                <p className="text-[10px] text-slate-400">Users inherit default permissions assigned to groups.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Advocate', 'Office Staff', 'Admin Advocate'].map((group) => {
                    const typedGroup = group as 'Advocate' | 'Office Staff' | 'Admin Advocate';
                    const isChecked = selectedGroups.includes(typedGroup);
                    return (
                      <label 
                        key={group} 
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 font-medium' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedGroups(selectedGroups.filter((g) => g !== typedGroup));
                            } else {
                              setSelectedGroups([...selectedGroups, typedGroup]);
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="block">{group}</span>
                          <span className="text-[9px] text-slate-400 font-normal mt-0.5 block leading-normal">
                            {group === 'Advocate' && 'Standard bar advocate credentials.'}
                            {group === 'Office Staff' && 'Register members and checkout payments.'}
                            {group === 'Admin Advocate' && 'Access dashboard, reporting, and settings.'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Additional Direct Permissions Grid */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Additional Permissions (Direct Overrides)</h4>
                <p className="text-[10px] text-slate-400">Explicitly assign specific privileges as direct overrides to this user account.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allSystemPermissions.map((perm) => {
                    const isChecked = selectedAdditional.includes(perm);
                    const isInherited = selectedGroups.some((g) => {
                      const perms = GROUP_PERMISSIONS[g] || [];
                      return perms.includes(perm);
                    });

                    return (
                      <div 
                        key={perm} 
                        className={`p-3 rounded-lg border flex gap-3 transition-all ${
                          isInherited 
                            ? 'bg-slate-50 border-slate-100 opacity-80'
                            : isChecked
                            ? 'bg-emerald-50/20 border-emerald-100 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || isInherited}
                          disabled={isInherited}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedAdditional(selectedAdditional.filter((p) => p !== perm));
                            } else {
                              setSelectedAdditional([...selectedAdditional, perm]);
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <div>
                          <span className="font-semibold block flex items-center gap-1.5">
                            {PERMISSION_METADATA[perm]?.label}
                            {isInherited && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-normal px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Inherited
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-normal">
                            {PERMISSION_METADATA[perm]?.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Permissions (Union View) */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Effective Permissions (Evaluated Union)</h4>
                <p className="text-[10px] text-slate-400">The total computed set of privileges resulting from the union of Django Groups and direct overrides.</p>
                
                <div className="flex flex-wrap gap-1.5">
                  {liveEffectiveList.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px]">No effective permissions assigned. User will lock out.</span>
                  ) : (
                    liveEffectiveList.map((perm) => (
                      <span 
                        key={perm} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-mono text-[9px] font-semibold border border-slate-200"
                      >
                        {perm}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUserPrivileges}
                className="text-xs font-semibold"
              >
                Save Privileges
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
