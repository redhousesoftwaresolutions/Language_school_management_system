import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaStar, FaTh, FaBuilding, FaUserTie, FaUserGraduate,
  FaMoneyBillWave, FaBed, FaChevronDown, FaChevronUp, FaSignOutAlt, FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: <FaTh />, path: '/admin/dashboard' },
  {
    label: 'Organisation', icon: <FaBuilding />, children: [
      { label: 'School Details', path: '/admin/organisation/school-details' },
      { label: 'Timetable', path: '/admin/organisation/timetable' },
      { label: 'Add Course', path: '/admin/organisation/courses/add' },
      { label: 'Course List', path: '/admin/organisation/courses' },
      { label: 'Calendar', path: '/admin/organisation/calendar' },
    ]
  },
  {
    label: 'Staff', icon: <FaUserTie />, children: [
      { label: 'Add New Staff', path: '/admin/staff/add' },
      { label: 'Staff List', path: '/admin/staff' },
    ]
  },
  {
    label: 'Student', icon: <FaUserGraduate />, children: [
      { label: 'Add New Student', path: '/admin/students/add' },
      { label: 'Students List', path: '/admin/students' },
    ]
  },
  {
    label: 'Finance', icon: <FaMoneyBillWave />, children: [
      { label: 'Invoices', path: '/admin/finance/invoices' },
      { label: 'Income', path: '/admin/finance/income' },
      { label: 'Payments', path: '/admin/finance/payments' },
    ]
  },
  {
    label: 'Accommodation', icon: <FaBed />, children: [
      { label: 'Add Accommodation', path: '/admin/accommodation/add' },
      { label: 'Accommodations List', path: '/admin/accommodation' },
    ]
  }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) => item.children?.some(c => location.pathname.startsWith(c.path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoBox}>
        <FaStar size={20} color="#fff" />
        <div>
          <div style={styles.logoText}>LOGO</div>
          <div style={styles.logoSub}>Paste Here</div>
        </div>
      </div>

      <nav style={{ marginTop: 20, flex: 1 }}>
        {navItems.map(item => (
          <div key={item.label}>
            <div
              style={{
                ...styles.navItem,
                background: (isActive(item.path) || isParentActive(item)) ? '#4A6FA5' : 'transparent'
              }}
              onClick={() => item.path ? navigate(item.path) : toggleMenu(item.label)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {item.children && (
                <span style={styles.chevron}>
                  {openMenus[item.label] ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </span>
              )}
            </div>

            {item.children && openMenus[item.label] && (
              <div style={styles.subMenu}>
                {item.children.map(child => (
                  <div
                    key={child.label}
                    style={{ ...styles.subItem, color: isActive(child.path) ? '#fff' : 'rgba(255,255,255,0.7)' }}
                    onClick={() => navigate(child.path)}
                  >
                    • {child.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div style={styles.userBox}>
        <FaUserCircle size={32} color="rgba(255,255,255,0.8)" />
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.firstName || 'User'}</div>
          <div style={styles.userRole}>{user?.role || 'Admin'}</div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <FaSignOutAlt size={16} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: 220, minHeight: '100vh', background: '#3D4F7C', color: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column' },
  logoBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoText: { fontSize: 16, fontWeight: 700 },
  logoSub: { fontSize: 10, opacity: 0.6 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderRadius: 6, margin: '2px 10px', transition: 'background 0.2s' },
  navIcon: { fontSize: 15, opacity: 0.9 },
  navLabel: { flex: 1, fontSize: 14 },
  chevron: { opacity: 0.7 },
  subMenu: { paddingLeft: 20 },
  subItem: { padding: '8px 20px', fontSize: 13, cursor: 'pointer' },
  userBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 'auto', background: 'rgba(0,0,0,0.15)' },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, opacity: 0.6, textTransform: 'capitalize' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background 0.2s' },
};
