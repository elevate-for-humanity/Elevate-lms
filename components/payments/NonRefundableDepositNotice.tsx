export function NonRefundableDepositNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Non-refundable deposit policy"
      className={compact
        ? "rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        : "mx-auto my-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8"}
    >
      <div className={compact ? "" : "rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6"}>
        <p className="font-black uppercase tracking-wide text-amber-950">
          Non-Refundable Deposit Notice
        </p>
        <p className="mt-2 leading-6 text-amber-950">
          All deposits are non-refundable. A deposit is an administrative enrollment fee used to
          process your application, enrollment, and onboarding into the selected program or
          apprenticeship. Once paid, the deposit will not be refunded, including if you decide not
          to begin or continue the program. By submitting a deposit, you acknowledge and agree that
          the deposit is non-refundable.
        </p>
      </div>
    </section>
  );
}
