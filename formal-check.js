export const FORMAL_VERSION='Formalcheck 1 · 30.10.2026';
export const FORMAL_LIMITS='Eine HTML-Antwort, keine Unterseiten, kein JavaScript ausgeführt, kein gerendertes Layout. Externe Links und Medien werden nicht aufgerufen. Keine Prüfung von Fakten, Quellenqualität, Urheberschaft, Lizenzen, Analyse, Synthese oder Kreativität. Keine automatische Punktevergabe.';
const cut=(s,n=350)=>String(s??'').slice(0,n);
const short=el=>cut(el.outerHTML?.replace(/\s+/g,' ')||el.textContent,350);
export function inspectDocument(doc){
 const rows=[],add=(id,label,status,finding,method,evidence=[])=>rows.push({id,label,status,finding,method,evidence:evidence.slice(0,12)}),all=s=>[...doc.querySelectorAll(s)],attr=(el,a)=>el.getAttribute(a)||'';
 const title=doc.querySelector('title')?.textContent.trim()||'';
 add('title','Seitentitel',title?'erfasst':'hinweis',title||'Kein nichtleerer <title> gefunden.','Erstes <title>-Element im abgerufenen HTML.');
 const lang=doc.documentElement.getAttribute('lang')?.trim()||'';
 add('lang','Sprachdeklaration',lang?'erfasst':'hinweis',lang?`lang="${cut(lang)}" vorhanden; sprachliche Richtigkeit nicht geprüft.`:'Kein nichtleeres lang-Attribut an <html>.','Attributprüfung, keine Spracherkennung.');
 const viewport=all('meta[name]').filter(e=>attr(e,'name').toLowerCase()==='viewport').map(e=>attr(e,'content'));
 add('viewport','Mobile Viewport-Deklaration',viewport.some(s=>/width\s*=\s*device-width/i.test(s))?'erfasst':'hinweis',viewport.length?viewport.join(' · '):'Keine Viewport-Angabe gefunden.','Nur Meta-Angabe; keine Aussage über tatsächliche mobile Lesbarkeit.');
 const headings=all('h1,h2,h3,h4,h5,h6'),h1=headings.filter(e=>e.tagName==='H1'),jumps=headings.filter((h,n)=>n&&+h.tagName[1]>+headings[n-1].tagName[1]+1);
 add('headings','Überschriftenstruktur',h1.length===1&&!jumps.length?'erfasst':'hinweis',`${headings.length} Überschriften, ${h1.length} H1, ${jumps.length} Sprünge um mehr als eine Ebene. Keine Inhaltsbewertung.`, 'H1–H6 in HTML-Reihenfolge; versteckte und dynamische Darstellung nicht berücksichtigt.',headings.map(e=>e.tagName+': '+cut(e.textContent.trim(),200)));
 const imgs=all('img'),missing=imgs.filter(e=>!e.hasAttribute('alt')),empty=imgs.filter(e=>e.hasAttribute('alt')&&!attr(e,'alt').trim());
 add('images','Bildbeschreibungen',missing.length?'hinweis':'erfasst',`${imgs.length} <img>, ${missing.length} ohne alt-Attribut, ${empty.length} mit leerem alt. Ein leeres alt kann bei Dekoration korrekt sein.`, 'Attributprüfung nur bei <img>; CSS-Hintergrundbilder fehlen. Beschreibungsqualität und Bildfunktion manuell prüfen.',missing.map(short));
 const videos=all('video'),tracks=all('video track').filter(e=>['captions','subtitles'].includes(attr(e,'kind').toLowerCase())&&attr(e,'src').trim()),without=videos.filter(v=>![...v.querySelectorAll('track')].some(e=>['captions','subtitles'].includes(attr(e,'kind').toLowerCase())&&attr(e,'src').trim()));
 add('media','Audio, Video und Untertitelverweise',without.length?'hinweis':'erfasst',`${videos.length} <video>, ${all('audio').length} <audio>, ${tracks.length} Untertitel-/Caption-Tracks mit src; ${without.length} Videos ohne solchen Track.`, 'Nur HTML-Verweise: kein Abspielen, kein Abruf der Tracks. Eingebrannte Untertitel und Textfassungen nicht erkannt; ohne Sprache kann ein Video keinen Untertitel benötigen.',without.map(short));
 const frames=all('iframe');add('embeds','Eingebettete Fremdinhalte','erfasst',`${frames.length} Iframes; ihre Inhalte wurden nicht untersucht.`, 'Nur <iframe>-Elemente und src-/title-Attribute.',frames.map(short));
 const ids=new Set(all('[id]').map(e=>attr(e,'id'))),anchors=new Set(all('a[name]').map(e=>attr(e,'name'))),links=all('a[href]'),broken=[],emptyLinks=[];
 for(const a of links){const href=attr(a,'href').trim();if(!href||href==='#'){emptyLinks.push(a);continue;}if(href.startsWith('#')){let id;try{id=decodeURIComponent(href.slice(1));}catch{broken.push(a);continue;}if(!ids.has(id)&&!anchors.has(id))broken.push(a);}}
 add('links','Linkinventar und lokale Sprungziele',broken.length||emptyLinks.length?'hinweis':'erfasst',`${links.length} Links; ${broken.length} reine #Sprungziele fehlen im HTML; ${emptyLinks.length} leere bzw. #-Verweise.`, 'Nur href="#…" wird gegen IDs und benannte Anker derselben Antwort geprüft. JS-Ziele können später entstehen; externe Erreichbarkeit bleibt ungeprüft.',[...broken,...emptyLinks].map(short));
 const body=doc.body?.cloneNode(true);body?.querySelectorAll('script,style,noscript,template').forEach(e=>e.remove());const gather=n=>n.nodeType===3?n.textContent:[...n.childNodes].map(gather).join(' ');const text=body?gather(body):'';
 const matches=[...text.matchAll(/\b(?:lorem ipsum|TODO|Platzhalter|hier (?:Text|Bild|Video) einfügen)\b/gi)];
 add('placeholders','Platzhalter-Suchlauf',matches.length?'hinweis':'erfasst',`${matches.length} Treffer für das festgelegte Suchmuster. Ein Treffer kann ein bewusstes Zitat sein; fehlende Treffer beweisen keine Vollständigkeit.`, 'Suchbegriffe, ohne Gross-/Kleinschreibung: lorem ipsum, TODO, Platzhalter, hier Text einfügen, hier Bild einfügen, hier Video einfügen. Textknoten ohne script/style/noscript/template; keine visuelle Sichtbarkeitsprüfung.',matches.map(m=>cut(text.slice(Math.max(0,m.index-55),m.index+m[0].length+90).replace(/\s+/g,' '),200)));
 const scripts=all('script');add('scope','Umfang des statischen Auszugs','erfasst',`${text.trim().length} Textzeichen, ${scripts.length} Script-Elemente. Nachgeladene Inhalte können fehlen.`, 'Textknoten zählen, keine visuelle Wortzählung. Bei wenig Text und Scripts möglicherweise nur ein App-Gerüst.');
 return rows;
}
export async function makeFormalReport(page,{mode='url',filename='',parse=html=>new DOMParser().parseFromString(html,'text/html')}={}){
 if(!/html/i.test(page.contentType||''))throw Error('Formalcheck benötigt HTML; die Antwort ist kein HTML-Dokument.');
 const bytes=new TextEncoder().encode(page.html),hash=await crypto.subtle.digest('SHA-256',bytes);
 return {version:1,checker:FORMAL_VERSION,mode,filename:cut(filename,250),requestedUrl:page.requestedUrl||'',url:page.url||'',capturedAt:new Date().toISOString(),httpStatus:mode==='url'?page.httpStatus:null,contentType:page.contentType,bytes:bytes.length,sha256:[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join(''),outcome:'captured',error:'',rows:inspectDocument(parse(page.html)),limits:FORMAL_LIMITS};
}
export function failedFormalReport(address,error){return {version:1,checker:FORMAL_VERSION,mode:'url',requestedUrl:cut(address,2000),url:'',capturedAt:new Date().toISOString(),outcome:'failed',error:cut(error,1000),rows:[],limits:FORMAL_LIMITS};}
export function validateFormalReport(raw){
 if(!raw||raw.version!==1||!['captured','failed'].includes(raw.outcome)||!['url','file'].includes(raw.mode)||!Array.isArray(raw.rows)||raw.rows.length>30)return null;
 const out={version:1,mode:raw.mode,outcome:raw.outcome};
 for(const k of ['checker','filename','requestedUrl','url','capturedAt','contentType','sha256','error'])out[k]=cut(raw[k],k.includes('Url')||k==='url'?2000:1000);
 out.httpStatus=Number.isInteger(raw.httpStatus)&&raw.httpStatus>=100&&raw.httpStatus<=599?raw.httpStatus:null;
 out.bytes=Number.isInteger(raw.bytes)&&raw.bytes>=0&&raw.bytes<=1000000?raw.bytes:null;out.limits=FORMAL_LIMITS;
 out.rows=raw.rows.map(r=>({id:cut(r?.id,100),label:cut(r?.label,200),status:['erfasst','hinweis'].includes(r?.status)?r.status:'hinweis',finding:cut(r?.finding,2000),method:cut(r?.method,2000),evidence:Array.isArray(r?.evidence)?r.evidence.slice(0,12).map(e=>cut(e,500)):[]}));return out;
}
export function formalReportLines(report,currentUrl=''){
 const r=validateFormalReport(report);if(!r)return ['Noch kein automatischer Formalcheck dokumentiert.'];
 const lines=[r.checker,`Erfassung: ${r.capturedAt} · ${r.mode==='url'?(r.outcome==='failed'?'URL-Abrufversuch im Browser':'Direkter URL-Abruf im Browser'):'Lokal importierte HTML-Datei; kein Live-Abruf'}`,`Angefragt: ${r.requestedUrl||'—'} · Antwort-URL: ${r.url||'—'}`];
 const canonical=value=>{try{return new URL(value).href;}catch{return value;}};
 if(currentUrl&&r.mode==='url'&&canonical(r.requestedUrl)!==canonical(currentUrl)&&canonical(r.url)!==canonical(currentUrl))lines.push('ACHTUNG: Die aktuelle Produktadresse weicht vom gespeicherten Prüfbericht ab. Neu prüfen.');
 if(r.outcome==='failed')return [...lines,'KEIN HTML ERFASST: '+r.error,'Browserblockade (z. B. CORS), Netz- oder Adressfehler sind keine festgestellten Produktmängel.',FORMAL_LIMITS];
 lines.push(`HTTP: ${r.httpStatus??'nicht erhoben (Datei)'} · Content-Type: ${r.contentType} · ${r.bytes} UTF-8-Bytes des dekodierten HTML`, `SHA-256 des dekodierten HTML (UTF-8): ${r.sha256}`);
 if(r.filename)lines.push('Datei: '+r.filename);
 for(const row of r.rows)lines.push(`${row.status==='hinweis'?'PRÜFHINWEIS':'AUTOMATISCH ERFASST'} · ${row.label}: ${row.finding}`, 'Methode / Grenze: '+row.method,...row.evidence.map(e=>'Fundstelle im HTML: '+e));
 lines.push('Pro Befund werden höchstens 12 Fundstellen ausgegeben. Zählwerte beziehen sich auf alle gefundenen Elemente. Ein gespeicherter bzw. importierter Bericht ist eine Momentaufnahme, keine aktuelle erneute Prüfung.',FORMAL_LIMITS);return lines;
}
