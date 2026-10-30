import {normalizeSource} from './evidence.js?v=20261030-stufen';
export function htmlToText(html){
 const template=document.createElement('template');template.innerHTML=html;
 template.content.querySelectorAll('script,style,noscript,template,iframe,object,svg,canvas,head,title,meta,link,base,[hidden],[aria-hidden="true"]').forEach(el=>el.remove());
 const blocks=new Set(['P','DIV','SECTION','ARTICLE','HEADER','FOOTER','NAV','MAIN','H1','H2','H3','H4','H5','H6','LI','TR','BLOCKQUOTE','PRE','FIGCAPTION']);
 let text='';
 function walk(el){if(el.nodeType===3){text+=el.textContent;return;}if(el.nodeType!==1&&el.nodeType!==11)return;if(el.nodeType===1){if(blocks.has(el.tagName)||el.tagName==='BR')text+='\n';if(el.tagName==='IMG'&&el.getAttribute('alt'))text+='[Bildbeschreibung: '+el.getAttribute('alt')+']';}for(const child of el.childNodes)walk(child);if(blocks.has(el.tagName))text+='\n';}
 walk(template.content);return text.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function productFromText(filename,text,url=''){
 if(!/\.(txt|md|html?|xhtml)$/i.test(filename))throw Error('Bitte TXT, Markdown oder HTML auswählen.');
 const content=/\.(html?|xhtml)$/i.test(filename)?htmlToText(text):text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 if(!content.trim())throw Error('Die Quelle enthält keinen auslesbaren Text.');
 return normalizeSource({text:content,filename,url});
}
export async function fetchProduct(address){
 let url;try{url=new URL(address);}catch{throw Error('Bitte eine vollständige Produktadresse mit https:// eingeben.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Nur öffentliche HTTP- oder HTTPS-Adressen ohne Zugangsdaten verwenden.');
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);
 try{
  const response=await fetch(url.href,{credentials:'omit',referrerPolicy:'no-referrer',signal:abort.signal});
  if(!response.ok)throw Error('Die Website antwortet mit HTTP '+response.status+'.');
  const type=response.headers.get('content-type')||'';if(!/text\/(html|plain|markdown)|application\/xhtml\+xml/i.test(type))throw Error('Der Abruf liefert keinen HTML- oder Textinhalt.');
  let text;if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000){await reader.cancel();throw Error('Quelltext ist grösser als 1 MB. Bitte einen gezielten Textauszug importieren.');}chunks.push(value);}const bytes=new Uint8Array(size);let n=0;for(const chunk of chunks){bytes.set(chunk,n);n+=chunk.length;}text=new TextDecoder().decode(bytes);}else{text=await response.text();if(text.length>1000000)throw Error('Quelltext ist zu gross.');}
  const html=/html/i.test(type);return productFromText(html?'Webspecial.html':'Webspecial.txt',text,response.url||url.href);
 }finally{clearTimeout(timer);}
}
