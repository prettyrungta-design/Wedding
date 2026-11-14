import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Heart, LoaderCircle, X } from 'lucide-react';

const EMPTY_FORM = { full_name: '', phone: '', attendance: 'yes', guests: '1' };

export default function RsvpDialog({ open, onClose, supabase, eventIds }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const setField = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const attending = form.attendance === 'yes';

  function handleClose() {
    onClose();
    if (submitted) { setSubmitted(null); setForm(EMPTY_FORM); }
    setStatus('');
  }

  async function submit(e) {
    e.preventDefault();
    const guests = Number(form.guests);
    if (attending && (!Number.isInteger(guests) || guests < 1 || guests > 30)) {
      return setStatus('Please enter between 1 and 30 people.');
    }
    setLoading(true); setStatus('');
    const { error } = await supabase.from('wedding_rsvps').insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      attendance: form.attendance,
      adults: attending ? guests : 0,
      children: 0,
      events: attending ? eventIds : [],
    });
    setLoading(false);
    if (error) setStatus('We could not save your response. Please try again.');
    else setSubmitted(form.attendance);
  }

  return (
    <dialog ref={dialogRef} className="rsvp-dialog" onClose={handleClose} aria-labelledby="rsvp-title">
      <button type="button" className="dialog-close" onClick={handleClose} aria-label="Close RSVP form"><X size={18} /></button>
      {submitted ? (
        <div className="success-state">
          <div className="success-icon"><CheckCircle2 size={30} /></div>
          <h2 id="rsvp-title">Thank you!</h2>
          <p>{submitted === 'yes' ? 'Your RSVP has been received. We look forward to celebrating with you.' : 'Thank you for letting us know. You will be missed.'}</p>
          <button type="button" className="outline" onClick={handleClose}>Close</button>
        </div>
      ) : (
        <form className="rsvp-form" onSubmit={submit}>
          <p className="eyebrow">KINDLY RESPOND</p>
          <h2 id="rsvp-title" className="dialog-title">RSVP</h2>
          <label>Full name <b>*</b><input value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Enter your name" required maxLength="100" autoComplete="name" /></label>
          <label>Mobile number <b>*</b><input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="Your contact number" required minLength="5" maxLength="20" autoComplete="tel" /></label>
          <fieldset>
            <legend>Will you be joining us? <b>*</b></legend>
            <div className="choice-row two">
              {[['yes', 'Coming'], ['no', 'Not coming']].map(([value, label]) => (
                <button type="button" key={value} aria-pressed={form.attendance === value} className={`choice ${form.attendance === value ? 'selected' : ''}`} onClick={() => setField('attendance', value)}>
                  {form.attendance === value && <CheckCircle2 size={14} />} {label}
                </button>
              ))}
            </div>
          </fieldset>
          {attending && (
            <label>Number of people coming <b>*</b><input type="number" inputMode="numeric" min="1" max="30" value={form.guests} onChange={e => setField('guests', e.target.value)} required /></label>
          )}
          {status && <p className="error" role="alert">{status}</p>}
          <button className="primary full submit" disabled={loading}>
            {loading ? <><LoaderCircle className="spin" size={17} /> Submitting…</> : <>Submit RSVP <Heart size={15} /></>}
          </button>
        </form>
      )}
    </dialog>
  );
}
