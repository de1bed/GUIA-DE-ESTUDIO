/* Dos infografías más, construidas con las preguntas reales del cuestionario
   en lugar de contenido inventado: las cifras que el examen pregunta y las
   preguntas que dependen de una figura impresa. */

const XBANK = window.QUESTION_BANK || {};
const xEsc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const xFolio = file => 2 * file - 1;

/* Una pregunta es "de cifra" cuando sus tres opciones son valores.
   Se mide sobre el texto en inglés, que es mas uniforme, y se muestra el
   español. */
const NUMERIC = /^([\d.,;\s]+(%|\s*psi|\s*mph|\s*feet|\s*seconds?|\s*years?|\s*months?)?|one|two|three|four|five)\.?$/i;

function collect(predicate) {
  const out = [];
  Object.entries(XBANK).forEach(([file, page]) => {
    page.questions.forEach(q => {
      if (predicate(q)) out.push({ ...q, file: +file, folio: xFolio(+file) });
    });
  });
  return out;
}

const keyOf = (file, n) => pageForms[file]?.key?.[n];

const numberCards = collect(q => q.optsEn.every(o => NUMERIC.test(o.trim())));
const figureCards = collect(q => q.figure);

/* Agrupa las cifras por tema para que se puedan repasar de un vistazo. */
const TOPICS = [
  ['Frenos de aire', /psi|frenos de aire|compresor|válvula de seguridad|retraso/i],
  ['Espacio y velocidad', /segundos|distancia|velocidad|duplica|mph/i],
  ['Alcohol y documentos', /alcohol|BAC|certificad|CDL|DMV|días/i],
  ['Autobús y pasajeros', /autobús|pasajeros|ferrocarril|puente|asientos/i],
];

function topicOf(q) {
  const text = `${q.es} ${q.optsEs.join(' ')}`;
  return (TOPICS.find(([, re]) => re.test(text)) || ['Otras cifras'])[0];
}

function renderNumbers() {
  const withKey = numberCards
    .map(q => ({ ...q, key: keyOf(q.file, q.n) }))
    .filter(q => q.key);

  const groups = {};
  withKey.forEach(q => { (groups[topicOf(q)] ??= []).push(q); });

  $('#visualStage').innerHTML = `
    <div class="visual-intro"><div>
      <p class="eyebrow dark"><span></span> CIFRAS QUE PREGUNTA EL EXAMEN</p>
      <h3>Los números, todos juntos.</h3>
      <p>${withKey.length} preguntas del cuestionario se responden con una cifra. Aquí están agrupadas por tema, con la respuesta de la clave. Toca una para abrirla en su hoja.</p>
    </div></div>
    <div class="figure-groups">${Object.entries(groups).map(([topic, list]) => `
      <section class="figure-group">
        <h4>${xEsc(topic)} <span>${list.length}</span></h4>
        <div class="number-grid">${list.map(q => `
          <button class="number-card" data-goto-sheet="${q.file}" data-goto-n="${q.n}">
            <b>${xEsc(q.optsEs['ABC'.indexOf(q.key)].replace(/\.$/, ''))}</b>
            <span>${xEsc(q.es)}</span>
            <small>Hoja ${q.folio} · pregunta ${q.n}</small>
          </button>`).join('')}</div>
      </section>`).join('')}</div>`;
  wireGoto();
}

function renderFigures() {
  $('#visualStage').innerHTML = `
    <div class="visual-intro"><div>
      <p class="eyebrow dark"><span></span> PREGUNTAS CON FIGURA</p>
      <h3>Las que no se pueden responder solo con texto.</h3>
      <p>${figureCards.length} preguntas dependen de un dibujo impreso: un letrero, un diagrama de giro o una señal. La transcripción conserva el enunciado, pero la figura solo está en el escaneo.</p>
    </div></div>
    <div class="figure-list">${figureCards.map(q => `
      <button class="figure-card" data-goto-sheet="${q.file}" data-goto-n="${q.n}">
        <img loading="lazy" src="assets/questionnaire/page-${String(q.file).padStart(2, '0')}.jpg" alt="Hoja ${q.folio}">
        <div>
          <strong>${xEsc(q.es)}</strong>
          <em>${xEsc(q.en)}</em>
          <ul>${q.optsEs.map((o, i) => `<li><b>${'ABC'[i]}</b> ${xEsc(o)}</li>`).join('')}</ul>
          <small>Hoja ${q.folio} · pregunta ${q.n} · ver el dibujo en el escaneo</small>
        </div>
      </button>`).join('')}</div>`;
  wireGoto();
}

/* Cualquier tarjeta lleva a su hoja en el simulador. */
function wireGoto() {
  $$('[data-goto-sheet]').forEach(card => card.onclick = () => {
    sourceExamPage = +card.dataset.gotoSheet;
    showPractice('source');
    renderSourceExam();
    $('#practica').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const row = $(`[data-source-answer="${card.dataset.gotoN}"]`)?.closest('.q-item');
      if (row) { row.scrollIntoView({ block: 'center' }); row.classList.add('q-flash'); }
    }, 120);
  });
}

/* Se añaden las pestañas y se extiende el conmutador existente. */
const tabs = $('.visual-tabs');
tabs.insertAdjacentHTML('beforeend',
  '<button data-visual="numbers">Cifras clave</button><button data-visual="figures">Preguntas con figura</button>');

const renderVisualBase = renderVisual;
renderVisual = mode => {
  if (mode === 'numbers' || mode === 'figures') {
    $$('.visual-tabs button').forEach(b => b.classList.toggle('active', b.dataset.visual === mode));
    return mode === 'numbers' ? renderNumbers() : renderFigures();
  }
  return renderVisualBase(mode);
};
$$('[data-visual]').forEach(b => b.onclick = () => renderVisual(b.dataset.visual));
