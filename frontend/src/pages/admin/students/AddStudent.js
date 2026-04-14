import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaCamera, FaPlus, FaTimes } from 'react-icons/fa';

export default function AddStudent() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    'address.street': '', 'address.city': '', 'address.postcode': '', 'address.country': '',
    email: '', password: '',
    'permissions.photographicPermission': false,
    'permissions.medicalPermission': false,
    'emergencyContact.name': '', 'emergencyContact.phone': '', 'emergencyContact.relationship': '',
    'medicalInformation.notes': '',
    enrolledCourses: []
  });
  const [documents,   setDocuments]   = useState([]);
  const [allCourses,  setAllCourses]   = useState([]);
  const [docType,     setDocType]      = useState('');
  const [error,       setError]        = useState('');
  const [saving,      setSaving]       = useState(false);

  useEffect(() => {
    api.get('/admin/courses').then(({ data }) => setAllCourses(data)).catch(() => {});
    if (isEdit) {
      api.get(`/admin/students/${id}`).then(({ data }) => {
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          'address.street': data.address?.street || '',
          'address.city': data.address?.city || '',
          'address.postcode': data.address?.postcode || '',
          'address.country': data.address?.country || '',
          email: data.email || '',
          password: '',
          'permissions.photographicPermission': data.permissions?.photographicPermission || false,
          'permissions.medicalPermission': data.permissions?.medicalPermission || false,
          'emergencyContact.name': data.emergencyContact?.name || '',
          'emergencyContact.phone': data.emergencyContact?.phone || '',
          'emergencyContact.relationship': data.emergencyContact?.relationship || '',
          'medicalInformation.notes': data.medicalInformation?.notes || '',
          enrolledCourses: (data.enrolledCourses || []).map(c => c._id || c)
        });
        setDocuments(data.documents || []);
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const buildPayload = () => ({
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    email: form.email,
    ...(form.password && { password: form.password }),
    address: {
      street: form['address.street'],
      city: form['address.city'],
      postcode: form['address.postcode'],
      country: form['address.country']
    },
    permissions: {
      photographicPermission: form['permissions.photographicPermission'],
      medicalPermission: form['permissions.medicalPermission']
    },
    emergencyContact: {
      name: form['emergencyContact.name'],
      phone: form['emergencyContact.phone'],
      relationship: form['emergencyContact.relationship']
    },
    medicalInformation: { notes: form['medicalInformation.notes'] },
    enrolledCourses: form.enrolledCourses,
    documents
  });

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/students/${id}`, buildPayload());
      } else {
        await api.post('/admin/students', buildPayload());
      }
      navigate('/admin/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Students', path: '/admin/students' },
        { label: isEdit ? 'Edit Student' : 'Add New Student' },
      ]} />
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h2 style={styles.title}>{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {error && <span style={styles.error}>{error}</span>}
            <button style={styles.cancelBtn} onClick={() => navigate('/admin/students')}>Cancel</button>
            <button style={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div style={styles.photoBox}><FaCamera size={20} color="#aaa" /></div>

        <div style={styles.threeCol}>
          {/* Left */}
          <div style={styles.col}>
            <Field label="First Name" value={form.firstName} onChange={v => set('firstName', v)} />
            <Field label="Last Name" value={form.lastName} onChange={v => set('lastName', v)} />
            <Field label="Phone Number" value={form.phone} onChange={v => set('phone', v)} />
            <Field label="Street Address" value={form['address.street']} onChange={v => set('address.street', v)} />
            <Field label="City" value={form['address.city']} onChange={v => set('address.city', v)} />
            <Field label="Postcode" value={form['address.postcode']} onChange={v => set('address.postcode', v)} />
            <Field label="Country" value={form['address.country']} onChange={v => set('address.country', v)} />
            <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
            <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} value={form.password} onChange={v => set('password', v)} type="password" />
          </div>

          {/* Middle */}
          <div style={styles.col}>
            <p style={styles.sectionLabel}>Photographic Permission</p>
            <div style={styles.permBox}>
              <p style={{ fontSize: 12, color: '#555', flex: 1 }}>Allow photograph to be taken by the school, published on website and social media.</p>
              <Toggle value={form['permissions.photographicPermission']} onChange={v => set('permissions.photographicPermission', v)} />
            </div>

            <p style={styles.sectionLabel}>Emergency Contact</p>
            <Field label="Contact Name" value={form['emergencyContact.name']} onChange={v => set('emergencyContact.name', v)} />
            <Field label="Relationship" value={form['emergencyContact.relationship']} onChange={v => set('emergencyContact.relationship', v)} />
            <Field label="Contact Phone" value={form['emergencyContact.phone']} onChange={v => set('emergencyContact.phone', v)} />

            <p style={styles.sectionLabel}>Medical Information & Permission</p>
            <div style={styles.permBox}>
              <p style={{ fontSize: 12, color: '#555', flex: 1 }}>Allow administering medication when needed.</p>
              <Toggle value={form['permissions.medicalPermission']} onChange={v => set('permissions.medicalPermission', v)} />
            </div>
            <Field label="Medical Notes" value={form['medicalInformation.notes']} onChange={v => set('medicalInformation.notes', v)} />
          </div>

          {/* Right */}
          <div style={styles.col}>
            <p style={styles.sectionLabel}>Courses</p>
            <div style={styles.courseCheckList}>
              {allCourses.length === 0 && <p style={{ fontSize: 12, color: '#aaa' }}>No courses available.</p>}
              {allCourses.map(c => {
                const checked = form.enrolledCourses.includes(c._id);
                return (
                  <label key={c._id} style={styles.courseCheckItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => set('enrolledCourses', checked
                        ? form.enrolledCourses.filter(id => id !== c._id)
                        : [...form.enrolledCourses, c._id]
                      )}
                      style={{ marginRight: 8, accentColor: '#3D4F7C' }}
                    />
                    <span style={styles.checkCode}>{c.code}</span>
                    <span style={{ fontSize: 13, color: '#333' }}>{c.name}</span>
                    {c.level && <span style={styles.checkLevel}>{c.level}</span>}
                  </label>
                );
              })}
            </div>

            <p style={{ ...styles.sectionLabel, marginTop: 24 }}>Documents</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select style={{ ...styles.select, flex: 1 }} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="">Select document type</option>
                <option>Passport</option>
                <option>ID Card</option>
                <option>Visa</option>
                <option>Insurance</option>
              </select>
              <button style={styles.addDocBtn} onClick={() => { if (docType) { setDocuments(d => [...d, { name: docType, fileUrl: '' }]); setDocType(''); } }}>
                <FaPlus size={10} />
              </button>
            </div>
            {documents.map((doc, i) => (
              <div key={i} style={styles.docItem}>
                <span style={{ fontSize: 13 }}>📄 {doc.name}</span>
                <FaTimes size={10} style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => setDocuments(documents.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder="..." />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div style={{ ...toggleStyles.track, background: value ? '#4A90D9' : '#ccc' }} onClick={() => onChange(!value)}>
      <div style={{ ...toggleStyles.knob, left: value ? 18 : 2 }} />
    </div>
  );
}

const toggleStyles = {
  track: { width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' },
  knob: { width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, transition: 'left 0.2s' }
};

const styles = {
  breadcrumb: { fontSize: 12, color: '#aaa', marginBottom: 20 },
  container: { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  saveBtn: { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 28px', cursor: 'pointer', fontSize: 13 },
  cancelBtn: { background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  error: { fontSize: 12, color: '#C62828' },
  photoBox: { width: 60, height: 60, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  threeCol: { display: 'flex', gap: 40 },
  col: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#3D4F7C', marginBottom: 10, marginTop: 16, borderBottom: '1px solid #eee', paddingBottom: 6 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 4 },
  input: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  select: { width: '100%', border: '1px solid #ddd', borderRadius: 6, outline: 'none', padding: '7px 10px', fontSize: 13, background: '#fff' },
  permBox: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#F5F6FA', borderRadius: 6, marginBottom: 10 },
  addDocBtn: { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer' },
  docItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F6FA', borderRadius: 6, padding: '8px 12px', marginTop: 6 },
  courseCheckList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, padding: '8px 10px' },
  courseCheckItem: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, padding: '2px 0' },
  checkCode: { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 4 },
  checkLevel: { fontSize: 11, color: '#888', marginLeft: 4 }
};
