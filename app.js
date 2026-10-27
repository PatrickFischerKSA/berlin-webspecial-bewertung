import {criteria,questions,books} from './data.js';
import {calculate,validateImport,gradeFor} from './scoring.js';
import {readTranscript, validateTranscript} from './transcript.js';
const $=id=>document.getElementById(id),key='berlin-rubric-v1';
let state={ratings:{},notes:{},meta:{},selected:[],marks:[],transcript:{text:'',filename:''}};
try{const raw=localStorage.getItem(key);if(raw)state=validateImport(JSON.parse(raw),criteria);}catch{$('saveStatus').textContent='Lokale Daten nicht lesbar – bitte Sicherung importieren.';}
const metaKeys=['person','group','book','date','examiner','url','recording','strength','next','judgment'];
function save(){try{localStorage.setItem(key,JSON.stringify({version:1,kind:'dossier',...state}));$('saveStatus').textContent='Auf diesem Gerät gespeichert';}catch{$('saveStatus').textContent='Speicherung nicht möglich – bitte JSON exportieren.';}}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
for(const b of ['Roman wählen',...books])$('book').append(new Option(b,b==='Roman wählen'?'':b));
for(const c of criteria){
 const card=node('article',undefined,'criterion');
 const heading=node('div',undefined,'criterion-heading');heading.append(node('span',c.id.slice(1).padStart(2,'0'),'number'),node('h3',c.title),node('span',c.weight+' Punkte','weight'));card.append(heading,node('p',c.aim,'aim'));const checks=node('ul',undefined,'content-checks');c.checks.forEach(q=>checks.append(node('li',q)));card.append(checks);
 const details=node('details'),sum=node('summary','Leistungsstufen & Beleganker');details.append(sum);const levels=node('ol',undefined,'levels');levels.reversed=true;levels.start=4;c.levels.forEach((d,i)=>{const li=node('li');li.value=4-i;li.append(node('strong',c.labels[i]+': '),document.createTextNode(d));levels.append(li);});details.append(levels,node('p','Beleganker: '+c.evidence,'evidence'));card.append(details);
 const row=node('div',undefined,'assessment'),left=node('div'),label=node('label','Bewertungsstufe'),select=node('select');select.id='rating-'+c.id;select.setAttribute('aria-label',c.title+': Bewertungsstufe');select.append(new Option('Noch nicht bewertet',''));for(let i=4;i>=0;i--)select.append(new Option(i+' · '+c.labels[4-i],String(i)));label.append(select);const result=node('p','','selected-description');result.id='desc-'+c.id;left.append(label,result);
 const noteLabel=node('label','Beleg / Begründung / Zeitmarke'),note=node('textarea');note.id='note-'+c.id;note.rows=3;note.placeholder=c.evidence;noteLabel.append(note);row.append(left,noteLabel);card.append(row);$(c.part+'Criteria').append(card);
 select.addEventListener('change',()=>{if(select.value==='')delete state.ratings[c.id];else state.ratings[c.id]=Number(select.value);updateDescriptor(c);save();renderResults();});note.addEventListener('input',()=>{state.notes[c.id]=note.value;save();renderResults();});
}
function updateDescriptor(c){const rating=state.ratings[c.id];$('desc-'+c.id).textContent=rating===undefined?'Urteil mit einer konkreten Stelle begründen.':`${(c.weight*rating/4).toLocaleString('de-CH')} / ${c.weight} P. · ${c.levels[4-rating]}`;}
questions.forEach(([cat,q,follow],i)=>{const box=node('article',undefined,'question'),label=node('label'),check=node('input');check.type='checkbox';check.id='q'+i;label.append(check,node('small',cat+' · zur Prüfung auswählen'));box.append(label,node('p',q),node('p','Nachfrage: '+follow));$('questions').append(box);check.addEventListener('change',()=>{state.selected=check.checked?[...new Set([...state.selected,i])]:state.selected.filter(n=>n!==i);save();});});
for(const id of metaKeys)$(id).addEventListener('input',()=>{state.meta[id]=$(id).value;save();});
function hydrate(){for(const id of metaKeys)$(id).value=state.meta[id]||'';for(const c of criteria){$('rating-'+c.id).value=state.ratings[c.id]??'';$('note-'+c.id).value=state.notes[c.id]||'';updateDescriptor(c);}questions.forEach((_,i)=>$('q'+i).checked=state.selected.includes(i));renderMarks();renderResults();renderTranscript();}
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
 const missing=criteria.filter(c=>state.ratings[c.id]!==undefined&&!state.notes[c.id]?.trim());
 if(missing.length)root.append(node('p','Begründung fehlt bei: '+missing.map(c=>c.title).join(' · '),'warning'));
 root.append(node('p','Zwei unabhängige Noten: Produktnote = 1 + 5 × Produktpunkte / 50. Note mündliche Prüfung = 1 + 5 × Gesprächspunkte / 28. Jede Note wird erst nach vollständiger Bewertung ihres Bereichs auf eine Dezimalstelle gerundet.'));
}

document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-current',t===b?'page':'false');});}));
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export').onclick=()=>download({version:1,kind:'dossier',...state},'berlin-bewertung.json');
$('groupExport').onclick=()=>{const group={ratings:{},notes:{}};for(const c of criteria.filter(c=>c.part==='product')){if(state.ratings[c.id]!==undefined)group.ratings[c.id]=state.ratings[c.id];if(state.notes[c.id])group.notes[c.id]=state.notes[c.id];}download({version:1,kind:'group',...group,meta:{group:state.meta.group||'',book:state.meta.book||'',url:state.meta.url||''}},'berlin-gruppenbewertung.json');};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error('Datei ist zu gross (maximal 2 MB).');const raw=JSON.parse(await file.text()),imported=validateImport(raw,criteria);if(!confirm(raw.kind==='group'?'Produktbewertung und Gruppendaten ersetzen? Individuelle Prüfung bleibt erhalten.':'Aktuelles Dossier durch die importierte Datei ersetzen? Vorher bei Bedarf exportieren.'))return;if(raw.kind==='group'){for(const c of criteria.filter(c=>c.part==='product')){delete state.ratings[c.id];delete state.notes[c.id];}Object.assign(state.ratings,imported.ratings);Object.assign(state.notes,imported.notes);for(const k of ['group','book','url'])state.meta[k]=imported.meta[k]||'';}else{state=imported;stopClock();elapsed=0;tick();}hydrate();save();$('feedback').textContent='Datei erfolgreich geladen.';}catch(err){$('feedback').textContent='Import fehlgeschlagen: '+err.message;}finally{e.target.value='';}};
let elapsed=0,started=null,interval=null;
function seconds(){return elapsed+(started===null?0:(performance.now()-started)/1000);}
function format(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');}
function tick(){const s=seconds();$('clock').textContent=format(s);$('clock').classList.toggle('over',s>=600);$('phase').textContent=s>=600?'10 Minuten erreicht · Gespräch beenden':s>=480?'8–10 Min. · Reflexion':s>=360?'6–8 Min. · Transfer':s>=120?'2–6 Min. · Inhalt':'0–2 Min. · Defense';}
function stopClock(){if(started!==null){elapsed=seconds();started=null;}clearInterval(interval);interval=null;$('start').disabled=false;}
$('start').onclick=()=>{if(started!==null)return;started=performance.now();interval=setInterval(tick,250);$('start').disabled=true;};$('pause').onclick=()=>{stopClock();tick();};$('resetTimer').onclick=()=>{if(!confirm('Prüfungsuhr zurücksetzen? Bestehende Zeitmarken bleiben erhalten.'))return;stopClock();elapsed=0;tick();};
$('addMark').onclick=()=>{const text=$('markText').value.trim();if(!text)return;state.marks.push({seconds:Math.floor(seconds()),text});$('markText').value='';renderMarks();save();};
function renderMarks(){$('marks').replaceChildren();state.marks.forEach(m=>$('marks').append(node('li',format(m.seconds)+' · '+m.text)));}
$('newDossier').onclick=()=>{if(!confirm('Neues leeres Dossier beginnen? Aktuelles Dossier vorher als JSON sichern.'))return;state={ratings:{},notes:{},meta:{},selected:[],marks:[],transcript:{text:'',filename:''}};stopClock();elapsed=0;tick();hydrate();save();};
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
  state.transcript=transcript;renderTranscript();save();
 }catch(err){$('transcriptStatus').textContent='Upload fehlgeschlagen: '+(err instanceof TypeError?'Die Datei muss als UTF-8-Text gespeichert sein.':err.message);}
 finally{e.target.value='';}
};
$('transcriptText').addEventListener('input',()=>{
 state.transcript=validateTranscript({text:$('transcriptText').value,filename:state.transcript?.filename||''});
 const t=state.transcript;$('transcriptStatus').textContent=t.text?`${t.filename||'Direkt eingefügter Text'} · ${t.text.length.toLocaleString('de-CH')} Zeichen`:'Noch kein Transkript hinterlegt.';
 $('transcriptDownload').disabled=!t.text;$('transcriptClear').disabled=!t.text;save();
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
$('transcriptClear').onclick=()=>{if(!confirm('Transkript aus diesem Dossier entfernen? Bereits übernommene Belegpassagen bleiben erhalten.'))return;state.transcript={text:'',filename:''};renderTranscript();save();};
// Normal text blocks let long transcript and evidence text wrap across printed pages.
window.addEventListener('beforeprint',()=>{document.querySelectorAll('textarea').forEach(t=>{const block=node('div',t.value||'—','print-value');t.after(block);});});
window.addEventListener('afterprint',()=>document.querySelectorAll('.print-value').forEach(b=>b.remove()));
hydrate();tick();
