/* Muestra el enunciado y las tres opciones de cada pregunta en lugar de
   botones A/B/C sueltos. Las páginas todavía sin transcribir conservan la
   hoja de respuestas compacta, de modo que nada deja de funcionar. */

const BANK = window.QUESTION_BANK || {};

/* El folio impreso a mano en el original no coincide con el número de archivo:
   el PDF solo contiene las hojas impares del folleto (1, 3, 5 … 51). */
const folioOf = file => 2 * file - 1;
const bankPage = file => BANK[String(file)];
const bankQuestion = (file, number) =>
  (bankPage(file)?.questions || []).find(q => q.n === Number(number));

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function optionMarkup(question, letter, index, { selected, keyed, disabled, attrs }) {
  const option = question ? question.optsEn[index] : null;
  const optionEs = question ? question.optsEs[index] : null;
  const classes = [selected ? 'selected' : '', keyed ? 'key-answer' : ''].filter(Boolean).join(' ');
  const body = option
    ? `<span class="opt-text"><b>${esc(option)}</b><em>${esc(optionEs)}</em></span>`
    : '';
  return `<button class="${classes}" ${attrs} ${disabled ? 'disabled' : ''}><i>${letter}</i>${body}</button>`;
}

function questionMarkup(file, number, { answers, key, graded, unanswerable }) {
  const question = bankQuestion(file, number);
  const isBlank = unanswerable.includes(Number(number));
  const rowState = graded && key[number] ? (answers[number] === key[number] ? 'row-correct' : 'row-wrong') : '';
  const options = ['A', 'B', 'C'].map((letter, index) => optionMarkup(question, letter, index, {
    selected: answers[number] === letter,
    keyed: graded && key[number] === letter,
    disabled: isBlank,
    attrs: `data-source-answer="${number}" data-source-letter="${letter}"`,
  })).join('');

  const heading = question
    ? `<p class="q-en">${esc(question.en)}</p><p class="q-es">${esc(question.es)}</p>`
    : `<p class="q-pending">Enunciado aún no transcrito · léelo en el escaneo de la izquierda.</p>`;

  return `<article class="q-item ${rowState} ${question ? '' : 'q-compact'}">
    <header><b>${number}</b>${isBlank ? '<span class="q-blank">El original imprime “??” y no incluye pregunta</span>' : heading}</header>
    <div class="q-opts">${options}</div>
    ${question?.figure ? '<small class="q-figure">Esta pregunta depende de la figura impresa: consulta el escaneo.</small>' : ''}
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
  const folio = folioOf(sourceExamPage);
  const transcribed = Boolean(bankPage(sourceExamPage));

  $('#sourceExamShell').innerHTML = `<div class="source-exam-head">
      <div><strong>${form.section} · Hoja ${folio} del folleto</strong>
      <small>Escaneo ${sourceExamPage} de 26 · preguntas ${form.numbers[0]}–${form.numbers.at(-1)} tal como aparecen impresas</small></div>
      <div><button id="sourceExamPrev">←</button><span>${String(sourceExamPage).padStart(2, '0')} / 26</span><button id="sourceExamNext">→</button></div>
    </div>
    <div class="missing-note">Hoja ${folio + 1} ausente del PDF original: solo se escanearon las páginas impares del folleto.</div>
    <div class="source-exam-body">
      <div class="source-exam-page"><img src="assets/questionnaire/page-${String(sourceExamPage).padStart(2, '0')}.jpg" alt="Hoja ${folio} del cuestionario original"></div>
      <aside class="answer-sheet">
        <p class="eyebrow dark"><span></span> HOJA DE RESPUESTAS</p>
        <h3>${form.section}</h3>
        <p>${transcribed
          ? 'Enunciado y opciones transcritos del escaneo. La imagen original permanece a la izquierda para comprobar cada renglón.'
          : 'Esta hoja aún no tiene el texto transcrito: responde leyendo el escaneo de la izquierda.'}</p>
        <div class="answer-sheet-grid">${form.numbers.map(n => questionMarkup(sourceExamPage, n, { answers, key, graded, unanswerable })).join('')}</div>
        <div class="source-answer-progress"><strong>${answered}/${form.numbers.length}</strong> respondidas · <strong>${keyCount}/${form.numbers.length}</strong> con clave</div>
        ${keyCount ? `<button class="grade-source" id="gradeSource">${graded ? 'Ocultar revisión' : 'Revisar respuestas'}</button>` : '<div class="key-pending">Clave en verificación contra el manual.</div>'}
        ${graded ? `<div class="source-score"><strong>${score}/${keyCount}</strong><span>correctas entre las preguntas con clave</span></div>` : ''}
      </aside>
    </div>`;

  $('#sourceExamPrev').onclick = () => { sourceExamPage = Math.max(1, sourceExamPage - 1); renderSourceExam(); };
  $('#sourceExamNext').onclick = () => { sourceExamPage = Math.min(26, sourceExamPage + 1); renderSourceExam(); };
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
        <div><img src="assets/questionnaire/page-${String(item.page).padStart(2, '0')}.jpg" alt="Hoja ${folio} del cuestionario original"></div>
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

  $('.answer-sheet').insertAdjacentHTML('afterbegin', `<div class="global-source-progress"><span>PROGRESO GLOBAL</span><strong>${totalAnswered} / 255</strong><i><em style="width:${Math.round(totalAnswered / 255 * 100)}%"></em></i><small>Los números se repiten porque cada sección reinicia su numeración.</small></div>`);

  $$('[data-source-answer]').forEach(button => button.addEventListener('click', markActivity, { once: true }));
  updateStats();
}

if (typeof sourceExamPage !== 'undefined' && $('#sourceExamShell')?.innerHTML.trim()) renderSourceExam();
