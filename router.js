/* Convierte el portal de una sola pagina de 19 000 px en vistas separadas.

   Cada seccion pasa a ser una vista independiente: solo una es visible a la
   vez, la navegacion cambia entre ellas y el hash de la URL las hace
   enlazables y compatibles con el boton atras del navegador. */

const VIEWS = [
  { id: 'inicio', label: 'Inicio', icon: '⌂' },
  { id: 'biblioteca', label: 'Biblioteca', icon: '▤' },
  { id: 'explorador', label: 'Escaneos', icon: '⛶' },
  { id: 'traduccion', label: 'Español', icon: '⇄' },
  { id: 'bilingue', label: 'Bilingüe', icon: '◫' },
  { id: 'infografias', label: 'Infografías', icon: '◈' },
  { id: 'academia', label: 'Academia', icon: '✦' },
  { id: 'practica', label: 'Práctica', icon: '✓' },
  { id: 'progreso', label: 'Progreso', icon: '◔' },
];

/* Las que llevan un atajo permanente en la barra inferior del telefono. */
const QUICK = ['inicio', 'practica', 'explorador', 'traduccion', 'progreso'];

const viewIds = VIEWS.map(v => v.id);
const sectionOf = id => document.getElementById(id);
const isView = id => viewIds.includes(id);

let currentView = null;

function navigate(id, { push = true } = {}) {
  if (!isView(id)) return false;
  const target = sectionOf(id);
  if (!target) return false;

  viewIds.forEach(other => {
    const el = sectionOf(other);
    if (el) el.hidden = other !== id;
  });
  /* El aviso de contenido fuente solo tiene sentido junto al material. */
  const notice = document.querySelector('.notice-wrap');
  if (notice) notice.hidden = !['inicio', 'biblioteca', 'explorador', 'traduccion'].includes(id);

  currentView = id;
  document.body.dataset.view = id;

  document.querySelectorAll('[data-view-link]').forEach(link =>
    link.classList.toggle('active', link.dataset.viewLink === id));

  if (push && location.hash !== `#${id}`) history.pushState({ view: id }, '', `#${id}`);
  scrollTo({ top: 0, behavior: 'instant' });
  return true;
}

/* Cualquier enlace interno que apunte a una vista la abre en lugar de
   desplazarse por una pagina interminable. */
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  if (!isView(id)) return;
  event.preventDefault();
  navigate(id);
});

/* app.js y overrides.js saltan de seccion con scrollIntoView. En lugar de
   editar cada llamada, se intercepta: si el destino es una vista, se abre. */
const scrollIntoViewBase = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function (...args) {
  if (this.id && isView(this.id)) {
    navigate(this.id);
    return;
  }
  /* Si el destino vive dentro de otra vista, se abre antes de desplazar. */
  const owner = this.closest?.(viewIds.map(id => `#${id}`).join(','));
  if (owner && owner.id !== currentView) navigate(owner.id);
  return scrollIntoViewBase.apply(this, args);
};

addEventListener('popstate', () => navigate(location.hash.slice(1) || 'inicio', { push: false }));

/* Navegacion de escritorio: los enlaces de la barra superior. */
document.querySelectorAll('.topbar nav a').forEach(link => {
  const id = link.getAttribute('href').slice(1);
  if (isView(id)) link.dataset.viewLink = id;
});

/* Barra inferior para telefono: los cinco destinos mas usados, siempre a mano. */
const tabbar = document.createElement('nav');
tabbar.className = 'tabbar';
tabbar.setAttribute('aria-label', 'Navegación rápida');
tabbar.innerHTML = QUICK.map(id => {
  const view = VIEWS.find(v => v.id === id);
  return `<a href="#${id}" data-view-link="${id}"><i>${view.icon}</i><span>${view.label}</span></a>`;
}).join('');
document.body.append(tabbar);

/* Cabecera de la vista: dice donde estas y permite volver al inicio. */
const crumb = document.createElement('div');
crumb.className = 'view-crumb';
crumb.innerHTML = '<button type="button" id="crumbBack" aria-label="Volver al inicio">←</button><strong id="crumbTitle"></strong>';
document.querySelector('main').prepend(crumb);
crumb.querySelector('#crumbBack').onclick = () => navigate('inicio');

const crumbTitle = crumb.querySelector('#crumbTitle');
const baseNavigate = navigate;
navigate = function (id, options) {
  const ok = baseNavigate(id, options);
  if (ok) {
    const view = VIEWS.find(v => v.id === id);
    crumbTitle.textContent = view.label;
    crumb.hidden = id === 'inicio';
  }
  return ok;
};

/* Accesos desde la portada a cada area, para no depender solo del menu. */
const hub = document.createElement('div');
hub.className = 'view-hub';
hub.innerHTML = `<h2>Todo el material</h2><div class="hub-grid">${
  VIEWS.filter(v => v.id !== 'inicio').map(v =>
    `<a href="#${v.id}"><i>${v.icon}</i><strong>${v.label}</strong></a>`).join('')
}</div>`;
sectionOf('inicio').append(hub);

navigate(location.hash.slice(1) || 'inicio', { push: false });
