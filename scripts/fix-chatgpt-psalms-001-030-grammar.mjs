import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const response=await fetch('https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Psalms.json');
if(!response.ok) throw new Error(`KJV fetch failed: ${response.status}`);
const kjv=await response.json();
const chapters=new Map(kjv.chapters.map(ch=>[Number(ch.chapter),ch.verses]));
const pad=n=>String(n).padStart(3,'0');

const overrides=new Map(Object.entries({
  '2:12':'Kiss [bar—possibly “son” or “in purity”; wording uncertain], lest he be angry and you perish in the way, for his anger may quickly kindle. Blessed are all who take refuge in him.',
  '6:5':'For in death there is no remembrance of you; in Sheol who will give you thanks?',
  '8:4':'What is humanity, that you remember them, and a human being, that you attend to them?',
  '8:5':'Yet you have made humanity a little lower than the divine beings [elohim], and crowned them with glory and honor.',
  '9:17':'The wicked return to Sheol—all nations that forget God.',
  '16:10':'For you will not abandon my being to Sheol, nor let your faithful one see the Pit [or corruption].',
  '18:5':'The cords of Sheol surrounded me; the snares of death confronted me.',
  '18:33':'He makes my feet like the feet of a deer and sets me securely on my heights.',
  '22:16':'For dogs surround me; a band of evildoers encircles me; like a lion [at] my hands and my feet [textual reading disputed].',
  '22:21':'Save me from the lion’s mouth, and from the horns of the wild oxen—you have answered me.',
  '23:4':'Even though I walk through a valley of deep darkness, I fear no evil, for you are with me; your rod and your staff comfort me.',
  '29:6':'He makes Lebanon skip like a calf, and Sirion like a young wild ox.',
  '30:3':'YHWH, you brought my being up from Sheol; you kept me alive, away from those descending to the pit.'
}));

function conservativeRestore(text){
  return String(text)
    .replace(/\bJEHOVAH\b/g,'YHWH')
    .replace(/\bLORD\b/g,'YHWH')
    .replace(/\bGOD\b/g,'YHWH')
    .replace(/\bheathen\b/g,'nations').replace(/\bHeathen\b/g,'Nations')
    .replace(/\bungodly\b/g,'wicked').replace(/\bUngodly\b/g,'Wicked')
    .replace(/\bleasing\b/g,'falsehood').replace(/\bLeasing\b/g,'Falsehood')
    .replace(/\bbuckler\b/g,'shield').replace(/\bBuckler\b/g,'Shield')
    .replace(/\breins\b/g,'innermost being').replace(/\bReins\b/g,'Innermost being')
    .replace(/\bunicorns\b/g,'wild oxen').replace(/\bunicorn\b/g,'wild ox')
    .replace(/\bhinds’ feet\b/g,'deer’s feet').replace(/\bhinds' feet\b/g,'deer’s feet')
    .replace(/\bnigh\b/g,'near').replace(/\bNigh\b/g,'Near')
    .replace(/\s+/g,' ').trim();
}

function mystical(restored){
  if(/\b(enemy|enemies|destroy|slay|kill|sword|battle|war|arrows?|fire|wrath|perish)\b/i.test(restored)) return 'Contemplatively, this verse gives voice to the longing that violence, deceit, domination, and fear lose their power; it is not a directive against human enemies.';
  return restored
    .replace(/\bYHWH\b/g,'the Living Presence')
    .replace(/\bGod\b/g,'the Divine')
    .replace(/\bLord\b/g,'Holy Presence')
    .replace(/\bwicked\b/gi,'patterns rooted in harm')
    .replace(/\brighteous\b/gi,'aligned with truth')
    .replace(/\bsalvation\b/gi,'deliverance and wholeness')
    .replace(/\bmy soul\b/gi,'my whole being')
    .replace(/\bthe soul\b/gi,'the whole being')
    .replace(/\bZion\b/g,'Zion, the holy center')
    .replace(/\btemple\b/gi,'sanctuary');
}

for(let ch=1;ch<=30;ch+=1){
  const src=chapters.get(ch);
  const restoredPath=path.join(root,'scripture','psalms',`psalms-${pad(ch)}.json`);
  const mysticalPath=path.join(root,'scripture','psalms','mystical',`psalms-${pad(ch)}-mystical.json`);
  const doc=JSON.parse(fs.readFileSync(restoredPath,'utf8'));
  const myst=JSON.parse(fs.readFileSync(mysticalPath,'utf8'));
  for(const v of doc.verses){
    const kjvVerse=src.find(x=>Number(x.verse)===Number(v.verse));
    if(!kjvVerse) throw new Error(`Missing KJV Psalm ${ch}:${v.verse}`);
    v.restored=overrides.get(`${ch}:${v.verse}`)||conservativeRestore(kjvVerse.text);
  }
  for(const v of myst.verses){
    const restored=doc.verses.find(x=>Number(x.verse)===Number(v.verse))?.restored;
    if(!restored) throw new Error(`Missing restored Psalm ${ch}:${v.verse}`);
    v.mystical_translation=mystical(restored);
  }
  doc.translation_notes=[
    'This chapter expands corpus coverage while remaining explicitly pending a deeper Hebrew/source-witness audit. KJV is retained only as the familiar comparison layer.',
    'The completion draft intentionally preserves coherent traditional English syntax where a verse has not yet received a curated Hebrew-sensitive rendering; it does not mix archaic and modern grammar. Major identified lexical/textual issues receive explicit overrides and notes.'
  ];
  fs.writeFileSync(restoredPath,JSON.stringify(doc,null,2)+'\n');
  fs.writeFileSync(mysticalPath,JSON.stringify(myst,null,2)+'\n');
}
console.log('Corrected Psalms 1-30 to coherent conservative draft grammar while preserving curated source-sensitive overrides.');
