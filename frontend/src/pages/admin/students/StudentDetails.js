import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaEdit, FaPrint } from 'react-icons/fa';

const TABS = ['Details', 'Courses', 'Finance'];

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Details');

  useEffect(() => {
    api.get(`/admin/students/${id}`)
      .then(({ data }) => setStudent(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Loading...</p></Layout>;
  if (!student)  return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Student not found.</p></Layout>;

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Students', path: '/admin/students' },
        { label: `${student.firstName} ${student.lastName}` },
      ]} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <FaEdit size={16} color="#aaa" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/students/edit/${id}`)} />
          <FaPrint size={16} color="#aaa" style={{ cursor: 'pointer' }} />
        </div>

        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              style={{ ...styles.tab, borderBottom: activeTab === tab ? '2px solid #4A90D9' : '2px solid transparent', color: activeTab === tab ? '#4A90D9' : '#aaa' }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Details'  && <DetailsTab student={student} />}
        {activeTab === 'Courses'  && <CoursesTab student={student} navigate={navigate} />}
        {activeTab === 'Finance'  && <FinanceTab />}
      </div>
    </Layout>
  );
}

function DetailsTab({ student }) {
  const addr = student.address;
  const addressStr = [addr?.street, addr?.city, addr?.postcode, addr?.country].filter(Boolean).join(', ') || '—';

  return (
    <div style={styles.threeCol}>
      <div style={styles.col}>
        <div style={styles.avatar}>{student.firstName?.[0]}</div>
        <Field label="First Name"   value={student.firstName} />
        <Field label="Last Name"    value={student.lastName} />
        <Field label="Phone"        value={student.phone} />
        <Field label="Address"      value={addressStr} />
        <Field label="Email"        value={student.email} />
      </div>
      <div style={styles.col}>
        <label style={styles.label}>Photographic Permission</label>
        <div style={styles.permBox}>
          <p style={{ fontSize: 12, flex: 1, color: '#555' }}>Photograph taken by the school.</p>
          <Toggle on={student.permissions?.photographicPermission} />
        </div>
        <Field label="Emergency Contact"
          value={[student.emergencyContact?.name, student.emergencyContact?.phone, student.emergencyContact?.relationship].filter(Boolean).join(' / ') || null}
        />
        <label style={styles.label}>Medical Permission</label>
        <div style={styles.permBox}>
          <p style={{ fontSize: 12, flex: 1, color: '#555' }}>Administer medication when needed.</p>
          <Toggle on={student.permissions?.medicalPermission} />
        </div>
        {student.medicalInformation?.notes && (
          <Field label="Medical Notes" value={student.medicalInformation.notes} />
        )}
      </div>
      <div style={styles.col}>
        <label style={styles.label}>Documents</label>
        {student.documents?.length > 0
          ? student.documents.map((d, i) => (
              <div key={i} style={styles.docItem}>📄 {d.name || d.type || 'Document'}</div>
            ))
          : <p style={{ fontSize: 13, color: '#aaa' }}>No documents.</p>
        }
      </div>
    </div>
  );
}

function CoursesTab({ student, navigate }) {
  const courses = student.enrolledCourses || [];

  if (!courses.length) {
    return <p style={{ color: '#aaa', fontSize: 13, padding: '20px 0' }}>Not enrolled in any courses.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {courses.map(course => {
        const teachers = course.teachers?.length > 0 ? course.teachers : (course.teacher ? [course.teacher] : []);
        return (
          <div key={course._id} style={styles.courseCard}>
            <div style={styles.courseCardTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={styles.code}>{course.code}</span>
                {course.level && <span style={styles.level}>{course.level}</span>}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#3D4F7C' }}>{course.name}</span>
              </div>
              <button style={styles.viewBtn} onClick={() => navigate(`/admin/organisation/courses/${course._id}`)}>
                View Course →
              </button>
            </div>
            <div style={styles.courseCardInfo}>
              <span style={{ fontSize: 12, color: '#888' }}>{fmt(course.startDate)} – {fmt(course.endDate)}</span>
            </div>
            {teachers.length > 0 && (
              <div style={styles.teacherRow}>
                <span style={{ fontSize: 12, color: '#aaa', marginRight: 8 }}>Teachers:</span>
                {teachers.map(t => (
                  <button key={t._id} style={styles.teacherChip} onClick={() => navigate(`/admin/staff/${t._id}`)}>
                    <div style={styles.smallAvatar}>{t.firstName?.[0]}</div>
                    {t.firstName} {t.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FinanceTab() {
  const rows = [
    { id: 'INV-001', subject: 'Course Fee', pending: '£ 3,000', paid: '£ 3,000', total: '£ 6,000', status: 'Paid' },
    { id: 'INV-002', subject: 'Course Fee', pending: '£ 3,000', paid: '£ 3,000', total: '£ 6,000', status: 'Pending' },
  ];
  return (
    <div>
      <table style={styles.table}>
        <thead>
          <tr>
            {['Invoice', 'Subject', 'Pending', 'Paid', 'Total', 'Status'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={styles.tableRow}>
              <td style={styles.td}>{r.id}</td>
              <td style={styles.td}>{r.subject}</td>
              <td style={styles.td}>{r.pending}</td>
              <td style={styles.td}>{r.paid}</td>
              <td style={styles.td}>{r.total}</td>
              <td style={styles.td}>
                <span style={{ color: r.status === 'Paid' ? '#4A90D9' : '#E8A838' }}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={styles.label}>{label}</p>
      <p style={{ fontSize: 13, color: '#888', borderBottom: '1px solid #eee', paddingBottom: 4 }}>{value || '—'}</p>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#4A90D9' : '#ccc', position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.2s' }} />
    </div>
  );
}

const styles = {
  container:    { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar:       { display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 },
  tabs:         { display: 'flex', gap: 0, borderBottom: '1px solid #eee', marginBottom: 24 },
  tab:          { padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  threeCol:     { display: 'flex', gap: 30, flexWrap: 'wrap' },
  col:          { flex: '1 1 200px', minWidth: 180 },
  avatar:       { width: 50, height: 50, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 16 },
  label:        { fontSize: 12, color: '#aaa', marginBottom: 4 },
  permBox:      { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#F5F6FA', borderRadius: 6, marginBottom: 10 },
  docItem:      { background: '#F5F6FA', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 8 },
  courseCard:   { border: '1px solid #eee', borderRadius: 8, padding: '14px 16px' },
  courseCardTop:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  courseCardInfo:{ marginBottom: 10 },
  code:         { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 },
  level:        { background: '#F0F4FF', color: '#3D4F7C', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500 },
  viewBtn:      { background: 'none', border: '1px solid #3D4F7C', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#3D4F7C', whiteSpace: 'nowrap' },
  teacherRow:   { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  teacherChip:  { display: 'flex', alignItems: 'center', gap: 6, background: '#F5F6FA', border: '1px solid #eee', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#333' },
  smallAvatar:  { width: 22, height: 22, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { textAlign: 'left', fontSize: 12, color: '#aaa', padding: '8px', borderBottom: '1px solid #eee' },
  tableRow:     { borderBottom: '1px solid #f5f5f5' },
  td:           { padding: '12px 8px', fontSize: 13 },
};
