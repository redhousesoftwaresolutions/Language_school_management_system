import { useState, useEffect, useMemo } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';

const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const COLORS      = ['#EBF3FF', '#EDF7ED', '#FFF8E1', '#FDE8F0', '#F0EBFF'];
const TEXT_COLORS = ['#4A90D9', '#2E7D32', '#F57F17', '#C2185B', '#6A1B9A'];

const EMPTY_FORM    = { day: 'Monday', time: '09:00', course: '', teacher: '', room: '', _courseTeachers: [] };
const EMPTY_HOLIDAY = { startDate: '', endDate: '', note: '', allClasses: true, entries: [] };

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Timetable() {
  const [entries,  setEntries]  = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // class modal
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [error,     setError]     = useState('');

  // holiday modal
  const [showHolidayModal,  setShowHolidayModal]  = useState(false);
  const [holidayForm,       setHolidayForm]       = useState(EMPTY_HOLIDAY);
  const [deleteHolidayId,   setDeleteHolidayId]   = useState(null);
  const [holidayError,      setHolidayError]      = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/timetable'),
      api.get('/admin/staff'),
      api.get('/admin/courses'),
      api.get('/admin/rooms'),
      api.get('/admin/holidays'),
    ]).then(([en, t, c, r, h]) => {
      setEntries(en.data);
      setTeachers(t.data);
      setCourses(c.data);
      setRooms(r.data);
      setHolidays(h.data);
    }).catch(err => console.error('Timetable fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const getSlotEntries = (day, time) => entries.filter(e => e.day === day && e.time === time);

  // ── Class modal ────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (entry) => {
    const course = courses.find(c => c._id === (entry.course?._id || entry.course));
    setForm({
      day:             entry.day,
      time:            entry.time,
      course:          entry.course?._id || entry.course || '',
      teacher:         entry.teacher || '',
      room:            entry.room || '',
      _courseTeachers: course?.teachers || [],
    });
    setEditId(entry._id);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.course || !form.teacher || !form.room) {
      setError('Course, teacher and room are required.');
      return;
    }
    const clash = entries.find(e =>
      e.day === form.day && e.time === form.time && e.room === form.room && e._id !== editId
    );
    if (clash) {
      setError(`${form.room} is already booked on ${form.day} at ${form.time}.`);
      return;
    }
    try {
      const payload = { day: form.day, time: form.time, course: form.course, teacher: form.teacher, room: form.room };
      if (editId) {
        const { data } = await api.put(`/admin/timetable/${editId}`, payload);
        setEntries(prev => prev.map(e => e._id === editId ? data : e));
      } else {
        const { data } = await api.post('/admin/timetable', payload);
        setEntries(prev => [...prev, data]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/timetable/${deleteId}`);
      setEntries(prev => prev.filter(e => e._id !== deleteId));
    } catch { alert('Delete failed'); }
    setDeleteId(null);
  };

  // ── Holiday modal ──────────────────────────────────────────────────────────

  // Entries that fall on days within the holiday date range (for "specific classes" picker)
  const holidayAffectedEntries = useMemo(() => {
    if (!holidayForm.startDate) return [];
    const start = new Date(holidayForm.startDate);
    const end   = new Date(holidayForm.endDate || holidayForm.startDate);
    const days  = new Set();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.add(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]);
    }
    return entries.filter(e => days.has(e.day));
  }, [holidayForm.startDate, holidayForm.endDate, entries]);

  const toggleHolidayEntry = (id) => {
    setHolidayForm(f => ({
      ...f,
      entries: f.entries.includes(id) ? f.entries.filter(x => x !== id) : [...f.entries, id],
    }));
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.startDate) { setHolidayError('Start date is required.'); return; }
    if (!holidayForm.allClasses && holidayForm.entries.length === 0) {
      setHolidayError('Select at least one class or choose "All Classes".'); return;
    }
    try {
      const { data } = await api.post('/admin/holidays', holidayForm);
      setHolidays(prev => [...prev, data]);
      setShowHolidayModal(false);
      setHolidayForm(EMPTY_HOLIDAY);
      setHolidayError('');
    } catch (err) {
      setHolidayError(err.response?.data?.message || 'Save failed');
    }
  };

  const confirmDeleteHoliday = async () => {
    try {
      await api.delete(`/admin/holidays/${deleteHolidayId}`);
      setHolidays(prev => prev.filter(h => h._id !== deleteHolidayId));
    } catch { alert('Delete failed'); }
    setDeleteHolidayId(null);
  };

  // For each holiday, determine which class names are cancelled
  const getHolidaySummary = (holiday) => {
    if (holiday.allClasses) return 'All classes';
    const ids = new Set((holiday.entries || []).map(e => e._id || e));
    const affected = entries.filter(e => ids.has(e._id));
    if (affected.length === 0) return 'No classes';
    return affected.map(e => e.course?.name || 'Unknown').join(', ');
  };

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'Timetable' },
      ]} />
      <div style={st.container}>

        {/* ── Top bar ── */}
        <div style={st.topBar}>
          <h2 style={st.title}>Weekly Schedule</h2>
          <button style={st.addBtn} onClick={openAdd} disabled={loading}>
            {loading ? 'Loading...' : '+ Add Class'}
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading timetable data…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={st.table}>
              <thead>
                <tr>
                  <th style={st.timeTh}>Time</th>
                  {DAYS.map(d => <th key={d} style={st.dayTh}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {TIMES.map(time => (
                  <tr key={time}>
                    <td style={st.timeTd}>{time}</td>
                    {DAYS.map((day, di) => {
                      const slotEntries = getSlotEntries(day, time);
                      return (
                        <td key={day} style={{ ...st.cell, height: slotEntries.length > 1 ? 'auto' : 70 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {slotEntries.map((entry, ci) => (
                              <div key={entry._id} style={{
                                ...st.classBlock,
                                background:  COLORS[(di + ci) % COLORS.length],
                                borderLeft:  `3px solid ${TEXT_COLORS[(di + ci) % TEXT_COLORS.length]}`,
                              }}>
                                <p style={{ ...st.subject, color: TEXT_COLORS[(di + ci) % TEXT_COLORS.length] }}>
                                  {entry.course?.name || '—'}
                                </p>
                                <p style={st.meta}>{entry.teacher}</p>
                                <p style={st.meta}>{entry.room}</p>
                                {entry.course?.startDate && (
                                  <p style={st.dateRange}>
                                    {fmt(entry.course.startDate)} – {fmt(entry.course.endDate)}
                                  </p>
                                )}
                                <div style={st.actions}>
                                  <button style={st.editBtn} onClick={() => openEdit(entry)}>Edit</button>
                                  <button style={st.delBtn}  onClick={() => setDeleteId(entry._id)}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Holidays Section ───────────────────────────────────────────────── */}
      <div style={{ ...st.container, marginTop: 24 }}>
        <div style={st.topBar}>
          <div>
            <h2 style={st.title}>Holidays &amp; Cancellations</h2>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              Classes are automatically cancelled for the dates listed below.
            </p>
          </div>
          <button style={st.addBtn} onClick={() => { setHolidayForm(EMPTY_HOLIDAY); setHolidayError(''); setShowHolidayModal(true); }}>
            + Add Holiday
          </button>
        </div>

        {holidays.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No holidays added yet.</p>
        ) : (
          <table style={st.table}>
            <thead>
              <tr>
                <th style={st.th}>Date(s)</th>
                <th style={st.th}>Note</th>
                <th style={st.th}>Affected Classes</th>
                <th style={st.th}></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => {
                const sameDay = h.startDate?.slice(0,10) === h.endDate?.slice(0,10);
                return (
                  <tr key={h._id} style={st.hRow}>
                    <td style={st.td}>
                      <span style={st.dateBadge}>
                        {sameDay ? fmt(h.startDate) : `${fmt(h.startDate)} – ${fmt(h.endDate)}`}
                      </span>
                    </td>
                    <td style={st.td}>{h.note || <span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ ...st.td, color: '#555', fontSize: 12 }}>{getHolidaySummary(h)}</td>
                    <td style={st.td}>
                      <button style={st.delBtn} onClick={() => setDeleteHolidayId(h._id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add / Edit Class Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <span style={st.modalTitle}>{editId ? 'Edit Class' : 'Add Class'}</span>
              <button style={st.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={st.grid2}>
              <div style={st.field}>
                <label style={st.label}>Day</label>
                <select style={st.input} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={st.field}>
                <label style={st.label}>Time</label>
                <select style={st.input} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={st.field}>
              <label style={st.label}>Course</label>
              <select style={st.input} value={form.course} onChange={e => {
                const selected = courses.find(c => c._id === e.target.value);
                setForm(f => ({ ...f, course: e.target.value, teacher: '', _courseTeachers: selected?.teachers || [] }));
              }}>
                <option value="">— Select a course —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
              {form.course && (() => {
                const c = courses.find(x => x._id === form.course);
                if (c?.startDate) return (
                  <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    Runs {fmt(c.startDate)} – {fmt(c.endDate)} · repeats weekly
                  </p>
                );
              })()}
            </div>

            <div style={st.grid2}>
              <div style={st.field}>
                <label style={st.label}>
                  Teacher
                  {form.course && (form._courseTeachers || []).length === 0 && (
                    <span style={{ color: '#e67e22', fontSize: 11, marginLeft: 6 }}>No teachers assigned</span>
                  )}
                </label>
                <select style={st.input} value={form.teacher}
                  onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                  disabled={!form.course}>
                  <option value="">— Select a teacher —</option>
                  {(form._courseTeachers?.length > 0 ? form._courseTeachers : teachers).map(t => (
                    <option key={t._id} value={`${t.firstName} ${t.lastName}`}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={st.field}>
                <label style={st.label}>Room</label>
                <select style={st.input} value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
                  <option value="">— Select a room —</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r.name}>
                      {r.name}{r.capacity ? ` (cap. ${r.capacity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p style={st.error}>{error}</p>}

            <div style={st.modalFooter}>
              <button style={st.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSave}>{editId ? 'Save Changes' : 'Add Class'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Class Confirm ───────────────────────────────────────────── */}
      {deleteId && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div style={{ ...st.modal, maxWidth: 380 }}>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>Remove this class?</p>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>This removes it from the weekly schedule.</p>
            <div style={st.modalFooter}>
              <button style={st.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...st.saveBtn, background: '#e74c3c' }} onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Holiday Modal ──────────────────────────────────────────────── */}
      {showHolidayModal && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setShowHolidayModal(false)}>
          <div style={{ ...st.modal, maxWidth: 520 }}>
            <div style={st.modalHeader}>
              <span style={st.modalTitle}>Add Holiday / Cancellation</span>
              <button style={st.closeBtn} onClick={() => setShowHolidayModal(false)}>✕</button>
            </div>

            <div style={st.grid2}>
              <div style={st.field}>
                <label style={st.label}>Start Date *</label>
                <input style={st.input} type="date" value={holidayForm.startDate}
                  onChange={e => setHolidayForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate || e.target.value, entries: [] }))} />
              </div>
              <div style={st.field}>
                <label style={st.label}>End Date <span style={{ fontWeight: 400, color: '#bbb' }}>(leave same for single day)</span></label>
                <input style={st.input} type="date" value={holidayForm.endDate}
                  onChange={e => setHolidayForm(f => ({ ...f, endDate: e.target.value, entries: [] }))} />
              </div>
            </div>

            <div style={st.field}>
              <label style={st.label}>Reason / Note</label>
              <input style={st.input} type="text" value={holidayForm.note}
                placeholder="e.g. Christmas holidays, Bank Holiday…"
                onChange={e => setHolidayForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            <div style={st.field}>
              <label style={st.label}>Which classes to cancel?</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" checked={holidayForm.allClasses}
                    onChange={() => setHolidayForm(f => ({ ...f, allClasses: true, entries: [] }))} />
                  All classes
                </label>
                <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="radio" checked={!holidayForm.allClasses}
                    onChange={() => setHolidayForm(f => ({ ...f, allClasses: false }))} />
                  Specific classes only
                </label>
              </div>
            </div>

            {!holidayForm.allClasses && (
              <div style={st.field}>
                <label style={st.label}>Select classes to cancel</label>
                {holidayAffectedEntries.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#aaa' }}>
                    {holidayForm.startDate ? 'No scheduled classes fall on these dates.' : 'Pick a date first.'}
                  </p>
                ) : (
                  <div style={st.entryPickerBox}>
                    {holidayAffectedEntries.map(e => {
                      const checked = holidayForm.entries.includes(e._id);
                      return (
                        <label key={e._id} style={{ ...st.entryPickerRow, background: checked ? '#EBF3FF' : '#fff' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleHolidayEntry(e._id)}
                            style={{ marginRight: 8, accentColor: '#3D4F7C' }} />
                          <span style={{ fontWeight: checked ? 600 : 400, color: checked ? '#3D4F7C' : '#333', fontSize: 13 }}>
                            {e.day} {e.time} — {e.course?.name || '?'} ({e.teacher}, {e.room})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {holidayError && <p style={st.error}>{holidayError}</p>}

            <div style={st.modalFooter}>
              <button style={st.cancelBtn} onClick={() => setShowHolidayModal(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSaveHoliday}>Add Holiday</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Holiday Confirm ─────────────────────────────────────────── */}
      {deleteHolidayId && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setDeleteHolidayId(null)}>
          <div style={{ ...st.modal, maxWidth: 380 }}>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>Remove this holiday?</p>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Classes will no longer be cancelled for this period.</p>
            <div style={st.modalFooter}>
              <button style={st.cancelBtn} onClick={() => setDeleteHolidayId(null)}>Cancel</button>
              <button style={{ ...st.saveBtn, background: '#e74c3c' }} onClick={confirmDeleteHoliday}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const st = {
  breadcrumb:     { fontSize: 12, color: '#aaa', marginBottom: 20 },
  container:      { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:          { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  addBtn:         { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  table:          { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  timeTh:         { width: 70, padding: '10px 8px', background: '#F5F6FA', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'center', border: '1px solid #eee' },
  dayTh:          { padding: '12px 8px', background: '#3D4F7C', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center', border: '1px solid #4A6FA5' },
  timeTd:         { padding: '8px', fontSize: 12, color: '#aaa', textAlign: 'center', background: '#F5F6FA', border: '1px solid #eee', verticalAlign: 'top' },
  cell:           { padding: 6, border: '1px solid #eee', verticalAlign: 'top', minWidth: 130, height: 70 },
  classBlock:     { borderRadius: 6, padding: '6px 8px' },
  subject:        { fontSize: 12, fontWeight: 600, marginBottom: 2 },
  meta:           { fontSize: 11, color: '#888' },
  dateRange:      { fontSize: 10, color: '#bbb', marginTop: 2 },
  actions:        { display: 'flex', gap: 4, marginTop: 4 },
  editBtn:        { fontSize: 10, padding: '2px 6px', background: '#3D4F7C22', color: '#3D4F7C', border: 'none', borderRadius: 4, cursor: 'pointer' },
  delBtn:         { fontSize: 10, padding: '2px 6px', background: '#e74c3c22', color: '#e74c3c', border: 'none', borderRadius: 4, cursor: 'pointer' },
  th:             { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '1px solid #eee', background: '#F5F6FA' },
  td:             { padding: '12px', fontSize: 13, verticalAlign: 'middle' },
  hRow:           { borderBottom: '1px solid #f5f5f5' },
  dateBadge:      { background: '#FFF3E0', color: '#E65100', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500 },
  overlay:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:          { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:     { fontWeight: 700, fontSize: 17 },
  closeBtn:       { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  grid2:          { display: 'flex', gap: 16 },
  field:          { flex: 1, marginBottom: 14 },
  label:          { display: 'block', fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 5 },
  input:          { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  error:          { color: '#e74c3c', fontSize: 12, marginBottom: 10 },
  modalFooter:    { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn:      { padding: '8px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  saveBtn:        { padding: '8px 20px', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  entryPickerBox: { border: '1px solid #ddd', borderRadius: 8, maxHeight: 200, overflowY: 'auto' },
  entryPickerRow: { display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
};
