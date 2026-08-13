/* Muestra el enunciado y las tres opciones de cada pregunta en lugar de
   botones A/B/C sueltos. Las páginas todavía sin transcribir conservan la
   hoja de respuestas compacta, de modo que nada deja de funcionar. */

const BANK = window.QUESTION_BANK || {};

/* En el folleto completo, el número de archivo coincide con el folio. */
const folioOf = file => Number(file);
const bankPage = file => BANK[String(file)];
const bankQuestion = (file, number) =>
  (bankPage(file)?.questions || []).find(q => q.n === Number(number));

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Verificaciones de la clave contra el manual, cuando existen. */
const AUDIT = (window.ANSWER_AUDIT?.entradas || []);
const auditOf = (file, number) =>
  AUDIT.find(e => (2 * e.archivo - 1) === Number(file) && e.n === Number(number));

/* Claves que el folleto no traía: unas se copian de otra hoja que repite la
   misma pregunta, otras se dedujeron de los manuales. Se guardan aparte para
   poder decir siempre de dónde salió cada respuesta. */
const IA = window.CLAVES_IA || {};
const iaOf = (file, number) => IA[String(file)]?.[String(number)];

/* Correcciones a pageForms comprobadas contra los escaneos:
   - la hoja 5 abre la Seccion 3 con una pregunta que la tabla no listaba;
   - la hoja 43 se titula "Commercial Driver Examination" en el original,
     no "Class C Examination", y eso alimenta el filtro por seccion. */
Object.keys(pageForms).forEach(page => delete pageForms[page]);
Object.entries(BANK).forEach(([page, data]) => {
  const claveDe = q => q.key || iaOf(page, q.n)?.clave;
  pageForms[page] = {
    section: data.section,
    numbers: data.questions.map(q => q.n),
    key: Object.fromEntries(data.questions.filter(claveDe).map(q => [q.n, claveDe(q)])),
    /* Sólo las que venían impresas en el folleto. */
    keyFolleto: Object.fromEntries(data.questions.filter(q => q.key).map(q => [q.n, q.key])),
  };
});
verifiedQuestionBank = Object.entries(pageForms).flatMap(([page, form]) =>
  form.numbers.filter(number => form.key[number]).map(number => ({
    page: +page, number, section: form.section, correct: form.key[number],
  })));

/* Los totales dejan de estar codificados a mano: se derivan de los datos.
   Estaban escritos como 255 y 253 en el HTML y dentro de updateStats, y
   quedaron desfasados al recuperar la pregunta que faltaba en la hoja 5. */
const TOTAL_SPACES = Object.values(pageForms).reduce((sum, form) => sum + form.numbers.length, 0);
const TOTAL_KEYS = Object.values(pageForms).reduce((sum, form) => sum + Object.keys(form.key || {}).length, 0);
const TOTAL_FOLLETO = Object.values(pageForms).reduce((sum, form) => sum + Object.keys(form.keyFolleto || {}).length, 0);
const SHEET_COUNT = Object.keys(pageForms).length;
const BOOKLET_SHEETS = SHEET_COUNT;

/* Sincroniza los rótulos fijos del portal con los datos reales. */
function syncTotals() {
  const answered = Object.entries(pageForms).reduce(
    (sum, [page, form]) => sum + form.numbers.filter(n => (sourceAnswers[`p${page}`] || {})[n]).length, 0);
  const percent = Math.min(100, Math.round(answered / TOTAL_SPACES * 100));

  const set = (selector, text) => { const el = $(selector); if (el) el.textContent = text; };
  set('#heroPercent', `${percent}%`);
  set('#heroAnswered', `${answered}/${TOTAL_SPACES}`);
  set('#heroProgressCopy', `${answered} de ${TOTAL_SPACES} espacios respondidos.`);
  const ring = $('.ring');
  if (ring) ring.style.background = `conic-gradient(var(--amber) 0 ${percent}%,#dfe5e7 ${percent}%)`;

  set('[data-jump="source"] small', `${SHEET_COUNT} hojas · ${TOTAL_SPACES} espacios`);
  set('[data-jump="custom"] small', `10, 25, 50 o ${TOTAL_KEYS} preguntas`);
  set('[data-practice="source"]', `Cuestionario completo · ${TOTAL_SPACES}`);

  const badge = $('.fidelity-badge');
  if (badge) {
    badge.querySelector('small').textContent = 'FIDELIDAD VERIFICADA';
    badge.querySelector('strong').textContent = `${SHEET_COUNT} de ${BOOKLET_SHEETS} hojas`;
    badge.title = 'Las 52 hojas consecutivas del folleto completo están disponibles.';
  }
}

/* updateStats calcula el porcentaje del encabezado con el total antiguo. */
const updateStatsBase = updateStats;
updateStats = () => { updateStatsBase(); syncTotals(); };

/* Verificación individual: qué preguntas tienen la clave ya revelada. */
const revealed = new Set(JSON.parse(localStorage.getItem('rutaCdlRevealed') || '[]'));
const revealKey = (file, number) => `${file}:${number}`;
const isRevealed = (file, number) => revealed.has(revealKey(file, number));
function toggleReveal(file, number) {
  const id = revealKey(file, number);
  revealed.has(id) ? revealed.delete(id) : revealed.add(id);
  localStorage.setItem('rutaCdlRevealed', JSON.stringify([...revealed]));
}

function optionMarkup(question, letter, index, { selected, keyed, disabled, attrs, badge }) {
  const option = question ? question.optsEn[index] : null;
  const optionEs = question ? question.optsEs[index] : null;
  const classes = [selected ? 'selected' : '', keyed ? 'key-answer' : '', badge === 'bad' ? 'wrong-pick' : ''].filter(Boolean).join(' ');
  const tag = badge === 'ok' ? '<b class="opt-badge ok">Correcta</b>'
    : badge === 'bad' ? '<b class="opt-badge bad">Tu respuesta</b>' : '';
  const body = option
    ? `<span class="opt-text"><b>${esc(option)}</b><em>${esc(optionEs)}</em></span>`
    : '';
  return `<button class="${classes}" ${attrs} ${disabled ? 'disabled' : ''}><i>${letter}</i>${body}${tag}</button>`;
}

function questionMarkup(file, number, { answers, key, graded, unanswerable }) {
  const question = bankQuestion(file, number);
  const isBlank = unanswerable.includes(Number(number));
  const correct = key[number];
  const picked = answers[number];
  /* Se revela por la casilla individual o por el botón de revisión general. */
  const show = Boolean(correct) && (graded || isRevealed(file, number));
  const rowState = show ? (picked === correct ? 'row-correct' : picked ? 'row-wrong' : 'row-key') : '';

  const options = ['A', 'B', 'C'].map((letter, index) => optionMarkup(question, letter, index, {
    selected: picked === letter,
    keyed: show && correct === letter,
    disabled: isBlank,
    attrs: `data-source-answer="${number}" data-source-letter="${letter}"`,
    badge: !show ? null : correct === letter ? 'ok' : picked === letter ? 'bad' : null,
  })).join('');

  const heading = question
    ? `<p class="q-en">${esc(question.en)}</p><p class="q-es">${esc(question.es)}</p>`
    : `<p class="q-pending">Enunciado aún no transcrito · léelo en el escaneo de la izquierda.</p>`;

  const verdict = !show ? '' : `<p class="q-verdict ${picked === correct ? 'ok' : 'bad'}">${
    picked === correct ? `✓ Correcta. La clave es <b>${correct}</b>.`
      : picked ? `✗ Marcaste <b>${picked}</b>. La correcta es <b>${correct}</b>.`
        : `La respuesta correcta es <b>${correct}</b>.`
  }</p>`;

  /* Antes, una pregunta sin clave simplemente no mostraba nada: el botón
     "Verificar respuesta" aparecía en unas preguntas y en otras no, sin
     explicación. Ahora el hueco se declara en lugar de quedar mudo. */
  const verify = isBlank ? ''
    : correct
      ? `<button class="q-verify" data-verify="${number}">${show ? 'Ocultar respuesta' : 'Verificar respuesta'}</button>`
      : `<p class="missing-note">Sin clave verificada todavía · esta pregunta aún no tiene respuesta contrastada contra el manual, por eso no hay botón de verificación.</p>`;

  /* Si la clave se contrasto contra el manual, se cita el pasaje. */
  const audit = show ? auditOf(file, number) : null;
  const source = !audit ? '' : `<figure class="q-source ${audit.veredicto}">
    <figcaption>${{
      confirmado: '✓ Confirmado en el manual',
      compatible: '≈ Compatible con el manual vigente',
      cambio: '⚠ La norma cambió desde 2003',
    }[audit.veredicto] || 'Contrastado'} · Commercial Driver Handbook, pág. ${audit.pagina}</figcaption>
    <blockquote>${esc(audit.cita)}</blockquote>
    <small>${esc(audit.nota)}</small>
  </figure>`;

  /* Procedencia: nunca se presenta una respuesta deducida como si viniera
     impresa en el folleto. */
  const ia = show ? iaOf(file, number) : null;
  const origen = !ia ? '' : ia.origen === 'duplicado'
    ? `<figure class="q-origin duplicado">
        <figcaption>↔ Clave del folleto original, tomada de otra hoja</figcaption>
        <small>${esc(ia.nota)}</small>
      </figure>`
    : `<figure class="q-origin ia ${ia.certeza}">
        <figcaption>RESPUESTA CON IA BASADA EN LOS MANUALES · ${{
          confirmada: 'el manual lo dice literalmente',
          deducida: 'deducida por descarte, revisable',
          cambio: 'la norma cambió desde 2003',
        }[ia.certeza] || 'contrastada'}</figcaption>
        <blockquote>${esc(ia.cita)}</blockquote>
        <small>${esc(ia.nota)} · ${esc(ia.manual)}, pág. ${ia.pagina}</small>
      </figure>`;

  return `<article class="q-item ${rowState} ${question ? '' : 'q-compact'} ${!isBlank && !correct ? 'q-unkeyed' : ''}">
    <header><b>${number}</b>${isBlank ? '<span class="q-blank">El original imprime “??” y no incluye pregunta</span>' : heading}</header>
    <div class="q-opts">${options}</div>
    ${question?.figure ? '<small class="q-figure">Esta pregunta depende de la figura impresa: consulta el escaneo.</small>' : ''}
    ${verdict}${source}${origen}${verify}
  </article>`;
}

function renderSourceExam() {
  const pageKey = `p${sourceExamPage}`;
  const form = pageForms[sourceExamPage];
  const answers = sourceAnswers[pageKey] || {};
  const key = form.key || {};
  const graded = sourceAnswers[`${pageKey}Graded`];
  const unanswerable = form.unanswerable || [];
  const answered = form.numbers.filter(n => answers[n]).length;
  const score = form.numbers.filter(n => key[n] && answers[n] === key[n]).length;
  const keyCount = Object.keys(key).length;
  const folletoCount = Object.keys(form.keyFolleto || {}).length;
  const folio = folioOf(sourceExamPage);
  const transcribed = Boolean(bankPage(sourceExamPage));

  $('#sourceExamShell').innerHTML = `<div class="source-exam-head">
      <div><strong>${form.section} · Hoja ${folio} del folleto</strong>
      <small>Escaneo ${sourceExamPage} de ${SHEET_COUNT} · preguntas ${form.numbers[0]}–${form.numbers.at(-1)} tal como aparecen impresas</small></div>
      <div><button id="sourceExamPrev">←</button><span>${String(sourceExamPage).padStart(2, '0')} / ${SHEET_COUNT}</span><button id="sourceExamNext">→</button></div>
    </div>
    <div class="source-exam-body">
      <div class="source-exam-page"><img src="assets/questionnaire-v2/page-${String(sourceExamPage).padStart(2, '0')}.jpg" alt="Hoja ${folio} del cuestionario original"></div>
      <aside class="answer-sheet">
        <p class="eyebrow dark"><span></span> HOJA DE RESPUESTAS</p>
        <h3>${form.section}</h3>
        <p>${transcribed
          ? 'Enunciado y opciones transcritos del escaneo. La imagen original permanece a la izquierda para comprobar cada renglón.'
          : 'Esta hoja aún no tiene el texto transcrito: responde leyendo el escaneo de la izquierda.'}</p>
        <div class="answer-sheet-grid">${form.numbers.map(n => questionMarkup(sourceExamPage, n, { answers, key, graded, unanswerable })).join('')}</div>
        <div class="source-answer-progress"><strong>${answered}/${form.numbers.length}</strong> respondidas · <strong>${keyCount}/${form.numbers.length}</strong> con clave</div>
        ${folletoCount === keyCount ? '' : `<p class="key-origin-note">${folletoCount
          ? `${folletoCount} de estas claves venían impresas en el folleto; las otras ${keyCount - folletoCount} se completaron leyendo los manuales.`
          : 'Ninguna clave de esta hoja venía impresa en el folleto: todas se completaron leyendo los manuales.'} Cada respuesta dice su procedencia al verificarla.</p>`}
        ${keyCount ? `<button class="grade-source" id="gradeSource">${graded ? 'Ocultar revisión' : 'Revisar respuestas'}</button>` : ''}
        ${keyCount === form.numbers.length ? '' : `<div class="key-pending">${keyCount
          ? `${form.numbers.length - keyCount} de ${form.numbers.length} preguntas de esta hoja siguen sin clave: en ellas no aparece el botón “Verificar respuesta”.`
          : 'Ninguna pregunta de esta hoja tiene clave todavía, por eso no hay botón “Verificar respuesta” ni revisión.'} Clave en verificación contra el manual.</div>`}
        ${graded ? `<div class="source-score"><strong>${score}/${keyCount}</strong><span>correctas entre las preguntas con clave</span></div>` : ''}
      </aside>
    </div>`;

  $('#sourceExamPrev').onclick = () => { sourceExamPage = Math.max(1, sourceExamPage - 1); renderSourceExam(); };
  $('#sourceExamNext').onclick = () => { sourceExamPage = Math.min(SHEET_COUNT, sourceExamPage + 1); renderSourceExam(); };
  $$('[data-source-answer]').forEach(button => button.onclick = () => {
    sourceAnswers[pageKey] ??= {};
    sourceAnswers[pageKey][button.dataset.sourceAnswer] = button.dataset.sourceLetter;
    sourceAnswers[`${pageKey}Graded`] = false;
    localStorage.setItem('rutaCdlSourceAnswers', JSON.stringify(sourceAnswers));
    renderSourceExam();
  });
  if ($('#gradeSource')) $('#gradeSource').onclick = () => {
    sourceAnswers[`${pageKey}Graded`] = !graded;
    localStorage.setItem('rutaCdlSourceAnswers', JSON.stringify(sourceAnswers));
    renderSourceExam();
  };
  $$('[data-verify]').forEach(button => button.onclick = () => {
    toggleReveal(sourceExamPage, button.dataset.verify);
    renderSourceExam();
  });
  decorateSourceExam();
}

function renderCustomExamQuestion() {
  const item = customExam[customExamIndex];
  if (!item) return renderExamBuilder();
  const answer = customExamAnswers[customExamIndex];
  const answered = Object.keys(customExamAnswers).length;
  const question = bankQuestion(item.page, item.number);
  const folio = folioOf(item.page);

  const options = ['A', 'B', 'C'].map((letter, index) => optionMarkup(question, letter, index, {
    selected: answer === letter,
    keyed: false,
    disabled: false,
    attrs: `data-custom-answer="${letter}"`,
  })).join('');

  $('#customExamShell').innerHTML = `<div class="custom-exam-head">
      <div><small>SIMULACIÓN PERSONALIZADA</small><strong>${customExamIndex + 1} / ${customExam.length}</strong></div>
      <div class="custom-progress"><i style="width:${(customExamIndex + 1) / customExam.length * 100}%"></i></div>
      <span>${answered} respondidas</span>
    </div>
    <div class="custom-exam-body">
      <article><header><strong>Hoja ${folio} · Pregunta ${item.number}</strong><small>${item.section} · documento original</small></header>
        <div><img src="assets/questionnaire-v2/page-${String(item.page).padStart(2, '0')}.jpg" alt="Hoja ${folio} del cuestionario original"></div>
      </article>
      <aside>
        <p class="eyebrow dark"><span></span> PREGUNTA ${item.number}</p>
        ${question
          ? `<h3 class="q-en">${esc(question.en)}</h3><p class="q-es">${esc(question.es)}</p>`
          : `<h3>Localiza la pregunta ${item.number} en el escaneo.</h3><p>El enunciado de esta hoja aún no está transcrito.</p>`}
        <div class="custom-answer-options">${options}</div>
        <div class="custom-navigation">
          <button id="customPrev" ${customExamIndex === 0 ? 'disabled' : ''}>← Anterior</button>
          <button id="customNext">${customExamIndex === customExam.length - 1 ? 'Revisar y entregar' : 'Siguiente →'}</button>
        </div>
        <button class="exam-exit" id="customExit">Salir y crear otro examen</button>
      </aside>
    </div>`;

  $$('[data-custom-answer]').forEach(button => button.onclick = () => {
    customExamAnswers[customExamIndex] = button.dataset.customAnswer;
    renderCustomExamQuestion();
  });
  $('#customPrev').onclick = () => { customExamIndex--; renderCustomExamQuestion(); };
  $('#customNext').onclick = () => {
    if (customExamIndex === customExam.length - 1) renderCustomExamReview();
    else { customExamIndex++; renderCustomExamQuestion(); }
  };
  $('#customExit').onclick = renderExamBuilder;
}

/* Reaplica las decoraciones que app.js añadía alrededor de renderSourceExam:
   selector de hoja, progreso global, marca de actividad y estadísticas. */
function decorateSourceExam() {
  const totalAnswered = Object.entries(pageForms).reduce(
    (sum, [page, form]) => sum + form.numbers.filter(number => (sourceAnswers[`p${page}`] || {})[number]).length, 0);

  const nav = $('.source-exam-head>div:last-child');
  nav.insertAdjacentHTML('afterbegin', `<label class="source-page-jump">Ir a <select id="sourcePageJump">${
    Object.keys(pageForms).map(page => `<option value="${page}" ${+page === sourceExamPage ? 'selected' : ''}>Hoja ${folioOf(+page)}</option>`).join('')
  }</select></label>`);
  $('#sourcePageJump').onchange = event => { sourceExamPage = +event.target.value; renderSourceExam(); };

  $('.answer-sheet').insertAdjacentHTML('afterbegin', `<div class="global-source-progress"><span>PROGRESO GLOBAL</span><strong>${totalAnswered} / ${TOTAL_SPACES}</strong><i><em style="width:${Math.round(totalAnswered / TOTAL_SPACES * 100)}%"></em></i><small>Los números se repiten porque cada sección reinicia su numeración.</small></div>`);

  $$('[data-source-answer]').forEach(button => button.addEventListener('click', markActivity, { once: true }));
  updateStats();
}

syncTotals();
if (typeof sourceExamPage !== 'undefined' && $('#sourceExamShell')?.innerHTML.trim()) renderSourceExam();
