import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaEdit, FaBook, FaUsers } from 'react-icons/fa';

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

export default function StaffDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/staff/${id}`)
      .then(({ data }) => setTeacher(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Loading...</p></Layout>;
  if (!teacher)  return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Staff member not found.</p></Layout>;

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Staff', path: '/admin/staff' },
        { label: `${teacher.firstName} ${teacher.lastName}` },
      ]} />

      <div style={st.container}>
        <div style={st.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={st.avatar}>{teacher.firstName?.[0]}</div>
            <div>
              <h2 style={st.title}>{teacher.firstName} {teacher.lastName}</h2>
              {teacher.specialization && <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{teacher.specialization}</p>}
            </div>
          </div>
          <button style={st.editBtn} onClick={() => navigate(`/admin/staff/edit/${id}`)}>
            <FaEdit size={12} style={{ marginRight: 6 }} /> Edit Staff
          </button>
        </div>

        <div style={st.infoGrid}>
          <InfoItem label="Email"          value={teacher.email} />
          <InfoItem label="Phone"          value={teacher.phone} />
          <InfoItem label="Specialization" value={teacher.specialization} />
        </div>

        <div style={st.divider} />

        <section style={st.section}>
          <div style={st.sectionHeader}>
            <FaBook size={13} color="#3D4F7C" />
            <h3 style={st.sectionTitle}>Assigned Courses ({teacher.assignedCourses?.length ?? 0})</h3>
          </div>
          {!teacher.assignedCourses?.length
            ? <p style={st.empty}>No courses assigned.</p>
            : (
              <div style={st.chipRow}>
                {teacher.assignedCourses.map(c => (
                  <button key={c._id} style={st.courseChip} onClick={() => navigate(`/admin/organisation/courses/${c._id}`)}>
                    <span style={st.code}>{c.code}</span>
                    <div>
                      <p style={st.chipName}>{c.name}</p>
                      <p style={st.chipSub}>{c.level}{c.level && c.startDate ? ' · ' : ''}{c.startDate ? `${fmt(c.startDate)} – ${fmt(c.endDate)}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          }
        </section>

        <div style={st.divider} />

        <section style={st.section}>
          <div style={st.sectionHeader}>
            <FaUsers size={13} color="#3D4F7C" />
            <h3 style={st.sectionTitle}>Students ({teacher.assignedStudents?.length ?? 0})</h3>
          </div>
          {!teacher.assignedStudents?.length
            ? <p style={st.empty}>No students assigned.</p>
            : (
              <div style={st.chipRow}>
                {teacher.assignedStudents.map(s => (
                  <button key={s._id} style={st.chip} onClick={() => navigate(`/admin/students/${s._id}`)}>
                    <div style={st.chipAvatar}>{s.firstName?.[0]}</div>
                    <div>
                      <p style={st.chipName}>{s.firstName} {s.lastName}</p>
                      {s.email && <p style={st.chipSub}>{s.email}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )
          }
        </section>
      </div>
    </Layout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{value || '—'}</p>
    </div>
  );
}

const st = {
  container:     { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:         { fontSize: 20, fontWeight: 700, color: '#3D4F7C', margin: 0 },
  avatar:        { width: 52, height: 52, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  editBtn:       { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  infoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 20 },
  divider:       { height: 1, background: '#f0f0f0', margin: '20px 0' },
  section:       { marginBottom: 8 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: 600, color: '#3D4F7C', margin: 0 },
  empty:         { color: '#aaa', fontSize: 13 },
  chipRow:       { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip:          { display: 'flex', alignItems: 'center', gap: 10, background: '#F5F6FA', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' },
  courseChip:    { display: 'flex', alignItems: 'center', gap: 10, background: '#F5F6FA', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' },
  chipAvatar:    { width: 32, height: 32, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  code:          { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  chipName:      { fontSize: 13, fontWeight: 500, color: '#333', margin: 0 },
  chipSub:       { fontSize: 11, color: '#aaa', margin: 0 },
};
