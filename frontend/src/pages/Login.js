import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';

export default function Login() {
  const [form, setForm] = useState({ role: 'admin', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', form);
      login(data);
      if (data.role === 'admin') navigate('/admin/dashboard');
      else if (data.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={styles.left}>
        <div style={styles.logoBox}>
          <FaStar size={28} color="#fff" />
          <div>
            <div style={styles.logoText}>LOGO</div>
            <div style={styles.logoSub}>Paste Here</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.title}>Welcome to Us!</h2>

          <label style={styles.label}>You</label>
          <select
            style={styles.input}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <div style={{ textAlign: 'right' }}>
            <button style={styles.button} type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', height: '100vh', background: '#F5F6FA' },
  left: {
    width: '38%', background: '#3D4F7C', display: 'flex',
    alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 0 0'
  },
  logoBox: { display: 'flex', alignItems: 'center', gap: 12, color: '#fff' },
  logoText: { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  logoSub: { fontSize: 12, opacity: 0.7 },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff'
  },
  form: { width: 300 },
  title: { color: '#4A90D9', fontWeight: 700, fontSize: 24, marginBottom: 20 },
  label: { display: 'block', fontSize: 12, color: '#555', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 12px', marginBottom: 14, border: '1px solid #ddd',
    borderRadius: 4, fontSize: 13, outline: 'none', display: 'block'
  },
  button: {
    background: '#fff', border: '1px solid #ccc', borderRadius: 4,
    padding: '6px 20px', cursor: 'pointer', fontSize: 13
  },
  error: { color: 'red', fontSize: 12, marginBottom: 10 }
};
