import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const mockStaff = [
  { _id: '1', firstName: 'James', lastName: 'Smith', specialization: 'English B1/B2', email: 'j.smith@school.com', phone: '+44 7700 900111', status: 'Active' },
  { _id: '2', firstName: 'Laura', lastName: 'Brown', specialization: 'English A1/A2', email: 'l.brown@school.com', phone: '+44 7700 900222', status: 'Active' },
];

const statusStyle = {
  Active:   { background: '#EDF7ED', color: '#2E7D32' },
  'On Leave': { background: '#FFF8E1', color: '#F57F17' },
  Inactive: { background: '#F5F5F5', color: '#888' },
};

export default function StaffList() {
  const [staff,        setStaff]        = useState([]);
  const [allCourses,   setAllCourses]   = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('firstName');
  const [sortDir,      setSortDir]      = useState('asc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const [courseToAdd,  setCourseToAdd]  = useState('');
  const [savingCourse, setSavingCourse] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/staff')
      .then(({ data }) => setStaff(data))
      .catch(() => setStaff(mockStaff))
      .finally(() => setLoading(false));
    api.get('/admin/courses')
      .then(({ data }) => setAllCourses(data))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/staff/${deleteTarget._id}`);
      setStaff(prev => prev.filter(s => s._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleAddCourse = async () => {
    if (!courseToAdd || savingCourse) return;
    const currentIds = (viewItem.assignedCourses || []).map(c => c._id || c);
    if (currentIds.includes(courseToAdd)) return;
    setSavingCourse(true);
    try {
      await api.put(`/admin/staff/${viewItem._id}`, { assignedCourses: [...currentIds, courseToAdd] });
      const courseObj = allCourses.find(c => c._id === courseToAdd);
      const updated = { ...viewItem, assignedCourses: [...(viewItem.assignedCourses || []), courseObj] };
      setViewItem(updated);
      setStaff(prev => prev.map(s => s._id === viewItem._id ? updated : s));
      setCourseToAdd('');
    } catch { alert('Failed to add course'); }
    setSavingCourse(false);
  };

  const handleRemoveCourse = async (courseId) => {
    if (savingCourse) return;
    const currentIds = (viewItem.assignedCourses || []).map(c => c._id || c);
    setSavingCourse(true);
    try {
      await api.put(`/admin/staff/${viewItem._id}`, { assignedCourses: currentIds.filter(id => id !== courseId) });
      const updated = { ...viewItem, assignedCourses: (viewItem.assignedCourses || []).filter(c => (c._id || c) !== courseId) };
      setViewItem(updated);
      setStaff(prev => prev.map(s => s._id === viewItem._id ? updated : s));
    } catch { alert('Failed to remove course'); }
    setSavingCourse(false);
  };

  const filtered = useMemo(() => {
    let list = [...staff];
    if (search) list = list.filter(s => `${s.firstName} ${s.lastName} ${s.email} ${s.specialization}`.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== 'All') list = list.filter(s => s.status === filterStatus);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [staff, search, sortField, sortDir, filterStatus]);

  const enrolledIds = useMemo(
    () => (viewItem?.assignedCourses || []).map(c => c._id || c),
    [viewItem]
  );

  const availableCourses = useMemo(
    () => allCourses.filter(c => !enrolledIds.includes(c._id)),
    [allCourses, enrolledIds]
  );

  return (
    <Layout>
      <style>{`.list-row td { background: #fff; transition: background 0.15s; } .list-row:hover td { background: #D0D3DC !important; }`}</style>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Staff', path: '/admin/staff' },
        { label: 'Staff List' },
      ]} />
      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Staff</h2>
          <div style={st.controls}>
            <div style={st.searchBox}>
              <FaSearch size={13} color="#aaa" />
              <input style={st.searchInput} placeholder="Search name or subject..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={st.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {['All', 'Active', 'On Leave', 'Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button style={st.addBtn} onClick={() => navigate('/admin/staff/add')}>
              <FaPlus size={11} /> Add Staff
            </button>
          </div>
        </div>

        <p style={st.count}>{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</p>

        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead>
              <tr>
                <SortHeader label="ID"             field="staffId"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Name"           field="firstName"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Specialization" field="specialization" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Email"          field="email"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Phone"          field="phone"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={st.th}>Courses</th>
                <SortHeader label="Status"         field="status"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} className="list-row" style={st.row} onClick={() => { setViewItem(s); setCourseToAdd(''); }}>
                  <td style={st.td}>
                    <span style={st.idBadge}>{s.staffId}</span>
                  </td>
                  <td style={st.td}>
                    <div style={st.nameCell}>
                      <div style={st.avatar}>{s.firstName?.[0]}</div>
                      {s.firstName} {s.lastName}
                    </div>
                  </td>
                  <td style={st.td}>{s.specialization || '—'}</td>
                  <td style={st.td}>{s.email}</td>
                  <td style={st.td}>{s.phone || '—'}</td>
                  <td style={st.td}>
                    {s.assignedCourses?.length
                      ? s.assignedCourses.map(c => (
                          <span key={c._id} style={st.courseBadge}>{c.code || c.name}</span>
                        ))
                      : <span style={{ color: '#ccc' }}>—</span>
                    }
                  </td>
                  <td style={st.td}>
                    <span style={{ ...st.badge, ...(statusStyle[s.status] || {}) }}>{s.status || 'Active'}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={st.empty}>No staff found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail popup */}
      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...st.avatar, width: 44, height: 44, fontSize: 18 }}>{viewItem.firstName?.[0]}</div>
                <div>
                  <p style={st.modalName}>{viewItem.firstName} {viewItem.lastName}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <span style={st.idBadge}>{viewItem.staffId}</span>
                    <span style={{ ...st.badge, ...(statusStyle[viewItem.status] || {}) }}>{viewItem.status || 'Active'}</span>
                  </div>
                </div>
              </div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>

            <div style={st.detailGrid}>
              <Detail label="Email"          value={viewItem.email} />
              <Detail label="Phone"          value={viewItem.phone} />
              <Detail label="Specialization" value={viewItem.specialization} />
              <Detail label="Status"         value={viewItem.status} />
              {viewItem.address && <Detail label="Address" value={viewItem.address} span />}
              {viewItem.description && <Detail label="Notes" value={viewItem.description} span />}
            </div>

            {/* Courses section */}
            <div style={st.coursesSection}>
              <p style={st.coursesSectionTitle}>Assigned Courses</p>

              {/* Current courses */}
              <div style={st.coursesList}>
                {(viewItem.assignedCourses || []).length === 0 && (
                  <p style={{ fontSize: 12, color: '#aaa' }}>No courses assigned.</p>
                )}
                {(viewItem.assignedCourses || []).map(c => (
                  <div key={c._id || c} style={st.courseChip}>
                    <div>
                      <span style={st.courseCode}>{c.code}</span>
                      <span style={st.courseName}>{c.name}</span>
                      {c.level && <span style={st.courseLevel}>{c.level}</span>}
                    </div>
                    <button
                      style={st.removeBtn}
                      onClick={() => handleRemoveCourse(c._id || c)}
                      disabled={savingCourse}
                      title="Remove from course"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add course row */}
              {availableCourses.length > 0 && (
                <div style={st.addCourseRow}>
                  <select
                    style={st.courseSelect}
                    value={courseToAdd}
                    onChange={e => setCourseToAdd(e.target.value)}
                  >
                    <option value="">Add a course...</option>
                    {availableCourses.map(c => (
                      <option key={c._id} value={c._id}>{c.code} — {c.name}{c.level ? ` (${c.level})` : ''}</option>
                    ))}
                  </select>
                  <button
                    style={{ ...st.addCourseBtn, opacity: courseToAdd ? 1 : 0.5 }}
                    onClick={handleAddCourse}
                    disabled={!courseToAdd || savingCourse}
                  >
                    {savingCourse ? '...' : 'Assign'}
                  </button>
                </div>
              )}
            </div>

            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete
              </button>
              <button style={st.editBtn} onClick={() => navigate(`/admin/staff/edit/${viewItem._id}`)}>
                <FaEdit size={12} style={{ marginRight: 6 }} />Edit Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete staff member "${deleteTarget.firstName} ${deleteTarget.lastName}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  );
}

function Detail({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#333' }}>{value || '—'}</p>
    </div>
  );
}

const st = {
  breadcrumb: { fontSize: 12, color: '#aaa', marginBottom: 20 },
  container:  { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 },
  title:      { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  controls:   { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  searchBox:  { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #eee', borderRadius: 6, padding: '6px 12px' },
  searchInput:{ border: 'none', outline: 'none', fontSize: 13, width: 200 },
  select:     { border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#555' },
  addBtn:     { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  count:      { fontSize: 12, color: '#aaa', marginBottom: 12 },
  loading:    { textAlign: 'center', color: '#aaa', padding: 40 },
  table:      { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
  th:         { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '2px solid #eee', background: '#F5F6FA' },
  row:        { cursor: 'pointer' },
  td:         { padding: '12px 12px', fontSize: 13 },
  nameCell:   { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:     { width: 32, height: 32, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  idBadge:    { background: '#F0F4FF', color: '#3D4F7C', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' },
  courseBadge:{ display: 'inline-block', background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '1px 6px', fontSize: 11, marginRight: 4 },
  badge:      { borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
  empty:      { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: 13 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:      { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName:  { fontWeight: 700, fontSize: 17, color: '#3D4F7C' },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  coursesSection:   { padding: '16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 },
  coursesSectionTitle: { fontSize: 12, fontWeight: 600, color: '#3D4F7C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' },
  coursesList:      { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 },
  courseChip:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F6FA', borderRadius: 6, padding: '8px 12px' },
  courseCode:       { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 8 },
  courseName:       { fontSize: 13, color: '#333', marginRight: 8 },
  courseLevel:      { fontSize: 11, color: '#888' },
  removeBtn:        { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, display: 'flex', alignItems: 'center' },
  addCourseRow:     { display: 'flex', gap: 8, alignItems: 'center' },
  courseSelect:     { flex: 1, border: '1px solid #eee', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', color: '#555' },
  addCourseBtn:     { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  modalFooter:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  editBtn:          { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  delBtn:           { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
};
