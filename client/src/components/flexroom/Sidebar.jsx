import React from 'react';
import { Link } from 'react-router-dom';
import { House, Calendar, Users, Settings, LogOut } from 'lucide-react';
import RoundGreen from '../auth/round-green.png';

/**
 * Fixed sidebar: student (Home, Calendar) vs evaluator (Home, People).
 */
function Sidebar({
  variant = 'student',
  widthPx = 220,
  heightPx = 1024,
  topOffsetPx = 56,
  isOpen = false,
}) {
  const middleNav =
    variant === 'evaluator' ? (
      <>
        <Link to="/flexroom/evaluator" className="fr-nav-link">
          <House size={20} color="#5c6054" aria-hidden />
          Home
        </Link>
        <button type="button" className="fr-nav-btn">
          <Users size={20} color="#5c6054" aria-hidden />
          People
        </button>
      </>
    ) : (
      <>
        <Link to="/flexroom/student" className="fr-nav-link">
          <House size={20} color="#5c6054" aria-hidden />
          Home
        </Link>
        <button type="button" className="fr-nav-btn">
          <Calendar size={20} color="#5c6054" aria-hidden />
          Calendar
        </button>
      </>
    );

  return (
    <aside
      className="fr-sidebar d-flex flex-column"
      style={{ width: widthPx, height: heightPx, paddingTop: topOffsetPx + 24, transform: isOpen ? 'translateX(0)' : `translateX(-${widthPx}px)` }}
    >
      <nav className="d-flex flex-column gap-1 px-3 flex-grow-1" aria-label="Primary">
        {middleNav}
      </nav>

      <div className="mt-auto d-flex flex-column gap-1 px-3 pb-4">
        <button type="button" className="fr-nav-btn">
          <Settings size={20} color="#5c6054" aria-hidden />
          Settings
        </button>
        <button type="button" className="fr-nav-btn">
          <LogOut size={20} color="#5c6054" aria-hidden />
          Logout
        </button>
        <div className="d-flex justify-content-center mt-4">
          <img src={RoundGreen} alt="FlexRoom mark" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
