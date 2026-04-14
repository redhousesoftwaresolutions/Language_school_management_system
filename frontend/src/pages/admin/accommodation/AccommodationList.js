import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBed, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

const ROOM_TYPES = ['All', 'Single Room', 'Double Room', 'Shared Room', 'Studio', 'Apartment'];

// available = students.length < capacity
const isAvailable = (a) => (a.students?.length || 0) < (a.capacity || 1);

function OccupancyBar({ students = [], capacity = 1 }) {
  const count = students.length;
  const pct   = Math.min((count / capacity) * 100, 100);
  const full  = count >= capacity;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: full ? '#C62828' : '#555', marginBottom: 3 }}>
        <span>{count} / {capacity} students</span>
        {full && <span style={{ fontWeight: 600 }}>Full</span>}
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#eee', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: full ? '#C62828' : pct > 75 ? '#E8A838' : '#2E7D32', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export default function AccommodationList() {
  const [accommodations, setAccommodations] = useState([]);
  const [allStudents,    setAllStudents]    = useState([]);
  const [search,         setSearch]         = useState('');
  const [sortField,      setSortField]      = useState('propertyName');
  const [sortDir,        setSortDir]        = useState('asc');
  const [filterAvail,    setFilterAvail]    = useState('All');
  const [filterType,     setFilterType]     = useState('All');
  const [viewMode,       setViewMode]       = useState('grid');
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [viewItem,       setViewItem]       = useState(null);
  const [studentToAdd,   setStudentToAdd]   = useState('');
  const [savingStudent,  setSavingStudent]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/accommodation')
      .then(({ data }) => setAccommodations(data))
      .catch(() => setAccommodations([]))
      .finally(() => setLoading(false));
    api.get('/admin/students')
      .then(({ data }) => setAllStudents(data))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/accommodation/${deleteTarget._id}`);
      setAccommodations(prev => prev.filter(a => a._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleAddStudent = async () => {
    if (!studentToAdd || savingStudent) return;
    const currentIds = (viewItem.students || []).map(s => s._id || s);
    if (currentIds.includes(studentToAdd)) return;
    if (currentIds.length >= (viewItem.capacity || 1)) return alert('Accommodation is at full capacity.');
    setSavingStudent(true);
    try {
      const { data } = await api.put(`/admin/accommodation/${viewItem._id}`, { students: [...currentIds, studentToAdd] });
      setViewItem(data);
      setAccommodations(prev => prev.map(a => a._id === viewItem._id ? data : a));
      setStudentToAdd('');
    } catch { alert('Failed to assign student'); }
    setSavingStudent(false);
  };

  const handleRemoveStudent = async (studentId) => {
    if (savingStudent) return;
    const currentIds = (viewItem.students || []).map(s => s._id || s);
    setSavingStudent(true);
    try {
      const { data } = await api.put(`/admin/accommodation/${viewItem._id}`, { students: currentIds.filter(id => id !== studentId) });
      setViewItem(data);
      setAccommodations(prev => prev.map(a => a._id === viewItem._id ? data : a));
    } catch { alert('Failed to remove student'); }
    setSavingStudent(false);
  };

  const filtered = useMemo(() => {
    let list = [...accommodations];
    if (search) list = list.filter(a => `${a.propertyName} ${a.address} ${a.city}`.toLowerCase().includes(search.toLowerCase()));
    if (filterAvail === 'Available') list = list.filter(a => isAvailable(a));
    if (filterAvail === 'Occupied')  list = list.filter(a => !isAvailable(a));
    if (filterType !== 'All') list = list.filter(a => a.roomType === filterType);
    list.sort((a, b) => {
      const va = (a[sortField] ?? '').toString().toLowerCase();
      const vb = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [accommodations, search, filterAvail, filterType, sortField, sortDir]);

  const totalAvail = accommodations.filter(a => isAvailable(a)).length;
  const totalOcc   = accommodations.filter(a => !isAvailable(a)).length;
  const totalBeds  = accommodations.reduce((s, a) => s + (a.capacity || 0), 0);
  const usedBeds   = accommodations.reduce((s, a) => s + (a.students?.length || 0), 0);

  const availStyle = (a) => isAvailable(a)
    ? { background: '#EDF7ED', color: '#2E7D32' }
    : { background: '#FEECEB', color: '#C62828' };

  const assignedIds = useMemo(
    () => (viewItem?.students || []).map(s => s._id || s),
    [viewItem]
  );
  const availableStudents = useMemo(
    () => allStudents.filter(s => !assignedIds.includes(s._id)),
    [allStudents, assignedIds]
  );

  return (
    <Layout>
      <style>{`
        .list-row td { background: #fff; transition: background 0.15s; }
        .list-row:hover td { background: #D0D3DC !important; }
        .acc-card { cursor: pointer; transition: background 0.15s; }
        .acc-card:hover { background: #D0D3DC !important; }
      `}</style>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Accommodation', path: '/admin/accommodation' },
        { label: 'Accommodations List' },
      ]} />

      <div style={st.summaryRow}>
        {[
          { label: 'Total Properties', value: accommodations.length, color: '#3D4F7C' },
          { label: 'Available',        value: totalAvail,             color: '#2E7D32' },
          { label: 'Occupied',         value: totalOcc,               color: '#C62828' },
          { label: 'Beds Used',        value: `${usedBeds} / ${totalBeds}`, color: '#F57F17' },
        ].map(s => (
          <div key={s.label} style={st.summaryCard}>
            <p style={st.summaryLabel}>{s.label}</p>
            <p style={{ ...st.summaryValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Accommodations</h2>
          <div style={st.controls}>
            <div style={st.searchBox}>
              <FaSearch size={13} color="#aaa" />
              <input style={st.searchInput} placeholder="Search property or city..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={st.select} value={filterAvail} onChange={e => setFilterAvail(e.target.value)}>
              {['All', 'Available', 'Occupied'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select style={st.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={st.viewToggle}>
              <button style={{ ...st.viewBtn, background: viewMode === 'grid' ? '#3D4F7C' : '#F5F6FA', color: viewMode === 'grid' ? '#fff' : '#555' }} onClick={() => setViewMode('grid')}>⊞</button>
              <button style={{ ...st.viewBtn, background: viewMode === 'list' ? '#3D4F7C' : '#F5F6FA', color: viewMode === 'list' ? '#fff' : '#555' }} onClick={() => setViewMode('list')}>≡</button>
            </div>
            <button style={st.addBtn} onClick={() => navigate('/admin/accommodation/add')}><FaPlus size={11} /> Add</button>
          </div>
        </div>

        <p style={st.count}>{filtered.length} propert{filtered.length !== 1 ? 'ies' : 'y'}</p>

        {loading ? <p style={st.loading}>Loading...</p> : viewMode === 'grid' ? (
          <div style={st.cardGrid}>
            {filtered.map(a => {
              const avail = isAvailable(a);
              return (
                <div key={a._id} className="acc-card" style={st.card} onClick={() => { setViewItem(a); setStudentToAdd(''); }}>
                  <div style={st.cardImg}>
                    {a.images?.[0]
                      ? <img src={`http://localhost:5000/uploads/accommodation/${a.images[0].filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FaBed size={28} color="#aaa" />}
                  </div>
                  <div style={st.cardBody}>
                    <div style={st.cardTop}>
                      <h3 style={st.cardName}>{a.propertyName}</h3>
                      <span style={{ ...st.statusBadge, ...availStyle(a) }}>{avail ? 'Available' : 'Full'}</span>
                    </div>
                    <p style={st.cardType}>{a.roomType}</p>
                    <p style={st.cardAddr}><FaMapMarkerAlt size={10} /> {a.address}, {a.city}</p>
                    <OccupancyBar students={a.students} capacity={a.capacity} />
                    <div style={st.cardFooter}>
                      <span style={st.price}>£{a.pricePerWeek}<span style={{ fontSize: 11, color: '#aaa' }}>/wk</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p style={st.empty}>No accommodations found.</p>}
          </div>
        ) : (
          <table style={st.table}>
            <thead>
              <tr>
                <SortHeader label="Property"   field="propertyName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Type"       field="roomType"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="City"       field="city"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Price/Wk"   field="pricePerWeek" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={st.th}>Occupancy</th>
                <th style={st.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a._id} className="list-row" style={st.row} onClick={() => { setViewItem(a); setStudentToAdd(''); }}>
                  <td style={{ ...st.td, fontWeight: 500 }}>{a.propertyName}</td>
                  <td style={st.td}>{a.roomType}</td>
                  <td style={st.td}>{a.city}</td>
                  <td style={st.td}>£{a.pricePerWeek}</td>
                  <td style={st.td}>
                    <span style={{ fontWeight: 600, color: (a.students?.length || 0) >= (a.capacity || 1) ? '#C62828' : '#2E7D32' }}>
                      {a.students?.length || 0} / {a.capacity || 1}
                    </span>
                  </td>
                  <td style={st.td}>
                    <span style={{ ...st.statusBadge, ...availStyle(a) }}>
                      {isAvailable(a) ? 'Available' : 'Full'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={st.empty}>No accommodations found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail popup */}
      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={st.modal}>
            {viewItem.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
                {viewItem.images.map(img => (
                  <img key={img._id} src={`http://localhost:5000/uploads/accommodation/${img.filename}`} alt="" style={{ height: 80, width: 120, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                ))}
              </div>
            )}
            <div style={st.modalHeader}>
              <div>
                <p style={st.modalName}>{viewItem.propertyName}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ ...st.statusBadge, ...availStyle(viewItem) }}>
                    {isAvailable(viewItem) ? 'Available' : 'Full'}
                  </span>
                  <span style={{ fontSize: 12, color: '#888' }}>
                    {viewItem.students?.length || 0} / {viewItem.capacity || 1} students
                  </span>
                </div>
              </div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>

            <div style={st.detailGrid}>
              <Detail label="Room Type"    value={viewItem.roomType} />
              <Detail label="Capacity"     value={viewItem.capacity} />
              <Detail label="Price / Week" value={viewItem.pricePerWeek ? `£${viewItem.pricePerWeek}` : null} />
              <Detail label="Available From" value={viewItem.availableFrom ? new Date(viewItem.availableFrom).toLocaleDateString('en-GB') : null} />
              <Detail label="Address" value={[viewItem.address, viewItem.city, viewItem.postcode].filter(Boolean).join(', ')} span />
              {viewItem.description && <Detail label="Notes" value={viewItem.description} span />}
            </div>

            {/* Occupancy bar */}
            <div style={{ marginBottom: 16 }}>
              <OccupancyBar students={viewItem.students} capacity={viewItem.capacity} />
            </div>

            {/* Students section */}
            <div style={st.studentsSection}>
              <p style={st.sectionTitle}>Assigned Students</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {(viewItem.students || []).length === 0 && (
                  <p style={{ fontSize: 12, color: '#aaa' }}>No students assigned.</p>
                )}
                {(viewItem.students || []).map(s => (
                  <div key={s._id} style={st.studentChip}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={st.avatar}>{s.firstName?.[0]}</div>
                      <div>
                        <span style={{ fontSize: 13, color: '#333' }}>{s.firstName} {s.lastName}</span>
                        {s.studentId && <span style={st.idBadge}>{s.studentId}</span>}
                      </div>
                    </div>
                    <button
                      style={st.removeBtn}
                      onClick={() => handleRemoveStudent(s._id)}
                      disabled={savingStudent}
                      title="Remove student"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add student — only show if not full */}
              {isAvailable(viewItem) && availableStudents.length > 0 && (
                <div style={st.addStudentRow}>
                  <select style={st.studentSelect} value={studentToAdd} onChange={e => setStudentToAdd(e.target.value)}>
                    <option value="">Assign a student...</option>
                    {availableStudents.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} {s.lastName}{s.studentId ? ` (${s.studentId})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    style={{ ...st.assignBtn, opacity: studentToAdd ? 1 : 0.5 }}
                    onClick={handleAddStudent}
                    disabled={!studentToAdd || savingStudent}
                  >
                    {savingStudent ? '...' : 'Assign'}
                  </button>
                </div>
              )}
              {!isAvailable(viewItem) && (
                <p style={{ fontSize: 12, color: '#C62828', fontWeight: 500 }}>
                  Accommodation is at full capacity.
                </p>
              )}
            </div>

            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete
              </button>
              <button style={st.editBtn} onClick={() => navigate(`/admin/accommodation/edit/${viewItem._id}`)}>
                <FaEdit size={12} style={{ marginRight: 6 }} />Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.propertyName}"?`}
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
  summaryRow:    { display: 'flex', gap: 16, marginBottom: 20 },
  summaryCard:   { flex: 1, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  summaryLabel:  { fontSize: 12, color: '#888', marginBottom: 6 },
  summaryValue:  { fontSize: 24, fontWeight: 700 },
  container:     { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 },
  title:         { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  controls:      { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  searchBox:     { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #eee', borderRadius: 6, padding: '6px 12px' },
  searchInput:   { border: 'none', outline: 'none', fontSize: 13, width: 180 },
  select:        { border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#555' },
  viewToggle:    { display: 'flex', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' },
  viewBtn:       { border: 'none', padding: '6px 10px', cursor: 'pointer', fontSize: 14 },
  addBtn:        { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  count:         { fontSize: 12, color: '#aaa', marginBottom: 16 },
  loading:       { textAlign: 'center', color: '#aaa', padding: 40 },
  cardGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card:          { border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff' },
  cardImg:       { background: '#F5F6FA', height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody:      { padding: 14 },
  cardTop:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName:      { fontSize: 14, fontWeight: 600, color: '#3D4F7C' },
  statusBadge:   { borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, flexShrink: 0 },
  cardType:      { fontSize: 12, color: '#888', marginBottom: 2 },
  cardAddr:      { fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 },
  cardFooter:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price:         { fontSize: 16, fontWeight: 700, color: '#3D4F7C' },
  table:         { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
  th:            { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '2px solid #eee', background: '#F5F6FA' },
  row:           { cursor: 'pointer' },
  td:            { padding: '12px 12px', fontSize: 13 },
  empty:         { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: 13 },
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:         { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName:     { fontWeight: 700, fontSize: 17, color: '#3D4F7C' },
  closeBtn:      { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  detailGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 16, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  studentsSection: { padding: '16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 },
  sectionTitle:  { fontSize: 12, fontWeight: 600, color: '#3D4F7C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' },
  studentChip:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F6FA', borderRadius: 6, padding: '8px 12px' },
  avatar:        { width: 28, height: 28, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  idBadge:       { background: '#F0F4FF', color: '#3D4F7C', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, marginLeft: 6 },
  removeBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, display: 'flex', alignItems: 'center' },
  addStudentRow: { display: 'flex', gap: 8 },
  studentSelect: { flex: 1, border: '1px solid #eee', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', color: '#555' },
  assignBtn:     { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  modalFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  editBtn:       { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  delBtn:        { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
};
