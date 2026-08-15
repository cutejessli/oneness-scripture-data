import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pad=n=>String(n).padStart(3,'0');
const violence=/\b(?:enemy|enemies|destroy|destroys|destroyed|slay|slays|slain|kill|kills|killed|blood|bloodshed|sword|swords|battle|battles|war|wars|smite|smites|smitten|vengeance|violent|violence|weapon|weapons|spear|spears|arrow|arrows)\b|break(?:s|ing)?\s+(?:their\s+)?teeth|dash(?:ed|es|ing)?\s+.*pieces/i;
const kingship=/\b(?:king|kings|kingdom|throne|sceptre|scepter)\b/i;

for(let ch=31;ch<=60;ch++){
  const file=path.join(root,'scripture','psalms',`psalms-${pad(ch)}.json`);
  const doc=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const verse of doc.verses){
    const text=String(verse.restored||'');
    verse.tags=(verse.tags||[]).filter(x=>x!=='violence-war'&&x!=='kingship');
    verse.editorial_flags=(verse.editorial_flags||[]).filter(x=>x!=='poetic-violence-description-not-modern-authorization');
    if(violence.test(text)){
      verse.tags.push('violence-war');
      verse.editorial_flags.push('poetic-violence-description-not-modern-authorization');
    }
    if(kingship.test(text)) verse.tags.push('kingship');
    verse.tags=[...new Set(verse.tags)];
    verse.editorial_flags=[...new Set(verse.editorial_flags)];
  }
  fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n');
}
console.log('Polished Psalms 31-60 violence and kingship tags with word-boundary matching.');
