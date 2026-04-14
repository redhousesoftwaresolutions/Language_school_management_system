import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaEdit, FaUser, FaUsers } from 'react-icons/fa';

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/courses/${id}`)
      .then(({ data }) => setCourse(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Loading...</p></Layout>;
  if (!course)  return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Course not found.</p></Layout>;

  const teachers = course.teachers?.length > 0 ? course.teachers : (course.teacher ? [course.teacher] : []);

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'Courses', path: '/admin/organisation/courses' },
        { label: course.name },
      ]} />

      <div style={st.container}>
        <div style={st.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={st.title}>{course.name}</h2>
              <span style={st.code}>{course.code}</span>
              {course.level && <span style={st.level}>{course.level}</span>}
            </div>
            {course.description && <p style={{ fontSize: 13, color: '#888' }}>{course.description}</p>}
          </div>
          <button style={st.editBtn} onClick={() => navigate(`/admin/organisation/courses/edit/${id}`)}>
            <FaEdit size={12} style={{ marginRight: 6 }} /> Edit Course
          </button>
        </div>

        <div style={st.infoGrid}>
          <InfoItem label="Start Date"   value={fmt(course.startDate)} />
          <InfoItem label="End Date"     value={fmt(course.endDate)} />
          <InfoItem label="Price"        value={course.price ? `£${course.price.toLocaleString()}` : '—'} />
          <InfoItem label="Max Students" value={course.maxStudents ?? '—'} />
        </div>

        <div style={st.divider} />

        <section style={st.section}>
          <div style={st.sectionHeader}>
            <FaUser size={13} color="#3D4F7C" />
            <h3 style={st.sectionTitle}>Teachers ({teachers.length})</h3>
          </div>
          {teachers.length === 0
            ? <p style={st.empty}>No teachers assigned.</p>
            : (
              <div style={st.chipRow}>
                {teachers.map(t => (
                  <button key={t._id} style={st.chip} onClick={() => navigate(`/admin/staff/${t._id}`)}>
                    <div style={st.chipAvatar}>{t.firstName?.[0]}</div>
                    <div>
                      <p style={st.chipName}>{t.firstName} {t.lastName}</p>
                      {t.specialization && <p style={st.chipSub}>{t.specialization}</p>}
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
            <h3 style={st.sectionTitle}>Enrolled Students ({course.students?.length ?? 0})</h3>
          </div>
          {!course.students?.length
            ? <p style={st.empty}>No students enrolled.</p>
            : (
              <div style={st.chipRow}>
                {course.students.map(s => (
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
      <p style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{value}</p>
    </div>
  );
}

const st = {
  container:     { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:         { fontSize: 20, fontWeight: 700, color: '#3D4F7C', margin: 0 },
  code:          { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '2px 8px', fontSize: 12 },
  level:         { background: '#F0F4FF', color: '#3D4F7C', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500 },
  editBtn:       { display: 'flex', alignItems: 'center', background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  infoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 20 },
  divider:       { height: 1, background: '#f0f0f0', margin: '20px 0' },
  section:       { marginBottom: 8 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: 600, color: '#3D4F7C', margin: 0 },
  empty:         { color: '#aaa', fontSize: 13 },
  chipRow:       { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip:          { display: 'flex', alignItems: 'center', gap: 10, background: '#F5F6FA', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' },
  chipAvatar:    { width: 32, height: 32, borderRadius: '50%', background: '#3D4F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  chipName:      { fontSize: 13, fontWeight: 500, color: '#333', margin: 0 },
  chipSub:       { fontSize: 11, color: '#aaa', margin: 0 },
};
