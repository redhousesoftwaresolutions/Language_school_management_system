import { useState, useEffect, useMemo } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const CATEGORIES = ['All', 'Tuition', 'Accommodation', 'Admin Fee', 'Other'];
const emptyForm  = { source: '', category: 'Tuition', amount: '', date: '', method: 'Bank Transfer', notes: '' };
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }

export default function Income() {
  const [income,      setIncome]      = useState([]);
  const [search,      setSearch]      = useState('');
  const [sortField,   setSortField]   = useState('date');
  const [sortDir,     setSortDir]     = useState('desc');
  const [filterCat,   setFilterCat]   = useState('All');
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [viewItem,    setViewItem]    = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/admin/finance/income')
      .then(({ data }) => setIncome(data))
      .catch(() => setIncome([]))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ source: item.source || '', category: item.category || 'Tuition', amount: item.amount || '', date: item.date ? item.date.slice(0, 10) : '', method: item.method || 'Bank Transfer', notes: item.notes || '' });
    setViewItem(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/admin/finance/income/${editTarget._id}`, form);
        setIncome(prev => prev.map(i => i._id === editTarget._id ? data : i));
      } else {
        const { data } = await api.post('/admin/finance/income', form);
        setIncome(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/finance/income/${deleteTarget._id}`);
      setIncome(prev => prev.filter(i => i._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...income];
    if (search) list = list.filter(i => `${i.reference} ${i.source}`.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'All') list = list.filter(i => i.category === filterCat);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [income, search, filterCat, sortField, sortDir]);

  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
  const byCat = CATEGORIES.slice(1).map(cat => ({ category: cat, total: income.filter(i => i.category === cat).reduce((s, i) => s + (i.amount || 0), 0) }));

  return (
    <Layout>
      <style>{`.list-row td { background: #fff; transition: background 0.15s; } .list-row:hover td { background: #D0D3DC !important; }`}</style>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Finance', path: '/admin/finance/invoices' },
        { label: 'Income' },
      ]} />

      <div style={st.summaryRow}>
        <div style={st.summaryCard}>
          <p style={st.summaryLabel}>Total Income</p>
          <p style={{ ...st.summaryValue, color: '#3D4F7C' }}>£{totalIncome.toLocaleString()}</p>
        </div>
        {byCat.map(c => (
          <div key={c.category} style={st.summaryCard}>
            <p style={st.summaryLabel}>{c.category}</p>
            <p style={{ ...st.summaryValue, color: '#4A90D9' }}>£{c.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={st.chartCard}>
        <h3 style={st.cardTitle}>Income by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCat} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="category" fontSize={12} tick={{ fill: '#aaa' }} />
            <YAxis fontSize={12} tick={{ fill: '#aaa' }} />
            <Tooltip formatter={v => `£${v.toLocaleString()}`} />
            <Bar dataKey="total" fill="#3D4F7C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Income Records</h2>
          <div style={st.controls}>
            <div style={st.searchBox}>
              <FaSearch size={13} color="#aaa" />
              <input style={st.searchInput} placeholder="Search source or ref..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={st.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button style={st.addBtn} onClick={openAdd}><FaPlus size={11} /> Add Income</button>
          </div>
        </div>

        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead>
              <tr>
                <SortHeader label="Ref"      field="reference" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Source"   field="source"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Category" field="category"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Amount"   field="amount"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Date"     field="date"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Method"   field="method"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} className="list-row" style={st.row} onClick={() => setViewItem(item)}>
                  <td style={{ ...st.td, color: '#4A90D9', fontWeight: 500 }}>{item.reference}</td>
                  <td style={st.td}>{item.source}</td>
                  <td style={st.td}><span style={st.catBadge}>{item.category}</span></td>
                  <td style={{ ...st.td, fontWeight: 600 }}>£{item.amount?.toLocaleString()}</td>
                  <td style={st.td}>{fmtDate(item.date)}</td>
                  <td style={st.td}>{item.method}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={st.empty}>No income records found.</td></tr>}
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
                <p style={st.modalName}>{viewItem.reference}</p>
                <span style={st.catBadge}>{viewItem.category}</span>
              </div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Source"   value={viewItem.source} span />
              <Detail label="Amount"   value={viewItem.amount ? `£${viewItem.amount.toLocaleString()}` : null} />
              <Detail label="Date"     value={fmtDate(viewItem.date)} />
              <Detail label="Category" value={viewItem.category} />
              <Detail label="Method"   value={viewItem.method} />
              {viewItem.notes && <Detail label="Notes" value={viewItem.notes} span />}
            </div>
            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete
              </button>
              <button style={st.editBtn} onClick={() => openEdit(viewItem)}>
                <FaEdit size={12} style={{ marginRight: 6 }} />Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Form */}
      {showForm && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <h3 style={st.modalName}>{editTarget ? 'Edit Income' : 'Add Income'}</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setShowForm(false)} />
            </div>
            {[['Source', 'source'], ['Amount (GBP)', 'amount', 'number'], ['Date', 'date', 'date'], ['Notes', 'notes']].map(([label, key, type = 'text']) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</label>
                <input style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} type={type} value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            {[['Category', 'category', ['Tuition', 'Accommodation', 'Admin Fee', 'Other']], ['Method', 'method', ['Bank Transfer', 'Card', 'Cash']]].map(([label, key, opts]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</label>
                <select style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none' }} value={form[key]} onChange={e => set(key, e.target.value)}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button style={st.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete income record "${deleteTarget.reference}"?`}
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
  breadcrumb:   { fontSize: 12, color: '#aaa', marginBottom: 20 },
  summaryRow:   { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard:  { flex: 1, minWidth: 140, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: 700 },
  chartCard:    { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  cardTitle:    { fontSize: 15, fontWeight: 600, color: '#3D4F7C', marginBottom: 16 },
  container:    { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title:        { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  controls:     { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  searchBox:    { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #eee', borderRadius: 6, padding: '6px 12px' },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, width: 180 },
  select:       { border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#555' },
  addBtn:       { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  loading:      { textAlign: 'center', color: '#aaa', padding: 40 },
  table:        { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
  th:           { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '2px solid #eee', background: '#F5F6FA' },
  row:          { cursor: 'pointer' },
  td:           { padding: '12px 12px', fontSize: 13 },
  catBadge:     { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 },
  empty:        { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: 13 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName:    { fontWeight: 700, fontSize: 17, color: '#3D4F7C', marginBottom: 6 },
  closeBtn:     { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  detailGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 24, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  modalFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  editBtn:      { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  delBtn:       { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  saveBtn:      { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', cursor: 'pointer', fontSize: 13 },
  cancelBtn:    { background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
};
