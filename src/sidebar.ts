export function initSidebar() {
  const sidebarElement = document.getElementById('sidebar');
  const toggleSidebarElement = document.getElementById('header-menu');
  if (sidebarElement === null || toggleSidebarElement === null) {
    return;
  }

  toggleSidebarElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    sidebarElement.classList.toggle('layout__sidebar_hidden');
  });

  document.addEventListener(
    'click',
    () => {
      sidebarElement.classList.add('layout__sidebar_hidden');
    },
    { passive: true }
  );
}

export default initSidebar;
