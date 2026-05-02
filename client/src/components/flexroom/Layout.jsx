import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './flexroom.css';

const SIDEBAR_PX = 220;
const TOPBAR_PX = 56;

/**
 * FlexRoom shell: fixed 1440×1024 frame. Sidebar full height; top bar over main lane only.
 * Only the main region scrolls.
 */
function Layout({
  sidebarVariant,
  displayName,
  defaultSidebarOpen = false,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);

  return (
    <div className="fr-shell">
      <TopBar
        displayName={displayName}
        sidebarWidthPx={SIDEBAR_PX}
        topBarHeightPx={TOPBAR_PX}
        onMenuClick={() => setIsSidebarOpen((current) => !current)}
      />
      <Sidebar
        variant={sidebarVariant}
        widthPx={SIDEBAR_PX}
        heightPx={1024}
        topOffsetPx={TOPBAR_PX}
        isOpen={isSidebarOpen}
      />
      <main className={`fr-main ${isSidebarOpen ? 'fr-main-open' : 'fr-main-closed'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
export { SIDEBAR_PX, TOPBAR_PX };
