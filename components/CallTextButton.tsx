import { CONTACT_INFO } from "@/lib/contact-info";

interface CallTextButtonProps {
  variant?: "call" | "text" | "both";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CallTextButton({
  variant = "both",
  size = "md",
  className = ""
}: CallTextButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-2.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  if (variant === "both") {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        <a
          href={`tel:${CONTACT_INFO.phone.tel}`}
          className={`inline-flex items-center gap-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold ${sizeClasses[size]}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call {CONTACT_INFO.phone.display}
        </a>
        <a
          href={`sms:${CONTACT_INFO.phone.tel}`}
          className={`inline-flex items-center gap-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition font-semibold ${sizeClasses[size]}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Text {CONTACT_INFO.phone.display}
        </a>
      </div>
    );
  }

  if (variant === "call") {
    return (
      <a
        href={`tel:${CONTACT_INFO.phone.tel}`}
        className={`inline-flex items-center gap-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold ${sizeClasses[size]} ${className}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Call {CONTACT_INFO.phone.display}
      </a>
    );
  }

  // variant === "text"
  return (
    <a
      href={`sms:${CONTACT_INFO.phone.tel}`}
      className={`inline-flex items-center gap-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition font-semibold ${sizeClasses[size]} ${className}`}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      Text {CONTACT_INFO.phone.display}
    </a>
  );
}
