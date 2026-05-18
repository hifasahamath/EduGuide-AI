import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BulkImportModal from '../../components/admin/BulkImportModal';
import {
  Edit2, Trash2, Plus, Search, BookOpen, X, Clock, Building2,
  DollarSign, RefreshCw, GraduationCap, MapPin, Briefcase, Tag,
  ChevronDown, ChevronUp, Upload, TrendingUp, AlertTriangle, Filter, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_COLORS = {
  IT: 'bg-blue-100 text-blue-700', Business: 'bg-emerald-100 text-emerald-700',
  Engineering: 'bg-orange-100 text-orange-700', Medicine: 'bg-red-100 text-red-700',
  Law: 'bg-purple-100 text-purple-700', Arts: 'bg-pink-100 text-pink-700',
};

const EMPTY_FORM = {
  name: '', field: '', courseType: 'Degree', university: '', level: 'Undergraduate',
  duration: '', studyMode: 'Full-time', totalFee: '', registrationFee: '',
  installmentAvailable: 'No', installmentPlan: '', eligibility: '', minimumRequirements: '',
  subjects: '', campusLocation: '', city: '', onlineAvailable: 'No',
  jobOpportunities: '', careerPath: '', internshipAvailable: 'No',
  industryCertification: 'No', practicalTraining: 'No',
  courseImage: '', keywords: '', tags: ''
};

// ── Field helpers ──────────────────────────────────────────
const SectionHeader = ({ icon, title, color = 'text-indigo-600' }) => (
  <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 ${color}`}>
    {icon}
    <span className="font-bold text-sm uppercase tracking-wider">{title}</span>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all';
const selectCls = inputCls + ' appearance-none';

// ── Missing data check ────────────────────────────────────────────────────────
const getMissing = (c) => {
  const fields = [];
  if (!c.totalFee) fields.push('Fee');
  if (!c.duration) fields.push('Duration');
  if (!c.eligibility) fields.push('Eligibility');
  if (!c.keywords?.length && !c.keywords) fields.push('Keywords');
  if (!c.jobOpportunities?.length && !c.jobOpportunities) fields.push('Career Info');
  return fields;
};

// ── Course Card ────────────────────────────────────────────────────────────────
const CourseCard = ({ course, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const fieldStyle = FIELD_COLORS[course.field] || 'bg-gray-100 text-gray-700';
  const missing = getMissing(course);
  const isPopular = (course.searchCount || 0) >= 10 || (course.recommendationScore || 0) >= 7;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${
        missing.length > 0 ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />
      {course.courseImage && (
        <img src={course.courseImage} alt={course.name} className="w-full h-32 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${fieldStyle}`}>{course.field || 'General'}</span>
              {course.courseType && <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">{course.courseType}</span>}
              {course.level && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{course.level}</span>}
              {isPopular && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">
                  <Star size={8} fill="currentColor"/>Popular
                </span>
              )}
              {missing.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  <AlertTriangle size={8}/>Missing: {missing[0]}{missing.length > 1 ? ` +${missing.length-1}` : ''}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{course.name}</h3>
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
            <button onClick={() => onEdit(course)} className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center"><Edit2 size={13} /></button>
            <button onClick={() => onDelete(course.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"><Trash2 size={13} /></button>
          </div>
        </div>

        <div className="space-y-1.5">
          {course.university && <div className="flex items-center gap-2 text-xs text-gray-500"><Building2 size={12} className="text-gray-400" />{course.university}</div>}
          <div className="flex items-center gap-4">
            {course.totalFee && <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><DollarSign size={12} className="text-emerald-500" />LKR {Number(course.totalFee).toLocaleString()}</div>}
            {course.duration && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock size={12} className="text-gray-400" />{course.duration}</div>}
          </div>
          {course.city && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={12} className="text-gray-400" />{course.city}</div>}
        </div>

        <button onClick={() => setExpanded(!expanded)} className="mt-3 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          {expanded ? <><ChevronUp size={13} /> Less details</> : <><ChevronDown size={13} /> More details</>}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-4 text-xs">

            {/* Duration & Mode */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Duration & Level</p>
              <div className="grid grid-cols-3 gap-2">
                {course.studyMode && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400 text-[10px]">Mode</p><p className="font-semibold text-gray-700">{course.studyMode}</p></div>}
                {course.level && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400 text-[10px]">Level</p><p className="font-semibold text-gray-700">{course.level}</p></div>}
                {course.duration && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400 text-[10px]">Duration</p><p className="font-semibold text-gray-700">{course.duration}</p></div>}
              </div>
            </div>

            {/* Fees */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fees</p>
              <div className="grid grid-cols-2 gap-2">
                {course.totalFee && <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100"><p className="text-emerald-500 text-[10px]">Total Fee</p><p className="font-bold text-emerald-700">LKR {Number(course.totalFee).toLocaleString()}</p></div>}
                {course.registrationFee && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400 text-[10px]">Registration Fee</p><p className="font-semibold text-gray-700">LKR {Number(course.registrationFee).toLocaleString()}</p></div>}
              </div>
              {course.installmentAvailable === 'Yes' && (
                <div className="mt-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <p className="text-amber-500 text-[10px] font-semibold">Installment Plan</p>
                  <p className="text-gray-700 font-medium">{course.installmentPlan || 'Available'}</p>
                </div>
              )}
            </div>

            {/* Eligibility */}
            {(course.eligibility || course.minimumRequirements) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Eligibility</p>
                <div className="bg-violet-50 rounded-lg p-2 border border-violet-100 space-y-1">
                  {course.eligibility && <p className="text-gray-700"><span className="font-semibold text-violet-700">Required: </span>{course.eligibility}</p>}
                  {course.minimumRequirements && <p className="text-gray-600"><span className="font-semibold">Min Requirements: </span>{course.minimumRequirements}</p>}
                </div>
              </div>
            )}

            {/* Subjects */}
            {course.subjects && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Subjects / Modules</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(course.subjects) ? course.subjects : course.subjects.split('|')).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium border border-indigo-100">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {(course.campusLocation || course.city) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Location</p>
                <div className="bg-gray-50 rounded-lg p-2 space-y-0.5">
                  {course.campusLocation && <p className="text-gray-600"><span className="font-semibold">Address: </span>{course.campusLocation}</p>}
                  {course.city && <p className="text-gray-600"><span className="font-semibold">City: </span>{course.city}</p>}
                  {course.onlineAvailable === 'Yes' && <p className="text-blue-600 font-semibold">🌐 Online Available</p>}
                </div>
              </div>
            )}

            {/* Career */}
            {(course.jobOpportunities || course.careerPath) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Career Outcomes</p>
                {course.jobOpportunities && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(Array.isArray(course.jobOpportunities) ? course.jobOpportunities : course.jobOpportunities.split('|')).map((j, i) => (
                      <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium border border-teal-100">💼 {j.trim()}</span>
                    ))}
                  </div>
                )}
                {course.careerPath && <p className="text-gray-600 bg-gray-50 rounded-lg p-2"><span className="font-semibold">Path: </span>{course.careerPath}</p>}
              </div>
            )}

            {/* Features */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Additional Features</p>
              <div className="flex flex-wrap gap-1.5">
                {course.internshipAvailable === 'Yes' && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100">🎓 Internship</span>}
                {course.industryCertification === 'Yes' && <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full font-semibold border border-violet-100">🏆 Industry Cert</span>}
                {course.practicalTraining === 'Yes' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-100">🔧 Practical Training</span>}
                {course.onlineAvailable === 'Yes' && <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full font-semibold border border-orange-100">🌐 Online</span>}
                {course.installmentAvailable === 'Yes' && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-100">💳 Installments</span>}
              </div>
            </div>

            {/* Keywords & Tags */}
            {(course.keywords?.length > 0 || course.tags?.length > 0) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Keywords & Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(course.keywords) ? course.keywords : (course.keywords || '').split('|')).filter(Boolean).map((k, i) => (
                    <span key={`k-${i}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono">#{k.trim()}</span>
                  ))}
                  {(Array.isArray(course.tags) ? course.tags : (course.tags || '').split('|')).filter(Boolean).map((t, i) => (
                    <span key={`t-${i}`} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-400 rounded text-[10px]">🏷 {t.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Full Course Modal ───────────────────────────────────────
const CourseModal = ({ editingId, formData, setFormData, onSave, onClose }) => {
  const set = (key, val) => setFormData(d => ({ ...d, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Course' : 'Add New Course'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSave} className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          <div className="space-y-8">

            {/* 1. Basic Details */}
            <div>
              <SectionHeader icon={<BookOpen size={16} />} title="Basic Details" />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Field label="Course Name *"><input required placeholder="e.g. BSc Software Engineering" value={formData.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field></div>
                <Field label="Field *"><input required placeholder="e.g. IT, Business, Engineering" value={formData.field} onChange={e => set('field', e.target.value)} className={inputCls} /></Field>
                <Field label="Course Type"><select value={formData.courseType} onChange={e => set('courseType', e.target.value)} className={selectCls}>{['Degree','Diploma','Certificate','HND','Masters','PhD'].map(o => <option key={o}>{o}</option>)}</select></Field>
                <div className="col-span-2"><Field label="University / Institute *"><input required placeholder="e.g. ESOFT Metro Campus, Colombo" value={formData.university} onChange={e => set('university', e.target.value)} className={inputCls} /></Field></div>
              </div>
            </div>

            {/* 2. Duration & Level */}
            <div>
              <SectionHeader icon={<Clock size={16} />} title="Duration & Level" color="text-blue-600" />
              <div className="grid grid-cols-3 gap-4">
                <Field label="Duration"><input placeholder="e.g. 3 Years" value={formData.duration} onChange={e => set('duration', e.target.value)} className={inputCls} /></Field>
                <Field label="Study Mode"><select value={formData.studyMode} onChange={e => set('studyMode', e.target.value)} className={selectCls}>{['Full-time','Part-time','Online','Blended'].map(o => <option key={o}>{o}</option>)}</select></Field>
                <Field label="Level"><select value={formData.level} onChange={e => set('level', e.target.value)} className={selectCls}>{['Undergraduate','Postgraduate','Foundation','Professional'].map(o => <option key={o}>{o}</option>)}</select></Field>
              </div>
            </div>

            {/* 3. Fees */}
            <div>
              <SectionHeader icon={<DollarSign size={16} />} title="Fees Details" color="text-emerald-600" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Total Fee (LKR) *"><input required type="number" placeholder="e.g. 250000" value={formData.totalFee} onChange={e => set('totalFee', e.target.value)} className={inputCls} /></Field>
                <Field label="Registration Fee (LKR)"><input type="number" placeholder="e.g. 5000" value={formData.registrationFee} onChange={e => set('registrationFee', e.target.value)} className={inputCls} /></Field>
                <Field label="Installment Available"><select value={formData.installmentAvailable} onChange={e => set('installmentAvailable', e.target.value)} className={selectCls}><option>No</option><option>Yes</option></select></Field>
                <Field label="Installment Plan"><input placeholder="e.g. 3 installments of LKR 50,000" value={formData.installmentPlan} onChange={e => set('installmentPlan', e.target.value)} className={inputCls} /></Field>
              </div>
            </div>

            {/* 4. Eligibility */}
            <div>
              <SectionHeader icon={<GraduationCap size={16} />} title="Eligibility" color="text-violet-600" />
              <div className="grid grid-cols-1 gap-4">
                <Field label="Required Qualification"><input placeholder="e.g. A/L pass, O/L pass, Diploma" value={formData.eligibility} onChange={e => set('eligibility', e.target.value)} className={inputCls} /></Field>
                <Field label="Minimum Requirements"><textarea rows={2} placeholder="e.g. Minimum 3 passes in A/L..." value={formData.minimumRequirements} onChange={e => set('minimumRequirements', e.target.value)} className={inputCls + ' resize-none'} /></Field>
              </div>
            </div>

            {/* 5. Course Content */}
            <div>
              <SectionHeader icon={<BookOpen size={16} />} title="Course Content / Modules" color="text-orange-600" />
              <Field label="Subjects / Modules (comma separated)">
                <textarea rows={3} placeholder="e.g. Programming, Database Management, AI, Networking, Web Development..." value={formData.subjects} onChange={e => set('subjects', e.target.value)} className={inputCls + ' resize-none'} />
              </Field>
            </div>

            {/* 6. Location */}
            <div>
              <SectionHeader icon={<MapPin size={16} />} title="Location" color="text-rose-600" />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><Field label="Campus Location"><input placeholder="e.g. No. 123, Galle Road" value={formData.campusLocation} onChange={e => set('campusLocation', e.target.value)} className={inputCls} /></Field></div>
                <Field label="City"><input placeholder="e.g. Colombo" value={formData.city} onChange={e => set('city', e.target.value)} className={inputCls} /></Field>
                <Field label="Online Available"><select value={formData.onlineAvailable} onChange={e => set('onlineAvailable', e.target.value)} className={selectCls}><option>No</option><option>Yes</option></select></Field>
              </div>
            </div>

            {/* 7. Career Outcomes */}
            <div>
              <SectionHeader icon={<Briefcase size={16} />} title="Career Outcomes" color="text-teal-600" />
              <div className="grid grid-cols-1 gap-4">
                <Field label="Job Opportunities (comma separated)"><input placeholder="e.g. Software Engineer, Data Analyst, DevOps Engineer" value={formData.jobOpportunities} onChange={e => set('jobOpportunities', e.target.value)} className={inputCls} /></Field>
                <Field label="Career Path"><textarea rows={2} placeholder="e.g. Junior Dev → Senior Dev → Tech Lead → CTO" value={formData.careerPath} onChange={e => set('careerPath', e.target.value)} className={inputCls + ' resize-none'} /></Field>
              </div>
            </div>

            {/* 8. Additional Features */}
            <div>
              <SectionHeader icon={<GraduationCap size={16} />} title="Additional Features" color="text-sky-600" />
              <div className="grid grid-cols-3 gap-4">
                <Field label="Internship Available"><select value={formData.internshipAvailable} onChange={e => set('internshipAvailable', e.target.value)} className={selectCls}><option>No</option><option>Yes</option></select></Field>
                <Field label="Industry Certification"><select value={formData.industryCertification} onChange={e => set('industryCertification', e.target.value)} className={selectCls}><option>No</option><option>Yes</option></select></Field>
                <Field label="Practical Training"><select value={formData.practicalTraining} onChange={e => set('practicalTraining', e.target.value)} className={selectCls}><option>No</option><option>Yes</option></select></Field>
              </div>
            </div>

            {/* 9. Media */}
            <div>
              <SectionHeader icon={<BookOpen size={16} />} title="Media" color="text-pink-600" />
              <Field label="Course Image URL"><input placeholder="https://example.com/course-image.jpg" value={formData.courseImage} onChange={e => set('courseImage', e.target.value)} className={inputCls} /></Field>
            </div>

            {/* 10. SEO / AI Metadata */}
            <div>
              <SectionHeader icon={<Tag size={16} />} title="AI & SEO Metadata" color="text-gray-500" />
              <div className="grid grid-cols-1 gap-4">
                <Field label="Keywords (comma separated — helps AI answer questions)"><input placeholder="e.g. IT, Software, Coding, Programming, Tech" value={formData.keywords} onChange={e => set('keywords', e.target.value)} className={inputCls} /></Field>
                <Field label="Tags"><input placeholder="e.g. popular, scholarship-available, evening" value={formData.tags} onChange={e => set('tags', e.target.value)} className={inputCls} /></Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all">
              {editingId ? '💾 Save Changes' : '✚ Add Course'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Main Page Component ────────────────────────────────────
const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');

  const fetchCourses = () => {
    setLoading(true);
    api.getCourses().then(r => setCourses(r.data || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleOpenModal = (course = null) => {
    if (course) { setFormData({ ...EMPTY_FORM, ...course }); setEditingId(course.id); }
    else { setFormData(EMPTY_FORM); setEditingId(null); }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        totalFee: Number(formData.totalFee) || 0,
        registrationFee: Number(formData.registrationFee) || 0,
        subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
        jobOpportunities: formData.jobOpportunities ? formData.jobOpportunities.split(',').map(s => s.trim()).filter(Boolean) : [],
        keywords: formData.keywords ? formData.keywords.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editingId) await api.updateCourse(editingId, payload);
      else await api.addCourse(payload);
      setIsModalOpen(false);
      fetchCourses();
    } catch { alert('Failed to save. Please check backend connection.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course permanently?')) return;
    try { await api.deleteCourse(id); fetchCourses(); } catch { console.error('Delete failed'); }
  };

  const allFields = ['all', ...new Set(courses.map(c => c.field).filter(Boolean))];

  const filtered = courses.filter(c => {
    const matchSearch = [c.name, c.university, c.field, c.city, c.courseType].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
    const matchField = fieldFilter === 'all' || c.field === fieldFilter;
    return matchSearch && matchField;
  });

  // Derived analytics
  const withKeywords = courses.filter(c => c.keywords?.length > 0).length;
  const missingData = courses.filter(c => getMissing(c).length > 0).length;
  const uniqueFields = new Set(courses.map(c => c.field).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-500 text-sm mt-0.5">{courses.length} courses · AI uses this data to answer students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCourses} className="flex items-center gap-2 text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium transition-colors"><RefreshCw size={14} /></button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 text-sm px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-200 transition-all"
          >
            <Upload size={16} /> Bulk Import CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 text-sm px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all"
          >
            <Plus size={16} /> Add Course
          </button>
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: courses.length, color: 'bg-indigo-50 text-indigo-700', icon: <BookOpen size={16}/> },
          { label: 'With Keywords', value: withKeywords, color: 'bg-emerald-50 text-emerald-700', icon: <Tag size={16}/> },
          { label: 'Incomplete Data', value: missingData, color: missingData > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400', icon: <AlertTriangle size={16}/> },
          { label: 'Fields Covered', value: uniqueFields, color: 'bg-violet-50 text-violet-700', icon: <TrendingUp size={16}/> },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 flex items-center gap-3 ${s.color}`}>
            <div className="opacity-70">{s.icon}</div>
            <div><p className="text-xl font-bold leading-none">{s.value}</p><p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Missing data warning */}
      {missingData > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={14}/>
          <strong>{missingData} course{missingData !== 1 ? 's' : ''}</strong> have incomplete data (missing fee, duration, eligibility, keywords, or career info). The AI may give incomplete answers for these.
        </div>
      )}

      {/* Search + Field Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, university, field, city..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
          {allFields.map(f => (
            <button key={f} onClick={() => setFieldFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                fieldFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f === 'all' ? 'All Fields' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No courses found. Click "Add Course" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>{filtered.map(course => <CourseCard key={course.id} course={course} onEdit={handleOpenModal} onDelete={handleDelete} />)}</AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && <CourseModal editingId={editingId} formData={formData} setFormData={setFormData} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isBulkOpen && <BulkImportModal onClose={() => setIsBulkOpen(false)} onSuccess={fetchCourses} />}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
