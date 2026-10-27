import test from 'node:test';
import assert from 'node:assert/strict';
import {readTranscript,validateTranscript,MAX_TRANSCRIPT_CHARS} from '../transcript.js';
import {validateImport} from '../scoring.js';
import {criteria} from '../data.js';
test('Upload behält Zeitstempel, Sprecher und Sonderzeichen',()=>{for(const name of ['gespräch.txt','gespräch.md','gespräch.srt','gespräch.vtt']){const t=readTranscript(name,'\uFEFF00:01:20,000 --> 00:01:22,000\r\nPrüfperson: Überzeugen Sie mich.');assert.equal(t.text,'00:01:20,000 --> 00:01:22,000\nPrüfperson: Überzeugen Sie mich.');assert.equal(t.filename,name);}});
test('Leere, binäre, zu lange und nicht unterstützte Dateien werden abgewiesen',()=>{assert.throws(()=>readTranscript('a.txt','   '));assert.throws(()=>readTranscript('a.txt','a\u0000b'));assert.throws(()=>readTranscript('a.pdf','Hallo'));assert.throws(()=>validateTranscript({text:'a'.repeat(MAX_TRANSCRIPT_CHARS+1)}));});
test('Dossier speichert das ganze Transkript verlustfrei',()=>{const raw={version:1,kind:'dossier',ratings:{o1:3},transcript:{text:'[02:00] Eine Aussage\n\nmit Beleg.',filename:'prüfung.txt'}};const result=validateImport(JSON.parse(JSON.stringify(raw)),criteria);assert.deepEqual(result.transcript,raw.transcript);});
test('Alte Dossiers sind kompatibel, Gruppenimporte nehmen kein Transkript mit',()=>{assert.deepEqual(validateImport({version:1,kind:'dossier',ratings:{}},criteria).transcript,{text:'',filename:''});assert.deepEqual(validateImport({version:1,kind:'group',ratings:{},transcript:{text:'privat',filename:'geheim.txt'}},criteria).transcript,{text:'',filename:''});});
