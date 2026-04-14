import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <main style={{ flex: 1, padding: 30, background: '#F5F6FA', overflowY: 'auto', height: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
