import {validEncryptedExcerpt} from './excerpt-crypto.js?v=20261103-crypto';
const headings = [
  'Genaue Lektüre',
  'Konkreter Bezug zum eigenen Webspecial',
  'Offene historische Einordnung',
  'Medienentscheidung und Deutung'
];

export function parseExamDossiers(paragraphs) {
  const starts = paragraphs.flatMap((line, i) => /^Prüfungsdossier\s+\d+\s*·/.test(line) ? [i] : []);
  if (!starts.length) throw Error('Keine nummerierten Prüfungsdossiers gefunden.');
  return starts.map((start, index) => {
    const block = paragraphs.slice(start, starts[index + 1]);
    const excerptStart = block.findIndex(line => line.startsWith('Zentrale Textstelle'));
    const excerptEnd = block.findIndex(line => line.endsWith('· Prüfungsaufträge'));
    const tasks = headings.map((heading, i) => {
      const prefix = (i + 1) + ' · ' + heading;
      return block.find(line => line.startsWith(prefix))?.slice(prefix.length).trim();
    });
    const dossier = {
      title: block[0],
      book: block[1],
      focus: block[2],
      excerpt: block.slice(excerptStart + 1, excerptEnd)
        .filter(line => !line.startsWith('BERLIN · THRILLER · WERKSTATT')).join('\n\n'),
      tasks
    };
    if (excerptStart < 0 || excerptEnd <= excerptStart || !validExamDossier(dossier)) {
      throw Error('Unvollständiges Dossier bei Eintrag ' + (index + 1) + '.');
    }
    return dossier;
  });
}

export function validExamDossier(dossier) {
  return Boolean(dossier && ['title', 'book', 'focus'].every(key =>
    typeof dossier[key] === 'string' && dossier[key].trim() && dossier[key].length <= 60000
  ) && (validEncryptedExcerpt(dossier.encryptedExcerpt) ||
  (typeof dossier.excerpt === 'string' && dossier.excerpt.trim() && dossier.excerpt.length <= 60000)) && Array.isArray(dossier.tasks) && dossier.tasks.length === 4 &&
    dossier.tasks.every(task => typeof task === 'string' && task.trim() && task.length <= 5000));
}

export { headings as examTaskHeadings };

export async function readExamDossiers(file) {
  if (!/\.docx$/i.test(file.name) || file.size > 10000000) throw Error('Bitte eine DOCX-Datei bis 10 MB wählen.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw Error('Ungültiges Word-Archiv.');
  let entry = view.getUint32(end + 16, true);
  const count = view.getUint16(end + 10, true);
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (entry + 46 > end || view.getUint32(entry, true) !== 0x02014b50) break;
    const nameLength = view.getUint16(entry + 28, true);
    const name = decoder.decode(bytes.subarray(entry + 46, entry + 46 + nameLength));
    if (name === 'word/document.xml') {
      const method = view.getUint16(entry + 10, true);
      const packedSize = view.getUint32(entry + 20, true);
      const size = view.getUint32(entry + 24, true);
      const local = view.getUint32(entry + 42, true);
      if (size > 2000000 || local + 30 > entry || view.getUint32(local, true) !== 0x04034b50) break;
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      if (start + packedSize > entry || ![0, 8].includes(method)) break;
      let stream = new Blob([bytes.subarray(start, start + packedSize)]).stream();
      if (method === 8) stream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
      const reader = stream.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > size) {
          await reader.cancel();
          throw Error('Ungültige Grösse des Word-Inhalts.');
        }
        chunks.push(value);
      }
      if (total !== size) throw Error('Unvollständiger Word-Inhalt.');
      const xml = new DOMParser().parseFromString(await new Blob(chunks).text(), 'application/xml');
      const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      return parseExamDossiers([...xml.getElementsByTagNameNS(ns, 'p')].map(paragraph =>
        [...paragraph.getElementsByTagNameNS(ns, 't')].map(text => text.textContent).join('').trim()
      ).filter(Boolean));
    }
    entry += 46 + nameLength + view.getUint16(entry + 30, true) + view.getUint16(entry + 32, true);
  }
  throw Error('Der Word-Inhalt konnte nicht gelesen werden.');
}

// Only link indicators directly elicited by these question types.
export const examTaskIndicators = [
  ['o1-1', 'o1-2'],
  ['o2-1', 'o2-2'],
  ['o1-3'],
  ['o2-3', 'o3-3']
];
