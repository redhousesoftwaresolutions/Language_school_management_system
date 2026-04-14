import { Link } from 'react-router-dom';

/**
 * Breadcrumb component
 * items: Array of { label, path? }
 * Last item is always the current page (no link).
 * Items with a path are rendered as clickable links.
 */
export default function Breadcrumb({ items }) {
  return (
    <nav style={styles.wrapper} aria-label="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={styles.item}>
            {i > 0 && <span style={styles.sep}>&gt;</span>}
            {isLast || !item.path
              ? <span style={styles.current}>{item.label}</span>
              : <Link to={item.path} style={styles.link}>{item.label}</Link>
            }
          </span>
        );
      })}
    </nav>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    fontSize: 12,
    marginBottom: 20,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  sep: {
    color: '#ccc',
  },
  link: {
    color: '#5a6fa0',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  current: {
    color: '#aaa',
  },
};
