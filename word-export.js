import {auditDossier,evidenceValid,citationLabel} from './evidence.js?v=20261030-stufen';
import {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,BorderStyle,Header,Footer,PageNumber,AlignmentType,VerticalAlign} from './vendor/docx.mjs';
import {criteria,questions} from './data.js?v=20261030-stufen';
import {calculate,deriveRatings,gradeFor,criterionResult,indicatorDecided,rawPoints,RUBRIC_VERSION} from './scoring.js?v=20261030-stufen';
const fmt=n=>n.toLocaleString('de-CH');
// XML 1.0 cannot represent most control characters, including those pasted into notes.
const clean=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'');
const txt=(text,options={})=>new TextRun({text:clean(text),...options});
const para=(text,options={})=>new Paragraph({children:[txt(text)],...options});
const labelled=(label,value,options={})=>new Paragraph({children:[txt(label+': ',{bold:true}),txt(value||'Nicht eingetragen')],spacing:{after:100},...options});
function multiline(value){return clean(value||'Nicht eingetragen').split(/\r?\n/).map(line=>para(line||' ',{spacing:{after:60}}));}
const line={style:BorderStyle.SINGLE,size:4,color:'D9D9D9'};
function table(rows,widths,heading=true){return new Table({width:{size:9638,type:WidthType.DXA},columnWidths:widths,rows:rows.map((row,index)=>new TableRow({tableHeader:heading&&index===0,cantSplit:true,children:row.map((value,col)=>new TableCell({width:{size:widths[col],type:WidthType.DXA},verticalAlign:VerticalAlign.CENTER,margins:{top:100,bottom:100,left:130,right:130},borders:{top:line,bottom:line,left:line,right:line},shading:{fill:index===0&&heading?'183C45':index%2===0?'F1F4F4':'FFFFFF'},children:[para(value,{alignment:col>0?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{after:0},children:[txt(value,{bold:index===0&&heading,color:index===0&&heading?'FFFFFF':'000000',size:20})]})]}))}))});}
function heading(text,level=HeadingLevel.HEADING_1,options={}){return para(text,{heading:level,keepNext:true,...options});}
export function buildAssessmentDocument(state,{includeTranscript=false}={}){
 const ratings=deriveRatings(criteria,state.observations||{},state),meta=state.meta||{},notes=state.notes||{},observations=state.observations||{};
 const children=[para('Bewertung des Berlin Thriller Webspecials',{heading:HeadingLevel.TITLE}),para('Produkt und mündliche Einzelprüfung werden getrennt benotet. Dieses Dossier dokumentiert die Einzelurteile und ihre Beleggrundlage. Offene Nachweise sind keine Nullbewertungen.'),labelled('Raster',RUBRIC_VERSION)];
 for(const [label,key] of [['Person oder Kürzel','person'],['Gruppe','group'],['Roman','book'],['Prüfungsdatum','date'],['Prüfperson','examiner'],['Produktadresse','url'],['Aufnahme ID','recording']])children.push(labelled(label,meta[key]));
 children.push(heading('Getrennte Noten'));
 const summary=[['Bereich','Punkte','Note','Status']];
 for(const [label,part] of [['Produkt','product'],['Mündliche Prüfung','oral']]){const r=calculate(criteria,ratings,part),g=gradeFor(r);summary.push([label,fmt(r.points)+' / '+r.max,g===null?'Offen':g.toFixed(1),r.complete?'Kriterien geprüft':r.count+' / '+r.total+' Kriterien']);}
 children.push(table(summary,[3558,1800,1400,2880]),para('Punktesummen berücksichtigen nur vollständig geprüfte Kriterien. Produktnote = 1 + 5 × Punkte / 50. Mündliche Prüfungsnote = 1 + 5 × Punkte / 28. Jeweils auf eine Dezimalstelle gerundet. Es wird keine Gesamtnote berechnet.',{spacing:{before:140,after:180}}));
 for(const [title,key] of [['Würdigung','strength'],['Entwicklungsziel','next'],['Übergreifende Rückmeldung','judgment']])if(meta[key]?.trim()){children.push(heading(title,HeadingLevel.HEADING_2),...multiline(meta[key]));}
 children.push(heading('Regeln der Punktevergabe',HeadingLevel.HEADING_2),para('Je Kriterium werden vier Nachweise unabhängig geprüft. Jedes Teilkriterium erhält 0, 1, 2 oder 3 Rohpunkte nach seinen eigenen Deskriptoren. Es zählt die höchste vollständig belegte Stufe. Gewichtete Teilpunkte = Kriteriumsgewicht × Rohpunkte / 12. Begründung und Fundstelle müssen die gewählte Stufe und den Abstand zur nächsthöheren erklären. Nicht geprüfte Leistungen bleiben offen. Die Eintragung eines Belegs bestätigt dessen fachliche Richtigkeit nicht automatisch. Keine frei gewählten Zwischenwerte, Zusatzpunkte oder globalen Abzüge. Zwischenrechnungen bleiben ungerundet.'));
 for(const c of criteria){
  const r=criterionResult(c,observations,state);
  children.push(heading((c.part==='product'?'Produkt ':'Mündliche Prüfung ')+c.id.toUpperCase()+' '+c.title.replace(/[^\p{L}\p{N}\s]/gu,' '),HeadingLevel.HEADING_1,{pageBreakBefore:c.id==='p1'||c.id==='o1'}),para(c.aim,{keepNext:true}),labelled('Ergebnis',r.complete?`${r.raw}/12 Rohpunkte · ${fmt(r.points)} von ${c.weight} Punkten`:`Offen · ${r.decided} von 4 Nachweisen abschliessend geprüft`,{keepNext:true}));
  const legacy=state.legacyRatings?.[c.id];if(legacy!==undefined)children.push(para(`Früheres Raster: ${legacy}/4. Nur als früheres Urteil erhalten, nicht in die aktuelle Note eingerechnet.`,{spacing:{after:140}}));
  for(const i of c.indicators){
   const o=observations[i.id],stale=(state.evidence||[]).some(e=>e.indicatorId===i.id&&!evidenceValid(e,state)),decided=indicatorDecided(o)&&!stale,verdict=decided?rawPoints(o)+'/3 Rohpunkte':'Offen',points=decided?fmt(c.weight*rawPoints(o)/12):'—';
   children.push(heading(i.id.toUpperCase().replace('-',' ')+' '+i.title,HeadingLevel.HEADING_2),...i.levels.map((description,n)=>para(n+'/3 Rohpunkte: '+description,{spacing:{after:80}})),labelled('Urteil',verdict+' · '+points+' gewichtete Punkte'));
   if(o?.status&&!decided)children.push(para(stale?'Zugeordnete Beleggrundlage verändert. Das Urteil bleibt bis zur erneuten Prüfung offen.':'Auswahl vorhanden, aber Begründung fehlt oder der Stufenabstand ist nicht dokumentiert. Der Nachweis ist nicht abgeschlossen.'));
   if(o?.legacyStatus)children.push(para('Früheres binäres Urteil: '+(o.legacyStatus==='yes'?'nachgewiesen':'nicht nachgewiesen')+'. Nicht automatisch in neue Punkte umgerechnet.'));
   children.push(...multiline(o?.evidence));
   if(o?.gap)children.push(labelled('Fehlender Bestandteil zur nächsten Stufe',o.gap));
   for(const ref of (state.evidence||[]).filter(e=>e.indicatorId===i.id)){
    children.push(labelled('Originalbeleg',citationLabel(ref)),para(evidenceValid(ref,state)?'Fundstelle stimmt mit dem gespeicherten Textauszug überein.':'Achtung: Quelle wurde verändert oder fehlt. Dies ist der ursprünglich zugeordnete Wortlaut.'),...multiline(ref.quote));
    if(ref.url)children.push(labelled('Quelladresse',ref.url));
   }
   if(c.part==='oral'){
    const q=state.opportunities?.[i.id];
    const opportunity=q?.opened&&q.question?.trim()?'Eröffnet und dokumentiert':'Nicht vollständig dokumentiert';
    children.push(para('Antwortgelegenheit: '+opportunity+(q?.time?' · '+q.time:'')+(q?.question?' · Frage: '+q.question:'')+(q?.help?' · Hilfen: '+q.help:''),{spacing:{after:120}}));
   }
  }
  if(notes[c.id]?.trim())children.push(heading('Ergänzende Begründung und Transkriptbelege',HeadingLevel.HEADING_2),...multiline(notes[c.id]));
 }
 const selected=(state.selected||[]).filter(i=>questions[i]);
 if(selected.length||state.marks?.length)children.push(heading('Prüfungsprotokoll',HeadingLevel.HEADING_1));
 if(selected.length){children.push(heading('Ausgewählte Prüfungsfragen',HeadingLevel.HEADING_2));for(const index of selected){const [type,q,follow]=questions[index];children.push(heading(type,HeadingLevel.HEADING_2),para(q),para('Nachfrage: '+follow));}}
 if(state.marks?.length){children.push(heading('Zeitmarken des Gesprächs',HeadingLevel.HEADING_2));for(const m of state.marks){const time=String(Math.floor(m.seconds/60)).padStart(2,'0')+':'+String(Math.floor(m.seconds%60)).padStart(2,'0');children.push(...multiline(time+' · '+m.text));}}
 const issues=auditDossier(criteria,state);
 children.push(heading('Bewertungskontrolle',HeadingLevel.HEADING_1),para('Diese Kontrolle prüft Dokumentation und Zuordnung, nicht die fachliche Richtigkeit. Eine fehlende Textverknüpfung kann durch eine überprüfte manuelle Fundstelle oder technische Beobachtung ersetzt werden. Die Hinweise sind vor Abschluss fachlich zu klären. Bei veränderten Beleggrundlagen bleiben betroffene Kriterien rechnerisch offen.'));
 if(!issues.length)children.push(para('Keine formalen Prüfhinweise vorhanden. Die fachliche Prüfung bleibt Aufgabe der Prüfperson.'));
 for(const issue of issues)children.push(para(issue.id.toUpperCase()+' · '+issue.text));
 if(includeTranscript&&state.transcript?.text){children.push(heading('Transkript der mündlichen Prüfung',HeadingLevel.HEADING_1),labelled('Datei',state.transcript.filename||'Direkt eingefügter Text'),...multiline(state.transcript.text));}
 const styles={default:{document:{run:{font:'Arial',size:21,color:'000000'},paragraph:{spacing:{after:100,line:270}}}},paragraphStyles:[{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font:'Arial',size:38,bold:true,color:'000000'},paragraph:{spacing:{after:220},keepNext:true}},{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',run:{font:'Arial',size:29,bold:true,color:'000000'},paragraph:{spacing:{before:160,after:160},keepNext:true}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font:'Arial',size:23,bold:true,color:'000000'},paragraph:{spacing:{before:160,after:100},keepNext:true}}]};
 return new Document({title:'Bewertung des Berlin Thriller Webspecials',creator:meta.examiner||'Prüfperson',description:'Getrennte Produkt- und Prüfungsnoten mit einzeln dokumentierten Nachweisen',styles,sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1000,bottom:1050,left:1134,right:1134,header:450,footer:450}}},headers:{default:new Header({children:[para('BERLIN THRILLER   BEWERTUNGSDOSSIER',{children:[txt('BERLIN THRILLER   BEWERTUNGSDOSSIER',{size:16})]})]})},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[txt('Seite ',{size:16}),new TextRun({children:[PageNumber.CURRENT],size:16}),txt(' von ',{size:16}),new TextRun({children:[PageNumber.TOTAL_PAGES],size:16})]})]})},children}]});
}
export async function exportWord(state,options){
 const blob=await Packer.toBlob(buildAssessmentDocument(state,options)),url=URL.createObjectURL(blob),anchor=document.createElement('a');
 const person=(state.meta.person||'dossier').replace(/[^a-zA-Z0-9äöüÄÖÜ_-]+/g,'-').slice(0,70);
 anchor.href=url;anchor.download='Berlin-Bewertung-'+person+'.docx';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
