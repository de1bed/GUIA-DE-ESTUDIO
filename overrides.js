$$('[data-jump]').forEach(button=>button.onclick=()=>{
  const mode=['source','custom','match','rapid'].includes(button.dataset.jump)?button.dataset.jump:'source';
  showPractice(mode);
  $('#practica').scrollIntoView({behavior:'smooth'});
});

$('#clearProgress').onclick=()=>{
  if(!confirm('¿Borrar respuestas, exámenes, notas, tarjetas y toda la actividad guardada?'))return;
  Object.keys(localStorage).filter(key=>key.startsWith('rutaCdl')).forEach(key=>localStorage.removeItem(key));
  location.reload();
};

$('.avatar').onclick=()=>$('#progreso').scrollIntoView({behavior:'smooth'});
$('#historyStart').onclick=()=>{showPractice('custom');$('#practica').scrollIntoView({behavior:'smooth'})};

const scenarioLauncher=$('[data-mode="scenario"]');
scenarioLauncher.onclick=()=>{
  scenarioIndex=0;
  scenarioScore=0;
  showAcademy('scenario');
};

const visualData={
  brakes:{title:'Cómo viaja la energía de frenado',copy:'Selecciona una etapa. El sistema convierte movimiento mecánico en presión de aire y finalmente en fuerza sobre los frenos.',nodes:[['1','Compresor','Genera aire','El compresor bombea aire al sistema y es controlado por el gobernador.'],['2','Depósitos','Almacenan','Los tanques conservan aire comprimido y deben drenarse según el sistema.'],['3','Válvula de pedal','Dosifica','La presión sobre el pedal regula cuánto aire se envía a los frenos.'],['4','Cámaras','Convierten','La presión de aire mueve la varilla de empuje y crea fuerza mecánica.'],['5','Ajustadores','Transmiten','Conectan la varilla con el mecanismo de freno y mantienen la holgura adecuada.'],['6','Frenos','Reducen velocidad','La fricción en las ruedas transforma movimiento en calor.']]},
  inspection:{zones:{front:['Frente','Luces, reflectores, parabrisas, limpiadores, espejos y ausencia de fugas visibles.'],cab:['Cabina','Medidores, advertencias, controles, cinturón, espejos y prueba de frenos.'],side:['Costado','Puertas, paneles, combustible, escape, bastidor y elementos de pasajeros.'],rear:['Parte trasera','Luces, reflectores, puertas y condición general.'],wheels:['Ruedas y frenos','Neumáticos, rines, tuercas, sellos, mangueras, cámaras y ajustadores.']}}
};
function renderVisual(mode='brakes'){
  $$('.visual-tabs button').forEach(button=>button.classList.toggle('active',button.dataset.visual===mode));
  if(mode==='brakes'){
    const data=visualData.brakes;
    $('#visualStage').innerHTML=`<div class="visual-intro"><div><p class="eyebrow dark"><span></span> SISTEMA DE FRENOS DE AIRE</p><h3>${data.title}</h3><p>${data.copy}</p></div></div><div class="visual-flow">${data.nodes.map((node,index)=>`<button class="flow-node" data-flow="${index}"><i>${node[0]}</i><strong>${node[1]}</strong><small>${node[2]}</small></button>`).join('')}</div><div class="visual-detail" id="visualDetail">Selecciona un componente para ver su función.</div>`;
    $$('[data-flow]').forEach(button=>button.onclick=()=>{$$('.flow-node').forEach(node=>node.classList.toggle('active',node===button));$('#visualDetail').innerHTML=`<strong>${data.nodes[+button.dataset.flow][1]}:</strong> ${data.nodes[+button.dataset.flow][3]}`});
  }
  if(mode==='distance')$('#visualStage').innerHTML=`<div class="visual-intro"><div><p class="eyebrow dark"><span></span> DISTANCIA TOTAL DE PARADA</p><h3>Detenerse comienza antes de pisar el freno.</h3><p>El resultado depende de cuatro etapas. Velocidad, peso, pendiente, superficie y condiciones de los frenos pueden aumentar la distancia.</p></div></div><div class="distance-chain"><div class="distance-part"><strong>1 · Percepción</strong><span>Ver y reconocer el peligro.</span></div><div class="distance-part"><strong>2 · Reacción</strong><span>Decidir y mover el pie al freno.</span></div><div class="distance-part"><strong>3 · Retraso</strong><span>El aire tarda en llegar a los frenos.</span></div><div class="distance-part"><strong>4 · Frenado</strong><span>El vehículo desacelera hasta detenerse.</span></div></div><div class="distance-total"><b>Distancia total</b> = percepción + reacción + retraso de frenos + frenado</div>`;
  if(mode==='inspection'){
    const zones=visualData.inspection.zones;
    $('#visualStage').innerHTML=`<div class="visual-intro"><div><p class="eyebrow dark"><span></span> RECORRIDO DE INSPECCIÓN</p><h3>Cinco zonas, una rutina completa.</h3><p>Selecciona los puntos del autobús urbano para recordar qué observar antes de ponerlo en servicio.</p></div></div><div class="inspection-map"><div class="bus-silhouette">${Object.keys(zones).map((zone,index)=>`<button class="inspection-hotspot" data-zone="${zone}" aria-label="${zones[zone][0]}">${index+1}</button>`).join('')}</div><div class="inspection-list">${Object.entries(zones).map(([zone,value])=>`<button data-zone-list="${zone}"><strong>${value[0]}</strong><br><span>${value[1]}</span></button>`).join('')}</div></div>`;
    $$('[data-zone], [data-zone-list]').forEach(button=>button.onclick=()=>{const zone=button.dataset.zone||button.dataset.zoneList;$$('[data-zone-list]').forEach(item=>item.classList.toggle('active',item.dataset.zoneList===zone));const target=$(`[data-zone-list="${zone}"]`);if(target)target.scrollIntoView({block:'nearest'})});
  }
}
$$('[data-visual]').forEach(button=>button.onclick=()=>renderVisual(button.dataset.visual));
renderVisual('brakes');
