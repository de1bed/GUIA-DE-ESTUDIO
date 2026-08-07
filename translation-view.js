/* La vista en español volcaba el texto corrido en un bloque plano, sin
   preguntas ni opciones. Aquí se arma con la misma estructura del formulario
   original: enunciado, tres opciones y casilla, junto al escaneo. */

const TBANK = window.QUESTION_BANK || {};

const tEsc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const SECTION_ES = {
  'General Knowledge / Air Brake Test': 'Conocimientos Generales / Prueba de Frenos de Aire',
  'General Knowledge Test': 'Prueba de Conocimientos Generales',
  'Air Brake Test': 'Prueba de Frenos de Aire',
  'Passenger Transport Endorsement': 'Endoso de Transporte de Pasajeros',
  'Class C Examination': 'Examen de Clase C',
  'Commercial Driver Examination': 'Examen de Conductor Comercial',
};

/* Marca las coincidencias de la búsqueda sin romper el marcado. */
function highlight(root, query) {
  if (!query) return 0;
  const needle = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.toLowerCase().includes(needle)) targets.push(node);
  }
  targets.forEach(text => {
    const fragment = document.createDocumentFragment();
    let rest = text.nodeValue;
    let at;
    while ((at = rest.toLowerCase().indexOf(needle)) !== -1) {
      fragment.append(rest.slice(0, at));
      const mark = document.createElement('mark');
      mark.textContent = rest.slice(at, at + query.length);
      fragment.append(mark);
      rest = rest.slice(at + query.length);
    }
    fragment.append(rest);
    text.replaceWith(fragment);
  });
  return targets.length;
}

function paintTranslation() {
  const host = $('#translatedPage');
  const page = TBANK[String(translationPage)];
  const query = $('#translationSearch').value.trim();

  if (!page) {
    host.innerHTML = '<p class="tr-empty">Esta hoja aún no tiene transcripción.</p>';
    return;
  }

  const sectionEs = SECTION_ES[page.section] || page.section;
  const questions = page.questions.map(q => {
    const options = ['A', 'B', 'C'].map((letter, i) => `
      <li>
        <span class="tr-box" aria-hidden="true"></span>
        <span class="tr-letter">${letter}</span>
        <span class="tr-opt"><b>${tEsc(q.optsEs[i])}</b><em>${tEsc(q.optsEn[i])}</em></span>
      </li>`).join('');
    const flags = [
      q.figure ? '<p class="tr-flag">▲ Depende de una figura impresa: mírala en el escaneo de la izquierda.</p>' : '',
      q.note ? `<p class="tr-flag">▲ ${tEsc(q.note)}</p>` : '',
    ].join('');
    return `<article class="tr-q">
      <h4><span class="tr-num">${q.n}</span>${tEsc(q.es)}</h4>
      <p class="tr-en">${tEsc(q.en)}</p>
      <ul class="tr-opts">${options}</ul>${flags}
    </article>`;
  }).join('');

  host.innerHTML = `<header class="tr-head">
      <strong>${tEsc(sectionEs)}</strong>
      <small>${tEsc(page.section)} · hoja ${page.folio} del folleto · ${page.questions.length} preguntas</small>
    </header>${questions}`;
  host.style.fontSize = `${translationFont}px`;

  const hits = highlight(host, query);
  const first = host.querySelector('mark');
  if (first) first.scrollIntoView({ block: 'center' });

  const status = $('#translationHits');
  if (status) status.textContent = query ? `${hits} coincidencia${hits === 1 ? '' : 's'}` : '';
}

function selectTranslationPage(page) {
  translationPage = Math.max(1, Math.min(52, +page));
  const code = String(translationPage).padStart(2, '0');
  const folio = 2 * translationPage - 1;
  $('#translationPageCount').textContent = `${code} / 52`;
  $('#translationSourcePage').textContent = folio;
  $('#translationPageSelect').value = translationPage;
  $('#translationSourceImage').src = `assets/questionnaire-v2/page-${code}.jpg`;
  $('#translationSourceImage').alt = `Hoja ${folio} del cuestionario original en inglés`;
  paintTranslation();
}

/* El selector muestra el folio real, no el número de archivo. */
$('#translationPageSelect').innerHTML = Array.from({ length: 52 }, (_, i) =>
  `<option value="${i + 1}">Hoja ${2 * (i + 1) - 1}</option>`).join('');

/* Contador de coincidencias junto al buscador. */
$('.translation-search')?.insertAdjacentHTML('beforeend', '<b id="translationHits" class="tr-hits"></b>');

$('#translationPrev').onclick = () => selectTranslationPage(translationPage - 1);
$('#translationNext').onclick = () => selectTranslationPage(translationPage + 1);
$('#translationPageSelect').onchange = e => selectTranslationPage(e.target.value);
$('#translationSearch').oninput = paintTranslation;
$('#translationSmaller').onclick = () => { translationFont = Math.max(11, translationFont - 1); paintTranslation(); };
$('#translationLarger').onclick = () => { translationFont = Math.min(24, translationFont + 1); paintTranslation(); };

selectTranslationPage(translationPage || 1);
