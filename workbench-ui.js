import {scoreOptions} from './scoring.js?v=20261030-stufen';
import {findMatches,passage,evidenceValid,citationLabel,auditDossier,replaceSource,newRevision} from './evidence.js?v=20261030-stufen';
import {productFromText,fetchProduct} from './source-import.js?v=20261030-stufen';
export function initWorkbench({criteria,getState,onChange,onNavigate}){
 const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 let active='product',pending=null,renderKey='',searchData={product:{matches:[],total:0},transcript:{matches:[],total:0}},queryTimer,searchRevision='',currentDossier=null;
 const all=criteria.flatMap(c=>c.indicators.map(i=>({...i,part:c.part,criterion:c.title,weight:c.weight})));
 for(const c of criteria){const group=el('optgroup');group.label=(c.part==='product'?'Produkt · ':'Prüfung · ')+c.title;for(const i of c.indicators)group.append(new Option(i.id.toUpperCase()+' · '+i.title,i.id));$('targetIndicator').append(group);}
 const state=()=>getState(),source=()=>state()[active]||{text:'',filename:''};
 function updateValue(id,value){if($(id).value!==value)$(id).value=value;}
 function selectTarget(id){$('targetIndicator').value=id;renderReview();}
 function selectPassage(kind,start,end){active=kind;$('sourceKind').value=kind;pending=passage(state()[kind],kind,start,end);renderKey='';renderSource();renderSelection();$('sourceView').scrollTop=(pending.lineStart-1)*22;}
 function renderSelection(){const valid=pending&&evidenceValid(pending,state());$('selectedPassage').value=pending?.quote||'';$('selectionMeta').textContent=pending?citationLabel(pending)+(valid?'':' · Quelle wurde verändert, bitte neu markieren'):'Noch keine Textpassage markiert.';$('assignEvidence').disabled=!valid;}
 function captureSelection(){
  const selection=window.getSelection();if(!selection?.rangeCount||selection.isCollapsed)return;
  const range=selection.getRangeAt(0),view=$('sourceView');if(!view.contains(range.startContainer)||!view.contains(range.endContainer))return;
  const prefix=document.createRange();prefix.selectNodeContents(view);prefix.setEnd(range.startContainer,range.startOffset);const start=prefix.toString().length;
  const end=start+range.toString().length;
  try{pending=passage(source(),active,start,end);renderSelection();$('workbenchStatus').textContent='Passage ausgewählt. Zielnachweis wählen und zuordnen.';}catch(error){$('workbenchStatus').textContent=error.message;}
 }
 $('sourceView').addEventListener('mouseup',captureSelection);$('sourceView').addEventListener('keyup',captureSelection);
 $('sourceView').addEventListener('scroll',()=>{$('lineNumbers').scrollTop=$('sourceView').scrollTop;});
 function renderSource(){
  const doc=source(),q=$('sourceQuery').value,key=active+'|'+(doc.revision||'initial')+'|'+q+'|'+$('caseSensitive').checked+'|'+(state().evidence||[]).map(e=>e.id).join(',');if(key===renderKey)return;renderKey=key;
  $('sourceMeta').textContent=(active==='product'?'Produkttext':'Transkript')+' · '+(doc.filename||'eingefügter Text')+' · '+doc.text.length.toLocaleString('de-CH')+' Zeichen'+(doc.url?' · '+doc.url:'');
  $('lineNumbers').textContent=Array.from({length:doc.text.split('\n').length},(_,i)=>i+1).join('\n');
  const view=$('sourceView');view.replaceChildren();if(!doc.text){view.textContent=active==='product'?'Noch kein Produkttext. Datei importieren oder Text einfügen.':'Noch kein Transkript. Unter «Einzelprüfung» einlesen oder einfügen.';$('lineNumbers').textContent='';return;}
  const hits=searchData[active]?.matches||[],refs=(state().evidence||[]).filter(e=>e.source===active&&evidenceValid(e,state())),focus=pending&&pending.source===active&&evidenceValid(pending,state())?[pending]:[];
  const boundaries=[...new Set([0,doc.text.length,...[...hits,...refs,...focus].flatMap(e=>[e.start,e.end])])].sort((a,b)=>a-b);
  for(let n=0;n<boundaries.length-1;n++){const a=boundaries[n],b=boundaries[n+1];if(b<=a)continue;const isHit=hits.some(e=>a>=e.start&&b<=e.end),isRef=refs.some(e=>a>=e.start&&b<=e.end),isFocus=focus.some(e=>a>=e.start&&b<=e.end);if(isHit||isRef||isFocus){const mark=el('mark',doc.text.slice(a,b),isFocus?'selected-mark':isRef?'linked-mark':'search-mark');view.append(mark);}else view.append(document.createTextNode(doc.text.slice(a,b)));}
 }
 function search(){
  searchRevision=(state().product?.revision||'initial')+'|'+(state().transcript?.revision||'initial');
  const query=$('sourceQuery').value,scope=$('searchScope').value,caseSensitive=$('caseSensitive').checked;let total=0;$('searchResults').replaceChildren();
  for(const kind of ['product','transcript']){
   if(scope!=='all'&&scope!==kind){searchData[kind]={matches:[],total:0};continue;}searchData[kind]=findMatches(state()[kind]?.text||'',query,{caseSensitive,limit:100});total+=searchData[kind].total;
   for(const hit of searchData[kind].matches){const button=el('button',`${kind==='product'?'Produkt':'Transkript'} · Z. ${hit.line}${kind==='transcript'&&hit.time?' · '+hit.time:''}\n${hit.context}`,'search-hit');button.type='button';button.addEventListener('click',()=>selectPassage(kind,hit.start,hit.end));$('searchResults').append(button);}
  }
  $('searchStatus').textContent=query.trim()?`${total} Treffer · maximal 100 je Quelle angezeigt. Treffer anklicken, um den genauen Suchausdruck als Passage auszuwählen; längere Belege im Quelltext markieren.`:'Suchbegriff eingeben oder direkt im Quelltext markieren.';renderKey='';renderSource();
 }
 $('sourceQuery').addEventListener('input',()=>{clearTimeout(queryTimer);queryTimer=setTimeout(search,180);});$('sourceQuery').addEventListener('search',search);$('sourceQuery').addEventListener('keydown',event=>{if(event.key==='Enter'){clearTimeout(queryTimer);search();}});$('searchScope').onchange=search;$('caseSensitive').onchange=search;
 $('sourceKind').onchange=()=>{active=$('sourceKind').value;renderSource();};
 $('targetIndicator').onchange=renderReview;
 function refCard(ref){
  const box=el('article',undefined,'reference'),valid=evidenceValid(ref,state());box.append(el('strong',ref.indicatorId.toUpperCase()+' · '+citationLabel(ref)),el('p',valid?'Fundstelle stimmt mit der gespeicherten Quelle überein.':'Quelle verändert oder nicht mehr vorhanden – erneut prüfen.',valid?'reference-ok':'reference-stale'),el('blockquote',ref.quote));
  const open=el('button','Fundstelle anzeigen','secondary');open.disabled=!valid;open.onclick=()=>selectPassage(ref.source,ref.start,ref.end);
  const target=el('button','Nachweis wählen','secondary');target.onclick=()=>selectTarget(ref.indicatorId);
  const remove=el('button','Zuordnung entfernen','secondary');remove.onclick=()=>{if(!confirm('Diese Belegzuordnung entfernen? Quelltext und fachliche Begründung bleiben erhalten.'))return;state().evidence=state().evidence.filter(e=>e.id!==ref.id);onChange();refresh();};
  const actions=el('div',undefined,'reference-actions');actions.append(open,target,remove);box.append(actions);return box;
 }
 function renderReferences(){
  const refs=state().evidence||[],target=$('targetIndicator').value;$('targetEvidence').replaceChildren(el('h4','Zugeordnete Originalbelege'));$('allEvidence').replaceChildren();
  refs.forEach(ref=>{$('allEvidence').append(refCard(ref));if(ref.indicatorId===target)$('targetEvidence').append(refCard(ref));});
  if(!refs.some(e=>e.indicatorId===target))$('targetEvidence').append(el('p','Noch kein Originalbeleg zugeordnet.'));
  if(!refs.length)$('allEvidence').append(el('p','Noch keine Belegzuordnungen.'));
 }
 function renderReview(){
  const target=all.find(i=>i.id===$('targetIndicator').value),o=state().observations[target.id]||{},q=state().opportunities?.[target.id]||{};
  $('targetRule').textContent=[3,2,1,0].map(n=>n+'/3 Rohpunkte: '+target.levels[n]).join('\n\n');
  if($('reviewStatus').dataset.target!==target.id){$('reviewStatus').replaceChildren(new Option('Offen / nicht geprüft',''));for(const option of scoreOptions(target,target))$('reviewStatus').append(new Option(option.label,option.value));$('reviewStatus').dataset.target=target.id;}
  if(o.legacyStatus)$('targetRule').textContent+='\n\nFrüheres binäres Urteil: '+(o.legacyStatus==='yes'?'nachgewiesen':'nicht nachgewiesen')+'. Bitte neu einstufen.';
  updateValue('reviewStatus',o.status||'');updateValue('reviewReason',o.evidence||'');updateValue('reviewGap',o.gap||'');$('oralOpportunity').hidden=target.part!=='oral';$('opportunityOpened').checked=q.opened||false;updateValue('opportunityQuestion',q.question||'');updateValue('opportunityTime',q.time||'');updateValue('opportunityHelp',q.help||'');renderReferences();
 }
 for(const id of ['reviewStatus','reviewReason','reviewGap'])$(id).addEventListener('input',()=>{const target=$('targetIndicator').value;state().observations[target]={...state().observations[target],status:$('reviewStatus').value,evidence:$('reviewReason').value,gap:$('reviewGap').value};onChange();});
 for(const id of ['opportunityOpened','opportunityQuestion','opportunityTime','opportunityHelp'])$(id).addEventListener('input',()=>{state().opportunities[$('targetIndicator').value]={opened:$('opportunityOpened').checked,question:$('opportunityQuestion').value,time:$('opportunityTime').value,help:$('opportunityHelp').value};onChange();});
 $('assignEvidence').onclick=()=>{
  if(!pending||!evidenceValid(pending,state()))return;
  if(state().evidence.length>=400){$('workbenchStatus').textContent='Maximal 400 Belege je Dossier. Bitte gezielt zuordnen.';return;}
  const indicatorId=$('targetIndicator').value;if(state().evidence.some(e=>e.indicatorId===indicatorId&&e.source===pending.source&&e.start===pending.start&&e.end===pending.end&&e.revision===pending.revision)){$('workbenchStatus').textContent='Diese Passage ist diesem Nachweis bereits zugeordnet.';return;}
  state().evidence.push({...pending,id:newRevision(),indicatorId});onChange();$('workbenchStatus').textContent='Originalbeleg zugeordnet. Urteil und fachliche Erklärung werden dadurch nicht automatisch verändert.';
 };
 $('openTarget').onclick=()=>onNavigate($('targetIndicator').value.startsWith('p')?'product':'oral',$('targetIndicator').value);
 $('editTranscript').onclick=()=>onNavigate('oral','transcriptText');
 function renderAudit(){
  const issues=auditDossier(criteria,state()),filter=$('auditFilter').value;$('auditSummary').textContent=`${issues.filter(i=>i.type==='open').length} offene Urteile · ${issues.filter(i=>i.type==='reason').length} fehlende Begründungen · ${issues.filter(i=>i.type==='stale').length} veränderte Beleggrundlagen · ${issues.filter(i=>i.type==='opportunity').length} undokumentierte Antwortgelegenheiten · ${issues.filter(i=>i.type==='manual').length} manuelle Belegkontrollen`;
  $('auditResults').replaceChildren();for(const issue of issues.filter(i=>filter==='all'||i.type===filter)){const button=el('button',issue.id.toUpperCase()+' · '+issue.text,'audit-item '+issue.type);button.onclick=()=>{selectTarget(issue.id);$('targetIndicator').focus();};$('auditResults').append(button);}if(!issues.some(i=>filter==='all'||i.type===filter))$('auditResults').append(el('p','Keine Hinweise in diesem Filter. Dies bestätigt die Dokumentation, nicht die fachliche Richtigkeit.'));
 }
 $('auditFilter').onchange=renderAudit;
 function acceptProduct(next){
  if(state().product.text&&state().product.text!==next.text&&!confirm('Produkttext ersetzen? Bestehende Belege bleiben als ursprüngliche Ausschnitte erhalten und werden zur erneuten Prüfung markiert.'))return;
  state().product=replaceSource(state().product,next);active='product';$('sourceKind').value=active;if(next.url)state().meta.url=next.url;onChange();$('productStatus').textContent='Produkttext eingelesen. Nur Textinhalte sind erschlossen; Medien und Funktionen separat prüfen.';
 }
 $('productFile').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Datei ist grösser als 1 MB.');const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());acceptProduct(productFromText(file.name,text));}catch(error){$('productStatus').textContent='Import fehlgeschlagen: '+error.message;}finally{event.target.value='';}};
 $('fetchProduct').onclick=async()=>{const button=$('fetchProduct');button.disabled=true;$('productStatus').textContent='Produkttext wird abgerufen …';try{acceptProduct(await fetchProduct($('productFetchUrl').value));}catch(error){$('productStatus').textContent='Abruf nicht möglich: '+error.message+' Bitte Datei importieren oder Text einfügen.';}finally{button.disabled=false;}};
 $('productText').addEventListener('input',()=>{state().product=replaceSource(state().product,{...state().product,text:$('productText').value});onChange();});
 function refresh(){
  if(currentDossier!==state()){currentDossier=state();pending=null;searchRevision='';renderKey='';updateValue('sourceQuery','');updateValue('productFetchUrl',state().meta.url||'');$('workbenchStatus').textContent='';}
  updateValue('productText',state().product.text);if(!$('productFetchUrl').value&&state().meta.url)$('productFetchUrl').value=state().meta.url;
  const revision=(state().product?.revision||'initial')+'|'+(state().transcript?.revision||'initial');if(searchRevision!==revision)search();else renderSource();
  renderReview();renderAudit();renderSelection();
 }
 refresh();return {refresh,openIndicator(id){selectTarget(id);active=id.startsWith('p')?'product':'transcript';$('sourceKind').value=active;renderSource();$('targetIndicator').focus();}};
}
