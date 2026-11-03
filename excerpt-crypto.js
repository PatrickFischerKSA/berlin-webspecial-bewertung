const encoder = new TextEncoder();
const iterations = 600000;
const encode = bytes => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

async function passwordMaterial(password) {
 return crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey', 'deriveBits']);
}

export async function verifyLegacyPassword(password) {
 const salt = encoder.encode('berlin-exam-legacy-verifier-v1');
 const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations}, await passwordMaterial(password), 256);
 if (encode(new Uint8Array(bits)) !== 'O4r9x1EDTk0JEGbcrC49RLWiJKRnPpVDV3aQtm8UX+g=') throw Error('Das Passwort stimmt nicht.');
}

async function excerptKey(password, salt) {
 return crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt, iterations},
  await passwordMaterial(password), {name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
}

export function validEncryptedExcerpt(value) {
 return value?.version === 1 &&
  /^[A-Za-z0-9+/]{22}==$/.test(value.salt) &&
  /^[A-Za-z0-9+/]{16}$/.test(value.iv) &&
  typeof value.data === 'string' && value.data.length >= 24 && value.data.length <= 320032 &&
  value.data.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value.data);
}

export async function encryptExcerpt(text, password) {
 const salt = crypto.getRandomValues(new Uint8Array(16));
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const data = await crypto.subtle.encrypt({name:'AES-GCM', iv}, await excerptKey(password, salt), encoder.encode(text));
 return {version:1, salt:encode(salt), iv:encode(iv), data:encode(new Uint8Array(data))};
}

export async function decryptExcerpt(value, password) {
 if (!validEncryptedExcerpt(value)) throw Error('Ungültiger verschlüsselter Originalauszug.');
 try {
  const text = await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(value.iv)},
   await excerptKey(password, decode(value.salt)), decode(value.data));
  return new TextDecoder().decode(text);
 } catch {
  throw Error('Falsches Passwort oder beschädigter Originalauszug.');
 }
}
