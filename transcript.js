export const MAX_TRANSCRIPT_CHARS=500000;
export function validateTranscript(value){
  if(value===undefined||value===null)return {text:'',filename:''};
  if(typeof value!=='object'||typeof value.text!=='string'||(value.filename!==undefined&&typeof value.filename!=='string'))throw Error('Ungültige Transkriptdaten.');
  if(value.text.length>MAX_TRANSCRIPT_CHARS)throw Error('Transkript ist zu lang (maximal 500’000 Zeichen).');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value.text))throw Error('Die Datei enthält Binärdaten oder ungültige Steuerzeichen.');
  return {text:value.text,filename:(value.filename||'').slice(0,255)};
}
export function readTranscript(filename,text){
  if(!/\.(txt|md|srt|vtt)$/i.test(filename))throw Error('Unterstützt werden TXT, Markdown, SRT und VTT.');
  const t=validateTranscript({filename,text:text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')});
  if(!t.text.trim())throw Error('Die Datei enthält keinen Transkripttext.');
  return t;
}
