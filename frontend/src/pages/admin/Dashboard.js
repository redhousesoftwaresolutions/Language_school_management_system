import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../../components/Layout';
import api from '../../services/api';

const FINANCE_COLORS = ['#3D4F7C', '#8A9CC8', '#C5CAD9'];
const ATTEND_COLORS  = ['#3D4F7C', '#E8ECF4'];
const STATUS_OPTIONS = ['Backlog', 'In Progress', 'Completed'];
const STATUS_COLOR   = { 'In Progress': '#4A90D9', 'Backlog': '#aaa', 'Completed': '#27ae60' };
const PRIORITY_COLOR = { 'Urgent': '#e74c3c', 'Non-Urgent': '#27ae60' };

const calDays = ['M','T','W','T','F','S','S'];
const calNums = [
  [null,null,null,null,null,1,2],
  [3,4,5,6,7,8,9],
  [10,11,12,13,14,15,16],
  [17,18,19,20,21,22,23],
  [24,25,26,27,28,29,30]
];
const today = new Date().getDate();

const INITIAL_TODOS = [
  { id: 1, title: 'Review new student applications', assignee: 'Admin',   date: '09.04.2026', status: 'In Progress', priority: 'Urgent'     },
  { id: 2, title: 'Update course timetables',        assignee: 'Admin',   date: '10.04.2026', status: 'Backlog',     priority: 'Non-Urgent' },
  { id: 3, title: 'Send invoices for April',         assignee: 'Finance', date: '11.04.2026', status: 'Backlog',     priority: 'Urgent'     },
  { id: 4, title: 'Arrange accommodation viewings',  assignee: 'Admin',   date: '12.04.2026', status: 'Backlog',     priority: 'Non-Urgent' },
  { id: 5, title: 'Chase overdue payments',          assignee: 'Finance', date: '13.04.2026', status: 'In Progress', priority: 'Urgent'     },
  { id: 6, title: 'Update staff contracts',          assignee: 'HR',      date: '14.04.2026', status: 'Backlog',     priority: 'Non-Urgent' },
  { id: 7, title: 'Book external examiner',          assignee: 'Admin',   date: '15.04.2026', status: 'Backlog',     priority: 'Urgent'     },
];

function AssigneeSelect({ value, onChange, teachers, style: extraStyle = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s.filterSelect, ...extraStyle }}>
      <option disabled>── Staff ──</option>
      <option value="Admin">Admin</option>
      <option value="Finance">Finance</option>
      <option value="HR">HR</option>
      <option disabled>── Teachers ──</option>
      {teachers.length === 0 && <option disabled value="">Loading teachers...</option>}
      {teachers.map(t => (
        <option key={t._id} value={`${t.firstName} ${t.lastName}`}>
          {t.firstName} {t.lastName}
        </option>
      ))}
    </select>
  );
}

function TodoTable({ todos, onChange, onDelete, teachers = [], showAll = false }) {
  const list = showAll ? todos : todos.slice(0, 5);
  const teacherNames = new Set(teachers.map(t => `${t.firstName} ${t.lastName}`));
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            <th style={s.th}>Task</th>
            <th style={s.th}>Assigned To</th>
            <th style={s.th}>Date</th>
            <th style={s.th}>Priority</th>
            <th style={s.th}>Status</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {list.map(t => (
            <tr key={t.id} style={{ ...s.tableRow, opacity: t.status === 'Completed' ? 0.5 : 1 }}>
              <td style={{ ...s.td, textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>{t.title}</td>
              <td style={s.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AssigneeSelect
                    value={t.assignee}
                    onChange={val => onChange(t.id, 'assignee', val)}
                    teachers={teachers}
                    style={{ fontSize: 12, padding: '3px 6px' }}
                  />
                  {teacherNames.has(t.assignee) && (
                    <span style={s.teacherTag}>Teacher</span>
                  )}
                </div>
              </td>
              <td style={s.td}>{t.date}</td>
              <td style={s.td}>
                <select
                  value={t.priority}
                  onChange={e => onChange(t.id, 'priority', e.target.value)}
                  style={{ ...s.statusSelect, color: PRIORITY_COLOR[t.priority], borderColor: PRIORITY_COLOR[t.priority] + '66', background: PRIORITY_COLOR[t.priority] + '11' }}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="Non-Urgent">Non-Urgent</option>
                </select>
              </td>
              <td style={s.td}>
                <select
                  value={t.status}
                  onChange={e => onChange(t.id, 'status', e.target.value)}
                  style={{ ...s.statusSelect, color: STATUS_COLOR[t.status], borderColor: STATUS_COLOR[t.status] + '66', background: STATUS_COLOR[t.status] + '11' }}
                >
                  {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </td>
              <td style={s.td}>
                <button style={s.deleteBtn} onClick={() => onDelete(t.id)} title="Remove">✕</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#aaa' }}>No tasks yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AllTodosModal({ todos, onClose, onChange, onDelete, onAdd, teachers }) {
  const [newTitle,    setNewTitle]    = useState('');
  const [newAssignee, setNewAssignee] = useState('Admin');
  const [newPriority, setNewPriority] = useState('Non-Urgent');
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [view, setView] = useState('list'); // 'list' | 'progress'

  const teacherNames = new Set(teachers.map(t => `${t.firstName} ${t.lastName}`));

  const filtered = todos
    .filter(t => filterStatus   === 'All' || t.status   === filterStatus)
    .filter(t => filterPriority === 'All' || t.priority === filterPriority)
    .filter(t => filterAssignee === 'All' || t.assignee === filterAssignee);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim(), assignee: newAssignee, priority: newPriority });
    setNewTitle(''); setNewAssignee('Admin'); setNewPriority('Non-Urgent');
  };

  // Build teacher progress data
  const teacherProgress = teachers.map(teacher => {
    const name       = `${teacher.firstName} ${teacher.lastName}`;
    const assigned   = todos.filter(t => t.assignee === name);
    const completed  = assigned.filter(t => t.status === 'Completed').length;
    const inProgress = assigned.filter(t => t.status === 'In Progress').length;
    const backlog    = assigned.filter(t => t.status === 'Backlog').length;
    const pct        = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;
    return { name, total: assigned.length, completed, inProgress, backlog, pct };
  }).filter(t => t.total > 0);

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Things To Do</span>
          <div style={{ display: 'flex', gap: 4, background: '#f0f2f5', borderRadius: 8, padding: 3 }}>
            {['list','progress'].map(v => (
              <button
                key={v}
                style={{ ...s.tabBtn, background: view === v ? '#fff' : 'transparent', color: view === v ? '#3D4F7C' : '#888', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                onClick={() => setView(v)}
              >
                {v === 'list' ? 'Task List' : 'Teacher Progress'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>
            {todos.filter(t => t.status === 'Completed').length}/{todos.length} done
          </span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {view === 'list' ? (<>
          {/* Filters */}
          <div style={s.filterRow}>
            <label style={s.filterLabel}>Status:</label>
            <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All</option>
              {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <label style={s.filterLabel}>Priority:</label>
            <select style={s.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">All</option>
              <option value="Urgent">Urgent</option>
              <option value="Non-Urgent">Non-Urgent</option>
            </select>
            <label style={s.filterLabel}>Assignee:</label>
            <select style={s.filterSelect} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="All">All</option>
              <option value="Admin">Admin</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              {teachers.map(t => (
                <option key={t._id} value={`${t.firstName} ${t.lastName}`}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Add new task */}
          <div style={s.modalAddRow}>
            <input
              style={{ ...s.addInput, flex: 2 }}
              placeholder="New task title…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <AssigneeSelect value={newAssignee} onChange={setNewAssignee} teachers={teachers} style={{ minWidth: 140 }} />
            <select style={s.filterSelect} value={newPriority} onChange={e => setNewPriority(e.target.value)}>
              <option value="Urgent">Urgent</option>
              <option value="Non-Urgent">Non-Urgent</option>
            </select>
            <button style={s.addBtn} onClick={handleAdd}>+ Add</button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 380 }}>
            <TodoTable todos={filtered} onChange={onChange} onDelete={onDelete} teachers={teachers} showAll />
          </div>
        </>) : (
          /* Teacher Progress View */
          <div style={{ overflowY: 'auto', flex: 1, paddingTop: 8 }}>
            {teacherProgress.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>No tasks assigned to teachers yet.</p>
            ) : teacherProgress.map(tp => (
              <div key={tp.name} style={s.progressCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={s.avatar}>{tp.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tp.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{tp.total} task{tp.total !== 1 ? 's' : ''} assigned</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: tp.pct === 100 ? '#27ae60' : '#3D4F7C' }}>{tp.pct}%</div>
                </div>
                {/* Progress bar */}
                <div style={s.progressBarBg}>
                  <div style={{ ...s.progressBarFill, width: `${tp.pct}%`, background: tp.pct === 100 ? '#27ae60' : '#4A6FA5' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {[
                    { label: 'Backlog',     val: tp.backlog,    color: '#aaa' },
                    { label: 'In Progress', val: tp.inProgress, color: '#4A90D9' },
                    { label: 'Completed',   val: tp.completed,  color: '#27ae60' },
                  ].map(item => (
                    <span key={item.label} style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>
                      {item.val} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats,      setStats]      = useState({ students: 0, staff: 0, courses: 0, invoiceTotal: 0, paid: 0, pending: 0 });
  const [teachers,   setTeachers]   = useState([]);
  const [todos,      setTodos]      = useState(INITIAL_TODOS);
  const [newTodo,    setNewTodo]    = useState('');
  const [newPriority,setNewPriority]= useState('Non-Urgent');
  const [newAssignee,setNewAssignee]= useState('Admin');
  const [showModal,  setShowModal]  = useState(false);
  const [absences]                  = useState([
    { name: 'Sarah Johnson',   subject: 'General English',  dates: '07.04.2026 – 10.04.2026', type: 'Sick Leave'   },
    { name: 'Robert Anderson', subject: 'Academic Writing', dates: '08.04.2026 – 09.04.2026', type: 'Annual Leave' },
  ]);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(err => console.error('Dashboard stats error:', err));
    api.get('/admin/staff').then(r => {
      const data = Array.isArray(r.data) ? r.data : [];
      setTeachers(data);
    }).catch(err => console.error('Teachers fetch error:', err));
  }, []);

  // Dashboard task logic: urgent first, fill up to 5 with non-urgent, never show completed
  const activeTodos    = todos.filter(t => t.status !== 'Completed');
  const urgentTodos    = activeTodos.filter(t => t.priority === 'Urgent');
  const nonUrgentTodos = activeTodos.filter(t => t.priority === 'Non-Urgent');
  const slots          = Math.max(0, 5 - urgentTodos.length);
  const dashboardTodos = [...urgentTodos, ...nonUrgentTodos.slice(0, slots)];
  const hiddenCount    = todos.length - dashboardTodos.length;

  const financeData = [
    { name: 'Paid',    value: stats.paid    || 1 },
    { name: 'Pending', value: stats.pending || 1 },
    { name: 'Other',   value: Math.max(0, (stats.invoiceTotal || 0) - (stats.paid || 0) - (stats.pending || 0)) || 1 },
  ];
  const attendData = [{ name: 'Present', value: 83 }, { name: 'Absent', value: 17 }];

  const updateTodo = (id, field, value) =>
    setTodos(prev => prev.map(t => t.id !== id ? t : { ...t, [field]: value }));

  const deleteTodo = (id) => setTodos(prev => prev.filter(t => t.id !== id));

  const addTodo = (extra = {}) => {
    const title = extra.title ?? newTodo.trim();
    if (!title) return;
    setTodos(prev => [...prev, {
      id:       Date.now(),
      title,
      assignee: extra.assignee ?? newAssignee,
      date:     new Date().toLocaleDateString('en-GB').replaceAll('/', '.'),
      status:   'Backlog',
      priority: extra.priority ?? newPriority,
    }]);
    if (!extra.title) { setNewTodo(''); setNewPriority('Non-Urgent'); setNewAssignee('Admin'); }
  };

  return (
    <Layout>

      {/* ── Stat Tiles ─────────────────────────────────────────────── */}
      <div style={s.tileRow}>
        {[
          { label: 'Students', value: stats.students,                              color: '#4A6FA5', to: '/admin/students' },
          { label: 'Staff',    value: stats.staff,                                 color: '#27ae60', to: '/admin/staff' },
          { label: 'Courses',  value: stats.courses,                               color: '#e67e22', to: '/admin/organisation/courses' },
          { label: 'Revenue',  value: `£${(stats.invoiceTotal||0).toLocaleString()}`, color: '#8e44ad', to: '/admin/finance/invoices' },
        ].map(tile => (
          <div key={tile.label} style={{ ...s.tile, borderTop: `4px solid ${tile.color}` }} onClick={() => navigate(tile.to)}>
            <div style={{ ...s.tileNum, color: tile.color }}>{tile.value}</div>
            <div style={s.tileLabel}>{tile.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts + Calendar ──────────────────────────────────────── */}
      <div style={s.row}>

        <div style={s.card}>
          <p style={s.cardTitle}>Finance</p>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={financeData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value">
                  {financeData.map((_, i) => <Cell key={i} fill={FINANCE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={s.legend}>
            {['Paid','Pending','Other'].map((l,i) => (
              <span key={l} style={s.legendItem}><span style={{ ...s.dot, background: FINANCE_COLORS[i] }} />{l}</span>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <p style={s.cardTitle}>Attendance</p>
          <p style={s.cardSub}>Students</p>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={attendData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} startAngle={90} endAngle={-270} dataKey="value">
                  {attendData.map((_, i) => <Cell key={i} fill={ATTEND_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, color: '#3D4F7C', margin: '4px 0' }}>83%</p>
          <p style={s.cardSub}>Average attendance</p>
        </div>

        <div style={{ ...s.card, minWidth: 220 }}>
          <div style={s.calHeader}>
            <span style={s.cardTitle}>Calendar</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={s.calBtn} onClick={() => navigate('/admin/organisation/calendar')}>{'<'}</button>
              <button style={s.calBtn} onClick={() => navigate('/admin/organisation/calendar')}>{'>'}</button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr>{calDays.map((d,i) => <th key={i} style={s.calTh}>{d}</th>)}</tr></thead>
            <tbody>
              {calNums.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => (
                    <td key={di} style={{ ...s.calTd, background: day === today ? '#3D4F7C' : 'transparent', color: day === today ? '#fff' : '#333', borderRadius: '50%', fontWeight: day === today ? 700 : 400 }}>
                      {day || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button style={s.addOrgBtn} onClick={() => navigate('/admin/organisation/calendar')}>
            + Add Event
          </button>
        </div>
      </div>

      {/* ── Things To Do (top 5) ───────────────────────────────────── */}
      <div style={s.section}>
        <div style={s.secHeader}>
          <span style={s.secTitle}>Things To Do</span>
          <span style={{ fontSize: 12, color: '#27ae60', marginLeft: 'auto' }}>
            {todos.filter(t => t.status === 'Completed').length} of {todos.length} completed
          </span>
        </div>

        {/* Quick-add row */}
        <div style={s.addRow}>
          <input
            style={s.addInput}
            placeholder="Quick add a task…"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <AssigneeSelect value={newAssignee} onChange={setNewAssignee} teachers={teachers} style={{ minWidth: 130 }} />
          <select style={{ ...s.filterSelect, minWidth: 110 }} value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            <option value="Urgent">Urgent</option>
            <option value="Non-Urgent">Non-Urgent</option>
          </select>
          <button style={s.addBtn} onClick={() => addTodo()}>+ Add</button>
        </div>

        <TodoTable todos={dashboardTodos} onChange={updateTodo} onDelete={deleteTodo} teachers={teachers} showAll />

        {hiddenCount > 0 && (
          <p style={s.moreNote}>{hiddenCount} more task{hiddenCount !== 1 ? 's' : ''} in full list</p>
        )}
        <p style={s.seeAll} onClick={() => setShowModal(true)}>See all things to do →</p>
      </div>

      {/* ── Staff Absence ──────────────────────────────────────────── */}
      <div style={s.section}>
        <div style={s.secHeader}>
          <span style={s.secTitle}>Staff Absence</span>
          <button style={s.linkBtn} onClick={() => navigate('/admin/staff')}>View all staff →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={s.th}>Name</th>
                <th style={s.th}>Subject</th>
                <th style={s.th}>Dates</th>
                <th style={s.th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a, i) => (
                <tr key={i} style={s.tableRow}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{a.name}</td>
                  <td style={s.td}>{a.subject}</td>
                  <td style={s.td}>{a.dates}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#4A90D922', color: '#4A90D9', border: '1px solid #4A90D944' }}>{a.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Full List Modal ────────────────────────────────────────── */}
      {showModal && (
        <AllTodosModal
          todos={todos}
          onClose={() => setShowModal(false)}
          onChange={updateTodo}
          onDelete={deleteTodo}
          onAdd={addTodo}
          teachers={teachers}
        />
      )}

    </Layout>
  );
}

const s = {
  tileRow:      { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 },
  tile:         { flex: '1 1 140px', background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer' },
  tileNum:      { fontSize: 28, fontWeight: 700 },
  tileLabel:    { fontSize: 13, color: '#888', marginTop: 4 },
  row:          { display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 },
  card:         { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: '1 1 200px' },
  cardTitle:    { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  cardSub:      { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },
  legend:       { display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 },
  legendItem:   { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' },
  dot:          { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  calHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calBtn:       { border: '1px solid #ddd', background: '#fff', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 11 },
  calTh:        { textAlign: 'center', padding: '3px 0', color: '#999', fontWeight: 500 },
  calTd:        { textAlign: 'center', padding: '4px 2px', fontSize: 11 },
  addOrgBtn:    { marginTop: 12, width: '100%', padding: '8px 0', border: '1px dashed #4A90D9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#4A90D9' },
  section:      { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  secHeader:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  secTitle:     { fontWeight: 600, fontSize: 15 },
  addRow:       { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  addInput:     { flex: 1, minWidth: 160, padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none' },
  addBtn:       { padding: '7px 16px', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table:        { width: '100%', borderCollapse: 'collapse', minWidth: 520 },
  th:           { padding: '8px 10px', fontSize: 12, color: '#888', fontWeight: 600, textAlign: 'left' },
  tableRow:     { borderBottom: '1px solid #f0f0f0' },
  td:           { padding: '10px 10px', fontSize: 13 },
  badge:        { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  deleteBtn:    { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 4 },
  statusSelect: { padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: '1px solid', cursor: 'pointer', outline: 'none' },
  filterSelect: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', cursor: 'pointer' },
  seeAll:       { textAlign: 'center', color: '#4A90D9', fontSize: 13, marginTop: 12, cursor: 'pointer' },
  moreNote:     { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 },
  linkBtn:      { marginLeft: 'auto', background: 'none', border: 'none', color: '#4A90D9', fontSize: 13, cursor: 'pointer', padding: 0 },
  teacherTag:     { fontSize: 10, background: '#3D4F7C22', color: '#3D4F7C', border: '1px solid #3D4F7C44', borderRadius: 10, padding: '2px 6px', whiteSpace: 'nowrap' },
  tabBtn:         { padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' },
  progressCard:   { background: '#f8f9fc', borderRadius: 10, padding: '16px 20px', marginBottom: 12, border: '1px solid #eee' },
  avatar:         { width: 38, height: 38, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  progressBarBg:  { width: '100%', height: 8, background: '#e8ecf4', borderRadius: 4, overflow: 'hidden' },
  progressBarFill:{ height: '100%', borderRadius: 4, transition: 'width 0.4s ease' },
  // Modal
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' },
  modalHeader:  { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 },
  modalTitle:   { fontWeight: 700, fontSize: 18 },
  closeBtn:     { marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888', padding: '2px 6px' },
  filterRow:    { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 },
  filterLabel:  { fontSize: 13, color: '#666', fontWeight: 500 },
  modalAddRow:  { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
};
