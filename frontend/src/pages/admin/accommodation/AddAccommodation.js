import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaCamera, FaTimes } from 'react-icons/fa';

export default function AddAccommodation() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [error,        setError]       = useState('');
  const [saving,       setSaving]      = useState(false);
  const [images,       setImages]      = useState([]);   // saved images (edit)
  const [queuedImages, setQueuedImages]= useState([]);   // { file, preview } (add)
  const photoInputRef = useRef();
  const [form, setForm] = useState({
    propertyName: '', address: '', city: '', postcode: '', country: '',
    roomType: '', capacity: '', pricePerWeek: '', availableFrom: '',
    amenities: '', description: '', landlordName: '', landlordPhone: '', landlordEmail: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/accommodation/${id}`).then(({ data }) => {
        setForm({ propertyName: data.propertyName || '', address: data.address || '', city: data.city || '', postcode: data.postcode || '', country: data.country || '', roomType: data.roomType || '', capacity: data.capacity || '', pricePerWeek: data.pricePerWeek || '', availableFrom: data.availableFrom ? data.availableFrom.slice(0,10) : '', amenities: data.amenities || '', description: data.description || '', landlordName: data.landlordName || '', landlordPhone: data.landlordPhone || '', landlordEmail: data.landlordEmail || '' });
        setImages(data.images || []);
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      let accId = id;
      if (isEdit) {
        await api.put(`/admin/accommodation/${id}`, form);
      } else {
        const { data } = await api.post('/admin/accommodation', form);
        accId = data._id;
      }
      for (const { file } of queuedImages) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/admin/accommodation/${accId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/admin/accommodation');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (isEdit) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const { data } = await api.post(`/admin/accommodation/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(data.images || []);
      } catch (err) { setError('Image upload failed'); }
    } else {
      setQueuedImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    }
  };

  const handleDeleteImage = async (imgId) => {
    try {
      const { data } = await api.delete(`/admin/accommodation/${id}/images/${imgId}`);
      setImages(data.images || []);
    } catch { setError('Failed to delete image'); }
  };

  const removeQueuedImage = (idx) => setQueuedImages(prev => prev.filter((_, i) => i !== idx));

  const allPhotos = [
    ...images.map(img => ({ src: `http://localhost:5000/uploads/accommodation/${img.filename}`, id: img._id, saved: true })),
    ...queuedImages.map((q, i) => ({ src: q.preview, idx: i, saved: false })),
  ];

  const ROOM_TYPES = ['Single Room', 'Double Room', 'Shared Room', 'Studio', 'Apartment'];

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Accommodation', path: '/admin/accommodation' },
        { label: isEdit ? 'Edit Accommodation' : 'Add Accommodation' },
      ]} />
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h2 style={styles.title}>{isEdit ? 'Edit Accommodation' : 'Add New Accommodation'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {error && <span style={{ fontSize: 12, color: '#C62828' }}>{error}</span>}
            <button style={styles.cancelBtn} onClick={() => navigate('/admin/accommodation')}>Cancel</button>
            <button style={styles.saveBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        {/* Photo Upload */}
        <div style={styles.photoRow}>
          {allPhotos.map((photo) => (
            <div key={photo.saved ? photo.id : `q${photo.idx}`} style={styles.photoBox}>
              <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              <button style={styles.photoDelBtn} onClick={() => photo.saved ? handleDeleteImage(photo.id) : removeQueuedImage(photo.idx)}>
                <FaTimes size={10} />
              </button>
            </div>
          ))}
          {allPhotos.length < 6 && (
            <label style={{ ...styles.photoBox, cursor: 'pointer' }} title="Add photo">
              <FaCamera size={20} color="#aaa" />
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
            </label>
          )}
          {allPhotos.length === 0 && <p style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>Click the box to add photos</p>}
        </div>

        <div style={styles.threeCol}>
          {/* Property Details */}
          <div style={styles.col}>
            <p style={styles.sectionLabel}>Property Details</p>
            <Field label="Property Name" value={form.propertyName} onChange={v => set('propertyName', v)} />
            <Field label="Address" value={form.address} onChange={v => set('address', v)} />
            <Field label="City" value={form.city} onChange={v => set('city', v)} />
            <Field label="Postcode" value={form.postcode} onChange={v => set('postcode', v)} />
            <Field label="Country" value={form.country} onChange={v => set('country', v)} />
          </div>

          {/* Room Details */}
          <div style={styles.col}>
            <p style={styles.sectionLabel}>Room Details</p>
            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>Room Type</label>
              <select style={styles.select} value={form.roomType} onChange={e => set('roomType', e.target.value)}>
                <option value="">Select Type</option>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Capacity (persons)" value={form.capacity} onChange={v => set('capacity', v)} type="number" />
            <Field label="Price Per Week (GBP)" value={form.pricePerWeek} onChange={v => set('pricePerWeek', v)} type="number" />
            <Field label="Available From" value={form.availableFrom} onChange={v => set('availableFrom', v)} type="date" />
            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>Amenities</label>
              <input style={styles.input} value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="e.g. WiFi, Breakfast, En-suite" />
            </div>
          </div>

          {/* Landlord Details */}
          <div style={styles.col}>
            <p style={styles.sectionLabel}>Landlord / Contact</p>
            <Field label="Landlord Name" value={form.landlordName} onChange={v => set('landlordName', v)} />
            <Field label="Phone" value={form.landlordPhone} onChange={v => set('landlordPhone', v)} />
            <Field label="Email" value={form.landlordEmail} onChange={v => set('landlordEmail', v)} type="email" />
            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>Description / Notes</label>
              <textarea style={styles.textarea} value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Additional notes..." />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder="Placeholder" />
    </div>
  );
}

const styles = {
  breadcrumb: { fontSize: 12, color: '#aaa', marginBottom: 20 },
  container: { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 600, color: '#3D4F7C' },
  saveBtn: { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 28px', cursor: 'pointer', fontSize: 13 },
  cancelBtn: { background: '#fff', color: '#3D4F7C', border: '1px solid #3D4F7C', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  photoRow:     { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' },
  photoBox:     { width: 100, height: 100, borderRadius: 8, background: '#f0f0f0', border: '1px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 },
  photoDelBtn:  { position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  threeCol: { display: 'flex', gap: 40 },
  col: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#3D4F7C', marginBottom: 14, borderBottom: '1px solid #eee', paddingBottom: 8 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  input: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  select: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  textarea: { width: '100%', border: '1px solid #ddd', borderRadius: 6, outline: 'none', padding: '8px', fontSize: 13, resize: 'vertical' }
};
