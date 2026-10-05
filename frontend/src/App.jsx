import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Payments from './Payments.jsx';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});

const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value || 0);

const blankFarmer = {
  name: '',
  mobile: '',
  village: '',
  accountHolderName: '',
  bankAccountNumber: '',
  ifscCode: ''
};

const blankRate = {
  milkType: 'COW',
  fat: '3.50',
  snf: '8.50',
  rate: ''
};

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  ...props
}) {
  return (
    <label className="form-label field">
      {label}
      <input
        className="form-control"
        type={type}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        required={required}
        {...props}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required = true }) {
  return (
    <label className="form-label field">
      {label}
      <select
        className="form-select"
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function Table({ heads, rows }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            {heads.map(head => <th key={head}>{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={heads.length} className="text-muted text-center py-4">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [farmers, setFarmers] = useState([]);
  const [rates, setRates] = useState([]);
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState([]);
  const [dash, setDash] = useState({});
  const [month, setMonth] = useState(today().slice(0, 7));
  const [farmerId, setFarmerId] = useState('');
  const [farmer, setFarmer] = useState({ ...blankFarmer });
  const [rate, setRate] = useState({ ...blankRate });
  const [editing, setEditing] = useState(null);
  const [collection, setCollection] = useState({
    farmerId: '',
    date: today(),
    shift: 'MORNING',
    milkType: 'COW',
    quantity: '',
    fat: '3.50',
    snf: '8.50'
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);

    try {
      const [f, r, c, d, m] = await Promise.all([
        api.get('/farmers'),
        api.get('/rates'),
        api.get('/collections', {
          params: { month, farmerId: farmerId || undefined }
        }),
        api.get('/dashboard'),
        api.get('/reports', { params: { month } })
      ]);

      setFarmers(f.data);
      setRates(r.data);
      setEntries(c.data);
      setDash(d.data);
      setReport(m.data);
      return true;
    } catch (exception) {
      setError(
        exception.response?.data?.message ||
        'Backend unavailable. Start Spring Boot on port 8080.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [month, farmerId]);

  async function perform(action, message) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await action();
      setNotice(message);
      await load();
      return true;
    } catch (exception) {
      setError(
        exception.response?.data?.message ||
        'Request failed. Check backend connection.'
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setEditing(null);
    setFarmer({ ...blankFarmer });
    setRate({ ...blankRate });
    setError('');
    setNotice('');
  }

  function editFarmer(item) {
    setFarmer({
      name: item.name,
      mobile: item.mobile,
      village: item.village,
      accountHolderName: item.accountHolderName || '',
      bankAccountNumber: item.bankAccountNumber || '',
      ifscCode: item.ifscCode || ''
    });
    setEditing(item.id);
  }

  async function saveFarmer(event) {
    event.preventDefault();

    const payload = {
      ...farmer,
      accountHolderName: farmer.accountHolderName.trim() || null,
      bankAccountNumber: farmer.bankAccountNumber.trim() || null,
      ifscCode: farmer.ifscCode.trim().toUpperCase() || null
    };

    const saved = await perform(
      () => editing
        ? api.put('/farmers/' + editing, payload)
        : api.post('/farmers', payload),
      'Farmer and bank details saved'
    );

    if (saved) {
      setFarmer({ ...blankFarmer });
      setEditing(null);
    }
  }

  async function saveRate(event) {
    event.preventDefault();

    const saved = await perform(
      () => editing
        ? api.put('/rates/' + editing, rate)
        : api.post('/rates', rate),
      'Rate saved'
    );

    if (saved) {
      setRate({ ...blankRate });
      setEditing(null);
    }
  }

  const farmerOptions = [
    ['', 'Select farmer'],
    ...farmers.map(item => [
      String(item.id),
      `${item.name} (#${item.id})`
    ])
  ];

  const selectedFarmer = farmers.find(
    item => String(item.id) === farmerId
  );

  const totals = entries.reduce((total, item) => ({
    litres: total.litres + Number(item.quantity),
    amount: total.amount + Number(item.amount)
  }), { litres: 0, amount: 0 });

  const matched = rates.find(item =>
    item.milkType === collection.milkType &&
    Number(item.fat) === Number(collection.fat) &&
    Number(item.snf) === Number(collection.snf)
  );

  function actions(edit, remove) {
    return (
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-primary"
          disabled={busy}
          onClick={edit}
        >
          Edit
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={busy}
          onClick={remove}
        >
          Delete
        </button>
      </div>
    );
  }

  const setFarmerField = (key, value) =>
    setFarmer(previous => ({ ...previous, [key]: value }));

  const setRateField = (key, value) =>
    setRate(previous => ({ ...previous, [key]: value }));

  const setCollectionField = (key, value) =>
    setCollection(previous => ({ ...previous, [key]: value }));

  return (
    <div className="app">
      <aside className="no-print">
        <h3>🥛 DairyConnect</h3>
        <p>दूध संकलन व्यवस्थापन</p>

        {[
          'Dashboard', 'Farmers', 'Milk Collection',
          'Rates', 'Monthly Bills', 'Payments', 'Reports'
        ].map(item => (
          <button
            key={item}
            className={'navitem ' + (page === item ? 'active' : '')}
            onClick={() => changePage(item)}
          >
            {item}
          </button>
        ))}

        <small>शेतकरी आणि दूध संकलन व्यवस्थापन</small>
      </aside>

      <main>
        <header className="no-print">
          <div>
            <h1>{page}</h1>
            <span className="text-muted">Simple records. Clear accounts.</span>
          </div>
          <span className="badge text-bg-light">{today()}</span>
        </header>

        {error && (
          <div className="alert alert-danger no-print" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="alert alert-success no-print" role="status">
            {notice}
          </div>
        )}

        {loading && (
          <p className="text-muted no-print">Loading records…</p>
        )}

        {page === 'Dashboard' && (
          <>
            <section className="dairy-hero">
              <div>
                <span className="hero-label">DAIRYCONNECT</span>
                <h2>तुमच्या डेअरीचा हिशोब,<br />एकाच ठिकाणी.</h2>
                <p>शेतकरी, दूध संकलन आणि मासिक बिले.</p>
                <button
                  className="btn btn-light"
                  onClick={() => changePage('Milk Collection')}
                >
                  दूध संकलन नोंदवा →
                </button>
              </div>
            </section>

            <div className="stats">
              {[
                ['Farmers', dash.farmers || 0],
                ['Today’s litres', Number(dash.litres || 0).toFixed(3)],
                ['Today’s collection value', money(dash.amount)]
              ].map(([label, value]) => (
                <section className="card p-4" key={label}>
                  <span>{label}</span>
                  <h2>{value}</h2>
                </section>
              ))}
            </div>

            <section className="panel">
              <h4>Quick start</h4>
              <p>
                Register a farmer, add a milk rate, then enter
                morning or evening milk collection.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => changePage('Milk Collection')}
              >
                Add milk collection
              </button>
            </section>

            <section className="panel">
              <h4>How rates work</h4>
              <p>
                Milk type, fat and SNF must match a configured rate exactly.
                Amounts are calculated and saved by the backend.
              </p>
            </section>
          </>
        )}

        {page === 'Farmers' && (
          <>
            <section className="panel">
              <h4>{editing ? 'Edit farmer' : 'Register farmer'}</h4>

              <form onSubmit={saveFarmer}>
                <div className="fields">
                  <Field
                    label="Name"
                    value={farmer.name}
                    onChange={value => setFarmerField('name', value)}
                    maxLength={100}
                  />
                  <Field
                    label="Mobile"
                    type="tel"
                    value={farmer.mobile}
                    onChange={value => setFarmerField('mobile', value)}
                    pattern="[0-9]{10}"
                    maxLength={10}
                  />
                  <Field
                    label="Village"
                    value={farmer.village}
                    onChange={value => setFarmerField('village', value)}
                    maxLength={100}
                  />
                </div>

                <h5>Bank details — optional</h5>

                <div className="fields">
                  <Field
                    label="Account holder name"
                    value={farmer.accountHolderName}
                    onChange={value => setFarmerField('accountHolderName', value)}
                    required={false}
                    maxLength={100}
                  />
                  <Field
                    label="Bank account number"
                    value={farmer.bankAccountNumber}
                    onChange={value => setFarmerField('bankAccountNumber', value)}
                    required={false}
                    inputMode="numeric"
                    pattern="[0-9]{9,18}"
                    maxLength={18}
                    autoComplete="off"
                  />
                  <Field
                    label="IFSC code"
                    value={farmer.ifscCode}
                    onChange={value =>
                      setFarmerField('ifscCode', value.toUpperCase())
                    }
                    required={false}
                    pattern="[A-Z]{4}0[A-Z0-9]{6}"
                    maxLength={11}
                    placeholder="Example: SBIN0001234"
                  />
                </div>

                <p className="text-muted">
                  Bank details are saved as information.
                  Saving them does not transfer money.
                </p>

                <button disabled={busy} className="btn btn-primary">
                  Save farmer
                </button>

                {editing && (
                  <button
                    type="button"
                    className="btn btn-light ms-2"
                    onClick={() => {
                      setEditing(null);
                      setFarmer({ ...blankFarmer });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </section>

            <section className="panel">
              <input
                aria-label="Search farmers"
                className="form-control mb-3"
                placeholder="Search name or village"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <Table
                heads={[
                  'Code', 'Name', 'Mobile', 'Village',
                  'Bank account', 'IFSC', 'Actions'
                ]}
                rows={farmers
                  .filter(item =>
                    (item.name + ' ' + item.village)
                      .toLowerCase().includes(search.toLowerCase())
                  )
                  .map(item => [
                    item.id,
                    item.name,
                    item.mobile,
                    item.village,
                    item.bankAccountNumber
                      ? '•••• ' + item.bankAccountNumber.slice(-4)
                      : '—',
                    item.ifscCode || '—',
                    actions(
                      () => editFarmer(item),
                      () => {
                        if (window.confirm('Delete this farmer?')) {
                          perform(
                            () => api.delete('/farmers/' + item.id),
                            'Farmer deleted'
                          );
                        }
                      }
                    )
                  ])}
              />
            </section>
          </>
        )}

        {page === 'Rates' && (
          <>
            <div className="alert alert-info">
              Enter your dairy’s rates. Milk type, fat and SNF must match exactly.
              Changing rates preserves historical amounts.
            </div>

            <section className="panel">
              <h4>{editing ? 'Edit rate' : 'Add rate'}</h4>
              <form onSubmit={saveRate}>
                <div className="fields">
                  <Select
                    label="Milk type"
                    value={rate.milkType}
                    onChange={value => setRateField('milkType', value)}
                    options={[['COW', 'Cow'], ['BUFFALO', 'Buffalo']]}
                  />
                  <Field
                    label="Fat %"
                    type="number"
                    value={rate.fat}
                    onChange={value => setRateField('fat', value)}
                    min={0}
                    max={15}
                    step="0.01"
                  />
                  <Field
                    label="SNF %"
                    type="number"
                    value={rate.snf}
                    onChange={value => setRateField('snf', value)}
                    min={0}
                    max={20}
                    step="0.01"
                  />
                  <Field
                    label="Rate ₹ / litre"
                    type="number"
                    value={rate.rate}
                    onChange={value => setRateField('rate', value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <button disabled={busy} className="btn btn-primary">
                  Save rate
                </button>

                {editing && (
                  <button
                    type="button"
                    className="btn btn-light ms-2"
                    onClick={() => {
                      setEditing(null);
                      setRate({ ...blankRate });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </section>

            <section className="panel">
              <Table
                heads={['Milk type', 'Fat', 'SNF', 'Rate / litre', 'Actions']}
                rows={rates.map(item => [
                  item.milkType,
                  item.fat,
                  item.snf,
                  money(item.rate),
                  actions(
                    () => {
                      setRate({
                        milkType: item.milkType,
                        fat: item.fat,
                        snf: item.snf,
                        rate: item.rate
                      });
                      setEditing(item.id);
                    },
                    () => {
                      if (window.confirm('Delete this rate?')) {
                        perform(
                          () => api.delete('/rates/' + item.id),
                          'Rate deleted'
                        );
                      }
                    }
                  )
                ])}
              />
            </section>
          </>
        )}

        {page === 'Milk Collection' && (
          <section className="panel">
            <h4>Add milk collection</h4>

            <form onSubmit={async event => {
              event.preventDefault();

              if (await perform(
                () => api.post('/collections', collection),
                'Collection saved'
              )) {
                setCollectionField('quantity', '');
              }
            }}>
              <div className="fields">
                <Select
                  label="Farmer"
                  value={collection.farmerId}
                  onChange={value => setCollectionField('farmerId', value)}
                  options={farmerOptions}
                />
                <Field
                  label="Date"
                  type="date"
                  value={collection.date}
                  onChange={value => setCollectionField('date', value)}
                  max={today()}
                />
                <Select
                  label="Shift"
                  value={collection.shift}
                  onChange={value => setCollectionField('shift', value)}
                  options={[
                    ['MORNING', 'Morning / सकाळ'],
                    ['EVENING', 'Evening / संध्याकाळ']
                  ]}
                />
                <Select
                  label="Milk type"
                  value={collection.milkType}
                  onChange={value => setCollectionField('milkType', value)}
                  options={[
                    ['COW', 'Cow / गाय'],
                    ['BUFFALO', 'Buffalo / म्हैस']
                  ]}
                />
                <Field
                  label="Quantity (litres)"
                  type="number"
                  value={collection.quantity}
                  onChange={value => setCollectionField('quantity', value)}
                  min="0.001"
                  step="0.001"
                />
                <Field
                  label="Fat %"
                  type="number"
                  value={collection.fat}
                  onChange={value => setCollectionField('fat', value)}
                  min={0}
                  max={15}
                  step="0.01"
                />
                <Field
                  label="SNF %"
                  type="number"
                  value={collection.snf}
                  onChange={value => setCollectionField('snf', value)}
                  min={0}
                  max={20}
                  step="0.01"
                />
              </div>

              <p>
                {matched
                  ? `Rate: ${money(matched.rate)} / litre. Estimated amount: ${
                      money(Number(collection.quantity) * Number(matched.rate))
                    }`
                  : 'No matching rate. Add the exact rate combination first.'}
              </p>

              <button
                disabled={busy || !matched}
                className="btn btn-primary"
              >
                Save collection
              </button>
            </form>
          </section>
        )}

        {['Milk Collection', 'Monthly Bills', 'Reports'].includes(page) && (
          <section className="panel">
            <div className="fields no-print">
              <Field
                label="Month"
                type="month"
                value={month}
                onChange={setMonth}
              />

              {page !== 'Reports' && (
                <Select
                  label="Farmer filter"
                  value={farmerId}
                  onChange={setFarmerId}
                  required={false}
                  options={[
                    ['', 'All farmers'],
                    ...farmerOptions.slice(1)
                  ]}
                />
              )}
            </div>

            {page === 'Reports' ? (
              <Table
                heads={[
                  'Farmer', 'Cow litres', 'Buffalo litres',
                  'Total litres', 'Amount'
                ]}
                rows={report.map(item => [
                  item.farmer,
                  item.cow,
                  item.buffalo,
                  item.litres,
                  money(item.amount)
                ])}
              />
            ) : (
              <>
                <h4>
                  {page === 'Monthly Bills'
                    ? 'DairyConnect — Monthly collection bill'
                    : 'Collection history'}
                </h4>

                <p>{month} · {selectedFarmer?.name || 'All farmers'}</p>

                {page === 'Monthly Bills' && selectedFarmer && (
                  <div className="mb-3">
                    <div>
                      Account holder: {selectedFarmer.accountHolderName || '—'}
                    </div>
                    <div>
                      Bank account: {selectedFarmer.bankAccountNumber
                        ? '•••• ' + selectedFarmer.bankAccountNumber.slice(-4)
                        : '—'}
                    </div>
                    <div>IFSC: {selectedFarmer.ifscCode || '—'}</div>
                  </div>
                )}

                <Table
                  heads={[
                    'Date', 'Farmer', 'Shift', 'Type', 'Litres',
                    'Fat', 'SNF', 'Rate', 'Amount'
                  ]}
                  rows={entries.map(item => [
                    item.date,
                    item.farmer.name,
                    item.shift,
                    item.milkType,
                    item.quantity,
                    item.fat,
                    item.snf,
                    money(item.appliedRate),
                    money(item.amount)
                  ])}
                />

                <div className="total">
                  Total: {totals.litres.toFixed(3)} litres · {money(totals.amount)}
                </div>
              </>
            )}

            {page !== 'Milk Collection' && (
              <>
                <p className="text-muted">
                  Collection summary only. This does not confirm payment.
                </p>
                <button
                  className="btn btn-primary no-print"
                  onClick={() => window.print()}
                >
                  Print / Save as PDF
                </button>
              </>
            )}
          </section>
        )}
        {page === 'Payments' && <Payments />}
      </main>
    </div>
  );
}