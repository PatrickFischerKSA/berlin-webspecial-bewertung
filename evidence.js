export const MAX_SOURCE_CHARS=500000;
export function newRevision(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
export function sourceRevision(source){return source?.revision||'initial';}
export function normalizeSource(source){
 if(source==null)return {text:'',filename:'',url:'',revision:'initial'};
 if(typeof source!=='object'||typeof source.text!=='string'||source.text.length>MAX_SOURCE_CHARS)throw Error('Ungültiger oder zu langer Produkttext (maximal 500’000 Zeichen).');
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source.text))throw Error('Produkttext enthält Binärdaten oder unzulässige Steuerzeichen.');
 return {text:source.text,filename:typeof source.filename==='string'?source.filename.slice(0,255):'',url:typeof source.url==='string'?source.url.slice(0,2000):'',revision:typeof source.revision==='string'?source.revision.slice(0,100):'initial'};
}
export function replaceSource(previous,next){return {...next,revision:next.text===previous?.text?sourceRevision(previous):newRevision()};}
export function lineAt(text,offset){return text.slice(0,Math.max(0,offset)).split('\n').length;}
export function timeAt(text,offset){
 let found='';
 for(const line of text.slice(0,offset+1).split('\n')){const match=line.match(/\b(?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d{1,3})?\b/);if(match)found=match[0];}
 return found;
}

export function passage(source,kind,start,end){
 if(!['product','transcript'].includes(kind)||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>source.text.length)throw Error('Bitte eine Textpassage in der Quelle markieren.');
 const quote=source.text.slice(start,end);
 if(!quote.trim()||quote.length>15000)throw Error('Bitte 1 bis 15’000 Zeichen mit Textinhalt markieren.');
 return {source:kind,revision:sourceRevision(source),filename:source.filename||'',url:source.url||'',start,end,quote,lineStart:lineAt(source.text,start),lineEnd:lineAt(source.text,end-1),time:kind==='transcript'?timeAt(source.text,start):''};
}
export function evidenceValid(evidence,state){
 const source=state[evidence.source];
 return Boolean(source&&sourceRevision(source)===evidence.revision&&source.text.slice(evidence.start,evidence.end)===evidence.quote&&lineAt(source.text,evidence.start)===evidence.lineStart&&lineAt(source.text,evidence.end-1)===evidence.lineEnd&&(evidence.source!=='transcript'||timeAt(source.text,evidence.start)===evidence.time));
}
export function citationLabel(e){return `${e.source==='product'?'Produkt':'Transkript'} · ${e.filename||'eingefügter Text'} · Z. ${e.lineStart}${e.lineEnd!==e.lineStart?'–'+e.lineEnd:''}${e.time?' · '+e.time:''}`;}
export function validateEvidence(raw,criteria){
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>400)throw Error('Ungültige Belegliste (maximal 400 Belege).');
 const ids=new Set(criteria.flatMap(c=>c.indicators.map(i=>i.id))),seen=new Set();
 return raw.map(e=>{
  if(!e||typeof e.id!=='string'||!e.id||e.id.length>100||seen.has(e.id)||!ids.has(e.indicatorId)||!['product','transcript'].includes(e.source)||typeof e.revision!=='string'||typeof e.quote!=='string'||e.quote.length>15000||!e.quote.trim()||!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end<=e.start||e.end>MAX_SOURCE_CHARS||e.end-e.start!==e.quote.length||!Number.isInteger(e.lineStart)||!Number.isInteger(e.lineEnd)||e.lineStart<1||e.lineEnd<e.lineStart)throw Error('Ungültige Belegzuordnung.');
  seen.add(e.id);return {id:e.id.slice(0,100),indicatorId:e.indicatorId,source:e.source,revision:e.revision.slice(0,100),quote:e.quote,start:e.start,end:e.end,lineStart:e.lineStart,lineEnd:e.lineEnd,filename:typeof e.filename==='string'?e.filename.slice(0,255):'',url:typeof e.url==='string'?e.url.slice(0,2000):'',time:typeof e.time==='string'?e.time.slice(0,50):''};
 });
}
export function validateOpportunities(raw,criteria){
 const out={};
 for(const c of criteria.filter(c=>c.part==='oral'))for(const i of c.indicators){const o=raw?.[i.id];if(o===undefined)continue;if(!o||typeof o.opened!=='boolean'||typeof o.question!=='string'||typeof o.help!=='string'||typeof o.time!=='string')throw Error('Ungültige Dokumentation der Antwortgelegenheit.');out[i.id]={opened:o.opened,question:o.question.slice(0,10000),help:o.help.slice(0,10000),time:o.time.slice(0,100)};}
 return out;
}
export function findMatches(text,query,{caseSensitive=false,limit=200}={}){
 if(!query.trim())return {matches:[],total:0};
 const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(escaped,caseSensitive?'gu':'giu');let m,total=0;const matches=[];
 while((m=pattern.exec(text))){total++;if(matches.length<limit)matches.push({start:m.index,end:m.index+m[0].length,line:lineAt(text,m.index),time:timeAt(text,m.index),context:text.slice(Math.max(0,m.index-55),Math.min(text.length,m.index+m[0].length+95)).replace(/\n/g,' ')});}
 return {matches,total};
}
export function auditDossier(criteria,state){
 const issues=[];
 for(const c of criteria)for(const i of c.indicators){
  const o=state.observations[i.id],refs=(state.evidence||[]).filter(e=>e.indicatorId===i.id);
  if(!o?.status)issues.push({type:'open',id:i.id,text:'Urteil noch offen'});
  else if(!o.evidence?.trim())issues.push({type:'reason',id:i.id,text:'Urteil ohne fachliche Begründung oder konkret bezeichnete Fehlstelle'});
  if(o?.status==='yes'&&!refs.some(e=>e.source===(c.part==='oral'?'transcript':'product')))issues.push({type:'manual',id:i.id,text:'Kein verknüpfter Textbeleg: manuelle Fundstelle oder technische Beobachtung kontrollieren'});
  if(refs.some(e=>!evidenceValid(e,state)))issues.push({type:'stale',id:i.id,text:'Beleg stammt aus verändertem oder fehlendem Quelltext; Zuordnung neu prüfen'});
  if(c.part==='oral'&&o?.status){const q=state.opportunities?.[i.id];if(!q?.opened||!q.question.trim())issues.push({type:'opportunity',id:i.id,text:'Antwortgelegenheit und Frage noch nicht dokumentiert'});}
 }
 return issues;
}
