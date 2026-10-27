import {validateTranscript} from './transcript.js';
export function calculate(criteria, ratings, part) {
  const items = criteria.filter(c => c.part === part);
  const assessed = items.filter(c => Number.isInteger(ratings[c.id]) && ratings[c.id]>=0 && ratings[c.id]<=4);
  return { points: assessed.reduce((sum,c)=>sum+c.weight*ratings[c.id]/4,0), max:items.reduce((sum,c)=>sum+c.weight,0), count:assessed.length, total:items.length, complete:assessed.length===items.length };
}
export function validateImport(raw, criteria) {
  if (!raw || raw.version!==1 || !['dossier','group'].includes(raw.kind) || !raw.ratings || typeof raw.ratings!=='object') throw Error('Keine gültige Bewertungsdatei (Version 1).');
  const out={ratings:{},notes:{},meta:{},selected:[],marks:[]};
  for(const c of criteria){
    if(raw.kind==='group' && c.part!=='product')continue;
    const n=raw.ratings[c.id];
    if(n!==undefined){if(!Number.isInteger(n)||n<0||n>4)throw Error('Ungültige Bewertungsstufe.');out.ratings[c.id]=n;}
    if(typeof raw.notes?.[c.id]==='string')out.notes[c.id]=raw.notes[c.id].slice(0,20000);
  }
  const keys=['person','group','book','date','examiner','url','recording','strength','next','judgment'];
  for(const k of keys)if(typeof raw.meta?.[k]==='string')out.meta[k]=raw.meta[k].slice(0,20000);
  out.selected=Array.isArray(raw.selected)?raw.selected.filter(n=>Number.isInteger(n)&&n>=0&&n<10):[];
  out.marks=Array.isArray(raw.marks)?raw.marks.filter(m=>Number.isFinite(m.seconds)&&m.seconds>=0&&typeof m.text==='string').map(m=>({seconds:m.seconds,text:m.text.slice(0,20000)})):[];
  out.transcript=raw.kind==='dossier'?validateTranscript(raw.transcript):{text:'',filename:''};
  return out;
}
