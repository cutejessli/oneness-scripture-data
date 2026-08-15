import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pad=n=>String(n).padStart(3,'0');
const violence=/\b(enemy|enemies|destroy|slay|kill|sword|battle|war|arrows?|fire|wrath|perish|smite|smote|consume|cut off)\b|\bbreak them\b|\bdash them\b/i;
const ancientTarget=/\b(nation|nations|enemy|enemies|heathen)\b/i;

for(let ch=1;ch<=30;ch+=1){
  const rp=path.join(root,'scripture','psalms',`psalms-${pad(ch)}.json`);
  const mp=path.join(root,'scripture','psalms','mystical',`psalms-${pad(ch)}-mystical.json`);
  const doc=JSON.parse(fs.readFileSync(rp,'utf8'));
  const myst=JSON.parse(fs.readFileSync(mp,'utf8'));
  for(const v of doc.verses){
    v.restored=String(v.restored).replace(/\bthe YHWH\b/g,'YHWH').replace(/\bThe YHWH\b/g,'YHWH');
    v.tags=Array.isArray(v.tags)?v.tags:[];
    v.editorial_flags=Array.isArray(v.editorial_flags)?v.editorial_flags:[];
    if(violence.test(v.restored)){
      if(!v.tags.includes('violence-war')) v.tags.push('violence-war');
      if(!v.editorial_flags.includes('poetic-violence-description-not-modern-authorization')) v.editorial_flags.push('poetic-violence-description-not-modern-authorization');
    }
    if(ancientTarget.test(v.restored)&&!v.editorial_flags.includes('ancient-enemy-language-not-modern-target')) v.editorial_flags.push('ancient-enemy-language-not-modern-target');
  }
  for(const mv of myst.verses){
    const restored=doc.verses.find(v=>Number(v.verse)===Number(mv.verse))?.restored||'';
    if(violence.test(restored)){
      mv.mystical_translation='Contemplatively, this verse gives voice to the longing that violence, deceit, domination, and fear lose their power; it is not a directive against human enemies.';
    }else{
      mv.mystical_translation=String(mv.mystical_translation).replace(/\bthe the Living Presence\b/g,'the Living Presence').replace(/\bThe the Living Presence\b/g,'the Living Presence');
    }
  }
  fs.writeFileSync(rp,JSON.stringify(doc,null,2)+'\n');
  fs.writeFileSync(mp,JSON.stringify(myst,null,2)+'\n');
}
console.log('Polished Psalms 1-30 divine-name grammar and broadened poetic-violence safeguards.');
