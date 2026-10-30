import {fetchMarkup} from './source-import.js?v=20261030-formal';
import {makeFormalReport,failedFormalReport,validateFormalReport,formalReportLines} from './formal-check.js?v=20261030-formal';
export function initFormalCheck({getState,onChange}){
 const $=id=>document.getElementById(id);let busy=false;
 function refresh(){const report=getState().formalReport,box=$('formalReport');box.replaceChildren();for(const line of formalReportLines(report,getState().meta.url)){const p=document.createElement('p');p.textContent=line;box.append(p);}$('formalDownload').disabled=!report;}
 function store(report,owner){if(owner!==getState()){$('formalStatus').textContent='Dossier während der Prüfung gewechselt. Ergebnis nicht übernommen; bitte im gewünschten Dossier neu prüfen.';return false;}owner.formalReport=validateFormalReport(report);onChange();refresh();return true;}
 $('formalRun').onclick=async()=>{
  if(busy)return;const address=$('url').value.trim();if(!address){$('formalStatus').textContent='Bitte oben die vollständige Produktadresse eintragen.';return;}
  const owner=getState();busy=true;$('formalRun').disabled=true;$('formalFile').disabled=true;$('formalStatus').textContent='Eine HTML-Antwort wird abgerufen und statisch geprüft …';
  try{const page=await fetchMarkup(address);if(store(await makeFormalReport(page),owner))$('formalStatus').textContent='HTML erfasst. Der Bericht nennt Methode und Grenzen jedes Befunds. Keine Punkte verändert.';}
  catch(error){if(store(failedFormalReport(address,error.message),owner))$('formalStatus').textContent='Kein HTML erfasst. Der Browser kann die Ursache einer Abrufblockade nicht immer unterscheiden; daraus wird kein Produktmangel abgeleitet. HTML-Datei kann separat geprüft werden.';}
  finally{busy=false;$('formalRun').disabled=false;$('formalFile').disabled=false;}
 };
 $('formalFile').onchange=async event=>{
  const file=event.target.files[0];if(!file||busy)return;const owner=getState();busy=true;$('formalRun').disabled=true;
  try{if(!/\.html?$/i.test(file.name)||file.size>1000000)throw Error('Bitte eine HTML-Datei mit maximal 1 MB auswählen.');const html=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());if(store(await makeFormalReport({html,requestedUrl:'',url:'',contentType:'text/html (lokale Datei)'},{mode:'file',filename:file.name}),owner))$('formalStatus').textContent='Lokale HTML-Datei geprüft. Die URL wurde dabei nicht aufgerufen. Keine Punkte verändert.';}
  catch(error){$('formalStatus').textContent='Dateiprüfung fehlgeschlagen: '+error.message+' Ein eventuell vorhandener Bericht bleibt unverändert.';}
  finally{busy=false;$('formalRun').disabled=false;event.target.value='';}
 };
 $('formalDownload').onclick=()=>{const report=getState().formalReport;if(!report)return;const blob=new Blob([formalReportLines(report,getState().meta.url).join('\n\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Berlin-Formalcheck.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 refresh();return {refresh};
}
