import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS', 'Business'];

export default function AddCourse() {
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', code: '', level: '', teachers: [],
    startDate: '', endDate: '', price: '', maxStudents: '', description: ''
  });
  const [allTeachers, setAllTeachers] = useState([]);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/admin/staff').then(({ data }) => setAllTeachers(data)).catch(() => {});

    if (isEdit) {
      api.get(`/admin/courses/${id}`).then(({ data }) => {
        // teachers may come back as objects (populated) or IDs
        const teacherIds = (data.teachers || []).map(t => t._id || t);
        setForm({
          name:        data.name        || '',
          code:        data.code        || '',
          level:       data.level       || '',
          teachers:    teacherIds,
          startDate:   data.startDate   ? data.startDate.slice(0, 10) : '',
          endDate:     data.endDate     ? data.endDate.slice(0, 10)   : '',
          price:       data.price       || '',
          maxStudents: data.maxStudents || '',
          description: data.description || '',
        });
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const toggleTeacher = (tid) =>
    set('teachers', form.teachers.includes(tid)
      ? form.teachers.filter(t => t !== tid)
      : [...form.teachers, tid]);

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      if (isEdit) await api.put(`/admin/courses/${id}`, form);
      else        await api.post('/admin/courses', form);
      navigate('/admin/organisation/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'Courses', path: '/admin/organisation/courses' },
        { label: isEdit ? 'Edit Course' : 'Add Course' },
      ]} />
      <div style={s.container}>
        <div style={s.topBar}>
          <h2 style={s.title}>{isEdit ? 'Edit Course' : 'Add New Course'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {error && <span style={s.error}>{error}</span>}
            <button style={s.cancelBtn} onClick={() => navigate('/admin/organisation/courses')}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        <div style={s.twoCol}>
          {/* Left column */}
          <div style={s.col}>
            <Field label="Course Name *" value={form.name} onChange={v => set('name', v)} />
            <Field label="Course Code *" value={form.code} onChange={v => set('code', v)} />

            <div style={s.formGroup}>
              <label style={s.label}>Level</label>
              <select style={s.select} value={form.level} onChange={e => set('level', e.target.value)}>
                <option value="">Select Level</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Multi-teacher select */}
            <div style={s.formGroup}>
              <label style={s.label}>
                Assigned Teachers
                {form.teachers.length > 0 && (
                  <span style={s.countBadge}>{form.teachers.length} selected</span>
                )}
              </label>
              <div style={s.teacherBox}>
                {allTeachers.length === 0 && (
                  <p style={{ fontSize: 12, color: '#aaa', padding: 8 }}>Loading teachers…</p>
                )}
                {allTeachers.map(t => {
                  const selected = form.teachers.includes(t._id);
                  return (
                    <label key={t._id} style={{ ...s.teacherRow, background: selected ? '#EBF3FF' : '#fff' }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTeacher(t._id)}
                        style={{ marginRight: 8, accentColor: '#3D4F7C' }}
                      />
                      <span style={{ fontWeight: selected ? 600 : 400, color: selected ? '#3D4F7C' : '#333' }}>
                        {t.firstName} {t.lastName}
                      </span>
                      {t.specialization && (
                        <span style={s.spec}>{t.specialization}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Max Students" value={form.maxStudents} onChange={v => set('maxStudents', v)} type="number" />
            <Field label="Price (GBP)"  value={form.price}       onChange={v => set('price', v)}       type="number" />
          </div>

          {/* Right column */}
          <div style={s.col}>
            <Field label="Start Date" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
            <Field label="End Date"   value={form.endDate}   onChange={v => set('endDate', v)}   type="date" />
            <div style={s.formGroup}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Course description..." />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={s.formGroup}>
      <label style={s.label}>{label}</label>
      <input style={s.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder="..." />
    </div>
  );
}

const s = {
  breadcrumb: { fontSize: 12, color: '#aaa', marginBottom: 20 },
  container:  { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title:      { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  saveBtn:    { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 28px', cursor: 'pointer', fontSize: 13 },
  cancelBtn:  { background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  error:      { fontSize: 12, color: '#C62828' },
  twoCol:     { display: 'flex', gap: 40 },
  col:        { flex: 1 },
  formGroup:  { marginBottom: 18 },
  label:      { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  input:      { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  select:     { width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none' },
  textarea:   { width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '8px', fontSize: 13, resize: 'vertical', outline: 'none' },
  dayRow:     { display: 'flex', gap: 6, flexWrap: 'wrap' },
  dayBtn:     { border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  timeRow:    { display: 'flex', gap: 20 },
  teacherBox: { border: '1px solid #ddd', borderRadius: 8, maxHeight: 220, overflowY: 'auto' },
  teacherRow: { display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: 13 },
  spec:       { marginLeft: 'auto', fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  countBadge: { marginLeft: 8, background: '#3D4F7C', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 },
};
