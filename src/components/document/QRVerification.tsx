import React from 'react';

interface QRVerificationProps {
  qrImageUrl?: string;
  verificationUrl?: string;
  cardStatus?: string;
  issueDate?: string;
}

export const QRVerification: React.FC<QRVerificationProps> = ({
  qrImageUrl,
  verificationUrl,
  cardStatus = 'ACTIVE',
  issueDate
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center p-1 border border-slate-200 rounded bg-slate-50/50 text-center select-none w-20 h-20 shrink-0"
      data-issued={issueDate}
    >
      {qrImageUrl ? (
        <img src={qrImageUrl} alt="QR Code" className="w-12 h-12 object-contain" />
      ) : (
        <div className="w-10 h-10 border border-slate-300 border-dashed rounded bg-white flex flex-col items-center justify-center relative shrink-0">
          {/* Mock QR visual lines */}
          <div className="w-8 h-8 grid grid-cols-3 gap-0.5 opacity-20">
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
            <div className="bg-slate-900 border border-white"></div>
          </div>
          {/* Status dot overlay */}
          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
            cardStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
        </div>
      )}
      <span className="text-[6px] font-bold text-slate-500 uppercase tracking-wide mt-1 leading-none">
        QR Verification
      </span>
      <span className="text-[4px] text-slate-400 mt-0.5 scale-90 leading-none block">
        (Available after backend integration)
      </span>
      {verificationUrl && (
        <span className="text-[3px] text-slate-450 mt-0.5 truncate max-w-full font-mono">
          {verificationUrl}
        </span>
      )}
    </div>
  );
};
