import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

export default function SortHeader({ label, field, sortField, sortDir, onSort, style }) {
  const active = sortField === field;
  return (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => onSort(field)}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active ? (sortDir === 'asc' ? <FaSortUp size={11} /> : <FaSortDown size={11} />) : <FaSort size={11} color="#ccc" />}
      </span>
    </th>
  );
}

const thStyle = { padding: '10px 12px', fontSize: 12, color: '#aaa', fontWeight: 500, textAlign: 'left', borderBottom: '1px solid #eee', background: '#F5F6FA' };
