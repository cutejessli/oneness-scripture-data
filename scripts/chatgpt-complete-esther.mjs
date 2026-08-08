import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BOOK_ID = 'esther';
const BOOK = 'Esther';
const pad = (n) => String(n).padStart(3, '0');

const response = await fetch('https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Esther.json');
if (!response.ok) throw new Error(`KJV fetch failed: ${response.status}`);
const kjv = await response.json();
const chapters = new Map(kjv.chapters.map((ch) => [Number(ch.chapter), ch.verses]));

function modernize(text) {
  return String(text)
    .replace(/\bLORD\b/g, 'YHWH')
    .replace(/\bThou hast\b/g, 'You have').replace(/\bthou hast\b/g, 'you have')
    .replace(/\bThou art\b/g, 'You are').replace(/\bthou art\b/g, 'you are')
    .replace(/\bThou didst\b/g, 'You did').replace(/\bthou didst\b/g, 'you did')
    .replace(/\bThou shalt\b/g, 'You shall').replace(/\bthou shalt\b/g, 'you shall')
    .replace(/\bThou wilt\b/g, 'You will').replace(/\bthou wilt\b/g, 'you will')
    .replace(/\bThou\b/g, 'You').replace(/\bthou\b/g, 'you')
    .replace(/\bThee\b/g, 'You').replace(/\bthee\b/g, 'you')
    .replace(/\bThy\b/g, 'Your').replace(/\bthy\b/g, 'your')
    .replace(/\bThine\b/g, 'Your').replace(/\bthine\b/g, 'your')
    .replace(/\bYe\b/g, 'You').replace(/\bye\b/g, 'you')
    .replace(/\bHath\b/g, 'Has').replace(/\bhath\b/g, 'has')
    .replace(/\bDoth\b/g, 'Does').replace(/\bdoth\b/g, 'does')
    .replace(/\bDost\b/g, 'Do').replace(/\bdost\b/g, 'do')
    .replace(/\bDidst\b/g, 'Did').replace(/\bdidst\b/g, 'did')
    .replace(/\bArt\b/g, 'Are').replace(/\bart\b/g, 'are')
    .replace(/\bWast\b/g, 'Were').replace(/\bwast\b/g, 'were')
    .replace(/\bShalt\b/g, 'Shall').replace(/\bshalt\b/g, 'shall')
    .replace(/\bWilt\b/g, 'Will').replace(/\bwilt\b/g, 'will')
    .replace(/\bWouldest\b/g, 'Would').replace(/\bwouldest\b/g, 'would')
    .replace(/\bShouldest\b/g, 'Should').replace(/\bshouldest\b/g, 'should')
    .replace(/\bSpake\b/g, 'Spoke').replace(/\bspake\b/g, 'spoke')
    .replace(/\bShewed\b/g, 'Showed').replace(/\bshewed\b/g, 'showed')
    .replace(/\bShew\b/g, 'Show').replace(/\bshew\b/g, 'show')
    .replace(/\bunto\b/g, 'to').replace(/\bUnto\b/g, 'To')
    .replace(/\bthereof\b/g, 'of it').replace(/\bThereof\b/g, 'Of it')
    .replace(/\bwherein\b/g, 'in which').replace(/\bWherein\b/g, 'In which')
    .replace(/\bwhereof\b/g, 'of which').replace(/\bWhereof\b/g, 'Of which')
    .replace(/\bwhosoever\b/g, 'whoever').replace(/\bWhosoever\b/g, 'Whoever')
    .replace(/\bwhithersoever\b/g, 'wherever').replace(/\bWhithersoever\b/g, 'Wherever')
    .replace(/\bwhatsoever\b/g, 'whatever').replace(/\bWhatsoever\b/g, 'Whatever')
    .replace(/\bbrethren\b/g, 'brothers').replace(/\bBrethren\b/g, 'Brothers')
    .replace(/\bhearken\b/g, 'listen').replace(/\bHearken\b/g, 'Listen')
    .replace(/\bwroth\b/g, 'angry').replace(/\bWroth\b/g, 'Angry')
    .replace(/\bavaileth\b/g, 'avails')
    .replace(/\bstandeth\b/g, 'stands')
    .replace(/\bsitteth\b/g, 'sits')
    .replace(/\bseeketh\b/g, 'seeks')
    .replace(/\bthinketh\b/g, 'thinks')
    .replace(/\bwaxed\b/g, 'grew')
    .replace(/\bnigh\b/g, 'near')
    .replace(/\bfourscore\b/g, 'eighty')
    .replace(/\bthreescore\b/g, 'sixty')
    .replace(/\ban hundred\b/g, 'one hundred')
    .replace(/\ba hundred\b/g, 'one hundred')
    .replace(/\s+/g, ' ').trim();
}

const meta = {
  1: {review:'Reviewed for imperial spectacle, alcohol, Vashti’s refusal, royal anger, legal bureaucracy, and the decree of male household rule.', safety:'Vashti’s refusal is not a moral failure and the empire’s response is not a mandate for male domination. The chapter depicts patriarchal coercion and political overreaction; it must not be used to justify abuse, forced sexual display, or control of women.', note:'A refusal inside a palace exposes how fragile domination can be when one person declines to perform for power.'},
  2: {review:'Reviewed for forced gathering of young women, harem structures, Esther/Hadassah’s orphanhood, concealment of Jewish identity, royal sexual power, favor, queenship, and the assassination plot.', safety:'The royal search for women occurs inside an imperial system with severe power imbalance and likely constrained consent. Do not romanticize the harem process or use Esther’s survival within it to erase coercion, sexual vulnerability, or the limited choices of unnamed women.', note:'Esther’s agency grows inside conditions she did not design; survival, concealment, relationship, and timing all become forms of navigation.'},
  3: {review:'Reviewed for Haman’s promotion, Mordecai’s refusal, ethnic generalization, genocidal intent, Pur casting, bribery, imperial decree, targeting of children and women, and state bureaucracy.', safety:'This chapter describes an explicit genocidal program. It must never be used to target any living ethnicity, nationality, religion, or political group. “Agagite” and other ancient labels are not codes for modern enemies.', note:'Genocide begins before killing: wounded ego becomes stereotype, stereotype becomes policy, and policy becomes paperwork.'},
  4: {review:'Reviewed for communal mourning, decree transmission, Esther’s constrained access to the king, Mordecai’s pressure, “such a time as this,” fasting, risk, and Esther’s decision to act.', safety:'Esther faces lethal constraints. “For such a time as this” must not become victim-blaming or a demand that endangered people sacrifice themselves. Courage here is meaningful precisely because the danger is real and the choice is costly.', note:'Courage is not the absence of fear; it is a decision formed in community, grief, fasting, and the knowledge that no outcome is guaranteed.'},
  5: {review:'Reviewed for Esther’s unsummoned approach, royal favor, strategic banquets, Haman’s entitlement and rage, status obsession, and the construction of a killing stake/gallows for Mordecai.', safety:'The chapter’s court intrigue and planned execution are descriptive. Political access, beauty, status, and violence are not presented here as reliable measures of moral worth.', note:'Esther changes the field without revealing everything at once; timing can be a form of wisdom when direct power is unequal.'},
  6: {review:'Reviewed for royal insomnia, archival memory, delayed recognition of Mordecai, Haman’s self-centered assumptions, public honor, humiliation, and reversal.', safety:'Public humiliation is part of the story’s reversal structure but should not be treated as an ethical ideal. The text exposes unstable status systems rather than offering a model for shaming enemies.', note:'A forgotten act returns through memory, and the machinery of ego is forced to honor the person it intended to destroy.'},
  7: {review:'Reviewed for Esther naming the genocidal threat, Haman’s exposure, ambiguous couch scene, royal rage, execution on Haman’s own structure, and narrative reversal.', safety:'Haman’s execution is a court killing, not a template for righteous revenge. The scene involving Esther’s couch is politically charged and must not be used to minimize sexual danger or assume guilt from physical proximity alone.', note:'Truth enters the banquet at the moment Esther names both the threat and the person who engineered it.'},
  8: {review:'Reviewed for transfer of property and authority, Esther’s continuing plea, the irreversible-decree problem, the counter-decree, self-defense language, violence against attackers including women and children in the KJV wording, and public rejoicing.', safety:'The counter-decree contains extreme retaliatory language. Survival under genocidal threat does not create a timeless authorization to kill families, seize property, or label modern populations as enemies. Distinguish self-defense from vengeance and imperial permission from moral endorsement.', note:'Reversal does not erase the first decree; survival requires confronting structures that cannot simply be wished away.'},
  9: {review:'Reviewed for armed defense, mass killing, Haman’s sons, Esther’s request for a second day in Susa, casualty figures, refusal of plunder, rest, feasting, gifts to the poor, and establishment of Purim.', safety:'This chapter contains mass violence and very large casualty claims. It must not be celebrated as permission for ethnic revenge, genocide, terrorism, collective punishment, or modern enemy-mapping. The refusal of plunder and the later turn toward feasting, mutual gifts, and gifts to the poor are important internal contrasts.', note:'A community turns threatened annihilation into memory and festival, but the violent road to survival remains morally difficult and should not be romanticized.'},
  10:{review:'Reviewed for imperial taxation, Mordecai’s elevation, official chronicles, public reputation, advocacy for his people, and peace language.', safety:'Mordecai’s proximity to imperial power is not proof that empire itself is just. Political influence should be evaluated by whom it protects and whether it serves peace rather than domination.', note:'The story closes not with withdrawal from power but with the question of how influence can be used for a people’s welfare and for peace.'}
};

function tags(ch,v){
  if(ch===1) return v>=10?['vashti','patriarchy','imperial-power']:['empire','banquet','royal-power'];
  if(ch===2) return v<=18?['esther','imperial-power','gender']:['mordecai','court','hidden-identity'];
  if(ch===3) return v<=5?['mordecai','haman','court']:['genocide','ethnic-hatred','imperial-power'];
  if(ch===4) return ['esther','courage','genocide-threat'];
  if(ch===5) return v<=8?['esther','strategy','court']:['haman','ego','violence'];
  if(ch===6) return ['reversal','memory','status'];
  if(ch===7) return ['esther','exposure','reversal'];
  if(ch===8) return v<=10?['esther','mordecai','imperial-law']:['self-defense','violence','reversal'];
  if(ch===9) return v<=16?['violence','self-defense','reception-risk']:['purim','memory','community'];
  return ['mordecai','political-power','peace'];
}

function flags(ch,v){
  const out=[];
  if(ch===1&&v>=10) out.push('patriarchal-coercion-audit');
  if(ch===2&&v<=18) out.push('sexual-power-and-consent-audit');
  if(ch===3&&v>=6) out.push('genocide-and-ethnic-hatred-safeguard');
  if(ch===4&&(v===13||v===14)) out.push('anti-victim-blaming-safeguard');
  if(ch===5&&v===14) out.push('execution-violence-audit');
  if(ch===7&&v>=8) out.push('execution-violence-audit');
  if(ch===8&&v>=11) out.push('retaliatory-violence-and-collective-punishment-audit');
  if(ch===9&&v<=16) out.push('mass-violence-and-genocide-reception-safeguard');
  return out;
}

function notes(ch,v){
  const map={
    '1:12':{title:'Vashti refuses',body:'The narrative reports Vashti’s refusal without giving her motive. Later claims that she endangered all male authority come from the king’s advisers, not from a neutral narrator.'},
    '2:7':{title:'Hadassah / Esther',body:'The Hebrew text gives her Jewish name Hadassah and her court name Esther. Her double naming fits the book’s larger pattern of hidden and public identity.'},
    '2:14':{title:'Royal harem structure',body:'The women move through a controlled imperial household with sharply unequal power. The passage should not be romanticized as an ordinary beauty contest.'},
    '3:6':{title:'From one man to a people',body:'Haman’s anger expands from Mordecai to an entire people. The verse exposes the genocidal move from personal grievance to collective targeting.'},
    '4:14':{title:'For such a time as this',body:'The line is a question about possibility and responsibility under crisis, not proof that every danger was divinely scripted or that threatened people are obligated to sacrifice themselves.'},
    '5:14':{title:'Gallows / stake',body:'The underlying Hebrew uses ʿets, “tree/wood,” and the exact execution structure is debated. “Gallows” is traditional English; stake or wooden structure may better fit Persian execution practices.'},
    '8:11':{title:'Counter-decree violence',body:'The wording grants sweeping retaliatory power. Its presence in the story does not settle the ethical distinction between self-defense and revenge.'},
    '9:16':{title:'Seventy-five thousand',body:'The very large casualty figure belongs to the received narrative and should be preserved while remaining open to historical and textual scrutiny. It is not a moral target or ideal.'},
    '9:22':{title:'Gifts to the poor',body:'Purim memory is redirected into feasting, mutual gifts, and material generosity toward people in need.'}
  };
  return map[`${ch}:${v}`]?[map[`${ch}:${v}`]]:[];
}

function terms(ch,v){
  const map={
    '2:7':[{display:'Hadassah',source:'Hadassah',language:'Hebrew',glossary_id:'hadassah'}],
    '3:7':[{display:'Pur / lot',source:'pur',language:'Hebrew',glossary_id:'pur'}],
    '5:14':[{display:'wooden structure / stake',source:'ets',language:'Hebrew',glossary_id:'ets'}],
    '7:9':[{display:'wooden structure / stake',source:'ets',language:'Hebrew',glossary_id:'ets'}],
    '9:24':[{display:'Pur / lot',source:'pur',language:'Hebrew',glossary_id:'pur'}],
    '9:26':[{display:'Purim',source:'purim',language:'Hebrew',glossary_id:'purim'}]
  };
  return map[`${ch}:${v}`]||[];
}

function crossRefs(ch,v){
  if(ch===3&&v>=6) return [{reference:'Esther 8:3-14',relationship:'reversal'}];
  if(ch===4&&v===14) return [{reference:'Esther 2:17',relationship:'narrative-connection'}];
  if(ch===5&&v===14) return [{reference:'Esther 7:9-10',relationship:'reversal'}];
  if(ch===8&&v>=11) return [{reference:'Esther 3:12-15',relationship:'counter-decree'}];
  if(ch===9&&v>=20) return [{reference:'Esther 3:7',relationship:'purim-origin'}];
  return [];
}

function mystical(ch,v){
  if(ch===1){if(v<=9)return 'Empire displays abundance as proof of greatness, yet spectacle cannot measure the freedom or dignity of the people inside it.';if(v<=12)return 'A woman’s refusal interrupts the performance expected by power and reveals that consent cannot be manufactured by command.';return 'Insecure authority turns one refusal into a crisis of control, multiplying private anger into public law.';}
  if(ch===2){if(v<=4)return 'A palace solves one woman’s refusal by gathering many more women into the machinery of royal desire; beauty and power remain unequal currencies.';if(v<=11)return 'Hadassah becomes Esther, carrying hidden identity and chosen relationship into a system she did not create.';if(v<=18)return 'Esther learns how to move with restraint inside the court, receiving favor without confusing favor with freedom.';return 'Small acts of attention and truthful reporting are stored in memory long before anyone knows what they will become.';}
  if(ch===3){if(v<=5)return 'Entitlement cannot tolerate a person who refuses to bow, and wounded status begins searching for a larger target.';if(v<=9)return 'Genocidal imagination turns difference into danger and prejudice into a financial and administrative proposal.';if(v<=14)return 'Once hatred receives a seal, clerks, languages, couriers, and institutions can make violence frighteningly efficient.';return 'The rulers drink while the city is bewildered: bureaucracy can normalize horror for those farthest from its consequences.';}
  if(ch===4){if(v<=4)return 'Grief refuses to dress itself for the palace; mourning makes the hidden threat visible in public space.';if(v<=9)return 'Information travels through trusted relationships until the person with access can see the danger clearly.';if(v<=14)return 'Privilege cannot guarantee escape from a threat aimed at identity, yet responsibility must still be chosen rather than imposed.';return 'Esther gathers community around the risk, then chooses to act without certainty of survival.';}
  if(ch===5){if(v<=3)return 'Courage enters the room before the request is spoken; the first threshold is simply becoming visible to power.';if(v<=8)return 'Esther does not rush disclosure. She changes the conditions of the conversation through patience and deliberate timing.';if(v<=13)return 'Haman possesses wealth, children, rank, and access, yet one unbowed person is enough to expose the emptiness of status hunger.';return 'When resentment is fed by a circle of approval, imagination turns quickly toward spectacular violence.';}
  if(ch===6){if(v<=3)return 'What power forgot remains written, and delayed recognition returns through an ordinary sleepless night.';if(v<=9)return 'Ego interprets every question as being about itself and unknowingly designs honor for the person it despises.';if(v<=11)return 'The intended humiliator becomes the herald of another’s honor; reversal exposes the instability of status.';return 'Humiliation sends Haman home, where even his advisers recognize that the pattern he tried to control is moving beyond him.';}
  if(ch===7){if(v<=4)return 'Esther finally names the stakes: her own life cannot be separated from the threatened life of her people.';if(v<=6)return 'Truth becomes specific when the system, the crime, and the architect of harm are named in the same room.';if(v<=8)return 'The exposed powerful person suddenly pleads for the mercy he was unwilling to extend to others.';return 'The instrument prepared for another becomes part of Haman’s own death; narrative reversal is vivid, but violence still remains violence.';}
  if(ch===8){if(v<=4)return 'Removing one architect of harm does not automatically dismantle the decree he set in motion.';if(v<=8)return 'Esther continues pleading because survival requires structural change, not merely personal victory.';if(v<=14)return 'An empire that claims its words cannot be revoked answers a death decree with another decree of force; law becomes a battleground for survival.';return 'Relief spreads through public symbols and communal joy, even while fear remains part of the political reversal.';}
  if(ch===9){if(v<=4)return 'The appointed day arrives, and power has shifted toward the people who were marked for destruction.';if(v<=10)return 'Self-defense and vengeance become difficult to separate once mass killing begins; the text preserves the violence without making it a timeless command.';if(v<=16)return 'The casualty counts grow and a second day of violence is authorized in Susa; survival memory here carries a morally heavy shadow.';if(v<=22)return 'After violence, the community turns toward rest, feasting, shared portions, and gifts to the poor—life becomes the form of remembrance.';return 'Purim transforms a cast lot meant for annihilation into an annual refusal to let threatened memory disappear.';}
  return 'Political influence is judged not by nearness to the throne but by whether it seeks a people’s well-being and speaks peace.';
}

const bookDir=path.join(root,'scripture',BOOK_ID);
const mysticalDir=path.join(bookDir,'mystical');
fs.mkdirSync(mysticalDir,{recursive:true});

for(let ch=1;ch<=10;ch+=1){
  const src=chapters.get(ch);
  if(!src?.length) throw new Error(`Missing Esther ${ch}`);
  const m=meta[ch];
  const verses=src.map(v=>{
    const n=Number(v.verse);
    return {verse:n,restored:modernize(v.text),familiar:{source:'KJV',text:v.text},notes:notes(ch,n),terms:terms(ch,n),tags:tags(ch,n),cross_references:crossRefs(ch,n),editorial_flags:flags(ch,n)};
  });
  const restored={
    book:BOOK,book_id:BOOK_ID,chapter:ch,
    audit_status:{status:'draft-pending-deep-source-audit',source_base:'ChatGPT-authored completion draft using public-domain KJV as familiar alignment scaffold; Hebrew/source-witness audit pending',review_note:m.review},
    verses,
    translation_notes:['This chapter completes corpus coverage but remains explicitly pending the later deep Hebrew/source-witness continuity audit. KJV is retained only as the familiar comparison layer.'],
    safety_note:m.safety,
    source_witness_audit_flags:['Compare directly with WLC/OSHB, Septuagint additions/traditions where relevant to Esther reception history, and other textual witnesses during the global audit. Canonical Hebrew Esther is kept distinct from later Greek additions.'],
    layer_status:{restored:true,familiar:'complete-KJV',verse_notes:'selective',source_terms:'selective-pending-deep-audit',tags:'baseline',cross_references:'selective',editorial_flags:'baseline',mystical_companion:'separate-file',modern_comparison:'pending-reference-backfill',original_language:'pending-reference-backfill'},
    generation_status:{status:'chatgpt-authored-completion-draft',intelligence:'ChatGPT conversation',external_ai_runner:false,continuity_audit:'pending-global-pass'}
  };
  const myst={book:BOOK,book_id:BOOK_ID,chapter:ch,layer:'mystical-companion',verses:src.map(v=>({verse:Number(v.verse),mystical_translation:mystical(ch,Number(v.verse))})),contemplative_note:m.note,safety_note:m.safety,generation_status:{status:'chatgpt-authored-contemplative-draft',aligned_to_restored_chapter:true,continuity_audit:'pending-global-pass'}};
  fs.writeFileSync(path.join(bookDir,`${BOOK_ID}-${pad(ch)}.json`),JSON.stringify(restored,null,2)+'\n');
  fs.writeFileSync(path.join(mysticalDir,`${BOOK_ID}-${pad(ch)}-mystical.json`),JSON.stringify(myst,null,2)+'\n');
  console.log(`Prepared Esther ${ch}: ${verses.length} verses`);
}

fs.writeFileSync(path.join(root,'metadata','esther-progress.json'),JSON.stringify({book:BOOK,book_id:BOOK_ID,total_chapters:10,restored_chapters:10,mystical_chapters:10,complete:true,status:'complete-draft-with-mystical-companions-pending-global-source-audit',generation_model:'ChatGPT conversation',continuity_audit:'pending-global-pass'},null,2)+'\n');
