import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptExcerpt,decryptExcerpt} from '../excerpt-crypto.js';
import {emptyDossier,dossierExport,validateImport} from '../scoring.js';
import {criteria} from '../data.js';

test('JSON blocks unencrypted excerpts and restores password-protected originals', async () => {
 const state=emptyDossier();
 const excerpt='VERTRAULICHER Originalauszug · Seite 42';
 const password='synthetic-test-password';
 state.examDossier={title:'Dossier',book:'Roman',focus:'Analyse',excerpt,tasks:['A','B','C','D']};
 assert.throws(()=>dossierExport(state), /verschlüsseln/);
 state.examDossier.encryptedExcerpt=await encryptExcerpt(excerpt,password);
 const json=JSON.stringify(dossierExport(state));
 assert.ok(!json.includes('VERTRAULICHER'));
 const loaded=validateImport(JSON.parse(json),criteria);
 assert.equal(await decryptExcerpt(loaded.examDossier.encryptedExcerpt,password),excerpt);
 await assert.rejects(decryptExcerpt(loaded.examDossier.encryptedExcerpt,'wrong'), /Falsches Passwort/);
});
