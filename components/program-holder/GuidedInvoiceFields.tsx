'use client';
import { useEffect, useState } from 'react';
import type { InvoiceStage, InvoiceTerms } from '@/lib/program-holder/invoice-prefill';
type Student = {
  id: string;
  name: string;
  trainingStart: string;
  trainingEnd: string;
  start: InvoiceTerms;
  completion: InvoiceTerms;
};
export function GuidedInvoiceFields() {
  const [students, setStudents] = useState<Student[]>([]);
  const [provider, setProvider] = useState('');
  const [studentId, setStudentId] = useState('');
  const [stage, setStage] = useState<InvoiceStage>('start');
  const [amount, setAmount] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false);
    setError('');
    fetch('/api/program-holder/invoice-options', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new Error('Reload and sign in to load your students.');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Invoice details could not load.');
        setStudents(data.students);
        setProvider(data.providerName);
        setLoaded(true);
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setError(cause.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const student = students.find((s) => s.id === studentId);
  const terms = student?.[stage];
  function choose(id: string, nextStage: InvoiceStage) {
    setStudentId(id);
    setStage(nextStage);
    const next = students.find((s) => s.id === id);
    const cents = next?.[nextStage].amountCents;
    setAmount(cents == null ? '' : (cents / 100).toFixed(2));
    setDates({ start: next?.trainingStart || '', end: next?.trainingEnd || '' });
    setDescription(
      next
        ? `${nextStage === 'start' ? 'Training start' : 'Training completion'} installment for ${next.name}, under my assigned agreement.`
        : '',
    );
  }
  const input = 'min-h-11 min-w-0 rounded-xl border bg-white p-2 font-normal';
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 font-bold">
        1. Select student → 2. Review amount → 3. Certify and submit
      </legend>
      {error && (
        <div role="alert" className="sm:col-span-2 text-red-800">
          {error}{' '}
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => setAttempt((a) => a + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">
        Student from your dashboard
        <select
          name="enrollmentId"
          required
          disabled={!loaded}
          value={studentId}
          onChange={(e) => choose(e.target.value, stage)}
          className={input}
        >
          <option value="">{loaded ? 'Choose your student' : 'Loading your students…'}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {loaded && !students.length && (
        <p className="sm:col-span-2 text-sm">
          No eligible assigned enrollments are available. Contact Elevate through Office Mail to
          check the student assignment.
        </p>
      )}
      <label className="grid gap-1 text-sm font-bold">
        Payment stage
        <select
          name="invoiceStage"
          value={stage}
          onChange={(e) => choose(studentId, e.target.value as InvoiceStage)}
          className={input}
        >
          <option value="start">Training start</option>
          <option value="completion">Training completion</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Provider / business name
        <input
          name="providerName"
          required
          maxLength={200}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className={input}
        />
      </label>
      <input type="hidden" name="studentName" value={student?.name || ''} />
      <label className="grid gap-1 text-sm font-bold">
        Invoice number
        <input
          name="invoiceNumber"
          required
          maxLength={100}
          placeholder="Your unique invoice reference"
          className={input}
        />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Amount requested (USD)
        <input
          name="amount"
          type="number"
          min="0.01"
          max="9999999.99"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={input}
        />
      </label>
      {terms && (
        <p className="sm:col-span-2 rounded-xl bg-white p-3 text-sm">
          <strong>{terms.source}</strong>
          <br />
          {terms.reason} You may edit the requested amount. Changes require Elevate review and do
          not change your contract.
        </p>
      )}
      <label className="grid gap-1 text-sm font-bold">
        Training start date
        <input
          name="trainingStart"
          type="date"
          required
          value={dates.start}
          onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
          className={input}
        />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Training end / service-through date
        <input
          name="trainingEnd"
          type="date"
          required
          value={dates.end}
          onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
          className={input}
        />
      </label>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">
        Training / services provided
        <textarea
          name="serviceDescription"
          required
          maxLength={2000}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={input}
        />
      </label>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm sm:col-span-2">
        <input
          name="invoiceAttested"
          type="checkbox"
          value="yes"
          required
          className="h-11 w-11 shrink-0"
        />
        I certify that these services, the selected student, dates and requested amount are
        accurate. Submission requests review; it does not release a payment.
      </label>
    </fieldset>
  );
}
