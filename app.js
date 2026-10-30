import {initWorkbench} from './workbench-ui.js?v=20261030-auftrag';
import {replaceSource,auditDossier,evidenceValid,citationLabel} from './evidence.js?v=20261030-auftrag';
import {criteria,questions,books} from './data.js?v=20261030-auftrag';
import {calculate,validateImport,gradeFor,emptyDossier,deriveRatings,criterionResult,indicatorDecided,dossierExport,groupExport,mergeGroup,scoreOptions,rawPoints} from './scoring.js?v=20261030-auftrag';
import {readTranscript, validateTranscript} from './transcript.js?v=20261030-auftrag';
const $=id=>document.getElementById(id),key='berlin-rubric-v1';
let state=emptyDossier();
let workbench=null;
try{const raw=localStorage.getItem(key);if(raw)state=validateImport(JSON.parse(raw),criteria);}catch{$('saveStatus').textContent='Lokale Daten nicht lesbar – bitte Sicherung importieren.';}
const metaKeys=['person','group','book','date','examiner','url','recording','strength','next','judgment'];
function save(){try{localStorage.setItem(key,JSON.stringify(dossierExport(state)));$('saveStatus').textContent='Auf diesem Gerät gespeichert';}catch{$('saveStatus').textContent='Speicherung nicht möglich – bitte JSON exportieren.';}}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
for(const b of ['Roman wählen',...books])$('book').append(new Option(b,b==='Roman wählen'?'':b));
for(const c of criteria){
 const card=node('article',undefined,'criterion');
 const heading=node('div',undefined,'criterion-heading');heading.append(node('span',c.id.slice(1).padStart(2,'0'),'number'),node('h3',c.title),node('span',c.weight+' Punkte','weight'));card.append(heading,node('p',c.aim,'aim'));
 const legacy=node('p','','warning');legacy.id='legacy-'+c.id;legacy.hidden=true;card.append(legacy);
 const result=node('p','','criterion-score');result.id='desc-'+c.id;result.setAttribute('aria-live','polite');card.append(result);
 for(const i of c.indicators){
  const box=node('fieldset',undefined,'indicator');box.append(node('legend',i.id.toUpperCase()+' · '+i.title));
  const levels=node('ol',undefined,'point-levels');levels.reversed=true;levels.start=3;for(let n=3;n>=0;n--){const li=node('li');li.value=n;li.append(node('strong',n+'/3 Rohpunkte: '),document.createTextNode(i.levels[n]));levels.append(li);}box.append(levels);
  const row=node('div',undefined,'indicator-inputs'),statusLabel=node('label','Urteil'),select=node('select');select.id='check-'+i.id;select.setAttribute('aria-label',i.id.toUpperCase()+' Urteil');
  select.append(new Option('Offen / nicht geprüft',''));for(const option of scoreOptions(c,i))select.append(new Option(option.label,option.value));statusLabel.append(select);
  const evidenceLabel=node('label','Fundstelle und Erklärung / fehlender Bestandteil'),note=node('textarea');note.id='evidence-'+i.id;note.rows=2;note.maxLength=20000;note.placeholder=c.part==='oral'?'Zeitmarke + Antwortkern; bei Nichterfüllung Frage und konkret fehlendes Element.':'Produktstation / Quellenstelle + Befund; bei Nichterfüllung geprüftes Material und konkret fehlendes Element.';note.setAttribute('aria-label',i.id.toUpperCase()+' Beleg oder Fehlstelle');evidenceLabel.append(note);row.append(statusLabel,evidenceLabel);box.append(row);const gapLabel=node('label','Fehlender Bestandteil zur nächsthöheren Punktestufe (bei 0–2 erforderlich)'),gap=node('textarea');gap.id='gap-'+i.id;gap.rows=2;gap.maxLength=20000;gap.setAttribute('aria-label',i.id.toUpperCase()+' Abstand zur nächsten Stufe');gapLabel.append(gap);box.append(gapLabel);const previous=node('p','','warning');previous.id='previous-'+i.id;previous.hidden=true;box.append(previous);card.append(box);
  const update=()=>{state.observations[i.id]={...state.observations[i.id],status:select.value,evidence:note.value,gap:gap.value};state.ratings=deriveRatings(criteria,state.observations,state);updateDescriptor(c);renderResults();save();workbench?.refresh();};
  select.addEventListener('change',update);note.addEventListener('input',update);gap.addEventListener('input',update);
  const links=node('div',undefined,'linked-evidence');links.id='linked-'+i.id;const linkButton=node('button','Originalbeleg suchen / zuordnen','secondary');linkButton.type='button';linkButton.onclick=()=>{showPanel('workbench');workbench.openIndicator(i.id);};box.append(links,linkButton);
 }
 const noteLabel=node('label','Ergänzende Begründung / Transkriptbelege'),note=node('textarea');note.id='note-'+c.id;note.rows=2;note.maxLength=20000;noteLabel.append(note);card.append(noteLabel);$(c.part+'Criteria').append(card);
 note.addEventListener('input',()=>{state.notes[c.id]=note.value;save();});
}
function updateDescriptor(c){
 const r=criterionResult(c,state.observations,state);$('desc-'+c.id).textContent=`${r.raw}/12 Rohpunkte · ${r.decided} von 4 abschliessend geprüft · ${r.complete?r.points.toLocaleString('de-CH')+' / '+c.weight+' Punkte':'Kriterium noch offen'}`;
 const legacy=$('legacy-'+c.id),old=state.legacyRatings[c.id];legacy.hidden=old===undefined||r.complete;if(!legacy.hidden)legacy.textContent=`Frühere Bewertung: ${old}/4. Sie stammt aus dem alten Raster und wird nicht umgerechnet. Die bisherigen Notizen bleiben erhalten; die vier neuen Nachweise müssen einzeln geprüft werden.`;
}
questions.forEach(([cat,q,follow],i)=>{const box=node('article',undefined,'question'),label=node('label'),check=node('input');check.type='checkbox';check.id='q'+i;label.append(check,node('small',cat+' · zur Prüfung auswählen'));box.append(label,node('p',q),node('p','Nachfrage: '+follow));$('questions').append(box);check.addEventListener('change',()=>{state.selected=check.checked?[...new Set([...state.selected,i])]:state.selected.filter(n=>n!==i);save();});});
for(const id of metaKeys)$(id).addEventListener('input',()=>{state.meta[id]=$(id).value;save();});
function hydrate(){
 for(const id of metaKeys)$(id).value=state.meta[id]||'';
 for(const c of criteria){
  for(const i of c.indicators){const o=state.observations[i.id];$('check-'+i.id).value=o?.status||'';$('evidence-'+i.id).value=o?.evidence||'';$('gap-'+i.id).value=o?.gap||'';renderLinkedEvidence(i.id);const previous=$('previous-'+i.id);previous.hidden=!o?.legacyStatus&&!o?.previousScore;previous.textContent=o?.previousScore?'Frühere Einstufung: '+rawPoints({status:o.previousScore})+'/3 Rohpunkte vor dem Auftragsabgleich. Belege und Begründungen bleiben erhalten; dieses geänderte Teilkriterium neu prüfen.':o?.legacyStatus?'Früheres binäres Urteil: '+(o.legacyStatus==='yes'?'nachgewiesen':'nicht nachgewiesen')+'. Keine automatische Umrechnung; neue Punktestufe anhand der Deskriptoren festlegen.':'';}
  $('note-'+c.id).value=state.notes[c.id]||'';updateDescriptor(c);
 }
 questions.forEach((_,i)=>$('q'+i).checked=state.selected.includes(i));renderMarks();renderResults();renderTranscript();workbench?.refresh();
}
function renderResults(){
 const root=$('results');root.replaceChildren();
 const grid=node('div',undefined,'result-grid');
 for(const [title,part] of [['Produktnote · Gruppenleistung','product'],['Note mündliche Prüfung · Einzelleistung','oral']]){
  const result=calculate(criteria,state.ratings,part),grade=gradeFor(result),card=node('div',undefined,'result');
  card.append(node('span',title),node('strong',grade===null?'—':grade.toFixed(1)),node('small',result.points.toLocaleString('de-CH')+' / '+result.max+' Punkte'),node('small',result.count+' von '+result.total+' Kriterien bewertet'));
  if(!result.complete)card.append(node('p','Note offen: In diesem Bereich sind noch nicht alle Kriterien bewertet.','grade-status'));
  grid.append(card);
 }
 root.append(grid);
 const missing=criteria.flatMap(c=>c.indicators).filter(i=>rawPoints(state.observations[i.id])!==null&&!indicatorDecided(state.observations[i.id]));
 if(missing.length)root.append(node('p','Punkteentscheid ohne vollständige Begründung oder Stufenabstand bleibt offen: '+missing.map(i=>i.id.toUpperCase()).join(' · '),'warning'));
 const issues=auditDossier(criteria,state);
 root.append(node('p',`Bewertungskontrolle: ${issues.filter(i=>i.type==='stale').length} veränderte Beleggrundlagen, ${issues.filter(i=>i.type==='opportunity').length} undokumentierte Antwortgelegenheiten und ${issues.filter(i=>i.type==='manual').length} manuelle Belegkontrollen. Hinweise im Belegarbeitsplatz prüfen.`,'warning'));
 const auditButton=node('button','Bewertungskontrolle öffnen','secondary');auditButton.onclick=()=>{showPanel('workbench');document.getElementById('auditSummary').scrollIntoView({block:'center'});};root.append(auditButton);
 root.append(node('p','Die Punktesumme enthält nur vollständig geprüfte Kriterien. Jeder der vier Nachweise benötigt ein Urteil und eine Fundstelle bzw. konkret bezeichnete Fehlstelle.'));
 root.append(node('p','Zwei unabhängige Noten: Produktnote = 1 + 5 × Produktpunkte / 50. Note mündliche Prüfung = 1 + 5 × Gesprächspunkte / 28. Jede Note wird erst nach vollständiger Bewertung ihres Bereichs auf eine Dezimalstelle gerundet.'));
}

function showPanel(id){document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==id);document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===id;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});}
function renderLinkedEvidence(id){const root=$('linked-'+id);if(!root)return;root.replaceChildren();for(const ref of state.evidence.filter(e=>e.indicatorId===id))root.append(node('p',citationLabel(ref)+(evidenceValid(ref,state)?' · Quelle unverändert':' · Quelle verändert – prüfen'),'evidence'));}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.tab)));

function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export').onclick=()=>download(dossierExport(state),'berlin-bewertung.json');
$('groupExport').onclick=()=>download(groupExport(state,criteria),'berlin-gruppenbewertung.json');
$('import').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>32000000)throw Error('Datei ist zu gross (maximal 32 MB).');
  const raw=JSON.parse(await file.text()),imported=validateImport(raw,criteria);
  if(!confirm(raw.kind==='group'?'Produktbewertung und Gruppendaten ersetzen? Individuelle Prüfung bleibt erhalten.':'Aktuelles Dossier ersetzen? Vorher bei Bedarf exportieren.'))return;
  if(raw.kind==='group')mergeGroup(state,imported,criteria);else{state=imported;stopClock();elapsed=0;tick();}
  hydrate();save();$('feedback').textContent=raw.version<4?'Altes Dossier geladen. Frühere Urteile, Belege und Notizen bleiben sichtbar; die neuen Punktestufen sind noch offen.':'Datei erfolgreich geladen.';
 }catch(err){$('feedback').textContent='Import fehlgeschlagen: '+err.message;}finally{e.target.value='';}
};
$('wordExport').onclick=async()=>{
 const button=$('wordExport');button.disabled=true;$('feedback').textContent='Word-Dokument wird erstellt …';
 try{const {exportWord}=await import('./word-export.js?v=20261030-auftrag');await exportWord(state,{includeTranscript:$('wordTranscript').checked});$('feedback').textContent='Word-Datei erstellt. Offene Urteile sind im Dokument als offen gekennzeichnet.';}catch(err){$('feedback').textContent='Word-Export fehlgeschlagen: '+err.message;}finally{button.disabled=false;}
};

let elapsed=0,started=null,interval=null;
function seconds(){return elapsed+(started===null?0:(performance.now()-started)/1000);}
function format(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');}
function tick(){const s=seconds();$('clock').textContent=format(s);$('clock').classList.toggle('over',s>=600);$('phase').textContent=s>=600?'10 Minuten erreicht · Gespräch beenden':s>=480?'8–10 Min. · Reflexion':s>=360?'6–8 Min. · Transfer':s>=120?'2–6 Min. · Inhalt':'0–2 Min. · Defense';}
function stopClock(){if(started!==null){elapsed=seconds();started=null;}clearInterval(interval);interval=null;$('start').disabled=false;}
$('start').onclick=()=>{if(started!==null)return;started=performance.now();interval=setInterval(tick,250);$('start').disabled=true;};$('pause').onclick=()=>{stopClock();tick();};$('resetTimer').onclick=()=>{if(!confirm('Prüfungsuhr zurücksetzen? Bestehende Zeitmarken bleiben erhalten.'))return;stopClock();elapsed=0;tick();};
$('addMark').onclick=()=>{const text=$('markText').value.trim();if(!text)return;state.marks.push({seconds:Math.floor(seconds()),text});$('markText').value='';renderMarks();save();};
function renderMarks(){$('marks').replaceChildren();state.marks.forEach(m=>$('marks').append(node('li',format(m.seconds)+' · '+m.text)));}
$('newDossier').onclick=()=>{if(!confirm('Neues leeres Dossier beginnen? Aktuelles Dossier vorher als JSON sichern.'))return;state=emptyDossier();stopClock();elapsed=0;tick();hydrate();save();};
$('print').onclick=()=>window.print();
for(const c of criteria.filter(c=>c.part==='oral'))$('transcriptCriterion').append(new Option(c.title,c.id));
function renderTranscript(){
 const t=state.transcript||{text:'',filename:''};$('transcriptText').value=t.text;
 $('transcriptStatus').textContent=t.text?`${t.filename||'Direkt eingefügter Text'} · ${t.text.length.toLocaleString('de-CH')} Zeichen`:'Noch kein Transkript hinterlegt.';
 $('transcriptDownload').disabled=!t.text;$('transcriptClear').disabled=!t.text;
}
$('transcriptFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>1000000)throw Error('Datei ist zu gross (maximal 1 MB).');
  if(!/\.(txt|md|srt|vtt)$/i.test(file.name))throw Error('Bitte TXT, Markdown, SRT oder VTT auswählen.');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
  const transcript=readTranscript(file.name,text);
  if(state.transcript?.text&&!confirm('Bestehendes Transkript ersetzen? Vorher bei Bedarf als TXT oder mit dem Dossier sichern.'))return;
  state.transcript=replaceSource(state.transcript,transcript);renderTranscript();save();workbench?.refresh();state.ratings=deriveRatings(criteria,state.observations,state);hydrate();
 }catch(err){$('transcriptStatus').textContent='Upload fehlgeschlagen: '+(err instanceof TypeError?'Die Datei muss als UTF-8-Text gespeichert sein.':err.message);}
 finally{e.target.value='';}
};
$('transcriptText').addEventListener('input',()=>{
 state.transcript=replaceSource(state.transcript,validateTranscript({text:$('transcriptText').value,filename:state.transcript?.filename||''}));
 const t=state.transcript;$('transcriptStatus').textContent=t.text?`${t.filename||'Direkt eingefügter Text'} · ${t.text.length.toLocaleString('de-CH')} Zeichen`:'Noch kein Transkript hinterlegt.';
 $('transcriptDownload').disabled=!t.text;$('transcriptClear').disabled=!t.text;state.ratings=deriveRatings(criteria,state.observations,state);save();workbench?.refresh();for(const c of criteria)updateDescriptor(c);renderResults();
});
$('useQuote').onclick=()=>{
 const area=$('transcriptText'),quote=area.value.slice(area.selectionStart,area.selectionEnd).trim();
 if(!quote){$('transcriptStatus').textContent='Bitte zuerst eine Passage im Transkript markieren.';return;}
 if(quote.length>15000){$('transcriptStatus').textContent='Bitte eine kürzere, gezielte Passage markieren (maximal 15’000 Zeichen).';return;}
 const id=$('transcriptCriterion').value,entry='Transkriptbeleg: '+quote;
 if(((state.notes[id]||'')+'\n\n'+entry).length>20000){$('transcriptStatus').textContent='Das Belegfeld ist zu lang. Bitte die vorhandenen Belege kürzen.';return;}
 state.notes[id]=state.notes[id]?state.notes[id]+'\n\n'+entry:entry;$('note-'+id).value=state.notes[id];save();renderResults();
 $('transcriptStatus').textContent='Markierte Passage bei «'+criteria.find(c=>c.id===id).title+'» als Beleg ergänzt.';
};
$('transcriptDownload').onclick=()=>{
 const url=URL.createObjectURL(new Blob([state.transcript.text],{type:'text/plain;charset=utf-8'})),a=node('a');a.href=url;a.download='berlin-pruefung-transkript.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('transcriptClear').onclick=()=>{if(!confirm('Transkript aus diesem Dossier entfernen? Bereits übernommene Belegpassagen bleiben erhalten.'))return;state.transcript=replaceSource(state.transcript,{text:'',filename:''});state.ratings=deriveRatings(criteria,state.observations,state);renderTranscript();save();hydrate();};
// Normal text blocks let long transcript and evidence text wrap across printed pages.
window.addEventListener('beforeprint',()=>{document.querySelectorAll('textarea').forEach(t=>{const block=node('div',t.value||'—','print-value');t.after(block);});});
window.addEventListener('afterprint',()=>document.querySelectorAll('.print-value').forEach(b=>b.remove()));
workbench=initWorkbench({criteria,getState:()=>state,onChange:()=>{state.ratings=deriveRatings(criteria,state.observations,state);hydrate();save();},onNavigate:(panel,id)=>{showPanel(panel);const target=$('check-'+id)||$(id);target?.scrollIntoView({block:'center'});target?.focus();}});
hydrate();tick();
