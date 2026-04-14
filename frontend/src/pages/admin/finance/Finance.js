import { useState, useEffect, useMemo } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import ConfirmModal from '../../../components/ConfirmModal';
import SortHeader from '../../../components/SortHeader';
import api from '../../../services/api';
import { generateInvoicePDF } from '../../../utils/generateInvoicePDF';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes, FaDownload, FaFilePdf, FaFileWord, FaFileAlt, FaFile, FaUpload } from 'react-icons/fa';

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB') : '—'; }

const statusStyle = {
  Paid:    { background: '#EDF7ED', color: '#2E7D32' },
  Pending: { background: '#FFF8E1', color: '#F57F17' },
  Overdue: { background: '#FEECEB', color: '#C62828' },
};

const INCOME_CATS   = ['Tuition', 'Accommodation', 'Admin Fee', 'Other'];
const EXPENSE_CATS  = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'IT', 'Insurance', 'Other'];
const METHODS       = ['Bank Transfer', 'Card', 'Cash'];
const EXPENSE_METHODS = ['Bank Transfer', 'Card', 'Cash', 'Direct Debit'];

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ school }) {
  const [items,        setItems]        = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('issuedDate');
  const [sortDir,      setSortDir]      = useState('desc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const [students,     setStudents]     = useState([]);
  const [courses,      setCourses]      = useState([]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const emptyForm = { student: '', course: '', amount: '', dueDate: '', status: 'Pending', description: '', notes: '' };

  useEffect(() => {
    api.get('/admin/finance/invoices').then(({ data }) => setItems(data)).catch(() => setItems([])).finally(() => setLoading(false));
    api.get('/admin/students').then(({ data }) => setStudents(data)).catch(() => {});
    api.get('/admin/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (inv) => {
    setEditTarget(inv);
    setForm({ student: inv.student?._id || '', course: inv.course?._id || '', amount: inv.amount || '', dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '', status: inv.status || 'Pending', description: inv.description || '', notes: inv.notes || '' });
    setViewItem(null); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/admin/finance/invoices/${editTarget._id}`, form);
        setItems(prev => prev.map(i => i._id === editTarget._id ? data : i));
      } else {
        const { data } = await api.post('/admin/finance/invoices', form);
        setItems(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/finance/invoices/${deleteTarget._id}`);
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) list = list.filter(i => {
      const name = i.student ? `${i.student.firstName} ${i.student.lastName}` : '';
      return `${i.invoiceNumber} ${name}`.toLowerCase().includes(search.toLowerCase());
    });
    if (filterStatus !== 'All') list = list.filter(i => i.status === filterStatus);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [items, search, filterStatus, sortField, sortDir]);

  const total   = items.reduce((s, i) => s + (i.amount || 0), 0);
  const paid    = items.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  const pending = items.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.amount || 0), 0);
  const overdue = items.filter(i => i.status === 'Overdue').reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <div style={st.tabDesc}>Track money owed by students for courses. Generate PDF invoices to send as receipts.</div>
      <div style={st.summaryRow}>
        {[{ label: 'Total Invoiced', value: `£${total.toLocaleString()}`, color: '#3D4F7C' }, { label: 'Paid', value: `£${paid.toLocaleString()}`, color: '#2E7D32' }, { label: 'Pending', value: `£${pending.toLocaleString()}`, color: '#F57F17' }, { label: 'Overdue', value: `£${overdue.toLocaleString()}`, color: '#C62828' }].map(s => (
          <div key={s.label} style={st.summaryCard}>
            <p style={st.summaryLabel}>{s.label}</p>
            <p style={{ ...st.summaryValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Invoices</h2>
          <div style={st.controls}>
            <div style={st.searchBox}><FaSearch size={13} color="#aaa" /><input style={st.searchInput} placeholder="Search invoice or student..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select style={st.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {['All', 'Paid', 'Pending', 'Overdue'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button style={st.addBtn} onClick={openAdd}><FaPlus size={11} /> New Invoice</button>
          </div>
        </div>
        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead><tr>
              <SortHeader label="Invoice #" field="invoiceNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th style={st.th}>Student</th>
              <th style={st.th}>Course</th>
              <SortHeader label="Amount" field="amount"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Due"    field="dueDate"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Status" field="status"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            </tr></thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv._id} className="list-row" style={st.row} onClick={() => setViewItem(inv)}>
                  <td style={{ ...st.td, color: '#4A90D9', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                  <td style={st.td}>{inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : '—'}</td>
                  <td style={st.td}>{inv.course?.name || '—'}</td>
                  <td style={{ ...st.td, fontWeight: 600 }}>£{inv.amount?.toLocaleString()}</td>
                  <td style={st.td}>{fmtDate(inv.dueDate)}</td>
                  <td style={st.td}><span style={{ ...st.badge, ...(statusStyle[inv.status] || {}) }}>{inv.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={st.empty}>No invoices found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <div><p style={st.modalName}>{viewItem.invoiceNumber}</p><span style={{ ...st.badge, ...(statusStyle[viewItem.status] || {}) }}>{viewItem.status}</span></div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Student"     value={viewItem.student ? `${viewItem.student.firstName} ${viewItem.student.lastName}` : null} />
              <Detail label="Course"      value={viewItem.course?.name} />
              <Detail label="Amount"      value={viewItem.amount ? `£${viewItem.amount.toLocaleString()}` : null} />
              <Detail label="Status"      value={viewItem.status} />
              <Detail label="Issued Date" value={fmtDate(viewItem.issuedDate)} />
              <Detail label="Due Date"    value={fmtDate(viewItem.dueDate)} />
              {viewItem.description && <Detail label="Description" value={viewItem.description} span />}
              {viewItem.notes && <Detail label="Notes" value={viewItem.notes} span />}
            </div>
            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}><FaTrash size={12} style={{ marginRight: 6 }} />Delete</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={st.pdfBtn} onClick={() => generateInvoicePDF(viewItem, school)}><FaDownload size={12} style={{ marginRight: 6 }} />Download PDF</button>
                <button style={st.editBtn} onClick={() => openEdit(viewItem)}><FaEdit size={12} style={{ marginRight: 6 }} />Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <h3 style={st.modalName}>{editTarget ? 'Edit Invoice' : 'New Invoice'}</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setShowForm(false)} />
            </div>
            <div style={st.formGroup}>
              <label style={st.label}>Student</label>
              <select style={st.modalInput} value={form.student} onChange={e => set('student', e.target.value)}>
                <option value="">— Select student —</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
              </select>
            </div>
            <div style={st.formGroup}>
              <label style={st.label}>Course</label>
              <select style={st.modalInput} value={form.course} onChange={e => set('course', e.target.value)}>
                <option value="">— Select course —</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <FF label="Amount (GBP)" value={form.amount}      onChange={v => set('amount', v)}      type="number" />
            <FF label="Due Date"     value={form.dueDate}     onChange={v => set('dueDate', v)}     type="date" />
            <div style={st.formGroup}>
              <label style={st.label}>Status</label>
              <select style={st.modalInput} value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Pending</option><option>Paid</option><option>Overdue</option>
              </select>
            </div>
            <FF label="Description" value={form.description} onChange={v => set('description', v)} />
            <FF label="Notes"       value={form.notes}       onChange={v => set('notes', v)} />
            <div style={st.formFooter}>
              <button style={st.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmModal message={`Delete invoice ${deleteTarget.invoiceNumber}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}

// ─── Income Tab ───────────────────────────────────────────────────────────────
function IncomeTab() {
  const [items,        setItems]        = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('date');
  const [sortDir,      setSortDir]      = useState('desc');
  const [filterCat,    setFilterCat]    = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const emptyForm = { source: '', category: 'Tuition', amount: '', date: '', method: 'Bank Transfer', description: '', notes: '' };

  useEffect(() => {
    api.get('/admin/finance/income').then(({ data }) => setItems(data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ source: item.source || '', category: item.category || 'Tuition', amount: item.amount || '', date: item.date ? item.date.slice(0, 10) : '', method: item.method || 'Bank Transfer', description: item.description || '', notes: item.notes || '' });
    setViewItem(null); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/admin/finance/income/${editTarget._id}`, form);
        setItems(prev => prev.map(i => i._id === editTarget._id ? data : i));
      } else {
        const { data } = await api.post('/admin/finance/income', form);
        setItems(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/finance/income/${deleteTarget._id}`);
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) list = list.filter(i => `${i.reference} ${i.source} ${i.description || ''}`.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'All') list = list.filter(i => i.category === filterCat);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [items, search, filterCat, sortField, sortDir]);

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <div style={st.tabDesc}>Record all money received by the school — tuition fees, accommodation payments, grants, and other income sources.</div>
      <div style={st.summaryRow}>
        <div style={st.summaryCard}>
          <p style={st.summaryLabel}>Total Income</p>
          <p style={{ ...st.summaryValue, color: '#2E7D32' }}>£{total.toLocaleString()}</p>
        </div>
        {INCOME_CATS.map(cat => (
          <div key={cat} style={st.summaryCard}>
            <p style={st.summaryLabel}>{cat}</p>
            <p style={{ ...st.summaryValue, color: '#4A90D9' }}>£{items.filter(i => i.category === cat).reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Income Records</h2>
          <div style={st.controls}>
            <div style={st.searchBox}><FaSearch size={13} color="#aaa" /><input style={st.searchInput} placeholder="Search source or ref..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select style={st.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              {['All', ...INCOME_CATS].map(c => <option key={c}>{c}</option>)}
            </select>
            <button style={st.addBtn} onClick={openAdd}><FaPlus size={11} /> Add Income</button>
          </div>
        </div>
        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead><tr>
              <SortHeader label="Ref"         field="reference"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Source"      field="source"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th style={st.th}>Description</th>
              <SortHeader label="Category"    field="category"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Amount"      field="amount"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Date"        field="date"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Method"      field="method"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            </tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} className="list-row" style={st.row} onClick={() => setViewItem(item)}>
                  <td style={{ ...st.td, color: '#4A90D9', fontWeight: 500 }}>{item.reference}</td>
                  <td style={st.td}>{item.source}</td>
                  <td style={{ ...st.td, color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                  <td style={st.td}><span style={st.catBadge}>{item.category}</span></td>
                  <td style={{ ...st.td, fontWeight: 600 }}>£{item.amount?.toLocaleString()}</td>
                  <td style={st.td}>{fmtDate(item.date)}</td>
                  <td style={st.td}>{item.method}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={st.empty}>No income records found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <div><p style={st.modalName}>{viewItem.reference}</p><span style={st.catBadge}>{viewItem.category}</span></div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Source"      value={viewItem.source} span />
              {viewItem.description && <Detail label="Description" value={viewItem.description} span />}
              <Detail label="Amount"      value={viewItem.amount ? `£${viewItem.amount.toLocaleString()}` : null} />
              <Detail label="Date"        value={fmtDate(viewItem.date)} />
              <Detail label="Category"    value={viewItem.category} />
              <Detail label="Method"      value={viewItem.method} />
              {viewItem.notes && <Detail label="Notes" value={viewItem.notes} span />}
            </div>
            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}><FaTrash size={12} style={{ marginRight: 6 }} />Delete</button>
              <button style={st.editBtn} onClick={() => openEdit(viewItem)}><FaEdit size={12} style={{ marginRight: 6 }} />Edit</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <h3 style={st.modalName}>{editTarget ? 'Edit Income' : 'Add Income'}</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setShowForm(false)} />
            </div>
            <FF label="Source"         value={form.source}      onChange={v => set('source', v)} />
            <FF label="Description"    value={form.description} onChange={v => set('description', v)} />
            <FF label="Amount (GBP)"   value={form.amount}      onChange={v => set('amount', v)}  type="number" />
            <FF label="Date"           value={form.date}        onChange={v => set('date', v)}    type="date" />
            <Sel label="Category" value={form.category} onChange={v => set('category', v)} opts={INCOME_CATS} />
            <Sel label="Method"   value={form.method}   onChange={v => set('method', v)}   opts={METHODS} />
            <FF label="Notes"          value={form.notes}       onChange={v => set('notes', v)} />
            <div style={st.formFooter}>
              <button style={st.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmModal message={`Delete income record "${deleteTarget.reference}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function DocIcon({ mimetype }) {
  if (!mimetype) return <FaFile size={14} color="#aaa" />;
  if (mimetype === 'application/pdf') return <FaFilePdf size={14} color="#C62828" />;
  if (mimetype.includes('word')) return <FaFileWord size={14} color="#1565C0" />;
  if (mimetype.startsWith('image/')) return <FaFileAlt size={14} color="#2E7D32" />;
  return <FaFile size={14} color="#aaa" />;
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ExpensesTab() {
  const [items,        setItems]        = useState([]);
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('date');
  const [sortDir,      setSortDir]      = useState('desc');
  const [filterCat,    setFilterCat]    = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [viewItem,     setViewItem]     = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const emptyForm = { supplier: '', category: 'Other', amount: '', date: '', method: 'Bank Transfer', description: '', notes: '' };

  useEffect(() => {
    api.get('/admin/finance/expenses').then(({ data }) => setItems(data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ supplier: item.supplier || '', category: item.category || 'Other', amount: item.amount || '', date: item.date ? item.date.slice(0, 10) : '', method: item.method || 'Bank Transfer', description: item.description || '', notes: item.notes || '' });
    setViewItem(null); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/admin/finance/expenses/${editTarget._id}`, form);
        setItems(prev => prev.map(i => i._id === editTarget._id ? data : i));
      } else {
        const { data } = await api.post('/admin/finance/expenses', form);
        setItems(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/finance/expenses/${deleteTarget._id}`);
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
    } catch { alert('Delete failed'); }
    setDeleteTarget(null);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !viewItem) return;
    e.target.value = '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/admin/finance/expenses/${viewItem._id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setItems(prev => prev.map(i => i._id === data._id ? data : i));
      setViewItem(data);
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      const { data } = await api.delete(`/admin/finance/expenses/${viewItem._id}/documents/${docId}`);
      setItems(prev => prev.map(i => i._id === data._id ? data : i));
      setViewItem(data);
    } catch { alert('Failed to delete document'); }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) list = list.filter(i => `${i.reference} ${i.supplier} ${i.description || ''}`.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'All') list = list.filter(i => i.category === filterCat);
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [items, search, filterCat, sortField, sortDir]);

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <div style={st.tabDesc}>Track outgoing payments — rent, utilities, salaries, supplies, and invoices received from suppliers.</div>
      <div style={st.summaryRow}>
        <div style={st.summaryCard}>
          <p style={st.summaryLabel}>Total Expenses</p>
          <p style={{ ...st.summaryValue, color: '#C62828' }}>£{total.toLocaleString()}</p>
        </div>
        {EXPENSE_CATS.slice(0, 4).map(cat => (
          <div key={cat} style={st.summaryCard}>
            <p style={st.summaryLabel}>{cat}</p>
            <p style={{ ...st.summaryValue, color: '#E67E22', fontSize: 18 }}>£{items.filter(i => i.category === cat).reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div style={st.container}>
        <div style={st.topRow}>
          <h2 style={st.title}>Expense Records</h2>
          <div style={st.controls}>
            <div style={st.searchBox}><FaSearch size={13} color="#aaa" /><input style={st.searchInput} placeholder="Search supplier or ref..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select style={st.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              {['All', ...EXPENSE_CATS].map(c => <option key={c}>{c}</option>)}
            </select>
            <button style={{ ...st.addBtn, background: '#8B0000' }} onClick={openAdd}><FaPlus size={11} /> Add Expense</button>
          </div>
        </div>
        {loading ? <p style={st.loading}>Loading...</p> : (
          <table style={st.table}>
            <thead><tr>
              <SortHeader label="Ref"         field="reference"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Supplier"    field="supplier"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th style={st.th}>Description</th>
              <SortHeader label="Category"    field="category"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Amount"      field="amount"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Date"        field="date"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th style={st.th}>Docs</th>
            </tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} className="list-row" style={st.row} onClick={() => setViewItem(item)}>
                  <td style={{ ...st.td, color: '#E67E22', fontWeight: 500 }}>{item.reference}</td>
                  <td style={st.td}>{item.supplier}</td>
                  <td style={{ ...st.td, color: '#888', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                  <td style={st.td}><span style={{ ...st.catBadge, background: '#FFF3E0', color: '#E65100' }}>{item.category}</span></td>
                  <td style={{ ...st.td, fontWeight: 600, color: '#C62828' }}>£{item.amount?.toLocaleString()}</td>
                  <td style={st.td}>{fmtDate(item.date)}</td>
                  <td style={st.td}>
                    {item.documents?.length > 0
                      ? <span style={{ background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{item.documents.length}</span>
                      : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={st.empty}>No expense records found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={{ ...st.modal, maxWidth: 520 }}>
            <div style={st.modalHeader}>
              <div><p style={st.modalName}>{viewItem.reference}</p><span style={{ ...st.catBadge, background: '#FFF3E0', color: '#E65100' }}>{viewItem.category}</span></div>
              <button style={st.closeBtn} onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div style={st.detailGrid}>
              <Detail label="Supplier"    value={viewItem.supplier} span />
              {viewItem.description && <Detail label="Description" value={viewItem.description} span />}
              <Detail label="Amount"      value={viewItem.amount ? `£${viewItem.amount.toLocaleString()}` : null} />
              <Detail label="Date"        value={fmtDate(viewItem.date)} />
              <Detail label="Category"    value={viewItem.category} />
              <Detail label="Method"      value={viewItem.method} />
              {viewItem.notes && <Detail label="Notes" value={viewItem.notes} span />}
            </div>

            {/* Documents section */}
            <div style={st.docsSection}>
              <div style={st.docsSectionHeader}>
                <p style={st.docsSectionTitle}>Documents</p>
                <label style={st.uploadBtn}>
                  {uploading ? 'Uploading...' : <><FaUpload size={11} style={{ marginRight: 5 }} />Upload</>}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
              {(!viewItem.documents || viewItem.documents.length === 0) ? (
                <p style={st.noDocsMsg}>No documents attached. Upload a PDF, Word doc, or image.</p>
              ) : (
                <div style={st.docList}>
                  {viewItem.documents.map(doc => (
                    <div key={doc._id} style={st.docRow}>
                      <DocIcon mimetype={doc.mimetype} />
                      <div style={st.docInfo}>
                        <a href={`http://localhost:5000/uploads/expenses/${doc.filename}`} target="_blank" rel="noreferrer" style={st.docName}>{doc.originalName}</a>
                        <span style={st.docMeta}>{fmtSize(doc.size)} · {fmtDate(doc.uploadedAt)}</span>
                      </div>
                      <button style={st.docDel} onClick={() => handleDeleteDoc(doc._id)} title="Remove"><FaTimes size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={st.modalFooter}>
              <button style={st.delBtn} onClick={() => { setViewItem(null); setDeleteTarget(viewItem); }}><FaTrash size={12} style={{ marginRight: 6 }} />Delete</button>
              <button style={st.editBtn} onClick={() => openEdit(viewItem)}><FaEdit size={12} style={{ marginRight: 6 }} />Edit</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <h3 style={st.modalName}>{editTarget ? 'Edit Expense' : 'Add Expense'}</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setShowForm(false)} />
            </div>
            <FF label="Supplier / Vendor" value={form.supplier}    onChange={v => set('supplier', v)} />
            <FF label="Description"       value={form.description} onChange={v => set('description', v)} />
            <FF label="Amount (GBP)"      value={form.amount}      onChange={v => set('amount', v)}  type="number" />
            <FF label="Date"              value={form.date}        onChange={v => set('date', v)}    type="date" />
            <Sel label="Category" value={form.category} onChange={v => set('category', v)} opts={EXPENSE_CATS} />
            <Sel label="Method"   value={form.method}   onChange={v => set('method', v)}   opts={EXPENSE_METHODS} />
            <FF label="Notes"             value={form.notes}       onChange={v => set('notes', v)} />
            <div style={st.formFooter}>
              <button style={st.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={{ ...st.saveBtn, background: '#8B0000' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmModal message={`Delete expense record "${deleteTarget.reference}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────
const TABS = ['Invoices', 'Income', 'Expenses'];

export default function Finance() {
  const [tab,    setTab]    = useState('Invoices');
  const [school, setSchool] = useState({});

  useEffect(() => {
    api.get('/admin/school').then(({ data }) => setSchool(data)).catch(() => {});
  }, []);

  return (
    <Layout>
      <style>{`.list-row td { background: #fff; transition: background 0.15s; } .list-row:hover td { background: #D0D3DC !important; }`}</style>
      <Breadcrumb items={[{ label: '🏠', path: '/admin/dashboard' }, { label: 'Finance' }, { label: tab }]} />

      <div style={st.tabBar}>
        {TABS.map(t => (
          <button key={t} style={{ ...st.tabBtn, ...(tab === t ? st.tabActive : {}) }} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Invoices' && <InvoicesTab school={school} />}
      {tab === 'Income'   && <IncomeTab />}
      {tab === 'Expenses' && <ExpensesTab />}
    </Layout>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function FF({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</label>
      <input style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function Sel({ label, value, onChange, opts }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</label>
      <select style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none' }} value={value} onChange={e => onChange(e.target.value)}>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
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
  tabBar:       { display: 'flex', gap: 4, marginBottom: 24, background: '#fff', borderRadius: 10, padding: '6px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', width: 'fit-content' },
  tabBtn:       { background: 'none', border: 'none', borderRadius: 7, padding: '8px 22px', fontSize: 14, fontWeight: 500, color: '#888', cursor: 'pointer' },
  tabActive:    { background: '#3D4F7C', color: '#fff' },
  tabDesc:      { fontSize: 13, color: '#888', marginBottom: 18, lineHeight: 1.5 },
  summaryRow:   { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard:  { flex: 1, minWidth: 130, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: 700 },
  container:    { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title:        { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  controls:     { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  searchBox:    { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #eee', borderRadius: 6, padding: '6px 12px' },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, width: 200 },
  select:       { border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#555' },
  addBtn:       { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  loading:      { textAlign: 'center', color: '#aaa', padding: 40 },
  table:        { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
  th:           { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '2px solid #eee', background: '#F5F6FA' },
  row:          { cursor: 'pointer' },
  td:           { padding: '12px 12px', fontSize: 13 },
  badge:        { borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
  catBadge:     { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 },
  empty:        { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: 13 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName:    { fontWeight: 700, fontSize: 17, color: '#3D4F7C', marginBottom: 6 },
  closeBtn:     { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  detailGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 24, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  modalFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  formFooter:   { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  formGroup:    { marginBottom: 14 },
  label:        { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  modalInput:   { width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  pdfBtn:       { display: 'flex', alignItems: 'center', background: '#4A90D9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  editBtn:      { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  delBtn:       { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  saveBtn:      { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', cursor: 'pointer', fontSize: 13 },
  cancelBtn:    { background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  // Document styles
  docsSection:      { borderTop: '1px solid #f0f0f0', paddingTop: 16, marginBottom: 16 },
  docsSectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  docsSectionTitle: { fontSize: 13, fontWeight: 600, color: '#3D4F7C' },
  uploadBtn:        { display: 'flex', alignItems: 'center', background: '#F0F4FF', color: '#3D4F7C', border: '1px solid #C5D0E8', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  noDocsMsg:        { fontSize: 12, color: '#bbb', fontStyle: 'italic' },
  docList:          { display: 'flex', flexDirection: 'column', gap: 8 },
  docRow:           { display: 'flex', alignItems: 'center', gap: 10, background: '#F8F9FB', borderRadius: 6, padding: '8px 12px' },
  docInfo:          { flex: 1, minWidth: 0 },
  docName:          { display: 'block', fontSize: 13, color: '#3D4F7C', fontWeight: 500, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docMeta:          { fontSize: 11, color: '#aaa' },
  docDel:           { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, borderRadius: 4, lineHeight: 1 },
};
