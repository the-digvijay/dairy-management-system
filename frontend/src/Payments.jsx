import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

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

export default function Payments() {
  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState('');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  // अनिश्चित network error नंतर तीच request पुन्हा पाठवण्यासाठी.
  const pending = useRef(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;

    api.get('/farmers')
      .then(response => {
        if (active) setFarmers(response.data);
      })
      .catch(() => {
        if (active) setError('Cannot load farmers. Check backend.');
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setSummary(null);
    setPayments([]);

    if (!farmerId || !month) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const params = { farmerId, billMonth: month };

    Promise.all([
      api.get('/payments/summary', { params }),
      api.get('/payments', { params })
    ])
      .then(([summaryResponse, paymentResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.data);
        setPayments(paymentResponse.data);
      })
      .catch(exception => {
        if (active) {
          setError(
            exception.response?.data?.message ||
            'Cannot load payment records.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [farmerId, month, refresh]);

  async function submit(event) {
    event.preventDefault();

    if (submitting.current) return;

    if (!pending.current) {
      if (!summary) return;

      if (
        Number(amount) <= 0 ||
        Number(amount) > Number(summary.outstandingAmount)
      ) {
        setError('Enter an amount within the outstanding balance.');
        return;
      }

      if (!window.confirm(
        'Have you already paid this amount? This only records the payment.'
      )) {
        return;
      }

      pending.current = {
        farmerId: Number(farmerId),
        billMonth: month,
        amount: Number(amount),
        paymentDate,
        paymentMethod: method,
        transactionReference: reference.trim() || null,
        notes: notes.trim() || null,
        requestId: crypto.randomUUID()
      };
    }

    submitting.current = true;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await api.post('/payments', pending.current);

      pending.current = null;
      setRetrying(false);
      setAmount('');
      setReference('');
      setNotes('');
      setNotice('Payment recorded successfully.');
      setRefresh(value => value + 1);
    } catch (exception) {
      const status = exception.response?.status;

      if (status && status >= 400 && status < 500) {
        pending.current = null;
        setRetrying(false);
        setRefresh(value => value + 1);
        setError(
          exception.response?.data?.message ||
          'Payment could not be recorded.'
        );
      } else {
        setRetrying(true);
        setError(
          'Save result is uncertain. Click Retry same payment. ' +
          'Do not create another record for this payment.'
        );
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const locked = busy || retrying;

  return (
    <>
      <section className="panel">
        <h4>Farmer payments</h4>
        <p className="text-muted">
          Bank app किंवा UPI मधून पैसे दिल्यानंतर येथे नोंद करा.
          हा form पैसे transfer करत नाही.
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
          </div>
        )}

        <div className="fields">
          <label className="form-label field">
            Farmer
            <select
              className="form-select"
              value={farmerId}
              disabled={locked}
              onChange={event => {
                setFarmerId(event.target.value);
                setNotice('');
                setAmount('');
              }}
            >
              <option value="">Select farmer</option>
              {farmers.map(farmer => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label field">
            Bill month
            <input
              className="form-control"
              type="month"
              value={month}
              disabled={locked}
              onChange={event => {
                setMonth(event.target.value);
                setNotice('');
                setAmount('');
              }}
            />
          </label>
        </div>

        {loading && <p>Loading payments…</p>}

        {summary && (
          <>
            <div className="stats mb-3">
              {[
                ['Bill amount', summary.billAmount],
                ['Already paid', summary.paidAmount],
                ['Outstanding', summary.outstandingAmount]
              ].map(([label, value]) => (
                <div className="card p-3" key={label}>
                  <span>{label}</span>
                  <h3>{money(value)}</h3>
                </div>
              ))}
            </div>

            <p>
              Status: <strong>{summary.status.replaceAll('_', ' ')}</strong>
            </p>
          </>
        )}

        {(retrying || (
          summary && Number(summary.outstandingAmount) > 0
        )) && (
          <form onSubmit={submit}>
            <fieldset disabled={locked}>
              <div className="fields">
                <label className="form-label field">
                  Amount paid ₹
                  <input
                    className="form-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={summary?.outstandingAmount}
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    required
                  />
                </label>

                <label className="form-label field">
                  Payment date
                  <input
                    className="form-control"
                    type="date"
                    value={paymentDate}
                    max={today()}
                    onChange={event => setPaymentDate(event.target.value)}
                    required
                  />
                </label>

                <label className="form-label field">
                  Payment method
                  <select
                    className="form-select"
                    value={method}
                    onChange={event => setMethod(event.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </label>
              </div>

              <div className="fields">
                <label className="form-label field">
                  Transaction reference / UTR
                  <input
                    className="form-control"
                    value={reference}
                    maxLength={100}
                    required={method !== 'CASH'}
                    onChange={event => setReference(event.target.value)}
                  />
                </label>

                <label className="form-label field">
                  Notes — optional
                  <input
                    className="form-control"
                    value={notes}
                    maxLength={250}
                    onChange={event => setNotes(event.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || (!retrying && loading)}
            >
              {busy
                ? 'Saving…'
                : retrying
                  ? 'Retry same payment'
                  : 'Record payment already made'}
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <h4>Payment history</h4>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{payment.paymentDate}</td>
                  <td>{money(payment.amount)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.transactionReference || '—'}</td>
                  <td>{payment.notes || '—'}</td>
                </tr>
              ))}

              {!payments.length && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No payment records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}