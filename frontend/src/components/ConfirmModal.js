export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <p style={styles.msg}>{message || 'Are you sure you want to delete this item?'}</p>
        <div style={styles.btns}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.deleteBtn} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 10, padding: 32, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  msg: { fontSize: 15, color: '#333', marginBottom: 24, lineHeight: 1.5 },
  btns: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  deleteBtn: { background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }
};
