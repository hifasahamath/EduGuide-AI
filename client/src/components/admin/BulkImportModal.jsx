import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import {
  X, Upload, Download, CheckCircle, AlertCircle,
  FileText, Loader2, ChevronRight, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// CSV column spec — must match backend
export const CSV_HEADERS = [
  'name', 'field', 'courseType', 'university', 'level', 'duration', 'studyMode',
  'totalFee', 'registrationFee', 'installmentAvailable', 'installmentPlan',
  'eligibility', 'minimumRequirements',
  'subjects',          // pipe-separated: Programming|Database|AI
  'campusLocation', 'city', 'onlineAvailable',
  'jobOpportunities',  // pipe-separated: Software Engineer|Data Analyst
  'careerPath',
  'internshipAvailable', 'industryCertification', 'practicalTraining',
  'courseImage',
  'keywords',          // pipe-separated: IT|Software|Coding
  'tags'               // pipe-separated: popular|evening
];

const SAMPLE_ROWS = [
  [
    'BSc Software Engineering', 'IT', 'Degree', 'ESOFT Metro Campus', 'Undergraduate',
    '3 Years', 'Full-time', '250000', '5000', 'Yes', '3 installments of LKR 85000',
    'A/L pass', 'Minimum 3 passes in A/L',
    'Programming|Database|AI|Networking|Web Development',
    'No. 123, Galle Road', 'Colombo', 'No',
    'Software Engineer|Data Analyst|DevOps Engineer',
    'Junior Dev → Senior Dev → Tech Lead',
    'Yes', 'Yes', 'Yes',
    '',
    'IT|Software|Coding|Programming',
    'popular|scholarship-available'
  ],
  [
    'Diploma in Business Management', 'Business', 'Diploma', 'NIBM', 'Undergraduate',
    '1 Year', 'Part-time', '75000', '2000', 'No', '',
    'O/L pass', 'Minimum 5 passes in O/L',
    'Marketing|Finance|HR|Management',
    'No. 45, Baseline Road', 'Kandy', 'Yes',
    'Business Analyst|Marketing Manager|HR Officer',
    'Executive → Manager → Director',
    'No', 'No', 'Yes',
    '',
    'Business|Management|MBA',
    'evening'
  ]
];

// Utility: parse CSV text → array of row objects
const parseCSV = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
      else { current += ch; }
    }
    values.push(current);

    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  }).filter(row => row.name); // skip blank rows
};

// Utility: generate & download CSV template
const downloadTemplate = () => {
  const headerLine = CSV_HEADERS.join(',');
  const sampleLines = SAMPLE_ROWS.map(r =>
    r.map(v => v.includes(',') ? `"${v}"` : v).join(',')
  );
  const csv = [headerLine, ...sampleLines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eduguide_courses_template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ── Bulk Import Modal ──────────────────────────────────────
const BulkImportModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('upload'); // upload | preview | result
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        alert('No valid data found in CSV. Make sure the header row is correct.');
        return;
      }
      setRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.bulkImportCourses(rows);
      setResult(res.data);
      setStep('result');
      onSuccess();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
    }
  };

  const PREVIEW_COLS = ['name', 'field', 'courseType', 'university', 'totalFee', 'duration', 'city'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Upload size={17} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Bulk Import Courses</h3>
              <p className="text-xs text-gray-400">Upload a CSV file to import multiple courses at once</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Steps */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              {['Upload', 'Preview', 'Result'].map((s, i) => {
                const stepIdx = { upload: 0, preview: 1, result: 2 }[step];
                return (
                  <React.Fragment key={s}>
                    <span className={`px-2.5 py-1 rounded-full ${i === stepIdx ? 'bg-indigo-600 text-white' : i < stepIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{s}</span>
                    {i < 2 && <ChevronRight size={12} className="text-gray-300" />}
                  </React.Fragment>
                );
              })}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ─ Step 1: Upload ─ */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                {/* Download template */}
                <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <FileText size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-indigo-800">Start with the template</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Download the CSV template with all required columns and 2 sample rows. Fill in your data and upload below.</p>
                    <p className="text-xs text-indigo-400 mt-1">💡 Tip: Use <code className="bg-white px-1 rounded">|</code> (pipe) as separator for multi-value fields like subjects, keywords, careers.</p>
                  </div>
                  <button onClick={downloadTemplate} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                    <Download size={14} /> Download Template
                  </button>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                >
                  <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-indigo-500' : 'text-gray-300'}`} />
                  <p className={`font-semibold ${dragOver ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {dragOver ? 'Drop your CSV file here!' : 'Drag & drop your CSV file here'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="text-xs text-gray-300 mt-3">Supported format: .csv</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />

                {/* Column reference */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CSV Columns Reference</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CSV_HEADERS.map(h => (
                      <span key={h} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-mono">{h}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─ Step 2: Preview ─ */}
            {step === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{rows.length} courses ready to import</p>
                    <p className="text-xs text-gray-400">From: {fileName} · Review below, remove rows if needed, then click Import.</p>
                  </div>
                  <button onClick={() => setStep('upload')} className="text-sm text-indigo-600 hover:underline font-medium">← Back</button>
                </div>

                {/* Preview Table */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2.5 font-semibold text-gray-500 w-8">#</th>
                          {PREVIEW_COLS.map(c => (
                            <th key={c} className="px-3 py-2.5 font-semibold text-gray-500 capitalize whitespace-nowrap">{c}</th>
                          ))}
                          <th className="px-3 py-2.5 font-semibold text-gray-500">Status</th>
                          <th className="px-3 py-2.5 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const valid = !!row.name && !!row.university;
                          return (
                            <tr key={i} className={`border-b border-gray-50 last:border-0 ${!valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              {PREVIEW_COLS.map(c => (
                                <td key={c} className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{row[c] || '—'}</td>
                              ))}
                              <td className="px-3 py-2">
                                {valid
                                  ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={11} /> Ready</span>
                                  : <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} /> Missing name/uni</span>
                                }
                              </td>
                              <td className="px-3 py-2">
                                <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">{rows.filter(r => r.name && r.university).length} valid · {rows.filter(r => !r.name || !r.university).length} will be skipped</p>
                  <button
                    onClick={handleImport}
                    disabled={importing || rows.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                  >
                    {importing ? <><Loader2 size={15} className="animate-spin" /> Importing...</> : <><Upload size={15} /> Import {rows.length} Courses</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─ Step 3: Result ─ */}
            {step === 'result' && result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${result.failed === 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {result.failed === 0
                    ? <CheckCircle size={40} className="text-emerald-500" />
                    : <AlertCircle size={40} className="text-amber-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{result.message}</h3>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600">{result.success}</p>
                      <p className="text-xs text-gray-500 font-medium">Added to Database</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-500">{result.failed}</p>
                      <p className="text-xs text-gray-500 font-medium">Failed / Skipped</p>
                    </div>
                  </div>
                </div>
                {result.errors?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 text-left border border-red-100">
                    <p className="text-xs font-semibold text-red-600 mb-2">Errors:</p>
                    {result.errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
                  </div>
                )}
                <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md">
                  Done — View Courses
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkImportModal;
