import React from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import type { SignatureConfig } from '@/types';

interface OfficialDocumentProps {
  title?: string;
  documentId?: string;
  date?: string;
  place?: string;
  showFooter?: boolean;
  children: React.ReactNode;
}

export const OfficialDocument: React.FC<OfficialDocumentProps> = ({
  title,
  documentId,
  date,
  place,
  showFooter = true,
  children
}) => {
  const { settings, officePositions, officeTerms, advocates, users } = useMockDB();

  // Resolve current active office bearers sorted by display_order
  const activeTerms = officeTerms.filter((t) => t.is_current);
  const bearers = activeTerms
    .map((term) => {
      const position = officePositions.find((p) => p.id === term.position);
      const advocate = advocates.find((a) => a.id === term.advocate);
      const user = advocate ? users.find((u) => u.id === advocate.user_id) : null;
      return {
        term,
        position,
        advocate,
        user,
      };
    })
    .filter((b) => b.position && b.advocate && b.user && b.position.is_active)
    .sort((a, b) => (a.position?.display_order || 0) - (b.position?.display_order || 0));

  // Resolve signatures config (sorted by display_order, enabled only)
  const enabledSignatures = (settings.signatures || [])
    .filter((s: SignatureConfig) => s.enabled)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div 
      id="printable-document"
      className="bg-white border-8 border-double border-slate-800 p-10 relative w-[210mm] min-h-[297mm] shadow-md flex flex-col justify-between text-slate-800 font-sans print:shadow-none print:border-8 print:p-8 print:w-full print:min-h-none print:h-auto print:box-border"
    >
      {/* Background Watermark Logo */}
      {settings.watermark_url && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none z-0">
          <img src={settings.watermark_url} alt="Watermark" className="w-[120mm] h-[120mm] object-contain" />
        </div>
      )}

      {/* Top Header Section */}
      <div className="w-full pb-4 border-b-4 border-double border-slate-800 flex items-center gap-6 relative z-10">
        {settings.logo_url && (
          <div className="w-20 h-20 rounded border border-slate-200/80 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <img src={settings.logo_url} alt="Association Logo" className="max-w-full max-h-full object-contain" />
          </div>
        )}
        <div className="flex-1 space-y-1 text-center pr-20">
          <h1 className="text-2xl font-bold tracking-wide font-serif text-slate-900 uppercase">
            {settings.association_name}
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wider">
            {settings.address}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            Phone: {settings.phone} | Email: {settings.email}
            {settings.website && ` | Website: ${settings.website}`}
          </p>
        </div>
      </div>

      {/* Core Split Sidebar + Body Grid */}
      <div className="flex-1 flex gap-6 py-6 relative z-10 min-h-0">
        
        {/* Left Sidebar: Dynamic Office Bearers (Committee) */}
        <div className="w-1/4 shrink-0 pr-4 border-r border-amber-400/80 flex flex-col gap-5 text-left select-none">
          <h2 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest border-b border-amber-200 pb-1 mb-1">
            Office Bearers
          </h2>
          <div className="space-y-4 max-h-[180mm] overflow-y-auto pr-1">
            {bearers.map((b) => (
              <div key={b.term.id} className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-900 block uppercase tracking-wider font-serif">
                  {b.position?.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Adv. {b.user?.first_name} {b.user?.last_name}
                </span>
                {b.advocate?.mobile_number && (
                  <span className="text-[9px] text-slate-450 block font-mono">
                    PH: {b.advocate.mobile_number}
                  </span>
                )}
              </div>
            ))}
            {bearers.length === 0 && (
              <p className="text-[10px] text-slate-400 italic">No office bearers assigned.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Main Body Context */}
        <div className="flex-1 flex flex-col justify-between pl-2 min-w-0">
          
          {/* Metadata Block (Place, Date, ID) */}
          <div className="flex justify-between items-start text-[11px] text-slate-500 font-medium mb-4 select-none">
            <div>
              {place && <p>Place: <span className="text-slate-800 font-semibold">{place}</span></p>}
              {date && <p className="mt-0.5">Date: <span className="text-slate-800 font-semibold">{date}</span></p>}
            </div>
            {documentId && (
              <p className="font-mono text-slate-650 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 text-[10px]">
                ID: {documentId}
              </p>
            )}
          </div>

          {/* Central Title */}
          {title && (
            <h2 className="text-center text-lg font-bold tracking-widest text-slate-900 underline underline-offset-8 font-serif mb-6 uppercase">
              {title}
            </h2>
          )}

          {/* Document Children Content */}
          <div className="flex-1 flex flex-col justify-start">
            {children}
          </div>

          {/* Bottom Verification Area: Signatures & QR Section */}
          <div className="mt-8 border-t border-slate-100 pt-6 flex justify-between items-end">
            
            {/* Signature Block */}
            <div className="flex gap-8 flex-1 select-none">
              {enabledSignatures.map((sig) => (
                <div key={sig.id} className="text-center flex flex-col items-center">
                  <div className="w-28 h-8 border-b border-dotted border-slate-400 mb-1.5" />
                  <span className="font-bold text-slate-900 text-[10px] block uppercase tracking-wider font-serif">
                    {sig.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {settings.association_name}
                  </span>
                </div>
              ))}
              {enabledSignatures.length === 0 && (
                <div className="text-[10px] text-slate-400 italic">No signatures configured.</div>
              )}
            </div>

            {/* QR Code Verification Placeholder */}
            <div className="w-28 h-28 border border-dashed border-slate-300 rounded-lg p-2 flex flex-col items-center justify-center text-center shrink-0 bg-slate-50/50 select-none">
              <div className="w-14 h-14 border-2 border-slate-200 border-double flex items-center justify-center mb-1 text-slate-350">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-[7px] font-bold text-slate-400 uppercase leading-normal tracking-wide">
                QR Verification
              </span>
              <span className="text-[5px] text-slate-450 mt-0.5 scale-90 origin-top">
                (Available after backend integration)
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Details */}
      {showFooter && (
        <div className="w-full pt-3 mt-4 border-t border-slate-200 text-center text-[9px] text-slate-450 font-medium select-none z-10 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <span>{settings.association_name} Office</span>
          <span>|</span>
          <span>{settings.address}</span>
          <span>|</span>
          <span>Ph: {settings.phone}</span>
          <span>|</span>
          <span>Email: {settings.email}</span>
          {settings.website && (
            <>
              <span>|</span>
              <span>Web: {settings.website}</span>
            </>
          )}
        </div>
      )}

      {/* Global CSS resets optimized for single A4 printing page */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-document {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 20mm !important;
            border: 8px double #1e293b !important;
            box-shadow: none !important;
            background: white !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
        }
      `}} />
    </div>
  );
};
