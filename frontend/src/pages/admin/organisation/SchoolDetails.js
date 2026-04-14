import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import Breadcrumb from '../../../components/Breadcrumb';
import api from '../../../services/api';

const SECTIONS = ['School Info', 'Address', 'Banking', 'VAT & Legal', 'Invoice Settings'];

export default function SchoolDetails() {
  const [activeSection, setActiveSection] = useState('School Info');
  const [form, setForm] = useState({
    legalName: '', tradingName: '', email: '', phone: '', website: '',
    'address.street': '', 'address.city': '', 'address.postcode': '', 'address.country': 'United Kingdom',
    companiesHouseNo: '', vatRegistered: false, vatNumber: '', vatRate: 20, charityNo: '',
    'bank.bankName': '', 'bank.accountName': '', 'bank.accountNumber': '', 'bank.sortCode': '', 'bank.iban': '', 'bank.swiftBic': '',
    'invoice.prefix': 'INV-', 'invoice.nextNumber': 1, 'invoice.paymentTerms': 30, 'invoice.lateInterest': 8, 'invoice.footerNote': 'Thank you for your payment.'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/school').then(({ data }) => {
      setForm({
        legalName:              data.legalName || '',
        tradingName:            data.tradingName || '',
        email:                  data.email || '',
        phone:                  data.phone || '',
        website:                data.website || '',
        'address.street':       data.address?.street || '',
        'address.city':         data.address?.city || '',
        'address.postcode':     data.address?.postcode || '',
        'address.country':      data.address?.country || 'United Kingdom',
        companiesHouseNo:       data.companiesHouseNo || '',
        vatRegistered:          data.vatRegistered || false,
        vatNumber:              data.vatNumber || '',
        vatRate:                data.vatRate ?? 20,
        charityNo:              data.charityNo || '',
        'bank.bankName':        data.bank?.bankName || '',
        'bank.accountName':     data.bank?.accountName || '',
        'bank.accountNumber':   data.bank?.accountNumber || '',
        'bank.sortCode':        data.bank?.sortCode || '',
        'bank.iban':            data.bank?.iban || '',
        'bank.swiftBic':        data.bank?.swiftBic || '',
        'invoice.prefix':       data.invoice?.prefix || 'INV-',
        'invoice.nextNumber':   data.invoice?.nextNumber ?? 1,
        'invoice.paymentTerms': data.invoice?.paymentTerms ?? 30,
        'invoice.lateInterest': data.invoice?.lateInterest ?? 8,
        'invoice.footerNote':   data.invoice?.footerNote || 'Thank you for your payment.'
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const payload = {
      legalName:        form.legalName,
      tradingName:      form.tradingName,
      email:            form.email,
      phone:            form.phone,
      website:          form.website,
      address: {
        street:   form['address.street'],
        city:     form['address.city'],
        postcode: form['address.postcode'],
        country:  form['address.country']
      },
      companiesHouseNo: form.companiesHouseNo,
      vatRegistered:    form.vatRegistered,
      vatNumber:        form.vatNumber,
      vatRate:          Number(form.vatRate),
      charityNo:        form.charityNo,
      bank: {
        bankName:      form['bank.bankName'],
        accountName:   form['bank.accountName'],
        accountNumber: form['bank.accountNumber'],
        sortCode:      form['bank.sortCode'],
        iban:          form['bank.iban'],
        swiftBic:      form['bank.swiftBic']
      },
      invoice: {
        prefix:       form['invoice.prefix'],
        nextNumber:   Number(form['invoice.nextNumber']),
        paymentTerms: Number(form['invoice.paymentTerms']),
        lateInterest: Number(form['invoice.lateInterest']),
        footerNote:   form['invoice.footerNote']
      }
    };
    try {
      await api.put('/admin/school', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  if (loading) return <Layout><p style={{ padding: 40, color: '#aaa', textAlign: 'center' }}>Loading...</p></Layout>;

  return (
    <Layout>
      <Breadcrumb items={[
        { label: '🏠', path: '/admin/dashboard' },
        { label: 'Organisation', path: '/admin/organisation/school-details' },
        { label: 'School Details' },
      ]} />

      <div style={st.container}>
        <div style={st.topBar}>
          <div>
            <h2 style={st.title}>School Details</h2>
            <p style={st.subtitle}>Used on invoices and official documents</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {saved && <span style={st.savedMsg}>✓ Saved</span>}
            <button style={st.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div style={st.tabs}>
          {SECTIONS.map(s => (
            <button
              key={s}
              style={{ ...st.tab, borderBottom: activeSection === s ? '2px solid #3D4F7C' : '2px solid transparent', color: activeSection === s ? '#3D4F7C' : '#aaa' }}
              onClick={() => setActiveSection(s)}
            >{s}</button>
          ))}
        </div>

        <div style={st.body}>
          {/* ── School Info ── */}
          {activeSection === 'School Info' && (
            <div style={st.twoCol}>
              <div style={st.col}>
                <Field label="Legal Name *" hint="As registered with Companies House" value={form.legalName} onChange={v => set('legalName', v)} />
                <Field label="Trading Name" hint="If different from legal name" value={form.tradingName} onChange={v => set('tradingName', v)} />
                <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
              </div>
              <div style={st.col}>
                <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
                <Field label="Website" value={form.website} onChange={v => set('website', v)} />
              </div>
            </div>
          )}

          {/* ── Address ── */}
          {activeSection === 'Address' && (
            <div style={st.twoCol}>
              <div style={st.col}>
                <Field label="Street Address" value={form['address.street']} onChange={v => set('address.street', v)} />
                <Field label="City / Town" value={form['address.city']} onChange={v => set('address.city', v)} />
              </div>
              <div style={st.col}>
                <Field label="Postcode" value={form['address.postcode']} onChange={v => set('address.postcode', v)} />
                <Field label="Country" value={form['address.country']} onChange={v => set('address.country', v)} />
              </div>
            </div>
          )}

          {/* ── Banking ── */}
          {activeSection === 'Banking' && (
            <>
              <p style={st.sectionNote}>These details appear on invoices so clients know where to send payment.</p>
              <div style={st.twoCol}>
                <div style={st.col}>
                  <Field label="Bank Name" value={form['bank.bankName']} onChange={v => set('bank.bankName', v)} />
                  <Field label="Account Name" value={form['bank.accountName']} onChange={v => set('bank.accountName', v)} />
                  <Field label="Account Number" hint="8 digits" value={form['bank.accountNumber']} onChange={v => set('bank.accountNumber', v)} />
                  <Field label="Sort Code" hint="XX-XX-XX" value={form['bank.sortCode']} onChange={v => set('bank.sortCode', v)} />
                </div>
                <div style={st.col}>
                  <Field label="IBAN" hint="For international payments" value={form['bank.iban']} onChange={v => set('bank.iban', v)} />
                  <Field label="SWIFT / BIC" hint="For international payments" value={form['bank.swiftBic']} onChange={v => set('bank.swiftBic', v)} />
                </div>
              </div>
            </>
          )}

          {/* ── VAT & Legal ── */}
          {activeSection === 'VAT & Legal' && (
            <div style={st.twoCol}>
              <div style={st.col}>
                <Field label="Companies House No" hint="8-character company number" value={form.companiesHouseNo} onChange={v => set('companiesHouseNo', v)} />
                <Field label="Charity Registration No" hint="Leave blank if not applicable" value={form.charityNo} onChange={v => set('charityNo', v)} />
              </div>
              <div style={st.col}>
                <div style={{ marginBottom: 18 }}>
                  <label style={st.label}>VAT Registered</label>
                  <div style={st.toggleRow}>
                    <div
                      style={{ ...st.toggle, background: form.vatRegistered ? '#3D4F7C' : '#ddd' }}
                      onClick={() => set('vatRegistered', !form.vatRegistered)}
                    >
                      <div style={{ ...st.knob, left: form.vatRegistered ? 18 : 2 }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#555' }}>{form.vatRegistered ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {form.vatRegistered && (
                  <>
                    <Field label="VAT Number" hint="GB followed by 9 digits" value={form.vatNumber} onChange={v => set('vatNumber', v)} />
                    <Field label="VAT Rate (%)" value={form.vatRate} onChange={v => set('vatRate', v)} type="number" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Invoice Settings ── */}
          {activeSection === 'Invoice Settings' && (
            <>
              <p style={st.sectionNote}>These defaults are applied to all new invoices.</p>
              <div style={st.twoCol}>
                <div style={st.col}>
                  <Field label="Invoice Prefix" hint='e.g. "INV-" → INV-0001' value={form['invoice.prefix']} onChange={v => set('invoice.prefix', v)} />
                  <Field label="Next Invoice Number" type="number" value={form['invoice.nextNumber']} onChange={v => set('invoice.nextNumber', v)} />
                  <Field label="Payment Terms (days)" hint="Days until payment is due" type="number" value={form['invoice.paymentTerms']} onChange={v => set('invoice.paymentTerms', v)} />
                </div>
                <div style={st.col}>
                  <Field label="Late Payment Interest (%)" hint="Per Late Payment Act 1998 — default 8%" type="number" value={form['invoice.lateInterest']} onChange={v => set('invoice.lateInterest', v)} />
                  <div style={{ marginBottom: 18 }}>
                    <label style={st.label}>Invoice Footer Note</label>
                    <textarea
                      style={st.textarea}
                      value={form['invoice.footerNote']}
                      onChange={e => set('invoice.footerNote', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, hint, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={st.label}>{label}</label>
      {hint && <p style={st.hint}>{hint}</p>}
      <input style={st.input} type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

const st = {
  container:   { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:       { fontSize: 18, fontWeight: 600, color: '#3D4F7C', marginBottom: 2 },
  subtitle:    { fontSize: 12, color: '#aaa' },
  saveBtn:     { background: '#3D4F7C', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 24px', cursor: 'pointer', fontSize: 13 },
  savedMsg:    { fontSize: 13, color: '#2E7D32', fontWeight: 500 },
  tabs:        { display: 'flex', borderBottom: '1px solid #eee', marginBottom: 28, gap: 4 },
  tab:         { padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  body:        {},
  twoCol:      { display: 'flex', gap: 48 },
  col:         { flex: 1 },
  sectionNote: { fontSize: 12, color: '#888', background: '#F5F6FA', borderRadius: 6, padding: '10px 14px', marginBottom: 20 },
  label:       { display: 'block', fontSize: 12, color: '#888', marginBottom: 3 },
  hint:        { fontSize: 11, color: '#bbb', marginBottom: 4, marginTop: -2 },
  input:       { width: '100%', border: 'none', borderBottom: '1px solid #ddd', outline: 'none', padding: '7px 0', fontSize: 13, background: 'transparent', boxSizing: 'border-box' },
  textarea:    { width: '100%', border: '1px solid #ddd', borderRadius: 6, outline: 'none', padding: '8px 10px', fontSize: 13, resize: 'vertical', background: '#fff', boxSizing: 'border-box' },
  toggleRow:   { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 },
  toggle:      { width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  knob:        { width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, transition: 'left 0.2s' },
};
