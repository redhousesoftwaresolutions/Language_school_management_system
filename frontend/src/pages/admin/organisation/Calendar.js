import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const COLOURS = [
  { label: 'Blue',   value: '#4A90D9' },
  { label: 'Green',  value: '#2E7D32' },
  { label: 'Amber',  value: '#E8A838' },
  { label: 'Red',    value: '#C62828' },
  { label: 'Purple', value: '#6A1B9A' },
  { label: 'Teal',   value: '#00838F' },
];

const emptyForm = { title: '', date: '', startTime: '', endTime: '', location: '', description: '', color: '#4A90D9', allDay: false };

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }
function toDateKey(dateStr) { return dateStr ? dateStr.slice(0, 10) : ''; }
function fmtTime(s, e) { if (!s) return ''; return e ? `${s}–${e}` : s; }

export default function Calendar() {
  const today = new Date();
  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events,       setEvents]       = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [viewEvent,    setViewEvent]    = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/admin/calendar?year=${year}&month=${month}`)
      .then(({ data }) => setEvents(data))
      .catch(() => {});
  }, [year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const openAdd = (day = null) => {
    const dateStr = day
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : '';
    setForm({ ...emptyForm, date: dateStr });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) return alert('Title and date are required.');
    setSaving(true);
    try {
      const { data } = await api.post('/admin/calendar', form);
      setEvents(prev => [...prev, data]);
      setShowForm(false);
      setForm(emptyForm);
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/calendar/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
      setViewEvent(null);
    } catch { alert('Delete failed'); }
  };

  // Build cell lookup: "YYYY-MM-DD" → events[]
  const eventsByDay = {};
  events.forEach(e => {
    const key = toDateKey(e.date);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(e);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selectedKey    = selectedDate
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
    : null;
  const selectedEvents = selectedKey ? (eventsByDay[selectedKey] || []) : [];

  // Upcoming = all events this month sorted by date
  const upcomingEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'Calendar' },
      ]} />

      <div style={st.wrapper}>
        {/* Calendar grid */}
        <div style={st.calContainer}>
          <div style={st.header}>
            <button style={st.navBtn} onClick={prev}><FaChevronLeft size={12} /></button>
            <h2 style={st.monthTitle}>{MONTHS[month]} {year}</h2>
            <button style={st.navBtn} onClick={next}><FaChevronRight size={12} /></button>
            <button style={st.addBtn} onClick={() => openAdd()}>
              <FaPlus size={11} /> Add Event
            </button>
          </div>

          <div style={st.grid}>
            {DAYS.map(d => <div key={d} style={st.dayLabel}>{d}</div>)}
            {cells.map((day, i) => {
              const key       = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
              const dayEvents = key ? (eventsByDay[key] || []) : [];
              const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDate;
              return (
                <div
                  key={i}
                  style={{
                    ...st.cell,
                    background: isSelected ? '#3D4F7C' : isToday ? '#EBF3FF' : '#fff',
                    color: isSelected ? '#fff' : '#333',
                    cursor: day ? 'pointer' : 'default',
                  }}
                  onClick={() => day && setSelectedDate(day === selectedDate ? null : day)}
                  onDoubleClick={() => day && openAdd(day)}
                >
                  {day && (
                    <>
                      <span style={st.dayNum}>{day}</span>
                      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 3 }}>
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? '#fff' : e.color }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p style={st.hint}>Click to select a day · Double-click to add an event on that day</p>
        </div>

        {/* Events panel */}
        <div style={st.eventsPanel}>
          <h3 style={st.eventsTitle}>
            {selectedDate ? `${selectedDate} ${MONTHS[month]}` : `${MONTHS[month]} ${year}`}
          </h3>

          {(selectedDate ? selectedEvents : upcomingEvents).length === 0 && (
            <p style={{ fontSize: 13, color: '#aaa' }}>No events{selectedDate ? ' this day' : ' this month'}.</p>
          )}

          {(selectedDate ? selectedEvents : upcomingEvents).map((e) => (
            <div
              key={e._id}
              style={{ ...st.eventCard, borderLeft: `4px solid ${e.color}`, cursor: 'pointer' }}
              onClick={() => setViewEvent(e)}
            >
              <p style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</p>
              {!selectedDate && (
                <p style={{ fontSize: 11, color: '#4A90D9', marginTop: 2 }}>
                  {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              )}
              {(e.startTime || e.allDay) && (
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  🕑 {e.allDay ? 'All day' : fmtTime(e.startTime, e.endTime)}
                </p>
              )}
              {e.location && <p style={{ fontSize: 12, color: '#888' }}>📍 {e.location}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Event modal */}
      {showForm && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <h3 style={st.modalTitle}>Add Event</h3>
              <button style={st.closeBtn} onClick={() => setShowForm(false)}><FaTimes size={14} /></button>
            </div>

            <MF label="Title *"    value={form.title}       onChange={v => set('title', v)} />
            <MF label="Date *"     value={form.date}        onChange={v => set('date', v)}        type="date" />

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <MF label="Start Time" value={form.startTime} onChange={v => set('startTime', v)} type="time" />
              </div>
              <div style={{ flex: 1 }}>
                <MF label="End Time"   value={form.endTime}   onChange={v => set('endTime', v)}   type="time" />
              </div>
            </div>

            <div style={st.checkRow}>
              <input type="checkbox" id="allDay" checked={form.allDay} onChange={e => set('allDay', e.target.checked)} style={{ accentColor: '#3D4F7C' }} />
              <label htmlFor="allDay" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>All day event</label>
            </div>

            <MF label="Location" value={form.location}    onChange={v => set('location', v)} />
            <MF label="Description" value={form.description} onChange={v => set('description', v)} />

            <div style={{ marginBottom: 16 }}>
              <label style={st.mlabel}>Colour</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {COLOURS.map(c => (
                  <div
                    key={c.value}
                    title={c.label}
                    onClick={() => set('color', c.value)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c.value, cursor: 'pointer',
                      border: form.color === c.value ? '3px solid #3D4F7C' : '2px solid transparent',
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={st.formFooter}>
              <button style={st.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={st.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Event modal */}
      {viewEvent && (
        <div style={st.overlay} onClick={e => e.target === e.currentTarget && setViewEvent(null)}>
          <div style={st.modal}>
            <div style={st.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: viewEvent.color, flexShrink: 0 }} />
                <h3 style={st.modalTitle}>{viewEvent.title}</h3>
              </div>
              <button style={st.closeBtn} onClick={() => setViewEvent(null)}><FaTimes size={14} /></button>
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
              <VRow label="Date" value={new Date(viewEvent.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
              {(viewEvent.startTime || viewEvent.allDay) && <VRow label="Time" value={viewEvent.allDay ? 'All day' : fmtTime(viewEvent.startTime, viewEvent.endTime)} />}
              {viewEvent.location    && <VRow label="Location"    value={viewEvent.location} />}
              {viewEvent.description && <VRow label="Description" value={viewEvent.description} />}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={st.delBtn} onClick={() => handleDelete(viewEvent._id)}>
                <FaTrash size={12} style={{ marginRight: 6 }} />Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function MF({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={st.mlabel}>{label}</label>
      <input
        style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        type={type} value={value} onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function VRow({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#333' }}>{value}</p>
    </div>
  );
}

const st = {
  wrapper:      { display: 'flex', gap: 24, alignItems: 'flex-start' },
  calContainer: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1 },
  header:       { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  navBtn:       { background: '#F5F6FA', border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' },
  monthTitle:   { fontSize: 18, fontWeight: 600, color: '#3D4F7C', flex: 1 },
  addBtn:       { display: 'flex', alignItems: 'center', gap: 6, background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 13 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  dayLabel:     { textAlign: 'center', fontSize: 12, color: '#aaa', fontWeight: 500, padding: '6px 0' },
  cell:         { borderRadius: 8, padding: '8px 4px', minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f0f0f0' },
  dayNum:       { fontSize: 13, fontWeight: 500 },
  hint:         { fontSize: 11, color: '#ccc', marginTop: 10, textAlign: 'center' },
  eventsPanel:  { width: 260, background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flexShrink: 0 },
  eventsTitle:  { fontSize: 14, fontWeight: 600, color: '#3D4F7C', marginBottom: 16 },
  eventCard:    { background: '#F5F6FA', borderRadius: 6, padding: 12, marginBottom: 10 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontWeight: 700, fontSize: 16, color: '#3D4F7C' },
  closeBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#888' },
  mlabel:       { display: 'block', fontSize: 12, color: '#888', marginBottom: 4 },
  checkRow:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  formFooter:   { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  saveBtn:      { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', cursor: 'pointer', fontSize: 13 },
  cancelBtn:    { background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  delBtn:       { display: 'flex', alignItems: 'center', background: '#FEECEB', color: '#C62828', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
};
