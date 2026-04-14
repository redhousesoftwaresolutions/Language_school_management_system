import { useState, useEffect, useMemo } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const statusStyle = {
  Completed: { background: '#EDF7ED', color: '#2E7D32' },
  Pending:   { background: '#FFF8E1', color: '#F57F17' },
  Failed:    { background: '#FEECEB', color: '#C62828' },
};

const emptyForm = { student: '', invoice: '', amount: '', date: '', method: 'Bank Transfer', status: 'Pending', notes: '' };
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }

export default function Payments() {
  const [payments,     setPayments]     = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('date');
  const [sortDir,      setSortDir]      = useState('desc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMethod, setFilterMethod] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/admin/finance/payments')
      .then(({ data }) => setPayments(data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => {
    setEditTarget(p);
    setForm({ student: p.student?._id || '', invoice: p.invoice?._id || '', amount: p.amount || '', date: p.date ? p.date.slice(0, 10) : '', method: p.method || 'Bank Transfer', status: p.status || 'Pending', notes: p.notes || '' });
    setViewItem(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/admin/finance/payments/${editTarget._id}`, form);
        setPayments(prev => prev.map(p => p._id === editTarget._id ? data : p));
      } else {
        const { data } = await api.post('/admin/finance/payments', form);
        setPayments(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/finance/payments/${deleteTarget._id}`);
      setPayments(prev => prev.filter(p => p._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...payments];
    if (search) list = list.filter(p => {
      const name = p.student ? `${p.student.firstName} ${p.student.lastName}` : '';
      return `${p.paymentRef} ${name}`.toLowerCase().includes(search.toLowerCase());
    });
    if (filterStatus !== 'All') list = list.filter(p => p.status === filterStatus);
    if (filterMethod !== 'All') list = list.filter(p => p.method === filterMethod);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [payments, search, filterStatus, filterMethod, sortField, sortDir]);

  const totalReceived = payments.filter(p => p.status === 'Completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending  = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <Layout>
      <style>{`.list-row td { background: #fff; transition: background 0.15s; } .list-row:hover td { background: #D0D3DC !important; }`}</style>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Finance', path: '/admin/finance/invoices' },
        { label: 'Payments' },
      ]} />

      <div style={st.summaryRow}>
        {[{ label: 'Total Received', value: `£${totalReceived.toLocaleString()}`, color: '#2E7D32' }, { label: 'Pending', value: `£${totalPending.toLocaleString()}`, color: '#F57F17' }, { label: 'Transactions', value: payments.length, color: '#3D4F7C' }].map(s => (
          <div key={s.label} style={st.summaryCard}>
            <p style={st.summaryLabel}>{s.label}</p>
            <p style={{ ...st.summaryValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Payments</h2>
          <div style={st.controls}>
            <div style={st.searchBox}>
              <FaSearch size={13} color="#aaa" />
              <input style={st.searchInput} placeholder="Search ref or student..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={st.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {['All', 'Completed', 'Pending', 'Failed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select style={st.select} value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
              {['All', 'Bank Transfer', 'Card', 'Cash'].map(m => <option key={m}>{m}</option>)}
            </select>
            <button style={st.addBtn} onClick={openAdd}><FaPlus size={11} /> Record Payment</button>
          </div>
        </div>

        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead>
              <tr>
                <SortHeader label="Ref"    field="paymentRef" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={st.th}>Student</th>
                <th style={st.th}>Invoice</th>
                <SortHeader label="Amount" field="amount"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Date"   field="date"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Method" field="method"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Status" field="status"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="list-row" style={st.row} onClick={() => setViewItem(p)}>
                  <td style={{ ...st.td, color: '#4A90D9', fontWeight: 500 }}>{p.paymentRef}</td>
                  <td style={st.td}>{p.student ? `${p.student.firstName} ${p.student.lastName}` : '—'}</td>
                  <td style={{ ...st.td, color: '#888' }}>{p.invoice?.invoiceNumber || '—'}</td>
                  <td style={{ ...st.td, fontWeight: 600 }}>£{p.amount?.toLocaleString()}</td>
                  <td style={st.td}>{fmtDate(p.date)}</td>
                  <td style={st.td}>{p.method}</td>
                  <td style={st.td}><span style={{ ...st.badge, ...(statusStyle[p.status] || {}) }}>{p.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={st.empty}>No payments found.</td></tr>}
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
                <p style={st.modalName}>{viewItem.paymentRef}</p>
                <span style={{ ...st.badge, ...(statusStyle[viewItem.status] || {}) }}>{viewItem.status}</span>
              </div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Student" value={viewItem.student ? `${viewItem.student.firstName} ${viewItem.student.lastName}` : null} />
              <Detail label="Invoice" value={viewItem.invoice?.invoiceNumber} />
              <Detail label="Amount"  value={viewItem.amount ? `£${viewItem.amount.toLocaleString()}` : null} />
              <Detail label="Date"    value={fmtDate(viewItem.date)} />
              <Detail label="Method"  value={viewItem.method} />
              <Detail label="Status"  value={viewItem.status} />
              {viewItem.notes && <Detail label="Notes" value={viewItem.notes} span />}
            </div>
            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete
              </button>
              <button style={st.editBtn} onClick={() => openEdit(viewItem)}>
                <FaEdit size={12} style={{ marginRight: 6 }} />Edit Payment
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
              <h3 style={st.modalName}>{editTarget ? 'Edit Payment' : 'Record Payment'}</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setShowForm(false)} />
            </div>
            {[['Student ID', 'student'], ['Invoice ID', 'invoice'], ['Amount (GBP)', 'amount', 'number'], ['Date', 'date', 'date'], ['Notes', 'notes']].map(([label, key, type = 'text']) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</label>
                <input style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} type={type} value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            {[['Method', 'method', ['Bank Transfer', 'Card', 'Cash']], ['Status', 'status', ['Pending', 'Completed', 'Failed']]].map(([label, key, opts]) => (
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
          message={`Delete payment ${deleteTarget.paymentRef}?`}
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
  summaryRow:   { display: 'flex', gap: 16, marginBottom: 20 },
  summaryCard:  { flex: 1, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: 700 },
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
  badge:        { borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
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
