import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FsdNavigation } from '../FsdNavigation.jsx';
import { FsdLogo } from '../brand/Logos.jsx';
import { products } from '../data/products.js';
import { mountClientBag } from '../bag.js';
import { renderSiteFooter } from '../site-footer.js';
import { SiteCTA } from '../site-cta.jsx';
import {
  EMPTY_PRIVATE_ENQUIRY,
  PRIVATE_ENQUIRY_CATEGORIES,
  validatePrivateEnquiry,
} from '../private-enquiry-data.js';

const STEPS = [
  'Select your interest',
  'Introduce your proposal',
  'Submit for consideration',
];

function ProgressSteps({ current }) {
  return (
    <ol className="private-enquiries__progress" aria-label="Enquiry progress">
      {STEPS.map((label, index) => {
        const number = index + 1;
        return (
          <li
            key={label}
            className={number === current ? 'is-current' : number < current ? 'is-complete' : ''}
            aria-current={number === current ? 'step' : undefined}
          >
            <span aria-hidden="true">{String(number).padStart(2, '0')}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function FieldError({ id, children }) {
  return children ? <span className="private-enquiries__error" id={id}>{children}</span> : null;
}

function EnquiryFields({ values, errors, onChange }) {
  const field = (key, label, options = {}) => (
    <label className="private-enquiries__field" htmlFor={`enquiry-${key}`} key={key}>
      <span>{label}{options.optional ? <small>Optional</small> : <small>Required</small>}</span>
      {options.multiline ? (
        <textarea
          id={`enquiry-${key}`}
          name={key}
          value={values[key]}
          onChange={onChange}
          required={!options.optional}
          minLength={options.minLength}
          maxLength={options.maxLength}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `error-${key}` : undefined}
          rows="6"
        />
      ) : (
        <input
          id={`enquiry-${key}`}
          name={key}
          type={options.type || 'text'}
          value={values[key]}
          onChange={onChange}
          required={!options.optional}
          maxLength={options.maxLength}
          autoComplete={options.autoComplete}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `error-${key}` : undefined}
        />
      )}
      <FieldError id={`error-${key}`}>{errors[key]}</FieldError>
    </label>
  );

  return (
    <div className="private-enquiries__fields">
      {field('fullName', 'Full Name', { maxLength: 120, autoComplete: 'name' })}
      {field('organisation', 'Company / Organisation', {
        optional: true, maxLength: 160, autoComplete: 'organization',
      })}
      {field('email', 'Email Address', {
        type: 'email', maxLength: 254, autoComplete: 'email',
      })}
      {field('country', 'Country', { maxLength: 80, autoComplete: 'country-name' })}
      {field('subject', 'Subject', { maxLength: 160 })}
      {field('details', 'Enquiry Details', {
        multiline: true, minLength: 20, maxLength: 5000,
      })}
    </div>
  );
}

export function PrivateEnquiriesPage() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => {
    const initial = { ...EMPTY_PRIVATE_ENQUIRY };
    if (typeof window !== 'undefined') {
      const requested = new URLSearchParams(window.location.search).get('category');
      if (requested && PRIVATE_ENQUIRY_CATEGORIES.some(category => category.id === requested)) initial.category = requested;
    }
    return initial;
  });
  const [errors, setErrors] = useState({});
  const [started, setStarted] = useState(false);
  const [footerLogoTarget, setFooterLogoTarget] = useState(null);
  const footerRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const footerMarkup = useMemo(
    () => renderSiteFooter({ homeHref: '#home' }),
    [],
  );
  const selectedCategory = PRIVATE_ENQUIRY_CATEGORIES.find(
    category => category.id === values.category,
  );

  useLayoutEffect(() => {
    setFooterLogoTarget(footerRef.current?.querySelector('[data-fsd-logo-slot="footer"]') ?? null);
  }, []);

  useEffect(() => {
    mountClientBag({ products });
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length) errorSummaryRef.current?.focus();
  }, [errors]);

  const handleNavigation = useCallback(({ item, group }) => {
    let destination = item?.href || group?.href;
    if (!destination) return;
    if (destination.startsWith('#')) destination = `/${destination}`;
    window.location.assign(destination);
  }, []);

  const updateField = event => {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const startEnquiry = event => {
    event.preventDefault();
    setStarted(true);
    document.getElementById('enquiry-experience')?.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const continueToProposal = () => {
    if (!values.category) {
      setErrors({ category: 'Choose an enquiry category to continue.' });
      return;
    }
    setErrors({});
    setStep(2);
    setStarted(true);
  };

  const continueToReview = event => {
    event.preventDefault();
    const nextErrors = validatePrivateEnquiry(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep(3);
  };

  return (
    <div className="private-enquiries-page">
      <FsdNavigation onNavigate={handleNavigation} />
      <main className="private-enquiries" id="home">
        <section className="private-enquiries__hero" aria-labelledby="private-enquiries-title">
          <div className="private-enquiries__hero-inner">
            <nav className="private-enquiries__breadcrumb" aria-label="Breadcrumb">
              <a href="/">FSD</a><span aria-hidden="true">/</span>
              <a href="/the-house.html">THE HOUSE</a><span aria-hidden="true">/</span>
              <span aria-current="page">PRIVATE ENQUIRIES</span>
            </nav>
            <p className="private-enquiries__eyebrow">FSD / THE HOUSE</p>
            <h1 id="private-enquiries-title" aria-label="SOME CONVERSATIONS SHAPE WHAT COMES NEXT.">
              <span>SOME CONVERSATIONS</span>
              <span>SHAPE WHAT COMES NEXT.</span>
            </h1>
            <p className="private-enquiries__intro">
              A considered point of connection for strategic partnerships, commercial opportunities
              and conversations that deserve a more direct approach.
            </p>
            <SiteCTA
              variant="primary"
              href="#enquiry-experience"
              onClick={startEnquiry}
              aria-label="Begin an enquiry"
            >
              BEGIN AN ENQUIRY <span aria-hidden="true">↗</span>
            </SiteCTA>
            <span className="private-enquiries__hero-index" aria-hidden="true">01 <i>/</i> FSD</span>
          </div>
        </section>

        <section
          className="private-enquiries__experience"
          id="enquiry-experience"
          aria-labelledby="enquiry-experience-title"
        >
          <div className="private-enquiries__section-head">
            <div>
              <p className="private-enquiries__eyebrow">A considered point of connection</p>
              <h2 id="enquiry-experience-title">Begin a private enquiry.</h2>
            </div>
            <p>Choose a subject, share the relevant context, then review before submission.</p>
          </div>
          <ProgressSteps current={step} />
          <div className="private-enquiries__workspace">
            {step === 1 && (
              <section aria-labelledby="enquiry-interest-title">
                <p className="private-enquiries__step-label">STAGE 01 / SELECT YOUR INTEREST</p>
                <h3 id="enquiry-interest-title">What would you like to discuss?</h3>
                {errors.category && (
                  <p className="private-enquiries__error-summary" role="alert" ref={errorSummaryRef} tabIndex="-1">
                    {errors.category}
                  </p>
                )}
                <fieldset className="private-enquiries__category-grid">
                  <legend className="sr-only">Select one enquiry category</legend>
                  {PRIVATE_ENQUIRY_CATEGORIES.map(category => (
                    <label
                      key={category.id}
                      className={`private-enquiries__category ${values.category === category.id ? 'is-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={values.category === category.id}
                        onChange={event => {
                          setValues(current => ({ ...current, category: event.target.value }));
                          setErrors(current => {
                            const next = { ...current };
                            delete next.category;
                            return next;
                          });
                        }}
                      />
                      <span className="private-enquiries__category-title">{category.label}</span>
                      <span className="private-enquiries__category-description">{category.description}</span>
                      <span className="private-enquiries__category-mark" aria-hidden="true">↗</span>
                    </label>
                  ))}
                </fieldset>
                <div className="private-enquiries__actions">
                  <SiteCTA variant="primary" onClick={continueToProposal}>
                    CONTINUE <span aria-hidden="true">→</span>
                  </SiteCTA>
                </div>
              </section>
            )}

            {step === 2 && selectedCategory && (
              <form onSubmit={continueToReview} noValidate aria-labelledby="enquiry-proposal-title">
                <p className="private-enquiries__step-label">STAGE 02 / INTRODUCE YOUR PROPOSAL</p>
                <div className="private-enquiries__selected">
                  <span>ENQUIRY CATEGORY</span>
                  <strong>{selectedCategory.label}</strong>
                  <button type="button" onClick={() => setStep(1)}>Change</button>
                </div>
                <h3 id="enquiry-proposal-title">Tell us about your proposal.</h3>
                <p className="private-enquiries__field-intro">
                  Your details are held in this page only; the enquiry channel is not yet connected.
                </p>
                {Object.keys(errors).length > 0 && (
                  <p className="private-enquiries__error-summary" role="alert" ref={errorSummaryRef} tabIndex="-1">
                    Please review the highlighted fields before continuing.
                  </p>
                )}
                <EnquiryFields values={values} errors={errors} onChange={updateField} />
                <div className="private-enquiries__actions">
                  <SiteCTA variant="secondary" onClick={() => setStep(1)}>BACK</SiteCTA>
                  <SiteCTA variant="primary" type="submit">REVIEW ENQUIRY <span aria-hidden="true">→</span></SiteCTA>
                </div>
              </form>
            )}

            {step === 3 && selectedCategory && (
              <section aria-labelledby="enquiry-review-title">
                <p className="private-enquiries__step-label">STAGE 03 / SUBMIT FOR CONSIDERATION</p>
                <h3 id="enquiry-review-title">Review your enquiry.</h3>
                <dl className="private-enquiries__review">
                  <div><dt>Category</dt><dd>{selectedCategory.label}</dd></div>
                  <div><dt>Name</dt><dd>{values.fullName}</dd></div>
                  {values.organisation && <div><dt>Company / Organisation</dt><dd>{values.organisation}</dd></div>}
                  <div><dt>Email</dt><dd>{values.email}</dd></div>
                  <div><dt>Country</dt><dd>{values.country}</dd></div>
                  <div><dt>Subject</dt><dd>{values.subject}</dd></div>
                  <div className="private-enquiries__review-details"><dt>Enquiry details</dt><dd>{values.details}</dd></div>
                </dl>
                <div className="private-enquiries__privacy-note" role="note">
                  <strong>Submission is not connected.</strong>
                  <p>No information is sent or saved from this page. Email delivery and the approved privacy wording are required before submissions can open.</p>
                  <a href="/privacy.html">Review the current Privacy page</a>
                </div>
                <div className="private-enquiries__actions">
                  <SiteCTA variant="secondary" onClick={() => setStep(2)}>BACK TO DETAILS</SiteCTA>
                  <SiteCTA variant="primary" disabled aria-describedby="enquiry-submit-status">
                    SEND FOR CONSIDERATION
                  </SiteCTA>
                </div>
                <p id="enquiry-submit-status" className="private-enquiries__submit-status" role="status" aria-live="polite">
                  Email delivery is not configured. Your enquiry cannot be submitted yet.
                </p>
              </section>
            )}
          </div>
        </section>

        <section className="private-enquiries__closing" aria-label="Private enquiries closing">
          <span>FSD <i>/</i> THE HOUSE</span>
          <p>Considered conversations. Clear proposals.</p>
        </section>
      </main>
      <div ref={footerRef} dangerouslySetInnerHTML={{ __html: footerMarkup }} />
      {footerLogoTarget && createPortal(<FsdLogo loading="lazy" />, footerLogoTarget)}
    </div>
  );
}
