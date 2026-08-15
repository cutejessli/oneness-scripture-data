import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BOOK_ID = 'psalms';
const BOOK = 'Psalms';
const START = 91;
const END = 120;
const pad = n => String(n).padStart(3,'0');

const response = await fetch('https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Psalms.json');
if (!response.ok) throw new Error(`KJV fetch failed: ${response.status}`);
const kjv = await response.json();
const chapters = new Map(kjv.chapters.map(ch => [Number(ch.chapter), ch.verses]));

function restoreBase(text){
  return String(text)
    .replace(/\bthe LORD\b/g,'YHWH').replace(/\bThe LORD\b/g,'YHWH')
    .replace(/\bLORD\b/g,'YHWH').replace(/\bJEHOVAH\b/g,'YHWH')
    .replace(/\bheathen\b/g,'nations').replace(/\bHeathen\b/g,'Nations')
    .replace(/\bungodly\b/g,'wicked').replace(/\bUngodly\b/g,'Wicked')
    .replace(/\bsepulchre\b/g,'grave').replace(/\bSepulchre\b/g,'Grave')
    .replace(/\breins\b/g,'innermost being').replace(/\bReins\b/g,'Innermost being')
    .replace(/\bunicorns\b/g,'wild oxen').replace(/\bunicorn\b/g,'wild ox')
    .replace(/\bshew\b/g,'show').replace(/\bShew\b/g,'Show')
    .replace(/\bshewed\b/g,'showed').replace(/\bShewed\b/g,'Showed')
    .replace(/\bunto\b/g,'to').replace(/\bUnto\b/g,'To')
    .replace(/\bleasing\b/g,'falsehood').replace(/\bLeasing\b/g,'Falsehood')
    .replace(/\bbuckler\b/g,'shield').replace(/\bBuckler\b/g,'Shield')
    .replace(/\s+/g,' ').trim();
}

const overrides = new Map(Object.entries({
  '91:1':'Whoever dwells in the shelter of the Most High will lodge in the shadow of the Almighty.',
  '91:2':'I will say of YHWH, “My refuge and my fortress, my God, in whom I trust.”',
  '91:11':'For he will command his messengers concerning you, to guard you in all your ways.',
  '91:12':'They will lift you up in their hands, lest you strike your foot against a stone.',
  '94:1':'YHWH, God of vengeance—God of vengeance, shine forth.',
  '95:7':'For he is our God, and we are the people of his pasture and the flock of his hand. Today, if you hear his voice,',
  '96:10':'Say among the nations, “YHWH reigns.” The world is firmly established; it will not be moved. He judges the peoples with equity.',
  '97:7':'Let all who serve an image be put to shame, those who boast in idols; bow before him, all you gods [elohim].',
  '99:1':'YHWH reigns; let the peoples tremble. He sits enthroned above the cherubim; let the earth quake.',
  '102:12':'But you, YHWH, remain forever, and your remembrance from generation to generation.',
  '103:8':'YHWH is compassionate and gracious, slow to anger and abundant in steadfast love.',
  '103:12':'As far as east is from west, so far has he removed our transgressions from us.',
  '104:26':'There the ships travel, and Leviathan, whom you formed to play in it.',
  '105:25':'Their heart turned to hate his people, to deal craftily with his servants [poetic-theological attribution].',
  '106:37':'They sacrificed their sons and daughters to the shedim [demons].',
  '107:20':'He sent his word and healed them, and delivered them from their pits.',
  '109:8':'Let his days be few; let another take his office.',
  '110:1':'YHWH says to my lord [adoni], “Sit at my right hand until I make your enemies a footstool for your feet.”',
  '110:4':'YHWH has sworn and will not relent: “You are a priest forever, according to the order [or manner] of Melchizedek.”',
  '115:1':'Not to us, YHWH, not to us, but to your name give glory, for your steadfast love and faithfulness.',
  '115:4':'Their idols are silver and gold, the work of human hands.',
  '116:15':'Precious in the eyes of YHWH is the death of his faithful ones.',
  '118:22':'The stone the builders rejected has become the chief cornerstone.',
  '118:26':'Blessed is the one who comes in the name of YHWH; we bless you from the house of YHWH.',
  '119:1':'Blessed are those whose way is whole, who walk in the Torah of YHWH.',
  '119:105':'Your word is a lamp to my feet and a light to my path.',
  '119:176':'I have wandered like a lost sheep; seek your servant, for I have not forgotten your commandments.',
  '120:2':'YHWH, rescue my life from lying lips and from a deceitful tongue.'
}));

const notes = {
  '91:1':{title:'Protection poetry',body:'Psalm 91 speaks in sweeping poetry about divine refuge. It should not be turned into a guarantee that faithful people will never be injured, infected, traumatized, persecuted, or killed, nor used to blame people when harm occurs.'},
  '91:11':{title:'Messengers / angels',body:'Hebrew malakhim means messengers and is commonly rendered angels here. Matthew 4 and Luke 4 later quote verses 11–12 in the temptation narrative; that reception does not make the psalm a license for reckless testing of divine protection.'},
  '94:1':{title:'God of vengeance',body:'The psalm places vengeance in divine hands rather than granting private permission for retaliation. It must not be used to authorize vigilantism, abuse, harassment, or political violence.'},
  '95:7':{title:'Today, if you hear',body:'Hebrews 3–4 later builds an extended interpretation around this line and the wilderness generation. The psalm’s own setting remains a communal call to listen rather than harden the heart.'},
  '97:7':{title:'Elohim in Psalm 97',body:'The final term elohim can be understood as gods/divine beings. Ancient religious polemic should not be converted into permission to persecute people of other religions or spiritual traditions.'},
  '102:25':{title:'Creation language and Hebrews',body:'Hebrews 1 later applies Psalm 102:25–27 christologically. The Hebrew psalm itself addresses God within an afflicted person’s prayer; both literary settings should remain visible.'},
  '104:26':{title:'Leviathan at play',body:'Leviathan appears here as a creature formed by God to play in the sea, a strikingly non-combat image that should be preserved alongside other biblical Leviathan traditions.'},
  '105:25':{title:'Hardening / turning hearts',body:'This theological retelling attributes Egyptian hostility within a providential narrative. It must not erase human agency or become a template for claiming that modern hatred, oppression, or war was divinely caused or required.'},
  '106:37':{title:'Shedim',body:'Hebrew shedim is commonly rendered demons. The verse condemns child sacrifice within the psalm’s historical-theological retelling; it must never be used to demonize living religions, cultures, or spiritual practitioners.'},
  '109:1':{title:'Extreme imprecation',body:'Psalm 109 contains some of the Psalter’s most severe curses. They are preserved as ancient rage-prayer and must never authorize stalking, harassment, abuse, collective punishment, or physical harm.'},
  '109:8':{title:'Later citation in Acts',body:'Acts 1:20 later cites this line in relation to Judas. That reception history does not turn the entire psalm’s curses into a model for treating enemies.'},
  '110:1':{title:'YHWH and adoni',body:'The Hebrew distinguishes the divine name YHWH from adoni, “my lord/master.” The verse became central in later Jewish and Christian interpretation; the restored wording preserves the Hebrew distinction instead of collapsing both figures into the same title.'},
  '110:4':{title:'Melchizedek',body:'The Hebrew phrase al-divrati Malki-Tzedek is difficult and has generated multiple interpretations. Hebrews 5–7 later develops a major priestly reading. The source ambiguity and later reception should remain distinct.'},
  '115:4':{title:'Idol polemic',body:'The psalm’s satire of manufactured images belongs to ancient Israelite religious polemic. It must not be used to demean, vandalize, or persecute modern religious communities or sacred art.'},
  '116:15':{title:'Precious is the death',body:'This line values the lives and deaths of God’s faithful ones; it must not be romanticized into a reason to seek death, martyrdom, or self-harm.'},
  '118:22':{title:'Rejected stone',body:'The rejected-stone line became important in later Jewish and Christian reception, including the New Testament. The psalm’s original liturgical setting should remain visible alongside later applications.'},
  '118:26':{title:'Blessed is the one who comes',body:'This liturgical blessing is later used in the Gospel entry traditions. The source psalm and later messianic reception should be shown as related layers, not collapsed into one historical moment.'},
  '119:1':{title:'Torah and acrostic',body:'Psalm 119 is an eightfold alphabetic acrostic organized around Torah and overlapping terms for instruction, command, testimony, statute, and word. Torah here is lived divine teaching, not merely a synonym for punitive legalism.'},
  '119:105':{title:'Word as lamp',body:'The verse belongs to the Nun stanza of the alphabetic acrostic and describes instruction as practical illumination for a path rather than abstract information.'},
  '120:1':{title:'Songs of Ascents begin',body:'Psalm 120 begins the collection of Songs of Ascents (Psalms 120–134), likely associated in some way with pilgrimage or ascent, though the precise historical use is debated.'}
};

const meta = {
91:['Refuge, Most High, divine protection, plague, angels/messengers, danger, and trust.','Protection language is poetry of trust, not a guarantee of immunity from illness, accident, violence, or death; never blame harmed people for insufficient faith.','Refuge is deepest when it strengthens wise living rather than magical invulnerability.'],
92:['Sabbath song, praise, music, flourishing, enemies, age, and divine justice.','Flourishing imagery is wisdom poetry, not a promise that righteous people will always be healthy, wealthy, or physically vigorous.','A life can stay fruitful by remaining rooted in praise rather than performance.'],
93:['Divine kingship, waters, stability, majesty, and holiness.','Kingship imagery cannot authorize theocracy, authoritarianism, or leader immunity.','Even the roaring waters do not outrank the deeper steadiness of the sacred.'],
94:['Vengeance, violent rulers, oppression, widow/orphan/foreigner, discipline, and justice.','Vengeance belongs to God in the poem; it is not authorization for retaliation, vigilantism, abuse, or political violence.','Justice begins by hearing the people power assumes no one hears.'],
95:['Worship, creation, shepherd imagery, wilderness rebellion, listening, and rest.','The wilderness warning must not become a tool for coercive religion or victim-blaming; later Hebrews reception should remain distinct from the psalm’s own voice.','The invitation is to soften enough to hear what hardness keeps repeating.'],
96:['New song, nations, divine kingship, creation, judgment, and joy.','Universal praise cannot become cultural domination, forced conversion, or nationalism.','The whole earth is imagined as capable of joining a song no empire owns.'],
97:['Divine kingship, storm imagery, idols, elohim/gods, Zion, and justice.','Ancient idol polemic must not justify persecution of other religions or destruction of modern sacred objects.','Light is sown where power bends toward justice.'],
98:['New song, salvation, nations, music, sea, creation, and judgment.','Universal language should enlarge dignity rather than support triumphalism or forced conversion.','Even sea and rivers are recruited into a vision of justice as celebration.'],
99:['Divine kingship, cherubim, justice, Moses/Aaron/Samuel, holiness, and accountability.','Sacred authority remains accountable; priestly or prophetic status never grants immunity from harm or abuse.','Holiness is not distance from ethics but intensified accountability.'],
100:['Praise, service, belonging, shepherd imagery, gratitude, and steadfast love.','“His people” language should not be used to deny the dignity or spiritual worth of outsiders.','Belonging can be received as gift instead of defended as possession.'],
101:['Royal ethics, integrity, slander, arrogance, household rule, and judgment.','Ancient royal household discipline is not a charter for authoritarian purges or violence against perceived wrongdoers.','Leadership begins with what power permits inside its own house.'],
102:['Affliction, loneliness, mortality, Zion, creation, eternity, and later reception.','Suffering and physical decline are not moral failure; Zion restoration language cannot erase modern peoples or contested history.','A fragile human voice can address a horizon larger than generations.'],
103:['Blessing, forgiveness, healing language, compassion, mortality, steadfast love, and angels.','Healing language is not a promise that every illness will be cured or proof that illness reflects sin.','Compassion is imagined as spacious enough to outlast shame.'],
104:['Creation, ecology, animals, sea, Leviathan, food, breath/spirit, and praise.','Human use of creation does not authorize ecological destruction or cruelty; creation has value beyond utility to humans.','The world is alive with relationships of breath, water, food, play, and dependence.'],
105:['Covenant memory, ancestors, Egypt, Joseph, plagues, exodus, land, and historical retelling.','Plague and conquest memories must not authorize collective punishment, anti-Egyptian racism, or modern territorial dispossession.','Memory can sustain identity without turning ancient conflict into a modern target list.'],
106:['Confession, wilderness memory, idolatry, child sacrifice, violence, exile, and mercy.','Historical confession must not stigmatize modern religions or ethnicities, excuse child harm, or celebrate mass violence.','A community can tell the truth about its failures without surrendering the possibility of mercy.'],
107:['Thanksgiving, wilderness, prisoners, sickness imagery, storms, trade, poverty, and deliverance.','Sickness and disaster scenes are poetic deliverance patterns, not proof that suffering people caused their own distress.','Many different roads can end in the same recognition of steadfast love.'],
108:['Praise, nations, war geography, Moab/Edom/Philistia, and reuse of Psalms 57/60.','Ancient war taunts and peoples cannot be mapped onto living populations or modern military claims.','Reused prayer shows that sacred language can be recomposed without erasing its earlier life.'],
109:['False accusation, poverty, extreme curses, children/family imagery, death wishes, and vindication.','Extreme imprecation is preserved but never authorized as behavior; no curse in this psalm permits harm to enemies, children, families, or descendants.','Rage can be spoken without being enacted.'],
110:['Royal oracle, YHWH/adoni distinction, enemies, priesthood, Melchizedek, and later messianic reception.','Royal-priestly imagery must not create leader immunity or sacred violence; later Christian readings should not erase the Hebrew psalm or Jewish interpretation.','Authority becomes most dangerous when titles are allowed to blur accountability.'],
111:['Praise, divine works, covenant, food, justice, and wisdom.','“Fear of YHWH” should not be manipulated into abusive terror or coercive religious control.','Awe becomes wisdom when memory shapes ethical attention.'],
112:['Wisdom, generosity, wealth, fear, justice, stability, and the poor.','Wealth language is wisdom imagery, not a prosperity guarantee; poverty is never proof of divine disfavor.','The stable heart is recognized by generosity, not accumulation.'],
113:['Praise, divine transcendence, poor people, barren woman imagery, and reversal.','Infertility or childlessness must never be stigmatized; the poem’s reversal image is not a promise that every person will become a parent.','The Holy is pictured as stooping toward those status systems place low.'],
114:['Exodus, sea, Jordan, mountains, earth, and divine presence.','Exodus poetry cannot authorize contempt for modern Egyptians or any living people.','Creation itself is imagined as responsive to liberation.'],
115:['Divine glory, nations, idol polemic, trust, priesthood, blessing, and life/death.','Ancient idol satire must not justify persecution, vandalism, or contempt toward modern religions or sacred art.','Trust shifts weight from what hands manufacture to what cannot be possessed.'],
116:['Deliverance, death, Sheol, vows, sacrifice, faithful death, and gratitude.','Death language must not romanticize martyrdom or self-harm; continuing life and gratitude are central to the psalm.','Gratitude can become a public return of the self to life.'],
117:['All nations, all peoples, steadfast love, faithfulness, and praise.','Universal invitation is not forced conversion or cultural erasure.','The shortest psalm imagines the widest possible choir.'],
118:['Thanksgiving, enemies, gates, rejected stone, festival procession, YHWH name, and later reception.','Victory and enemy language must not authorize violence; later messianic readings should remain visible without erasing the psalm’s liturgical setting.','What builders discard can become structurally central in a different horizon.'],
119:['Alphabetic acrostic, Torah, instruction, affliction, justice, meditation, persecution, and longing.','Torah devotion must not be reduced to legalism or used for coercive rule-enforcement; affliction is not proof of divine punishment.','Attention repeated across an alphabet becomes a practice of aligning the whole self.'],
120:['Songs of Ascents, lying speech, conflict, Meshech/Kedar imagery, peace, and war.','Ancient place/people names are poetic geography and must not become labels for modern enemies; the speaker desires peace rather than violence.','The ascent begins by refusing to let deceit and conflict define the tongue.']
};

function specialNote(ch,v){const n=notes[`${ch}:${v}`]; return n?[n]:[];}
function terms(ch,v,text){
  const out=[];
  if(/\bYHWH\b/.test(text)) out.push({display:'YHWH',source:'יהוה',language:'Hebrew',glossary_id:'yhwh'});
  if(ch===97&&v===7) out.push({display:'elohim / gods',source:'אֱלֹהִים',language:'Hebrew',glossary_id:'elohim-divine-beings'});
  if(ch===103&&v===8) out.push({display:'steadfast love',source:'חֶסֶד',language:'Hebrew',glossary_id:'hesed'});
  if(ch===104&&v===26) out.push({display:'Leviathan',source:'לִוְיָתָן',language:'Hebrew',glossary_id:'leviathan'});
  if(ch===106&&v===37) out.push({display:'shedim / demons',source:'שֵּׁדִים',language:'Hebrew',glossary_id:'shedim'});
  if(ch===110&&v===1) out.push({display:'my lord',source:'אדֹנִי',language:'Hebrew',glossary_id:'adoni'});
  if(ch===119&&v===1) out.push({display:'Torah / instruction',source:'תּוֹרָה',language:'Hebrew',glossary_id:'torah'});
  return out;
}
const violence=/\b(?:enemy|enemies|destroy|destroys|destroyed|slay|slays|slain|kill|kills|killed|blood|bloodshed|sword|swords|battle|battles|war|wars|smite|smites|smitten|vengeance|violent|violence|weapon|weapons|spear|spears|arrow|arrows|curse|curses)\b|dash(?:ed|es|ing)?\s+.*pieces/i;
const king=/\b(?:king|kings|kingdom|throne|sceptre|scepter|reign|reigns|reigned)\b/i;
const poor=/\b(?:poor|needy|oppress|oppressed|widow|widows|orphan|orphans|fatherless)\b/i;
function tags(text,ch,v){
  const t=['psalms','poetry'];
  if(king.test(text)) t.push('kingship');
  if(poor.test(text)) t.push('poverty-justice');
  if(violence.test(text)) t.push('violence-war');
  if(/\b(?:trust|refuge|shield|shelter|fortress)\b/i.test(text)) t.push('trust-refuge');
  if(/\b(?:sick|disease|wound|bones|pain|heal|healed|healing)\b/i.test(text)) t.push('suffering-body');
  if(/\b(?:nation|nations|people|peoples|land|earth)\b/i.test(text)) t.push('peoples-land');
  if(/\b(?:praise|sing|song|worship|thank|thanks)\b/i.test(text)) t.push('praise-worship');
  if(ch===104) t.push('creation-ecology');
  if(ch===105||ch===106) t.push('historical-retelling');
  if(ch===109) t.push('imprecatory-psalm');
  if(ch===119) t.push('torah-acrostic');
  if(ch===120) t.push('songs-of-ascents');
  return [...new Set(t)];
}
function flags(text,ch,v){
  const out=[];
  if(violence.test(text)) out.push('poetic-violence-description-not-modern-authorization');
  if([105,106,108,120].includes(ch)) out.push('ancient-peoples-land-not-modern-target');
  if(ch===91) out.push('protection-poetry-not-guaranteed-immunity');
  if(ch===94) out.push('vengeance-no-vigilante-authorization');
  if(ch===97||ch===115) out.push('religious-polemic-no-modern-persecution');
  if(ch===103||ch===107) out.push('illness-disability-nonstigmatizing');
  if(ch===106) out.push('child-harm-and-collective-violence-audit');
  if(ch===109) out.push('imprecatory-violence-no-harm-authorization','children-descendants-not-legitimate-targets');
  if(ch===110) out.push('leader-accountability-no-sacred-immunity');
  if(ch===113) out.push('infertility-childlessness-nonstigmatizing');
  if(ch===116) out.push('death-language-no-self-harm-romanticization');
  return [...new Set(out)];
}
function crossRefs(ch,v){
  if(ch===91&&(v===11||v===12)) return [{reference:'Matthew 4:6',relationship:'later-reception'},{reference:'Luke 4:10-11',relationship:'later-reception'}];
  if(ch===95&&v>=7) return [{reference:'Hebrews 3:7-4:11',relationship:'extended-later-reception'}];
  if(ch===102&&v>=25) return [{reference:'Hebrews 1:10-12',relationship:'later-reception'}];
  if(ch===108) return [{reference:'Psalm 57:7-11; Psalm 60:5-12',relationship:'composite-reuse'}];
  if(ch===109&&v===8) return [{reference:'Acts 1:20',relationship:'later-reception'}];
  if(ch===110&&v===1) return [{reference:'Mark 12:36; Acts 2:34-35; Hebrews 1:13',relationship:'later-reception'}];
  if(ch===110&&v===4) return [{reference:'Hebrews 5-7',relationship:'extended-later-reception'}];
  if(ch===118&&v===22) return [{reference:'Matthew 21:42; Acts 4:11; 1 Peter 2:7',relationship:'later-reception'}];
  if(ch===118&&v===26) return [{reference:'Matthew 21:9; Mark 11:9; Luke 19:38; John 12:13',relationship:'later-reception'}];
  return [];
}
function mystical(ch,v,count){
  const m=meta[ch];
  if(v===1) return m[2];
  if(v===count) return `The prayer closes without erasing its tension: ${m[2].charAt(0).toLowerCase()+m[2].slice(1)}`;
  const third=count/3;
  if(v<=third) return `The poem enters through ${m[0].split(',').slice(0,3).join(',').toLowerCase()}, allowing what is real to be named before it is transformed.`;
  if(v<=third*2) return `Its center asks what becomes possible when memory, power, vulnerability, and desire are held in the presence of the Divine rather than acted out automatically.`;
  return m[2];
}

const bookDir=path.join(root,'scripture',BOOK_ID);
const mysticalDir=path.join(bookDir,'mystical');
fs.mkdirSync(bookDir,{recursive:true});
fs.mkdirSync(mysticalDir,{recursive:true});

for(let ch=START;ch<=END;ch++){
  const src=chapters.get(ch);
  if(!src?.length) throw new Error(`Missing Psalms ${ch}`);
  const m=meta[ch];
  if(!m) throw new Error(`Missing metadata for Psalm ${ch}`);
  const verses=src.map(v=>{
    const n=Number(v.verse);
    const restored=overrides.get(`${ch}:${n}`)||restoreBase(v.text);
    return {verse:n,restored,familiar:{source:'KJV',text:v.text},notes:specialNote(ch,n),terms:terms(ch,n,restored),tags:tags(restored,ch,n),cross_references:crossRefs(ch,n),editorial_flags:flags(restored,ch,n)};
  });
  const restoredDoc={
    book:BOOK,book_id:BOOK_ID,chapter:ch,
    audit_status:{status:'draft-pending-deep-source-audit',source_base:'ChatGPT-authored Psalms completion draft using public-domain KJV as familiar alignment scaffold with curated Hebrew/textual overrides; full WLC/OSHB/source-witness audit pending',review_note:m[0]},
    verses,
    translation_notes:['This chapter completes corpus coverage as a ChatGPT-authored draft. KJV is retained as a familiar comparison layer; a separate automated reference pass adds BSB and pointed Hebrew without replacing the restored draft.'],
    safety_note:m[1],
    source_witness_audit_flags:['Compare directly with WLC/OSHB, Septuagint, Dead Sea Psalms witnesses where extant, and other textual witnesses during the global audit. Preserve poetic parallelism, superscriptions, acrostic structure, duplicate/reused psalms, and significant Hebrew/Greek divergences rather than harmonizing them.'],
    layer_status:{restored:true,familiar:'complete-KJV',verse_notes:'selective',source_terms:'selective-pending-deep-audit',tags:'baseline',cross_references:'selective',editorial_flags:'baseline',mystical_companion:'separate-file',modern_comparison:'pending-reference-backfill',original_language:'pending-reference-backfill'},
    generation_status:{status:'chatgpt-authored-completion-draft',intelligence:'ChatGPT conversation',external_ai_runner:false,continuity_audit:'pending-global-pass'}
  };
  const myst={book:BOOK,book_id:BOOK_ID,chapter:ch,layer:'mystical-companion',verses:src.map(v=>({verse:Number(v.verse),mystical_translation:mystical(ch,Number(v.verse),src.length)})),contemplative_note:m[2],safety_note:m[1],generation_status:{status:'chatgpt-authored-contemplative-draft',aligned_to_restored_chapter:true,continuity_audit:'pending-global-pass'}};
  fs.writeFileSync(path.join(bookDir,`${BOOK_ID}-${pad(ch)}.json`),JSON.stringify(restoredDoc,null,2)+'\n');
  fs.writeFileSync(path.join(mysticalDir,`${BOOK_ID}-${pad(ch)}-mystical.json`),JSON.stringify(myst,null,2)+'\n');
  console.log(`Prepared Psalm ${ch}: ${verses.length} verses`);
}

fs.writeFileSync(path.join(root,'metadata','psalms-progress.json'),JSON.stringify({book:BOOK,book_id:BOOK_ID,total_chapters:150,restored_chapters:120,mystical_chapters:120,complete:false,status:'in-progress-chatgpt-authored-draft',generation_model:'ChatGPT conversation',last_batch:'Psalms 91-120',continuity_audit:'pending-global-pass'},null,2)+'\n');
