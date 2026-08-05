const visualLessons={
  inspection:{
    eyebrow:'INSPECCIÓN PREVIA AL VIAJE',title:'Un recorrido. Cinco zonas críticas.',copy:'Selecciona una zona del autobús para estudiar qué observar. La ubicación de los puntos corresponde al perfil lateral mostrado; la inspección real debe seguir el procedimiento completo del manual.',image:'assets/visuals/mts-inspection-side-v2.png',alt:'Vista lateral de un autobús urbano MTS de 40 pies en una bahía de inspección',
    points:{front:{x:91,y:52,label:'Frente y visibilidad',detail:'Parabrisas, limpiadores, espejos, luces, reflectores y ausencia de daño visible.'},doors:{x:80,y:57,label:'Puertas y accesibilidad',detail:'Operación de puertas, escalones, pasamanos, rampa y área de acceso libres y seguras.'},wheels:{x:73,y:70,label:'Rueda delantera y freno',detail:'Neumático, rin, tuercas, sello, manguera, cámara, ajustador y componentes visibles del freno.'},side:{x:50,y:55,label:'Costado y estructura',detail:'Paneles, bastidor, compartimientos, escape y ausencia de fugas o piezas sueltas.'},rear:{x:12,y:53,label:'Parte trasera',detail:'Luces, reflectores, paneles, condición general y rueda/freno traseros.'}}
  },
  distance:{
    eyebrow:'DISTANCIA TOTAL DE PARADA',title:'Detenerse comienza antes del pedal.',copy:'La distancia total integra cuatro etapas. La ilustración no representa una escala fija: velocidad, peso, pendiente, superficie y condición mecánica cambian el resultado.',image:'assets/visuals/mts-stopping-distance-v2.png',alt:'Autobús MTS y cuatro zonas visuales de distancia de parada',
    steps:[['1','Percepción','Ver y reconocer el peligro.'],['2','Reacción','Decidir y mover el pie al freno.'],['3','Retraso de aire','El sistema neumático tarda en aplicar los frenos.'],['4','Frenado','El vehículo desacelera hasta detenerse.']]
  },
  passengers:{
    eyebrow:'SEGURIDAD DE PASAJEROS',title:'Protege el espacio antes de mover el autobús.',copy:'Explora el interior de un autobús urbano de piso bajo. Los puntos resaltan verificaciones operativas, no sustituyen la inspección requerida.',image:'assets/visuals/mts-passenger-safety-v2.png',alt:'Corte lateral del interior de un autobús urbano de piso bajo',
    points:{driver:{x:86,y:48,label:'Área del operador',detail:'Visibilidad, espejos, controles y zona delante de la línea para pasajeros de pie.'},access:{x:68,y:57,label:'Accesibilidad',detail:'Rampa, área de movilidad y sistema de sujeción disponibles y sin obstrucciones.'},aisle:{x:49,y:68,label:'Pasillo',detail:'Debe permanecer libre de equipaje y obstáculos durante la operación.'},exits:{x:42,y:29,label:'Salidas de emergencia',detail:'Señalizadas, operables y cerradas de forma segura durante el servicio normal.'},handholds:{x:28,y:40,label:'Asientos y pasamanos',detail:'Asientos firmes, pasamanos seguros y elementos interiores sin riesgos visibles.'}}
  }
};

function renderVisualV2(mode='inspection'){
  const lesson=visualLessons[mode];
  $$('.visual-tabs button').forEach(button=>button.classList.toggle('active',button.dataset.visual===mode));
  const points=lesson.points?Object.entries(lesson.points).map(([key,p],index)=>`<button class="image-hotspot" style="left:${p.x}%;top:${p.y}%" data-visual-point="${key}" aria-label="${p.label}"><span>${index+1}</span></button>`).join(''):'';
  const steps=lesson.steps?`<div class="distance-step-grid">${lesson.steps.map(step=>`<button data-distance-step="${step[0]}"><b>${step[0]}</b><strong>${step[1]}</strong><span>${step[2]}</span></button>`).join('')}</div>`:'';
  $('#visualStage').innerHTML=`<div class="visual-v2-head"><div><p class="eyebrow dark"><span></span>${lesson.eyebrow}</p><h3>${lesson.title}</h3><p>${lesson.copy}</p></div><span class="accuracy-chip">FUENTE + IMAGEN</span></div><div class="visual-photo-frame"><img src="${lesson.image}" alt="${lesson.alt}">${points}</div>${steps}<div class="visual-learning-panel" id="visualLearningPanel"><small>INTERACTÚA CON LA IMAGEN</small><strong>${lesson.points?'Selecciona un punto numerado.':'Selecciona una etapa.'}</strong><p>La explicación aparecerá aquí.</p></div>`;
  if(lesson.points)$$('[data-visual-point]').forEach(button=>button.onclick=()=>{const p=lesson.points[button.dataset.visualPoint];$$('[data-visual-point]').forEach(item=>item.classList.toggle('active',item===button));$('#visualLearningPanel').innerHTML=`<small>ZONA SELECCIONADA</small><strong>${p.label}</strong><p>${p.detail}</p>`});
  if(lesson.steps)$$('[data-distance-step]').forEach(button=>button.onclick=()=>{const step=lesson.steps.find(item=>item[0]===button.dataset.distanceStep);$$('[data-distance-step]').forEach(item=>item.classList.toggle('active',item===button));$('#visualLearningPanel').innerHTML=`<small>ETAPA ${step[0]} DE 4</small><strong>${step[1]}</strong><p>${step[2]}</p>`});
}

$$('[data-visual]').forEach(button=>{if(visualLessons[button.dataset.visual])button.onclick=()=>renderVisualV2(button.dataset.visual)});
renderVisualV2('inspection');

function updateJourneyProgress(){
  const answered=Object.values(sourceAnswers).filter(value=>value&&typeof value==='object').reduce((sum,value)=>sum+Object.keys(value).length,0);
  const mastered=Object.values(cardMastery).filter(Boolean).length;
  const percent=Math.min(100,Math.round((answered/256*.75+mastered/cardDeck.length*.25)*100));
  const output=$('#journeyPercent');if(output)output.textContent=`${percent}%`;
}
updateJourneyProgress();

const missionStages=[
  {phase:'01 · PATIO',title:'Antes de salir',scene:'assets/visuals/mts-inspection-side-v2.png',question:'Durante la inspección encuentras una protuberancia visible en un neumático. ¿Qué haces?',answers:['Sales y reportas al terminar.','No operas el autobús hasta que se evalúe o repare.','Bajas la presión del neumático.'],correct:1,explain:'Una protuberancia puede indicar daño estructural. El vehículo no debe ponerse en servicio sin corrección.'},
  {phase:'02 · ABORDAJE',title:'Pasajeros seguros',scene:'assets/visuals/mts-passenger-safety-v2.png',question:'Hay equipaje bloqueando parcialmente el pasillo antes de iniciar. ¿Qué decisión es segura?',answers:['Pedir que se coloque sin bloquear pasillo ni salida.','Continuar porque aún puede caminarse.','Conducir más despacio.'],correct:0,explain:'Pasillos y salidas deben permanecer libres para el movimiento y una posible evacuación.'},
  {phase:'03 · INCORPORACIÓN',title:'Espacio para entrar',scene:'assets/visuals/mts-stopping-distance-v2.png',question:'Esperas una brecha para incorporarte al tráfico con el autobús.',answers:['Usas el acotamiento para ganar velocidad.','Esperas una brecha suficientemente grande.','Obligas al tráfico a reducir velocidad.'],correct:1,explain:'El tamaño y la aceleración del autobús requieren una brecha amplia; no debes forzar a otros usuarios.'},
  {phase:'04 · CRUCE',title:'Vías ferroviarias',scene:'assets/visuals/mts-inspection-side-v2.png',question:'Al aproximarte a un cruce ferroviario con pasajeros, ¿qué haces?',answers:['Sigues al vehículo delantero sin una revisión propia.','Aplicas el procedimiento de observación y parada requerido.','Cambias de marcha sobre las vías para mantener velocidad.'],correct:1,explain:'Los autobuses requieren observación y parada conforme al procedimiento aplicable; no se cambia de marcha sobre las vías.'},
  {phase:'05 · ALERTA',title:'Baja presión de aire',scene:'assets/visuals/mts-stopping-distance-v2.png',question:'Se activa la advertencia de baja presión mientras conduces.',answers:['Continúas hasta la terminal.','Bombeas repetidamente el pedal.','Te detienes de forma segura tan pronto como sea posible.'],correct:2,explain:'Debes detenerte de forma segura antes de perder capacidad de frenado o de que se apliquen los frenos de resorte.'},
  {phase:'06 · CIERRE',title:'Fin del recorrido',scene:'assets/visuals/mts-inspection-side-v2.png',question:'Al finalizar, detectas un defecto que puede afectar la seguridad del siguiente turno.',answers:['Lo reportas conforme al procedimiento y dejas registro.','Lo mencionas informalmente si ves a otro operador.','Lo ignoras porque el autobús ya está estacionado.'],correct:0,explain:'Los defectos que afectan la seguridad deben reportarse y documentarse para impedir una operación insegura posterior.'}
];
let missionIndex=0,missionLives=3,missionXP=0,missionLocked=false;
function renderMission(){
  const stage=missionStages[missionIndex];missionLocked=false;
  $('#academyStage').innerHTML=`<section class="mission-shell"><header><div class="mission-brand"><img src="assets/brand/mts-logo-official.jpg" alt="MTS"><span><small>MISIÓN DE OPERACIÓN</small><strong>${stage.phase}</strong></span></div><div class="mission-hud"><span>♥ <b id="missionLives">${missionLives}</b></span><span>XP <b id="missionXP">${missionXP}</b></span></div></header><div class="mission-progress"><i style="width:${(missionIndex+1)/missionStages.length*100}%"></i></div><div class="mission-scene"><img src="${stage.scene}" alt="Escena de ${stage.title}"><span>${stage.phase}</span></div><div class="mission-question"><small>${stage.title.toUpperCase()}</small><h3>${stage.question}</h3><div class="mission-answers">${stage.answers.map((answer,index)=>`<button data-mission-answer="${index}"><b>${String.fromCharCode(65+index)}</b>${answer}</button>`).join('')}</div><div id="missionFeedback"></div></div></section>`;
  $$('[data-mission-answer]').forEach(button=>button.onclick=()=>answerMission(+button.dataset.missionAnswer));
  $('#academyStage').scrollIntoView({behavior:'smooth',block:'center'});
}
function answerMission(choice){
  if(missionLocked)return;missionLocked=true;const stage=missionStages[missionIndex],correct=choice===stage.correct;
  if(correct)missionXP+=100;else missionLives=Math.max(0,missionLives-1);
  $$('[data-mission-answer]').forEach((button,index)=>{button.disabled=true;button.classList.toggle('correct-choice',index===stage.correct);button.classList.toggle('wrong-choice',index===choice&&!correct)});
  $('#missionLives').textContent=missionLives;$('#missionXP').textContent=missionXP;
  $('#missionFeedback').innerHTML=`<div class="mission-feedback ${correct?'success':'retry'}"><strong>${correct?'Decisión segura · +100 XP':'Decisión insegura · pierdes una vida'}</strong><p>${stage.explain}</p><button id="missionContinue">${missionLives===0?'Reiniciar misión':missionIndex===missionStages.length-1?'Ver resultado':'Continuar →'}</button></div>`;
  $('#missionContinue').onclick=()=>{if(missionLives===0){missionIndex=0;missionLives=3;missionXP=0;renderMission()}else if(missionIndex===missionStages.length-1)finishMission();else{missionIndex++;renderMission()}};
}
function finishMission(){
  const percent=Math.round(missionXP/(missionStages.length*100)*100);markActivity();localStorage.setItem('rutaCdlMissionBest',Math.max(missionXP,+localStorage.getItem('rutaCdlMissionBest')||0));
  $('#academyStage').innerHTML=`<section class="mission-complete"><img src="assets/brand/mts-logo-official.jpg" alt="MTS"><small>MISIÓN COMPLETADA</small><h3>${missionXP} XP</h3><p>${percent===100?'Turno perfecto: tomaste seis decisiones seguras.':`Completaste el recorrido con ${missionLives} vida${missionLives===1?'':'s'}. Repite la misión para alcanzar 600 XP.`}</p><div><button class="primary" id="missionReplay">Repetir misión</button><button class="outline" id="missionExam">Ir al simulador</button></div></section>`;
  $('#missionReplay').onclick=()=>{missionIndex=0;missionLives=3;missionXP=0;renderMission()};$('#missionExam').onclick=()=>{$('#practica').scrollIntoView({behavior:'smooth'});showPractice('custom')};
}
const missionLauncher=$('[data-mode="mission"]');missionLauncher.onclick=()=>{missionIndex=0;missionLives=3;missionXP=0;renderMission()};

const inspectionSequenceV2=[
  ['1','Vista general','Observa inclinación, fugas, daño visible y condición alrededor del vehículo.'],
  ['2','Compartimiento del motor','Revisa niveles, mangueras, correas, cableado y posibles fugas con el motor asegurado.'],
  ['3','Cabina y arranque','Comprueba controles, medidores, advertencias, espejos, cinturón y elementos interiores.'],
  ['4','Luces y señales','Activa los sistemas necesarios para poder verificar iluminación y señalización.'],
  ['5','Recorrido exterior','Inspecciona frente, costados, ruedas, frenos, puertas, estructura y parte trasera.'],
  ['6','Comprobación asistida','Verifica luces y señales que requieren observación exterior o ayuda.'],
  ['7','Prueba del sistema de frenos','Realiza las comprobaciones requeridas del sistema antes de poner el vehículo en servicio.']
];
let sequenceV2Order=[];
function renderSequenceV2(reset=true){
  if(reset)sequenceV2Order=[...inspectionSequenceV2].sort(()=>Math.random()-.5);
  $('#academyStage').innerHTML=`<section class="sequence-v2"><header><div><p class="eyebrow dark"><span></span> RUTINA PREVIA AL VIAJE</p><h3>Ordena las siete etapas</h3><p>Usa las flechas para mover cada bloque. El objetivo es construir una secuencia de memoria; consulta siempre el procedimiento completo aplicable.</p></div><div class="sequence-xp"><small>VALOR</small><strong>700 XP</strong></div></header><ol>${sequenceV2Order.map((step,index)=>`<li data-sequence-row="${index}"><span class="sequence-position">${index+1}</span><div><strong>${step[1]}</strong><small>${step[2]}</small></div><div class="sequence-movers"><button data-move-up="${index}" ${index===0?'disabled':''} aria-label="Mover ${step[1]} hacia arriba">↑</button><button data-move-down="${index}" ${index===sequenceV2Order.length-1?'disabled':''} aria-label="Mover ${step[1]} hacia abajo">↓</button></div></li>`).join('')}</ol><footer><span>Orden actual · ${sequenceV2Order.length} etapas</span><button id="checkSequenceV2">Comprobar orden</button></footer><div id="sequenceV2Feedback"></div></section>`;
  $$('[data-move-up]').forEach(button=>button.onclick=()=>moveSequenceV2(+button.dataset.moveUp,-1));$$('[data-move-down]').forEach(button=>button.onclick=()=>moveSequenceV2(+button.dataset.moveDown,1));$('#checkSequenceV2').onclick=checkSequenceV2;$('#academyStage').scrollIntoView({behavior:'smooth',block:'center'});
}
function moveSequenceV2(index,direction){const target=index+direction;[sequenceV2Order[index],sequenceV2Order[target]]=[sequenceV2Order[target],sequenceV2Order[index]];renderSequenceV2(false)}
function checkSequenceV2(){
  const score=sequenceV2Order.filter((step,index)=>step[0]===String(index+1)).length;
  $$('[data-sequence-row]').forEach((row,index)=>row.classList.toggle('correct-position',sequenceV2Order[index][0]===String(index+1)));
  $('#sequenceV2Feedback').innerHTML=`<div class="sequence-result"><strong>${score}/7 posiciones correctas · ${score*100} XP</strong><p>${score===7?'Rutina completa. La secuencia quedó consolidada.':'Las posiciones verdes son correctas. Ajusta las demás o revela el orden para estudiarlo.'}</p><div><button id="retrySequenceV2">Mezclar de nuevo</button><button id="revealSequenceV2">Mostrar orden correcto</button></div></div>`;
  $('#retrySequenceV2').onclick=()=>renderSequenceV2(true);$('#revealSequenceV2').onclick=()=>{sequenceV2Order=[...inspectionSequenceV2];renderSequenceV2(false);$$('[data-sequence-row]').forEach(row=>row.classList.add('correct-position'));$('#sequenceV2Feedback').innerHTML='<div class="sequence-result"><strong>Orden de estudio revelado</strong><p>Recorre las siete etapas de arriba abajo y después vuelve a mezclarlas.</p></div>'};
}
renderSequenceActivity=()=>renderSequenceV2(true);
