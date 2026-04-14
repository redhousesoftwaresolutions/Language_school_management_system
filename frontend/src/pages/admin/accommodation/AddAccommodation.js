import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';
import { FaCamera } from 'react-icons/fa';

export default function AddAccommodation() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      if (isEdit) await api.put(`/admin/accommodation/${id}`, form);
      else await api.post('/admin/accommodation', form);
      navigate('/admin/accommodation');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

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
          <div style={styles.photoBox}><FaCamera size={20} color="#aaa" /></div>
          <div style={styles.photoBox}><FaCamera size={20} color="#aaa" /></div>
          <div style={styles.photoBox}><FaCamera size={20} color="#aaa" /></div>
          <p style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>+ Add Photos</p>
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
  photoRow: { display: 'flex', gap: 12, marginBottom: 28 },
  photoBox: { width: 80, height: 80, borderRadius: 8, background: '#f0f0f0', border: '1px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  threeCol: { display: 'flex', gap: 40 },
  col: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#3D4F7C', marginBottom: 14, borderBottom: '1px solid #eee', paddingBottom: 8 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6 },
  input: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  select: { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '6px 0', fontSize: 13, background: 'transparent' },
  textarea: { width: '100%', border: '1px solid #ddd', borderRadius: 6, outline: 'none', padding: '8px', fontSize: 13, resize: 'vertical' }
};
