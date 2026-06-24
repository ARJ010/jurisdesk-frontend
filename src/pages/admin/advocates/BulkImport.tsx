import React, { useState, useRef } from 'react';
import { useMockDB } from '@/contexts/MockDBContext';
import { useAdvocateService } from '@/hooks/useAdvocateService';
import { parseCSV, generateCSVTemplate } from '@/lib/csvParser';
import type { ParsedCSVRow } from '@/lib/csvParser';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Upload, Download, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import type { Advocate } from '@/types';

interface BulkImportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditedRow {
  data: ParsedCSVRow;
  isValid: boolean;
  errors: string[];
}

export const BulkImport: React.FC<BulkImportProps> = ({ isOpen, onClose }) => {
  const { advocates } = useMockDB();
  const { registerAdvocate } = useAdvocateService();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [auditedRows, setAuditedRows] = useState<AuditedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  // Trigger download of standard template
  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hba_advocates_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run validators on parsed rows
  const auditParsedRows = (rows: ParsedCSVRow[]) => {
    const enrolmentTracker = new Set<string>();
    
    const results: AuditedRow[] = rows.map((row) => {
      const errs: string[] = [];
      const enrolment = row.enrolment_no?.trim();
      const mobile = row.mobile_number?.trim();

      // 1. Name Check
      if (!row.name?.trim()) {
        errs.push('Name is required.');
      }

      // 2. Mobile Format
      if (!mobile) {
        errs.push('Mobile number is required.');
      } else if (!/^\d{10,15}$/.test(mobile)) {
        errs.push('Mobile number must be 10-15 digits.');
      }

      // 3. Enrolment Checks
      if (!enrolment) {
        errs.push('Enrolment number is required.');
      } else {
        // Character regex
        if (!/^[\w/@./+-]+$/.test(enrolment)) {
          errs.push('Enrolment format invalid.');
        } else {
          // Check DB duplicate
          const isDbDuplicate = advocates.some(
            (a) => a.enrolment_no.toLowerCase() === enrolment.toLowerCase()
          );
          if (isDbDuplicate) {
            errs.push(`Registry duplicate (${enrolment}).`);
          }

          // Check CSV internal duplicate
          if (enrolmentTracker.has(enrolment.toLowerCase())) {
            errs.push(`CSV duplicate (${enrolment}).`);
          } else {
            enrolmentTracker.add(enrolment.toLowerCase());
          }
        }
      }

      // Dates checks
      if (!row.date_of_birth?.trim()) errs.push('DOB is required.');
      if (!row.date_of_enrolment?.trim()) errs.push('Enrolment date is required.');
      if (!row.joined_date?.trim()) errs.push('Joined date is required.');

      return {
        data: row,
        isValid: errs.length === 0,
        errors: errs,
      };
    });

    setAuditedRows(results);
  };

  // File Selector handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const parsed = parseCSV(text);
    auditParsedRows(parsed);
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      setFileName(file.name);
      const text = await file.text();
      const parsed = parseCSV(text);
      auditParsedRows(parsed);
    }
  };

  // Process Import Submission
  const handleProcessImport = () => {
    const validRows = auditedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    validRows.forEach((row) => {
      
      const advocateData: Omit<Advocate, 'id' | 'user_id'> = {
        mobile_number: row.data.mobile_number.trim(),
        enrolment_no: row.data.enrolment_no.trim(),
        kawf_no: row.data.kawf_no?.trim() || null,
        date_of_birth: row.data.date_of_birth,
        blood_group: row.data.blood_group?.trim() || 'O+',
        date_of_enrolment: row.data.date_of_enrolment,
        joined_date: row.data.joined_date,
        address: row.data.address?.trim() || 'Bar Chamber',
        picture_url: null,
        status: 'ACTIVE',
        internal_notes: null,
      };

      // Call register
      registerAdvocate(advocateData, row.data.name.trim(), row.data.email?.trim() || '');
    });

    onClose();
  };

  const handleReset = () => {
    setFileName(null);
    setAuditedRows([]);
  };

  const validCount = auditedRows.filter((r) => r.isValid).length;
  const invalidCount = auditedRows.length - validCount;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-2xl relative bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="border-b border-slate-50 flex-col items-start gap-1">
          <h2 className="text-lg font-bold font-heading text-slate-900">
            Bulk CSV Import Directory
          </h2>
          <p className="text-xs text-slate-500">
            Parse spreadsheets, review duplicate registries, and register members in bulk.
          </p>
        </CardHeader>

        <CardContent className="py-6">
          {auditedRows.length === 0 ? (
            /* Upload Dropzone view */
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">CSV Template spreadsheet</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Align columns with our standard layout schema before loading.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="text-xs h-8" onClick={handleDownloadTemplate}>
                  Download CSV
                </Button>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl py-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  dragActive ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-xs font-semibold text-slate-700">
                  Drag and drop your member CSV here
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports .csv extensions up to 2MB.
                </p>
              </div>
            </div>
          ) : (
            /* Preview validation view */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <span className="font-semibold text-slate-600 truncate max-w-xs">
                  File: {fileName}
                </span>
                <div className="flex gap-4">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> {invalidCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Grid Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="px-4 py-2">Row</th>
                        <th className="px-4 py-2">Enrolment</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Mobile</th>
                        <th className="px-4 py-2">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/50 ${
                            row.isValid ? 'bg-emerald-50/5' : 'bg-rose-50/10'
                          }`}
                        >
                          <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800">
                            {row.data.enrolment_no || '-'}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-900">
                            {row.data.name || '-'}
                          </td>
                          <td className="px-4 py-2 text-slate-500">{row.data.mobile_number || '-'}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <Badge variant="paid">Valid</Badge>
                            ) : (
                              <div className="flex flex-col gap-0.5 text-[9px] text-rose-600 font-medium">
                                {row.errors.map((e, eIdx) => (
                                  <span key={eIdx} className="flex items-center gap-0.5">
                                    <ShieldAlert className="h-3 w-3 shrink-0" /> {e}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-50 flex justify-between">
          {auditedRows.length > 0 ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Upload New File
              </Button>
              <Button
                variant="secondary"
                disabled={validCount === 0}
                onClick={handleProcessImport}
                className="font-semibold"
              >
                Import {validCount} Valid Members
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
