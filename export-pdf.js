/* Botones para descargar o imprimir el cuestionario en español, igual que
   los manuales tienen su PDF descargable en la biblioteca. La página no
   cambia: solo se añaden los accesos. */

const PDF_ES = 'Mandatory Class B Practice Test - Espanol.pdf';
const PDF_EN = 'Mandatory Class B Practice Test.pdf';

function exportButtons({ compact = false } = {}) {
  return `<span class="pdf-export ${compact ? 'compact' : ''}">
    <a class="pdf-btn" href="${encodeURI(PDF_ES)}" download>
      <i aria-hidden="true">↓</i>${compact ? 'PDF' : 'Descargar PDF en español'}</a>
    <button type="button" class="pdf-btn ghost" data-print-pdf>
      <i aria-hidden="true">⎙</i>${compact ? 'Imprimir' : 'Imprimir'}</button>
  </span>`;
}

/* Se abre en una pestaña y se lanza el diálogo de impresión del visor. */
function printPdf(file) {
  const win = open(encodeURI(file), '_blank');
  if (!win) return;
  win.addEventListener('load', () => setTimeout(() => win.print(), 600), { once: true });
}

function wirePrint(scope = document) {
  scope.querySelectorAll('[data-print-pdf]').forEach(button => {
    button.onclick = () => printPdf(button.dataset.printPdf || PDF_ES);
  });
}

/* Vista en español: junto a los controles de página. */
$('.translation-controls')?.insertAdjacentHTML('beforeend', exportButtons({ compact: true }));

/* Explorador de escaneos: allí se consulta el original en inglés. */
const scanNav = $('.scan-nav p');
if (scanNav) {
  scanNav.insertAdjacentHTML('afterend', `<span class="pdf-export compact">
    <a class="pdf-btn" href="${encodeURI(PDF_EN)}" download><i aria-hidden="true">↓</i>Original</a>
    <a class="pdf-btn" href="${encodeURI(PDF_ES)}" download><i aria-hidden="true">↓</i>Español</a>
  </span>`);
}

/* Cabecera de la sección en español: el acceso principal, bien visible. */
const translationHeading = document.querySelector('#traduccion .section-heading');
if (translationHeading) translationHeading.insertAdjacentHTML('beforeend', exportButtons());

wirePrint();
