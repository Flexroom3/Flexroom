import React from 'react';
import { Menu } from 'lucide-react';
import LogoWhite from '../auth/Flexroom-white.png';

/**
 * Sage top bar spanning the main content lane (not over sidebar).
 */
function TopBar({
  displayName = 'Guest',
  topBarHeightPx = 56,
  onMenuClick,
}) {
  const greeting =
    typeof displayName === 'string' && displayName.trim().length > 0
      ? `Hi, ${displayName.trim()}!`
      : 'Hi!';

  return (
    <header className="fr-topbar d-flex align-items-center justify-content-between px-4" style={{ height: topBarHeightPx }}>
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="btn btn-sm text-white border-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} aria-hidden />
        </button>
        <img src={LogoWhite} alt="FlexRoom" style={{ height: 40 }} />
      </div>
      <div className="d-flex align-items-center gap-3">
        <span style={{ fontSize: 15, fontWeight: 500 }}>{greeting}</span>
        <div
          className="d-flex align-items-center justify-content-center rounded-circle"
          style={{ width: 36, height: 36, background: '#5a604d' }}
          aria-hidden
        >
          <svg
            style={{ width: 24, height: 24, color: '#cfd2c9' }}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-8 1.67-8 5v2h16v-2c0-3.33-4.67-5-8-5Z" />
          </svg>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
