const SIDEBAR_ID = 'sidebar';
const HEADER_MENU_ID = 'header-menu';

const SIDEBAR_CLASS = 'layout__sidebar';
const SIDEBAR_HIDDEN_CLASS = `${SIDEBAR_CLASS}_hidden`;

export function initSidebar() {
  const sidebarElement = document.getElementById(SIDEBAR_ID);
  const toggleSidebarElement = document.getElementById(HEADER_MENU_ID);
  if (sidebarElement === null || toggleSidebarElement === null) {
    return;
  }

  toggleSidebarElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    sidebarElement.classList.toggle(SIDEBAR_HIDDEN_CLASS);
  });

  document.addEventListener('click', () => sidebarElement.classList.add(SIDEBAR_HIDDEN_CLASS), { passive: true });
}

export default initSidebar;
