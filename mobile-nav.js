/* Menú de navegación para teléfono.

   styles.css oculta .topbar nav por debajo de 1000 px sin poner nada en su
   lugar, así que en móvil la única forma de moverse era recorrer 19 000 px
   de scroll. Este archivo añade un botón hamburguesa y un panel lateral. */

const NAV_LINKS = [
  ['#inicio', 'Inicio'],
  ['#biblioteca', 'Biblioteca'],
  ['#explorador', 'Explorador original'],
  ['#traduccion', 'Español'],
  ['#infografias', 'Infografías'],
  ['#academia', 'Academia'],
  ['#practica', 'Práctica'],
  ['#progreso', 'Progreso'],
];

const topbar = document.querySelector('.topbar');

const toggle = document.createElement('button');
toggle.className = 'nav-toggle';
toggle.type = 'button';
toggle.setAttribute('aria-label', 'Abrir menú de navegación');
toggle.setAttribute('aria-expanded', 'false');
toggle.setAttribute('aria-controls', 'mobileDrawer');
toggle.innerHTML = '<span></span><span></span><span></span>';
topbar.append(toggle);

const backdrop = document.createElement('div');
backdrop.className = 'nav-backdrop';
backdrop.hidden = true;

const drawer = document.createElement('nav');
drawer.className = 'nav-drawer';
drawer.id = 'mobileDrawer';
drawer.setAttribute('aria-label', 'Navegación principal');
drawer.hidden = true;
drawer.innerHTML = `
  <div class="nav-drawer-head">
    <strong>Ruta CDL</strong>
    <button type="button" class="nav-close" aria-label="Cerrar menú">✕</button>
  </div>
  <ul>${NAV_LINKS.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
  <div class="nav-drawer-foot">
    <button type="button" id="drawerLanguage">ES ↔ EN</button>
    <button type="button" id="drawerKey">Ver clave completa</button>
  </div>`;

document.body.append(backdrop, drawer);

let lastFocus = null;

function openNav() {
  lastFocus = document.activeElement;
  drawer.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => document.body.classList.add('nav-open'));
  toggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  drawer.querySelector('a')?.focus();
}

function closeNav() {
  document.body.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  setTimeout(() => { drawer.hidden = true; backdrop.hidden = true; }, 220);
  lastFocus?.focus();
}

const navIsOpen = () => document.body.classList.contains('nav-open');

toggle.onclick = () => (navIsOpen() ? closeNav() : openNav());
backdrop.onclick = closeNav;
drawer.querySelector('.nav-close').onclick = closeNav;
drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navIsOpen()) closeNav();
  /* Mantener el foco dentro del panel mientras está abierto. */
  if (event.key === 'Tab' && navIsOpen()) {
    const focusable = [...drawer.querySelectorAll('a,button')].filter(el => !el.disabled);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

drawer.querySelector('#drawerLanguage').onclick = () => { document.querySelector('#languageButton')?.click(); closeNav(); };
drawer.querySelector('#drawerKey').onclick = () => { closeNav(); openAnswerKey(); };

/* Volver arriba: con 19 000 px de página, en móvil es imprescindible. */
const toTop = document.createElement('button');
toTop.className = 'to-top';
toTop.type = 'button';
toTop.setAttribute('aria-label', 'Volver al inicio de la página');
toTop.textContent = '↑';
document.body.append(toTop);
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
addEventListener('scroll', () => toTop.classList.toggle('visible', scrollY > 900), { passive: true });
