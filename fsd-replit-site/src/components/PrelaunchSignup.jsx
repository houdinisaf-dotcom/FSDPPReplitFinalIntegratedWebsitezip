import { useState } from 'react';
import { PRELAUNCH_CONSENT_COPY } from '../prelaunch-copy.js';
import '../prelaunch-signup.css';

const feedbackFor = (code, ok) => {
  if (ok) return 'Your sign-up has been recorded. Email updates are not connected yet.';
  if (code === 'invalid_email') return 'Enter a valid email address.';
  if (code === 'consent_required') return 'Consent is required to record your sign-up.';
  if (code === 'already_signed_up') return 'That email address is already recorded.';
  return 'We could not save your sign-up just now. Please try again later.';
};

export function PrelaunchSignup() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', error: false });

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setFeedback({ text: 'Enter a valid email address and tick the consent box.', error: true });
      return;
    }

    const formData = new FormData(form);
    setBusy(true);
    setFeedback({ text: '', error: false });
    try {
      const response = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          consent: formData.get('consent') === 'on',
        }),
      });
      const result = await response.json();
      const text = feedbackFor(result.code, response.ok);
      setFeedback({ text, error: !response.ok });
      if (response.ok) form.reset();
    } catch {
      setFeedback({
        text: 'We could not reach the sign-up service. Please try again later.',
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fsd-prelaunch-signup" aria-labelledby="fsd-prelaunch-title">
      <div className="fsd-prelaunch-copy">
        <p className="fsd-prelaunch-kicker">FSD / FIRST ACCESS</p>
        <h2 id="fsd-prelaunch-title">Get pre-launch updates</h2>
        <p>Register your interest in FSD launch news.</p>
        <p className="fsd-prelaunch-note">This form records your sign-up only; email updates are not connected yet.</p>
      </div>
      <form className="fsd-prelaunch-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="fsd-prelaunch-email">Email address</label>
        <input
          id="fsd-prelaunch-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          aria-describedby="fsd-prelaunch-consent fsd-prelaunch-feedback"
        />
        <label className="fsd-prelaunch-consent" id="fsd-prelaunch-consent">
          <input type="checkbox" name="consent" required />
          <span>{PRELAUNCH_CONSENT_COPY} <a href="/privacy.html">Privacy notice</a>.</span>
        </label>
        <button type="submit" disabled={busy} aria-disabled={busy}>
          {busy ? 'SAVING…' : 'SIGN UP'}
        </button>
        <p
          id="fsd-prelaunch-feedback"
          className={`fsd-prelaunch-feedback${feedback.error ? ' is-error' : ''}`}
          role={feedback.error ? 'alert' : 'status'}
          aria-live="polite"
        >{feedback.text}</p>
      </form>
    </section>
  );
}
