'use client';

export function SkipToContent() {
  const moveFocusToMain = () => {
    const main = document.getElementById('main-content');
    if (!main) return;

    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
    window.history.replaceState(null, '', '#main-content');
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    moveFocusToMain();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    moveFocusToMain();
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="skip-to-main fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-md transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-600"
    >
      Skip to main content
    </a>
  );
}
