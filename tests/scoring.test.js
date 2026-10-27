import test from 'node:test';
import assert from 'node:assert/strict';
import {criteria} from '../data.js';
import {calculate,validateImport} from '../scoring.js';
test('Gewichte entsprechen dem Auftrag',()=>{assert.equal(calculate(criteria,{},'product').max,50);assert.equal(calculate(criteria,{},'oral').max,28);assert.equal(criteria.filter(c=>['p1','p2','p3'].includes(c.id)).reduce((s,c)=>s+c.weight,0),34);});
test('vollständige Bewertungen auf drei Punktestufen',()=>{for(const level of [0,3,4]){const r=Object.fromEntries(criteria.map(c=>[c.id,level]));const p=calculate(criteria,r,'product'),o=calculate(criteria,r,'oral');assert.equal(p.points+o.points,78*level/4);assert.equal(p.complete&&o.complete,true);}});
test('fehlende Stufe bleibt offen, Null ist bewertet',()=>{assert.equal(calculate(criteria,{},'product').count,0);assert.equal(calculate(criteria,{p1:0},'product').count,1);assert.equal(calculate(criteria,{p1:0},'product').complete,false);});
test('Import weist ungültige Werte zurück',()=>{assert.throws(()=>validateImport({version:1,kind:'dossier',ratings:{p1:5}},criteria));assert.throws(()=>validateImport({version:1,kind:'dossier',ratings:{p1:2.5}},criteria));assert.throws(()=>validateImport({},criteria));});
test('Gruppenimport übernimmt keine Einzelbewertung',()=>{const r=validateImport({version:1,kind:'group',ratings:{p1:3,o1:4},notes:{o1:'privat'}},criteria);assert.deepEqual(r.ratings,{p1:3});assert.equal(r.notes.o1,undefined);});
