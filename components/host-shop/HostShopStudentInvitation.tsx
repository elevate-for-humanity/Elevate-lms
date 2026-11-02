import Link from 'next/link';

export const HOST_SHOP_STUDENT_APPLICATION_URL =
  'https://www.elevateforhumanity.org/apply/student/form?intent=enrollment';

export default function HostShopStudentInvitation() {
  return (
    <section
      aria-label="Invite students to enroll"
      className="my-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"
    >
      <h2 className="text-xl font-black">Have students ready to get started?</h2>
      <p className="mt-2 leading-7">
        Invite a student to apply. Already enrolled? Contact support to connect their account to
        your shop.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={HOST_SHOP_STUDENT_APPLICATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
        >
          Invite a student ↗
        </a>
        <Link
          href="/host-shop/email"
          className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 font-bold"
        >
          Contact Host Shop Support
        </Link>
      </div>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="min-h-11 cursor-pointer font-bold">
          Enrollment and placement details
        </summary>
        <p>
          Already has an Elevate account? Ask support to check it before creating another
          application. An application does not automatically approve enrollment, a new occupation,
          or a shop placement. Pending shops must complete approval before hosting.
        </p>
      </details>
    </section>
  );
}
