import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateRawSync} from 'node:zlib';
import {Packer} from '../vendor/docx.mjs';
import {buildAssessmentDocument} from '../word-export.js';
import {criteria} from '../data.js';
import {emptyDossier} from '../scoring.js';
function zipText(buffer,target){
 let end=buffer.length-22;while(end>=0&&buffer.readUInt32LE(end)!==0x06054b50)end--;
 assert.ok(end>=0,'Valid ZIP end directory');let at=buffer.readUInt32LE(end+16);
 for(let n=0;n<buffer.readUInt16LE(end+10);n++){
  assert.equal(buffer.readUInt32LE(at),0x02014b50);
  const nameLength=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32),name=buffer.subarray(at+46,at+46+nameLength).toString();
  if(name===target){const offset=buffer.readUInt32LE(at+42),start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28),bytes=buffer.subarray(start,start+buffer.readUInt32LE(at+20));return (buffer.readUInt16LE(at+10)===8?inflateRawSync(bytes):bytes).toString();}
  at+=46+nameLength+extra+comment;
 }
 throw Error('Missing ZIP entry '+target);
}
test('Word export contains all 40 rules, decisions and separate grades',async()=>{
 const state=emptyDossier();state.meta.person='Muster & <Test>';state.ratings={p1:4};
 for(const c of criteria)for(const i of c.indicators)state.observations[i.id]={status:'yes',evidence:'Beleg '+i.id};
 state.observations['o1-1']={status:'no',evidence:'Antwort geprüft; konkret fehlender Textbezug'};
 const buffer=await Packer.toBuffer(buildAssessmentDocument(state)),xml=zipText(buffer,'word/document.xml');
 assert.ok(xml.includes('Muster &amp; &lt;Test&gt;'));assert.ok(xml.includes('50 / 50'));assert.ok(xml.includes('26 / 28'));assert.ok(xml.includes('5.6'));assert.ok(xml.includes('6.0'));
 for(const c of criteria)for(const i of c.indicators){assert.ok(xml.includes(i.id.toUpperCase().replace('-',' ')));assert.ok(xml.includes('Beleg '+i.id)||i.id==='o1-1');}
 assert.ok(xml.includes('Nicht nachgewiesen'));assert.ok(zipText(buffer,'[Content_Types].xml').includes('wordprocessingml.document.main+xml'));
});
test('Word export keeps open assessments open and transcript opt-in',async()=>{
 const state=emptyDossier();state.ratings=Object.fromEntries(criteria.map(c=>[c.id,4]));state.observations['p1-1']={status:'yes',evidence:''};state.transcript={text:'VERTRAULICHES TESTTRANSKRIPT',filename:'test.txt'};
 const without=zipText(await Packer.toBuffer(buildAssessmentDocument(state)),'word/document.xml');
 assert.ok(without.includes('Offen'));assert.ok(without.includes('Begründung fehlt'));assert.ok(!without.includes('6.0'));assert.ok(!without.includes('VERTRAULICHES TESTTRANSKRIPT'));
 const withTranscript=zipText(await Packer.toBuffer(buildAssessmentDocument(state,{includeTranscript:true})),'word/document.xml');assert.ok(withTranscript.includes('VERTRAULICHES TESTTRANSKRIPT'));
});

test('Word report preserves original evidence, locator, question and audit',async()=>{
 const {passage,replaceSource}=await import('../evidence.js');
 const state=emptyDossier();state.transcript=replaceSource(state.transcript,{text:'[00:12] ORIGINALBELEG <Text> & Kontext',filename:'gespraech.txt'});
 const start=state.transcript.text.indexOf('ORIGINAL');state.evidence=[{...passage(state.transcript,'transcript',start,state.transcript.text.length),id:'ref1',indicatorId:'o1-1'}];
 state.opportunities['o1-1']={opened:true,question:'GESTELLTE FRAGE',time:'00:10',help:'Neutrale Nachfrage'};
 const xml=zipText(await Packer.toBuffer(buildAssessmentDocument(state)),'word/document.xml');
 assert.ok(xml.includes('ORIGINALBELEG &lt;Text&gt; &amp; Kontext'));assert.ok(xml.includes('Z. 1'));assert.ok(xml.includes('00:12'));assert.ok(xml.includes('GESTELLTE FRAGE'));assert.ok(xml.includes('Bewertungskontrolle'));
 state.transcript=replaceSource(state.transcript,{...state.transcript,text:'Geändert'});
 const changed=zipText(await Packer.toBuffer(buildAssessmentDocument(state)),'word/document.xml');assert.ok(changed.includes('ursprünglich zugeordnete Wortlaut'));assert.ok(changed.includes('ORIGINALBELEG'));
});
