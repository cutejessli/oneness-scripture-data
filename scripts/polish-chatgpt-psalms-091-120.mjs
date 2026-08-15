import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pad=n=>String(n).padStart(3,'0');

for(let ch=91;ch<=120;ch++){
  const file=path.join(root,'scripture','psalms',`psalms-${pad(ch)}.json`);
  const doc=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const verse of doc.verses){
    if(ch===91 && verse.verse===4){
      verse.restored='He will cover you with his feathers, and under his wings you will take refuge; his faithfulness will be your shield and rampart.';
    }
  }
  fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n');
}
console.log('Polished Psalms 91-120 curated wording.');
