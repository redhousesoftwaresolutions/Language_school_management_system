import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS', 'Business'];

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

export default function CourseList() {
  const [courses,      setCourses]      = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('name');
  const [sortDir,      setSortDir]      = useState('asc');
  const [filterLevel,  setFilterLevel]  = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/courses')
      .then(({ data }) => setCourses(data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/courses/${deleteTarget._id}`);
      setCourses(prev => prev.filter(c => c._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...courses];
    if (search) list = list.filter(c => `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase()));
    if (filterLevel !== 'All') list = list.filter(c => c.level === filterLevel);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [courses, search, sortField, sortDir, filterLevel]);

  const teacherNames = (c) => {
    const list = c.teachers?.length > 0 ? c.teachers : (c.teacher ? [c.teacher] : []);
    return list.length > 0 ? list.map(t => `${t.firstName} ${t.lastName}`).join(', ') : '—';
  };

  return (
    <Layout>
      <style>{`.list-row td { background: #fff; transition: background 0.15s; } .list-row:hover td { background: #D0D3DC !important; }`}</style>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'Course List' },
      ]} />
      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Courses</h2>
          <div style={st.controls}>
            <div style={st.searchBox}>
              <FaSearch size={13} color="#aaa" />
              <input style={st.searchInput} placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={st.select} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <button style={st.addBtn} onClick={() => navigate('/admin/organisation/courses/add')}>
              <FaPlus size={11} /> Add Course
            </button>
          </div>
        </div>

        <p style={st.count}>{filtered.length} course{filtered.length !== 1 ? 's' : ''}</p>

        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead>
              <tr>
                <SortHeader label="Code"    field="code"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Name"    field="name"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Level"   field="level" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={st.th}>Teacher(s)</th>
                <SortHeader label="Price"   field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={st.th}>Students</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} className="list-row" style={st.row} onClick={() => setViewItem(c)}>
                  <td style={st.td}><span style={st.code}>{c.code}</span></td>
                  <td style={{ ...st.td, fontWeight: 500 }}>{c.name}</td>
                  <td style={st.td}><span style={st.levelBadge}>{c.level}</span></td>
                  <td style={st.td}>{teacherNames(c)}</td>
                  <td style={st.td}>£{c.price?.toLocaleString() || '—'}</td>
                  <td style={st.td}>{c.students?.length ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={st.empty}>No courses found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail popup */}
      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <div>
                <p style={st.modalName}>{viewItem.name}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={st.code}>{viewItem.code}</span>
                  {viewItem.level && <span style={st.levelBadge}>{viewItem.level}</span>}
                </div>
              </div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Teacher(s)"   value={teacherNames(viewItem)} span />
              <Detail label="Start Date"   value={fmt(viewItem.startDate)} />
              <Detail label="End Date"     value={fmt(viewItem.endDate)} />
              <Detail label="Price"        value={viewItem.price ? `£${viewItem.price.toLocaleString()}` : null} />
              <Detail label="Max Students" value={viewItem.maxStudents} />
              <Detail label="Enrolled"     value={viewItem.students?.length ?? 0} />
              {viewItem.description && <Detail label="Description" value={viewItem.description} span />}
            </div>
            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={st.editBtn} onClick={() => navigate(`/admin/organisation/courses/edit/${viewItem._id}`)}>
                  <FaEdit size={12} style={{ marginRight: 6 }} />Edit
                </button>
                <button style={{ ...st.editBtn, background: '#4A90D9' }} onClick={() => navigate(`/admin/organisation/courses/${viewItem._id}`)}>
                  Open Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete course "${deleteTarget.name}"?`}
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
      <p style={{ fontSize: 13, color: '#333' }}>{value ?? '—'}</p>
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
  searchInput:{ border: 'none', outline: 'none', fontSize: 13, width: 180 },
  select:     { border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#555' },
  addBtn:     { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  count:      { fontSize: 12, color: '#aaa', marginBottom: 12 },
  loading:    { textAlign: 'center', color: '#aaa', padding: 40 },
  table:      { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
  th:         { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '2px solid #eee', background: '#F5F6FA' },
  row:        { cursor: 'pointer' },
  td:         { padding: '12px 12px', fontSize: 13 },
  code:       { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 },
  levelBadge: { background: '#F0F4FF', color: '#3D4F7C', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500 },
  empty:      { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: 13 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:      { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName:  { fontWeight: 700, fontSize: 17, color: '#3D4F7C' },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 24, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  modalFooter:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  editBtn:    { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  delBtn:     { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
};
