import {normalizeSource,validateEvidence,validateOpportunities,evidenceValid} from './evidence.js?v=20261030-stufen';
import {validateTranscript} from './transcript.js?v=20261030-stufen';
export const RUBRIC_VERSION='Abgestuftes Bewertungsraster 4 · 30.10.2026';
export const STATUS_POINTS={no:0,limited:1,partial:2,yes:3};
export function rawPoints(observation){return STATUS_POINTS[observation?.status]??null;}
export function scoreOptions(criterion,indicator){return [3,2,1,0].map(n=>({value:['no','limited','partial','yes'][n],label:`${n}/3 Rohpunkte · ${(criterion.weight*n/12).toLocaleString('de-CH',{maximumFractionDigits:3})} P.`,description:indicator.levels[n]}));}
export function emptyDossier(){return {ratings:{},observations:{},legacyRatings:{},notes:{},meta:{},selected:[],marks:[],transcript:{text:'',filename:''},product:normalizeSource(),evidence:[],opportunities:{}};}
export function indicatorDecided(observation){return Object.hasOwn(STATUS_POINTS,observation?.status)&&typeof observation.evidence==='string'&&Boolean(observation.evidence.trim())&&(rawPoints(observation)===3||Boolean(observation.gap?.trim()));}
export function criterionResult(criterion,observations,state){
 const records=criterion.indicators.map(i=>state&&(state.evidence||[]).some(e=>e.indicatorId===i.id&&!evidenceValid(e,state))?undefined:observations[i.id]);
 const yes=records.filter(o=>indicatorDecided(o)&&o.status==='yes').length;
 const decided=records.filter(indicatorDecided).length;
 const raw=records.filter(indicatorDecided).reduce((sum,o)=>sum+rawPoints(o),0);
 return {yes,raw,maxRaw:12,decided,total:4,complete:decided===4,points:criterion.weight*raw/12};
}
export function deriveRatings(criteria,observations,state){return Object.fromEntries(criteria.map(c=>[c.id,criterionResult(c,observations,state)]).filter(([,r])=>r.complete).map(([id,r])=>[id,r.raw/3]));}
export function calculate(criteria, ratings, part) {
 const items=criteria.filter(c=>c.part===part);
 const assessed=items.filter(c=>Number.isFinite(ratings[c.id])&&ratings[c.id]>=0&&ratings[c.id]<=4&&Math.abs(ratings[c.id]*3-Math.round(ratings[c.id]*3))<1e-8);
 const numerator=assessed.reduce((sum,c)=>sum+c.weight*Math.round(ratings[c.id]*3),0);
 return {points:numerator/12,numerator,max:items.reduce((sum,c)=>sum+c.weight,0),count:assessed.length,total:items.length,complete:assessed.length===items.length};
}
export function gradeFor(result){if(!result.complete)return null;if(Number.isInteger(result.numerator)){const n=120*result.max+50*result.numerator,d=12*result.max;return Math.floor((2*n+d)/(2*d))/10;}return Math.round((1+5*result.points/result.max)*10)/10;}
export function validateImport(raw,criteria){
 if(!raw||![1,2,3,4].includes(raw.version)||!['dossier','group'].includes(raw.kind)||!raw.ratings||typeof raw.ratings!=='object'||Array.isArray(raw.ratings))throw Error('Keine gültige Bewertungsdatei (Version 1 bis 4).');
 const out=emptyDossier();
 for(const c of criteria){
  if(raw.kind==='group'&&c.part!=='product')continue;
  const n=(raw.version===1?raw.ratings:raw.legacyRatings)?.[c.id];
  if(n!==undefined){if(!Number.isInteger(n)||n<0||n>4)throw Error('Ungültige frühere Bewertungsstufe.');out.legacyRatings[c.id]=n;}
  if(typeof raw.notes?.[c.id]==='string')out.notes[c.id]=raw.notes[c.id].slice(0,20000);
  if(raw.version>=2)for(const i of c.indicators){
   const o=raw.observations?.[i.id];if(o===undefined)continue;
   if(!o||!(raw.version<4?['','yes','no']:['','yes','no','limited','partial']).includes(o.status)||typeof o.evidence!=='string'||o.evidence.length>20000)throw Error('Ungültiger Einzelnachweis.');
   if(o.gap!==undefined&&(typeof o.gap!=='string'||o.gap.length>20000))throw Error('Ungültige Begründung zur nächsten Stufe.');
   out.observations[i.id]={gap:o.gap||'',status:raw.version<4?'':o.status,evidence:o.evidence};
   const prior=raw.version<4?o.status:o.legacyStatus;if(['yes','no'].includes(prior))out.observations[i.id].legacyStatus=prior;
  }
 }
 const keys=['person','group','book','date','examiner','url','recording','strength','next','judgment'];
 for(const k of keys)if(typeof raw.meta?.[k]==='string')out.meta[k]=raw.meta[k].slice(0,20000);
 if(raw.kind==='dossier'){
  out.selected=Array.isArray(raw.selected)?raw.selected.filter(n=>Number.isInteger(n)&&n>=0&&n<10):[];
  out.marks=Array.isArray(raw.marks)?raw.marks.filter(m=>m&&Number.isFinite(m.seconds)&&m.seconds>=0&&typeof m.text==='string').map(m=>({seconds:m.seconds,text:m.text.slice(0,20000)})):[];
  out.transcript=validateTranscript(raw.transcript);
  if(typeof raw.transcript?.revision==='string')out.transcript.revision=raw.transcript.revision.slice(0,100);
  out.opportunities=validateOpportunities(raw.opportunities,criteria);
 }
 out.product=normalizeSource(raw.product);
 out.evidence=validateEvidence(raw.evidence,criteria).filter(e=>raw.kind==='dossier'||(e.indicatorId.startsWith('p')&&e.source==='product'));
 out.ratings=deriveRatings(criteria,out.observations,out);
 return out;
}
export function dossierExport(state){return {version:4,rubric:RUBRIC_VERSION,kind:'dossier',...state};}
export function groupExport(state,criteria){
 const out={version:4,rubric:RUBRIC_VERSION,kind:'group',ratings:{},observations:{},legacyRatings:{},notes:{},meta:{},product:state.product,evidence:(state.evidence||[]).filter(e=>e.indicatorId.startsWith('p')&&e.source==='product')};
 for(const c of criteria.filter(c=>c.part==='product')){
  if(state.ratings[c.id]!==undefined)out.ratings[c.id]=state.ratings[c.id];
  if(state.legacyRatings[c.id]!==undefined)out.legacyRatings[c.id]=state.legacyRatings[c.id];
  if(state.notes[c.id])out.notes[c.id]=state.notes[c.id];
  for(const i of c.indicators)if(state.observations[i.id])out.observations[i.id]=state.observations[i.id];
 }
 for(const key of ['group','book','url'])out.meta[key]=state.meta[key]||'';
 return out;
}
export function mergeGroup(state,imported,criteria){
 for(const c of criteria.filter(c=>c.part==='product')){
  for(const key of ['ratings','notes','legacyRatings'])delete state[key][c.id];
  for(const i of c.indicators)delete state.observations[i.id];
 }
 for(const key of ['ratings','notes','legacyRatings','observations'])Object.assign(state[key],imported[key]);
 for(const key of ['group','book','url'])state.meta[key]=imported.meta[key]||'';
 state.product=imported.product;
 state.evidence=[...(state.evidence||[]).filter(e=>!e.indicatorId.startsWith('p')),...imported.evidence];
 state.ratings=deriveRatings(criteria,state.observations,state);
}
