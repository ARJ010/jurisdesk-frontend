import React from 'react';
import type { User, Advocate, AssociationSettings } from '@/types';
import { QRVerification } from './QRVerification';
import { ShieldAlert } from 'lucide-react';

interface OfficialIdentityCardProps {
  advocate: Advocate;
  user: User;
  settings: AssociationSettings;
  isAdminPreview?: boolean;
}

export const OfficialIdentityCard: React.FC<OfficialIdentityCardProps> = ({
  advocate,
  user,
  settings,
  isAdminPreview = false,
}) => {
  // Generate stable card number using stripped enrolment number
  const cleanEnrolment = advocate.enrolment_no.replace(/[^A-Za-z0-9]/g, '');
  const cardNo = `HBA-ID-${cleanEnrolment}`;

  // Parse Town/City from Settings Address
  const town = settings.address.split(',')[1]?.trim() || 'Kanhangad';

  // Format Dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const issueDate = formatDate(advocate.joined_date);
  
  // Calculate Expiry Date
  let expiryDate = '';
  if (settings.card_validity_years && settings.card_validity_years > 0) {
    const d = new Date(advocate.joined_date);
    d.setFullYear(d.getFullYear() + settings.card_validity_years);
    // Expiry date is one day prior to anniversary
    d.setDate(d.getDate() - 1);
    expiryDate = formatDate(d.toISOString().split('T')[0]);
  }

  // Check if photograph is missing
  const hasPhoto = !!advocate.picture_url;

  // Determine theme color style
  const themeColor = settings.primary_theme_color || '#7c3aed';
  
  // Watermark text overlay for inactive members shown only in admin preview
  const showInvalidWatermark = advocate.status !== 'ACTIVE' && isAdminPreview;

  // Reusable card front component
  const CardFront: React.FC = () => (
    <div 
      className="relative w-[85.6mm] h-[53.98mm] border border-slate-350 bg-white flex flex-col justify-between overflow-hidden text-slate-800 select-none shrink-0"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Header Banner */}
      <div 
        className="w-full text-center py-1.5 px-2 flex flex-col items-center justify-center text-white relative z-10"
        style={{ backgroundColor: themeColor }}
      >
        <h2 className="text-[7.5px] font-extrabold uppercase tracking-wider font-serif">
          {settings.association_name}
        </h2>
        <p className="text-[5.5px] font-medium tracking-wide opacity-90 mt-0.5">
          {town} (PO) | {settings.phone}
        </p>
      </div>

      {/* Designation Title */}
      <div className="w-full text-center mt-1 z-10">
        <span className="text-[8px] font-black text-rose-650 uppercase tracking-widest block font-heading">
          ADVOCATE
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex gap-3 px-3 py-1.5 items-center z-10 min-h-0">
        {/* Photo Box */}
        <div className="w-[18mm] h-[22mm] border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 rounded relative shadow-sm z-10">
          {hasPhoto ? (
            <img src={advocate.picture_url!} alt="Member photograph" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-0.5 text-slate-350">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[4.5px] font-bold text-slate-400 uppercase mt-0.5 scale-90 block">
                NO PHOTO
              </span>
            </div>
          )}
        </div>

        {/* Member Meta */}
        <div className="flex-1 flex flex-col justify-center min-w-0 text-left space-y-0.5">
          <h3 className="text-[10px] font-extrabold text-slate-950 font-serif leading-tight truncate">
            {user.first_name} {user.last_name}
          </h3>
          
          <div className="text-[7.5px] space-y-0.5 text-slate-700 mt-1">
            <p>
              <span className="font-semibold text-slate-400">Enrolment No:</span>{' '}
              <span className="font-bold text-slate-900 font-mono">{advocate.enrolment_no}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-400">Enrolled Date:</span>{' '}
              <span className="font-semibold text-slate-900">{formatDate(advocate.date_of_enrolment)}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-400">Card Number:</span>{' '}
              <span className="font-mono text-slate-900 font-bold">{cardNo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Signature & Bottom Actions */}
      <div className="px-3 pb-1 border-t border-slate-100/50 flex justify-between items-end text-[5.5px] text-slate-450 z-10 select-none">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 border-b border-slate-200 border-dotted h-3 mb-0.5" />
          <span>Signature of Holder</span>
        </div>
        <div className="text-center flex flex-col items-center">
          <div className="w-16 border-b border-slate-200 border-dotted h-3 mb-0.5" />
          <span className="font-bold text-slate-800">Secretary</span>
        </div>
      </div>

      {/* Bottom Thin Accent Bar */}
      <div className="w-full h-1" style={{ backgroundColor: themeColor }} />

      {/* Invalid Watermark Overlay */}
      {showInvalidWatermark && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-50/20 backdrop-blur-[0.5px] z-20 pointer-events-none select-none">
          <span className="text-rose-600 font-black text-2xl uppercase tracking-widest opacity-25 border-4 border-rose-600 border-double px-4 py-1 rotate-[-15deg] font-sans">
            INVALID
          </span>
        </div>
      )}
    </div>
  );

  // Reusable card back component
  const CardBack: React.FC = () => (
    <div 
      className="relative w-[85.6mm] h-[53.98mm] border border-slate-350 bg-white flex flex-col justify-between overflow-hidden text-slate-800 select-none shrink-0"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background/Watermark Logo */}
      {settings.logo_url && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none z-0">
          <img src={settings.logo_url} alt="" className="w-24 h-24 object-contain" />
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex gap-3 px-3 py-2.5 z-10 min-h-0">
        
        {/* Left/Middle Details */}
        <div className="flex-1 flex flex-col justify-center text-left min-w-0 py-0.5">
          <div className="grid grid-cols-[64px_4px_1fr] gap-x-1 gap-y-1 text-[7.5px] text-slate-700 leading-snug">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Address</span>
            <span>:</span>
            <span className="font-bold text-slate-900 break-words line-clamp-2">{advocate.address}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Date of Birth</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{formatDate(advocate.date_of_birth)}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Email</span>
            <span>:</span>
            <span className="font-bold text-slate-900 break-all">{user.email}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Phone number</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{advocate.mobile_number}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Place of Practice</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{town}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Blood Group</span>
            <span>:</span>
            <span className="font-extrabold text-slate-900 font-mono">{advocate.blood_group}</span>

            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Issued Date</span>
            <span>:</span>
            <span className="font-bold text-slate-900">{issueDate}</span>

            {expiryDate && (
              <>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[6.5px]">Valid Until</span>
                <span>:</span>
                <span className="font-bold text-slate-900">{expiryDate}</span>
              </>
            )}
          </div>
        </div>

        {/* Right Verification Column */}
        <div className="w-[24mm] shrink-0 flex flex-col gap-1.5 items-center justify-center border-l border-slate-100 pl-2">
          {/* Reusable QR Verification block */}
          <QRVerification cardStatus={advocate.status} issueDate={advocate.joined_date} />

          {/* Future Digital Signature Area */}
          <div className="w-full text-center border border-slate-150 rounded bg-slate-50/30 py-0.5 px-1 flex flex-col items-center justify-center shrink-0">
            <span className="text-[4px] font-black text-slate-400 uppercase tracking-wider scale-95 origin-center leading-none">
              Digitally Verified
            </span>
            <span className="text-[3px] text-slate-350 scale-90 leading-none mt-0.5">
              (Digital Seal Reserved)
            </span>
          </div>
        </div>

      </div>

      {/* Back Bottom Contact Details Banner */}
      <div 
        className="w-full py-1 text-center text-[5.5px] text-white select-none z-10 flex items-center justify-center gap-1.5 uppercase font-semibold mt-auto"
        style={{ backgroundColor: themeColor }}
      >
        <span>{settings.association_name} Office</span>
        <span>|</span>
        <span>Ph: {settings.phone}</span>
        {settings.website && (
          <>
            <span>|</span>
            <span>Web: {settings.website}</span>
          </>
        )}
      </div>

      {/* Invalid Watermark Overlay */}
      {showInvalidWatermark && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-50/20 backdrop-blur-[0.5px] z-20 pointer-events-none select-none">
          <span className="text-rose-600 font-black text-2xl uppercase tracking-widest opacity-25 border-4 border-rose-600 border-double px-4 py-1 rotate-[-15deg] font-sans">
            INVALID
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* On-screen warnings for photographs */}
      {!hasPhoto && (
        <div className="w-full max-w-xl p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800 print:hidden select-none">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Photograph Missing:</span> The ID card will print with a silhouette placeholder. We recommend adding a member photograph in the advocate registry metadata.
          </div>
        </div>
      )}

      {/* Mode A: Card Preview (For on-screen viewing) */}
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center print:hidden border border-slate-200 bg-slate-50/50 p-6 rounded-xl shadow-inner w-full max-w-3xl">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Front</span>
          <CardFront />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Back</span>
          <CardBack />
        </div>
      </div>

      {/* Mode B: Print Layout (For browser printing on A4) */}
      <div 
        id="printable-card-layout" 
        className="hidden print:flex print:flex-row print:justify-center print:items-center print:gap-8 print:w-full print:bg-white"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Front Side with cut guide border */}
        <div className="relative border-2 border-dashed border-slate-400 p-0.5">
          <CardFront />
          {/* Visual folding/cut indicator */}
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[8px] font-extrabold text-slate-300 font-mono rotate-90 hidden">CUT</span>
        </div>

        {/* Back Side with cut guide border */}
        <div className="relative border-2 border-dashed border-slate-400 p-0.5">
          <CardBack />
        </div>
      </div>

      {/* Print Style Injector for CR80 PVC aspect ratio positioning */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide non-modal pages entirely (handled globally by index.css, just reset body here) */
          /* Show print wrapper */
          #printable-card-layout {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 20px !important;
            height: auto !important;
            margin-top: 50mm !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            background: white !important;
          }
        }
      `}} />
    </div>
  );
};
