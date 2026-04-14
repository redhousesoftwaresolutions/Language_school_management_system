import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaCamera, FaPlus, FaTimes, FaUpload, FaFilePdf, FaFileWord, FaFileAlt, FaFile } from 'react-icons/fa';

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
  const [documents,    setDocuments]    = useState([]);
  const [queuedFiles,  setQueuedFiles]  = useState([]);
  const [profileImage, setProfileImage] = useState(null);   // saved filename (edit)
  const [queuedImage,  setQueuedImage]  = useState(null);   // { file, preview } (add)
  const [allCourses,   setAllCourses]   = useState([]);
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef  = useRef();
  const imageInputRef = useRef();

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
        setProfileImage(data.profileImage || null);
        setQueuedFiles([]);
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
  });

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      let studentId = id;
      if (isEdit) {
        await api.put(`/admin/students/${id}`, buildPayload());
      } else {
        const { data } = await api.post('/admin/students', buildPayload());
        studentId = data._id;
      }
      // Upload queued profile image
      if (queuedImage) {
        const fd = new FormData();
        fd.append('file', queuedImage.file);
        await api.post(`/admin/students/${studentId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      // Upload any queued files
      for (const { file, label } of queuedFiles) {
        const fd = new FormData();
        fd.append('file', file);
        if (label) fd.append('label', label);
        await api.post(`/admin/students/${studentId}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/admin/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  // Edit mode: upload immediately
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (isEdit) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post(`/admin/students/${id}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDocuments(data.documents || []);
      } catch (err) { setError(err.response?.data?.message || 'Upload failed'); }
      finally { setUploading(false); }
    } else {
      setQueuedFiles(prev => [...prev, { file, label: '' }]);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      const { data } = await api.delete(`/admin/students/${id}/documents/${docId}`);
      setDocuments(data.documents || []);
    } catch { setError('Failed to delete document'); }
  };

  const removeQueued = (idx) => setQueuedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (isEdit) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const { data } = await api.post(`/admin/students/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setProfileImage(data.profileImage || null);
      } catch (err) { setError('Image upload failed'); }
    } else {
      const preview = URL.createObjectURL(file);
      setQueuedImage({ file, preview });
    }
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

        <label style={styles.photoBox} title="Click to upload photo">
          {(profileImage || queuedImage)
            ? <img src={queuedImage ? queuedImage.preview : `http://localhost:5000/uploads/profiles/students/${profileImage}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <FaCamera size={20} color="#aaa" />}
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
        </label>

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <p style={{ ...styles.sectionLabel, marginTop: 0, marginBottom: 0 }}>Documents</p>
              <label style={styles.uploadBtn}>
                {uploading ? 'Uploading...' : <><FaUpload size={10} style={{ marginRight: 4 }} />Upload</>}
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={handleFileSelect} disabled={uploading || saving} />
              </label>
            </div>
            <p style={styles.docHint}>PDF, Word, images — max 10MB each</p>

            {/* Saved docs (edit mode) */}
            {documents.map(doc => (
              <div key={doc._id} style={styles.docItem}>
                <DocIcon mimetype={doc.mimetype} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={`http://localhost:5000/uploads/students/${doc.filename}`} target="_blank" rel="noreferrer" style={styles.docLink}>{doc.originalName}</a>
                  {doc.label && <span style={styles.docLabel}>{doc.label}</span>}
                  <span style={styles.docMeta}>{fmtSize(doc.size)}</span>
                </div>
                {isEdit && <FaTimes size={10} style={{ cursor: 'pointer', color: '#ccc', flexShrink: 0 }} onClick={() => handleDeleteDoc(doc._id)} />}
              </div>
            ))}

            {/* Queued files (add mode) */}
            {queuedFiles.map((q, i) => (
              <div key={i} style={{ ...styles.docItem, background: '#FFFBEA', border: '1px dashed #F0C040' }}>
                <DocIcon mimetype={q.file.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{q.file.name}</span>
                  <span style={styles.docMeta}>{fmtSize(q.file.size)} · will upload on save</span>
                </div>
                <FaTimes size={10} style={{ cursor: 'pointer', color: '#ccc', flexShrink: 0 }} onClick={() => removeQueued(i)} />
              </div>
            ))}

            {documents.length === 0 && queuedFiles.length === 0 && (
              <p style={styles.noDocsMsg}>No documents yet.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ mimetype }) {
  if (!mimetype) return <FaFile size={13} color="#aaa" />;
  if (mimetype === 'application/pdf') return <FaFilePdf size={13} color="#C62828" />;
  if (mimetype.includes('word')) return <FaFileWord size={13} color="#1565C0" />;
  if (mimetype.startsWith('image/')) return <FaFileAlt size={13} color="#2E7D32" />;
  return <FaFile size={13} color="#aaa" />;
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
  photoBox: { width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, cursor: 'pointer', overflow: 'hidden', border: '2px dashed #ddd', flexShrink: 0 },
  threeCol: { display: 'flex', gap: 40 },
  col: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#3D4F7C', marginBottom: 10, marginTop: 16, borderBottom: '1px solid #eee', paddingBottom: 6 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 4 },
  input: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  select: { width: '100%', border: '1px solid #ddd', borderRadius: 6, outline: 'none', padding: '7px 10px', fontSize: 13, background: '#fff' },
  permBox: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#F5F6FA', borderRadius: 6, marginBottom: 10 },
  uploadBtn:  { display: 'inline-flex', alignItems: 'center', background: '#F0F4FF', color: '#3D4F7C', border: '1px solid #C5D0E8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  docHint:    { fontSize: 11, color: '#bbb', marginTop: 4, marginBottom: 8 },
  docItem:    { display: 'flex', alignItems: 'center', gap: 8, background: '#F5F6FA', borderRadius: 6, padding: '7px 10px', marginTop: 5 },
  docLink:    { display: 'block', fontSize: 12, color: '#3D4F7C', fontWeight: 500, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docLabel:   { display: 'inline-block', background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '1px 6px', fontSize: 10, marginRight: 4 },
  docMeta:    { fontSize: 10, color: '#aaa', display: 'block' },
  noDocsMsg:  { fontSize: 12, color: '#bbb', fontStyle: 'italic', marginTop: 8 },
  courseCheckList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, padding: '8px 10px' },
  courseCheckItem: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, padding: '2px 0' },
  checkCode: { background: '#EBF3FF', color: '#4A90D9', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 4 },
  checkLevel: { fontSize: 11, color: '#888', marginLeft: 4 }
};
