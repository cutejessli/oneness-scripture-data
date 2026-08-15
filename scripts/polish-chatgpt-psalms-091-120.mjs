import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pad=n=>String(n).padStart(3,'0');
const stanzaLabels=['ALEPH','BETH','GIMEL','DALETH','HE','WAW','ZAYIN','HETH','TETH','YOD','KAPH','LAMED','MEM','NUN','SAMEKH','AYIN','PE','TSADHE','QOPH','RESH','SHIN','TAU'];
const stanzaTail=new RegExp(`\\s+(?:${stanzaLabels.join('|')})$`);

for(let ch=91;ch<=120;ch++){
  const file=path.join(root,'scripture','psalms',`psalms-${pad(ch)}.json`);
  const doc=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const verse of doc.verses){
    if(ch===91 && verse.verse===4){
      verse.restored='He will cover you with his feathers, and under his wings you will take refuge; his faithfulness will be your shield and rampart.';
    }
    if(ch===109 && verse.verse===6){
      verse.restored='Set a wicked person over him, and let an accuser stand at his right hand.';
      verse.notes=verse.notes||[];
      if(!verse.notes.some(n=>n.title==='Satan / accuser')) verse.notes.push({title:'Satan / accuser',body:'Hebrew satan here is a common noun meaning adversary or accuser, not necessarily the later proper-name figure “Satan.” The restored wording keeps the lexical sense visible.'});
      verse.terms=verse.terms||[];
      if(!verse.terms.some(t=>t.glossary_id==='satan-accuser')) verse.terms.push({display:'accuser / adversary',source:'שָׂטָן',language:'Hebrew',glossary_id:'satan-accuser'});
    }
    if(ch===110 && [5,6].includes(verse.verse)){
      verse.editorial_flags=[...new Set([...(verse.editorial_flags||[]),'poetic-violence-description-not-modern-authorization','leader-accountability-no-sacred-immunity'])];
      verse.tags=[...new Set([...(verse.tags||[]),'violence-war'])];
    }
    if(ch===119 && verse.modern?.text){
      verse.modern.text=verse.modern.text.replace(stanzaTail,'').trim();
    }
  }
  fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n');
}
console.log('Polished Psalms 91-120 curated wording, Psalm 109 accuser terminology, Psalm 110 violence flags, and Psalm 119 BSB stanza-marker cleanup.');
