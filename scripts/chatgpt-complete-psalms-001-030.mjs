import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BOOK_ID = 'psalms';
const BOOK = 'Psalms';
const START = 1;
const END = 30;
const pad = (n) => String(n).padStart(3, '0');

const response = await fetch('https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Psalms.json');
if (!response.ok) throw new Error(`KJV fetch failed: ${response.status}`);
const kjv = await response.json();
const chapters = new Map(kjv.chapters.map((ch) => [Number(ch.chapter), ch.verses]));

function modernize(text) {
  return String(text)
    .replace(/\bJEHOVAH\b/g, 'YHWH')
    .replace(/\bLORD\b/g, 'YHWH')
    .replace(/\bGOD\b/g, 'YHWH')
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
    .replace(/\bwhatsoever\b/g, 'whatever').replace(/\bWhatsoever\b/g, 'Whatever')
    .replace(/\bhearken\b/g, 'listen').replace(/\bHearken\b/g, 'Listen')
    .replace(/\bnigh\b/g, 'near').replace(/\bNigh\b/g, 'Near')
    .replace(/\bperadventure\b/g, 'perhaps')
    .replace(/\bheathen\b/g, 'nations').replace(/\bHeathen\b/g, 'Nations')
    .replace(/\bungodly\b/g, 'wicked').replace(/\bUngodly\b/g, 'Wicked')
    .replace(/\bleasing\b/g, 'falsehood').replace(/\bLeasing\b/g, 'Falsehood')
    .replace(/\bbuckler\b/g, 'shield').replace(/\bBuckler\b/g, 'Shield')
    .replace(/\breins\b/g, 'innermost being').replace(/\bReins\b/g, 'Innermost being')
    .replace(/\bunicorns\b/g, 'wild oxen').replace(/\bunicorn\b/g, 'wild ox')
    .replace(/\bhinds’ feet\b/g, 'deer’s feet').replace(/\bhinds' feet\b/g, 'deer’s feet')
    .replace(/\bsepulchre\b/g, 'grave').replace(/\bSepulchre\b/g, 'Grave')
    .replace(/\bsaith\b/g, 'says').replace(/\bSaith\b/g, 'Says')
    .replace(/\bsitteth\b/g, 'sits').replace(/\bstandeth\b/g, 'stands')
    .replace(/\bseeketh\b/g, 'seeks').replace(/\bmaketh\b/g, 'makes')
    .replace(/\bbringeth\b/g, 'brings').replace(/\bgiveth\b/g, 'gives')
    .replace(/\bknoweth\b/g, 'knows').replace(/\bloveth\b/g, 'loves')
    .replace(/\bhateth\b/g, 'hates').replace(/\bkeepeth\b/g, 'keeps')
    .replace(/\bpreserveth\b/g, 'preserves').replace(/\bheareth\b/g, 'hears')
    .replace(/\bwalketh\b/g, 'walks').replace(/\bmeditateth\b/g, 'meditates')
    .replace(/\s+/g, ' ').trim();
}

const overrides = new Map(Object.entries({
  '2:12': 'Kiss [bar—possibly “son” or “in purity”; wording uncertain], lest he be angry and you perish in the way, for his anger may quickly kindle. Blessed are all who take refuge in him.',
  '6:5': 'For in death there is no remembrance of you; in Sheol who will give you thanks?',
  '8:4': 'What is humanity, that you remember them, and a human being, that you attend to them?',
  '8:5': 'Yet you have made humanity a little lower than the divine beings [elohim], and crowned them with glory and honor.',
  '9:17': 'The wicked return to Sheol—all nations that forget God.',
  '16:10': 'For you will not abandon my being to Sheol, nor let your faithful one see the Pit [or corruption].',
  '18:5': 'The cords of Sheol surrounded me; the snares of death confronted me.',
  '18:33': 'He makes my feet like the feet of a deer and sets me securely on my heights.',
  '22:16': 'For dogs surround me; a band of evildoers encircles me; like a lion [at] my hands and my feet [textual reading disputed].',
  '22:21': 'Save me from the lion’s mouth, and from the horns of the wild oxen—you have answered me.',
  '23:4': 'Even though I walk through a valley of deep darkness, I fear no evil, for you are with me; your rod and your staff comfort me.',
  '29:6': 'He makes Lebanon skip like a calf, and Sirion like a young wild ox.',
  '30:3': 'YHWH, you brought my being up from Sheol; you kept me alive, away from those descending to the pit.'
}));

const specialNotes = {
  '2:12': {title:'Bar in Psalm 2:12',body:'The phrase traditionally rendered “Kiss the Son” is unusually difficult. Hebrew/Aramaic bar can be read in more than one way, and ancient/modern witnesses and translators diverge. The restored line leaves the uncertainty visible rather than forcing a single christological reading.'},
  '8:5': {title:'Elohim: God or divine beings',body:'Hebrew elohim can refer to God or divine beings. The Greek tradition renders “angels,” a reading later cited in Hebrews 2. The restored text keeps the Hebrew semantic range visible.'},
  '9:1': {title:'Psalm 9–10 acrostic relationship',body:'Psalms 9 and 10 show complementary portions of an alphabetic acrostic and are combined as one psalm in some ancient traditions. Their separation in the Hebrew/KJV numbering is preserved here.'},
  '10:1': {title:'Psalm 9–10 acrostic relationship',body:'Psalm 10 continues patterns begun in Psalm 9 and is joined to it in some ancient traditions. The project preserves received Hebrew/KJV chapter numbering while flagging the literary relationship.'},
  '16:10': {title:'Sheol and shachat',body:'Sheol names the realm of the dead. The final noun may be read as “pit” or, in some reception traditions, “corruption/decay.” The verse should not be flattened into a later doctrinal reading without noting the Hebrew ambiguity.'},
  '18:1': {title:'Parallel song',body:'Psalm 18 has a close parallel in 2 Samuel 22. Differences between the two forms are textual evidence and should be preserved rather than harmonized.'},
  '22:16': {title:'Hands and feet textual variant',body:'The Masoretic wording is commonly read “like a lion [at] my hands and feet,” while other witnesses and reconstructions support a verb interpreted as “dug/pierced.” This is a major textual variant and must remain visible.'},
  '23:4': {title:'Tsalmavet',body:'The Hebrew tsalmavet is traditionally “shadow of death” but is widely understood as “deep darkness” or “gloom.” The restored text uses “deep darkness” while retaining the traditional reading in comparison layers.'},
  '29:6': {title:'Re’em and Sirion',body:'Re’em is a wild ox, not the mythical unicorn of later English tradition. Sirion is an ancient name for Mount Hermon.'}
};

const chapterMeta = {
  1:['Two ways, Torah meditation, tree imagery, judgment, and prosperity language.','Faithfulness is not a guarantee of wealth, health, or easy outcomes; “prosper” is poetic wisdom, not a prosperity formula.','Rooted attention reshapes a life slowly, like water feeding a tree.'],
  2:['Royal rebellion, YHWH’s anointed, Zion kingship, nations, wrath, and iron-rod imagery.','Ancient royal and conquest poetry is not authorization for theocracy, imperialism, nationalism, collective punishment, or violence against modern nations.','Power is accountable to a horizon larger than itself; refuge matters more than domination.'],
  3:['Threat, fear, sleep, protection, enemy violence, and deliverance.','Enemy language belongs to a personal lament and must not be mapped onto living groups. Violent imagery is prayer-poetry, not a directive to attack people.','Even under pressure, the body can sleep when trust becomes a shield.'],
  4:['Distress, truth, inner reflection, sacrifice, joy, and peaceful sleep.','The psalm invites self-examination and trust; it does not justify shaming people in distress or claiming safety is guaranteed.','Stillness makes room for truth that noise can hide.'],
  5:['Morning prayer, deceit, bloodshed, judgment, worship, and protection.','Requests for an enemy’s downfall are lament language, not permission for personal retaliation or sacred violence.','Bring the first words of the day toward truth rather than toward the machinery of fear.'],
  6:['Illness, fear, grief, tears, death, prayer, and enemies.','Illness and emotional suffering are not evidence of divine punishment, weak faith, or moral failure.','Tears themselves become a form of prayer when speech is exhausted.'],
  7:['Accusation, self-examination, judgment, weapons, and reversal of violence.','Judgment imagery must not authorize vigilante violence; the psalmist also submits their own conduct to examination.','Ask for justice while remaining willing to be examined by the same truth you invoke.'],
  8:['Creation, human dignity, elohim, dominion, animals, sea, and cosmic praise.','Human “dominion” is not a license for ecological exploitation, cruelty, or claims of superiority over vulnerable people.','Human dignity is held inside wonder, not above the living world.'],
  9:['Praise, judgment, nations, bloodshed, oppressed people, Sheol, and acrostic structure.','Ancient nation-language cannot be transferred to modern ethnic or religious targets. Divine judgment is not human permission for collective punishment.','The cry of the oppressed is not forgotten even when empires behave as though it is.'],
  10:['Divine hiddenness, predatory power, poor and vulnerable people, violence, and justice.','The psalm describes predatory abuse of the poor; it should strengthen protection of vulnerable people, not stigmatize poverty.','The prayer names systems of predation clearly and refuses to let hidden harm remain invisible.'],
  11:['Refuge, social foundations, violence, testing, fire, and justice.','Fire-and-brimstone imagery is poetic judgment language, not an instruction for violence or a basis for disaster moralization.','When foundations feel unstable, refuge is not denial; it is a place from which to see clearly.'],
  12:['Deception, speech, oppression of the poor, pure words, and social corruption.','The text condemns exploitation and manipulative speech; it must not be weaponized to silence disagreement or vulnerable speakers.','Words can either manufacture domination or become shelter for people pushed aside.'],
  13:['Abandonment, sorrow, enemy pressure, trust, and song.','Feeling forgotten by God is allowed inside scripture and should never be treated as spiritual failure or grounds for self-harm.','Lament can hold despair and trust in the same breath.'],
  14:['Corruption, practical atheism, universal moral failure, exploitation of the poor, and Zion hope.','“The fool says…there is no God” must not be used to demean atheists or justify persecution; the psalm’s critique centers corrupt conduct and exploitation.','The deepest folly is a life organized as though no one else’s dignity matters.'],
  15:['Sacred space, integrity, truthful speech, neighbor ethics, oaths, lending, and bribery.','This ethical portrait is aspirational, not a purity test for excluding people from community or worship.','Sacredness is measured through ordinary honesty, neighbor-love, and resistance to corruption.'],
  16:['Refuge, other gods, inheritance, counsel, joy, Sheol, and path of life.','Afterlife language and “other gods” language should be translated historically and not used to persecute other religions or spiritual practices.','The path of life is pictured as presence, counsel, belonging, and joy rather than fear.'],
  17:['Vindication, hidden scrutiny, protection, violent enemies, wealth, and awakening.','Enemy imagery remains prayer-poetry; neither wealth nor poverty is proof of moral standing.','To ask for vindication is also to invite the heart to be searched in the night.'],
  18:['Deliverance song, cosmic theophany, warfare, kingship, enemies, and the 2 Samuel 22 parallel.','This royal war song cannot authorize holy war, nationalism, torture, domination, or modern enemy-mapping. Preserve its violence without endorsing it.','The poem magnifies rescue through storm and battle imagery while still locating strength beyond the warrior.'],
  19:['Creation, cosmic speech, Torah, wisdom, hidden faults, and speech ethics.','Creation poetry is theological poetry, not a scientific textbook; Torah praise must not become coercive religious control.','The heavens and the inner voice become two kinds of testimony, both inviting humility.'],
  20:['Trouble, sanctuary, offerings, king, chariots, horses, and military trust.','Royal military prayer is not an endorsement of nationalism or war; the psalm explicitly relativizes weapons and military power.','What a community trusts in reveals more than the banners it raises.'],
  21:['Royal victory, crown, enemies, fire, descendants, and arrows.','The destruction of enemies and their descendants is ancient royal rhetoric, not permission for collective punishment or harm to families.','Celebration of power must remain answerable to the question of what that power does to others.'],
  22:['Abandonment, bodily suffering, ridicule, textual variants, public praise, poor people, and nations.','This Jewish lament must not be erased by later Christian reception or used anti-Jewishly. Suffering language is not proof that victims were divinely abandoned.','The poem moves from the raw cry of abandonment toward testimony without pretending the pain was unreal.'],
  23:['Shepherd imagery, rest, deep darkness, enemies, anointing, abundance, and dwelling.','Comfort poetry is not a promise that faithful people will avoid danger, illness, grief, or death.','Guidance does not remove the valley; presence changes how the valley is crossed.'],
  24:['Creation ownership, clean hands, sacred ascent, gates, divine kingship, and battle imagery.','“The earth is YHWH’s” resists absolute human ownership; Zion and divine-kingship language must not justify modern territorial entitlement or war.','No possession is ultimate when the whole earth is held as sacred.'],
  25:['Trust, shame, instruction, covenant, guilt, loneliness, pain, enemies, and communal redemption.','Confession must not be manipulated into shame, coercion, or blaming people for suffering.','A teachable heart can hold regret without surrendering dignity.'],
  26:['Integrity, examination, worship, bribery, bloodshed, and assembly.','Claims of integrity should not become self-righteousness or a basis for excluding others; the speaker still asks for mercy.','Integrity is strongest when it remains open to examination.'],
  27:['Fear, war, sanctuary, beauty, abandonment by parents, false witnesses, and patient courage.','The psalm does not guarantee family acceptance, military victory, or immediate rescue; people abandoned by family deserve concrete human support as well as spiritual comfort.','Courage can be the practice of seeking beauty while danger is still present.'],
  28:['Silence, pit, deceit, retribution, strength, anointed leadership, and shepherding.','Calls for repayment according to deeds are placed before God, not handed to private vengeance; leaders remain accountable.','The prayer moves from fear of silence toward strength that can carry a whole community.'],
  29:['Storm theophany, waters, thunder, Lebanon, wilderness, temple, flood, strength, and peace.','Storm imagery must not be used to claim natural disasters are punishments for particular people or communities.','The same voice imagined in thunder ends by blessing the people with peace.'],
  30:['Healing, Sheol, anger/favor, grief/joy, prosperity, hiddenness, mourning, and thanksgiving.','Healing testimony is not a guarantee that every illness will resolve through faith, and suffering must not be blamed on the sufferer.','Night and morning become images for change: grief is real, and it is not the only possible future.']
};

function notes(ch,v){
  const n=specialNotes[`${ch}:${v}`];
  return n?[n]:[];
}

function terms(ch,v,text){
  const out=[];
  if(/\bYHWH\b/.test(text)) out.push({display:'YHWH',source:'יהוה',language:'Hebrew',glossary_id:'yhwh'});
  if(ch===1&&v===2) out.push({display:'Torah / instruction',source:'תּוֹרָה',language:'Hebrew',glossary_id:'torah'});
  if(ch===2&&v===2) out.push({display:'anointed',source:'מָשִׁיחַ',language:'Hebrew',glossary_id:'mashiach'});
  if(ch===8&&v===5) out.push({display:'elohim / divine beings',source:'אֱלֹהִים',language:'Hebrew',glossary_id:'elohim'});
  if((ch===6&&v===5)||(ch===9&&v===17)||(ch===16&&v===10)||(ch===18&&v===5)||(ch===30&&v===3)) out.push({display:'Sheol',source:'שְׁאוֹל',language:'Hebrew',glossary_id:'sheol'});
  if(ch===23&&v===4) out.push({display:'deep darkness',source:'צַלְמָוֶת',language:'Hebrew',glossary_id:'tsalmavet'});
  if(/mercy|lovingkindness/i.test(text)) out.push({display:'steadfast love',source:'חֶסֶד',language:'Hebrew',glossary_id:'hesed'});
  return out;
}

function tags(text,ch){
  const t=String(text).toLowerCase();
  const out=new Set(['psalms','poetry']);
  if(t.includes('yhwh')) out.add('divine-name');
  if(/king|anointed|throne/.test(t)) out.add('kingship');
  if(/enemy|enemies|war|battle|sword|arrow|destroy|slay|kill|violence/.test(t)) out.add('violence-war');
  if(/poor|needy|oppress|fatherless|afflict/.test(t)) out.add('justice-vulnerable');
  if(/tear|grief|sorrow|death|sheol|pit/.test(t)) out.add('lament-mortality');
  if(/heaven|earth|moon|star|sea|waters|creation/.test(t)) out.add('creation');
  if(/law|torah|statute|commandment|judgment/.test(t)) out.add('torah-wisdom');
  if(/trust|refuge|shield/.test(t)) out.add('trust-refuge');
  if(/praise|sing|song/.test(t)) out.add('praise-worship');
  if(ch===9||ch===10) out.add('psalm-9-10-acrostic-pair');
  return [...out];
}

function flags(text,ch){
  const t=String(text).toLowerCase();
  const out=[];
  if(/enemy|enemies|war|battle|sword|arrow|destroy|slay|kill|violence|fire/.test(t)) out.push('poetic-violence-description-not-modern-authorization');
  if(/nation|nations|heathen|enemy|enemies/.test(t)) out.push('ancient-enemy-language-not-modern-target');
  if(/king|anointed|throne/.test(t)) out.push('leader-accountability-no-sacred-immunity');
  if(/ill|heal|grief|sorrow|tears|afflict|death|sheol/.test(t)) out.push('suffering-illness-nonstigmatizing');
  if(/prosper/.test(t)) out.push('anti-prosperity-formula');
  if(ch===22) out.push('jewish-lament-no-supersessionist-erasure');
  return [...new Set(out)];
}

function crossRefs(ch,v){
  const map={
    '2:7':[{reference:'Acts 13:33',relationship:'later-reception'},{reference:'Hebrews 1:5',relationship:'later-reception'}],
    '2:9':[{reference:'Revelation 2:27',relationship:'later-reception'}],
    '8:4':[{reference:'Hebrews 2:6-9',relationship:'later-reception'},{reference:'Genesis 1:26-28',relationship:'creation-connection'}],
    '9:1':[{reference:'Psalm 10',relationship:'acrostic-continuation'}],
    '10:1':[{reference:'Psalm 9',relationship:'acrostic-continuation'}],
    '14:1':[{reference:'Psalm 53',relationship:'parallel-psalm'},{reference:'Romans 3:10-12',relationship:'later-reception'}],
    '16:10':[{reference:'Acts 2:25-32',relationship:'later-reception'},{reference:'Acts 13:35',relationship:'later-reception'}],
    '18:1':[{reference:'2 Samuel 22',relationship:'parallel-song'}],
    '19:4':[{reference:'Romans 10:18',relationship:'later-reception'}],
    '22:1':[{reference:'Mark 15:34',relationship:'later-reception'},{reference:'Matthew 27:46',relationship:'later-reception'}],
    '22:18':[{reference:'John 19:23-24',relationship:'later-reception'}]
  };
  return map[`${ch}:${v}`]||[];
}

function mystical(restored){
  const violent=/\b(enemy|enemies|destroy|slay|kill|sword|battle|war|arrows?|fire|wrath|perish)\b/i.test(restored);
  if(violent) return 'Contemplatively, this verse gives voice to the longing that violence, deceit, domination, and fear lose their power; it is not a directive against human enemies.';
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

const bookDir=path.join(root,'scripture',BOOK_ID);
const mysticalDir=path.join(bookDir,'mystical');
fs.mkdirSync(mysticalDir,{recursive:true});
let prepared=0;

for(let ch=START;ch<=END;ch+=1){
  const src=chapters.get(ch);
  if(!src?.length) throw new Error(`Missing Psalms ${ch}`);
  const meta=chapterMeta[ch];
  if(!meta) throw new Error(`Missing chapter metadata for Psalm ${ch}`);
  const verses=src.map(v=>{
    const n=Number(v.verse);
    const restored=overrides.get(`${ch}:${n}`)||modernize(v.text);
    return {verse:n,restored,familiar:{source:'KJV',text:v.text},notes:notes(ch,n),terms:terms(ch,n,restored),tags:tags(restored,ch),cross_references:crossRefs(ch,n),editorial_flags:flags(restored,ch)};
  });
  const restoredDoc={
    book:BOOK,book_id:BOOK_ID,chapter:ch,
    audit_status:{status:'draft-pending-deep-source-audit',source_base:'ChatGPT-authored Psalms completion draft using public-domain KJV as familiar alignment scaffold with curated Hebrew/textual overrides; full WLC/OSHB/source-witness audit pending',review_note:meta[0]},
    verses,
    translation_notes:['This chapter expands corpus coverage while remaining explicitly pending a deeper Hebrew/source-witness audit. KJV is retained only as the familiar comparison layer. Curated overrides preserve major lexical or textual issues where identified.'],
    safety_note:meta[1],
    source_witness_audit_flags:[ch===18?'Compare every verse with 2 Samuel 22 and preserve differences between the parallel forms.':'Compare directly with WLC/OSHB, Septuagint, Dead Sea Scrolls where extant, and other relevant witnesses during the global audit.',ch===9||ch===10?'Audit Psalms 9–10 together for alphabetic-acrostic structure and numbering differences across traditions.':'Preserve Psalm numbering and superscription differences across Hebrew and Greek traditions rather than silently harmonizing them.'],
    layer_status:{restored:true,familiar:'complete-KJV',verse_notes:'selective',source_terms:'selective-pending-deep-audit',tags:'baseline',cross_references:'selective',editorial_flags:'baseline',mystical_companion:'separate-file',modern_comparison:'pending-reference-backfill',original_language:'pending-reference-backfill'},
    generation_status:{status:'chatgpt-authored-completion-draft',intelligence:'ChatGPT conversation',external_ai_runner:false,continuity_audit:'pending-global-pass'}
  };
  const myst={book:BOOK,book_id:BOOK_ID,chapter:ch,layer:'mystical-companion',verses:verses.map(v=>({verse:v.verse,mystical_translation:mystical(v.restored)})),contemplative_note:meta[2],safety_note:meta[1],generation_status:{status:'chatgpt-authored-contemplative-draft',aligned_to_restored_chapter:true,continuity_audit:'pending-global-pass'}};
  fs.writeFileSync(path.join(bookDir,`${BOOK_ID}-${pad(ch)}.json`),JSON.stringify(restoredDoc,null,2)+'\n');
  fs.writeFileSync(path.join(mysticalDir,`${BOOK_ID}-${pad(ch)}-mystical.json`),JSON.stringify(myst,null,2)+'\n');
  prepared+=1;
  console.log(`Prepared Psalm ${ch}: ${verses.length} verses`);
}

const restoredCount=fs.readdirSync(bookDir).filter(n=>/^psalms-\d{3}\.json$/.test(n)).length;
const mysticalCount=fs.readdirSync(mysticalDir).filter(n=>/^psalms-\d{3}-mystical\.json$/.test(n)).length;
fs.mkdirSync(path.join(root,'metadata'),{recursive:true});
fs.writeFileSync(path.join(root,'metadata','psalms-progress.json'),JSON.stringify({book:BOOK,book_id:BOOK_ID,total_chapters:150,restored_chapters:restoredCount,mystical_chapters:mysticalCount,complete:restoredCount===150&&mysticalCount===150,status:restoredCount===150&&mysticalCount===150?'complete-draft-with-mystical-companions-pending-global-source-audit':'in-progress-chatgpt-authored-draft',generation_model:'ChatGPT conversation',last_batch:'Psalms 1-30',continuity_audit:'pending-global-pass'},null,2)+'\n');
console.log(`Prepared ${prepared} Psalms. Current totals: ${restoredCount} restored / ${mysticalCount} mystical.`);
