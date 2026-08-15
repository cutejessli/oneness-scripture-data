import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BOOK_ID = 'psalms';
const BOOK = 'Psalms';
const START = 31;
const END = 60;
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
  '31:5':'Into your hand I commit my spirit; you have redeemed me, YHWH, God of truth.',
  '32:2':'Blessed is the human to whom YHWH does not count iniquity, and in whose spirit there is no deceit.',
  '34:6':'This poor one cried, and YHWH heard, and saved them from all their troubles.',
  '36:9':'For with you is the fountain of life; in your light we see light.',
  '37:11':'But the humble shall inherit the land and delight themselves in abundant peace.',
  '39:5':'Behold, you have made my days a few handbreadths, and my lifetime is as nothing before you; surely every human stands as a mere breath. Selah.',
  '40:6':'Sacrifice and offering you did not desire; ears you have opened for me. Burnt offering and sin offering you did not require.',
  '42:7':'Deep calls to deep at the sound of your waterfalls; all your breakers and your waves have passed over me.',
  '45:6':'Your throne, O God [or: your divine throne], is forever and ever; a scepter of equity is the scepter of your kingdom.',
  '46:10':'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
  '49:15':'But God will ransom my life from the hand of Sheol, for he will take me. Selah.',
  '51:10':'Create in me a clean heart, O God, and renew a steadfast spirit within me.',
  '51:11':'Do not cast me away from your presence, and do not take your holy spirit from me.',
  '51:17':'The sacrifices of God are a broken spirit; a broken and contrite heart, O God, you will not despise.',
  '55:22':'Cast your burden upon YHWH, and he will sustain you; he will never let the righteous be shaken forever.',
  '56:8':'You have counted my wanderings; put my tears in your bottle. Are they not in your record?',
  '58:1':'Do you indeed speak righteousness, O mighty ones [wording uncertain]? Do you judge uprightly, children of humanity?',
  '60:8':'Moab is my washbasin; over Edom I cast my sandal; over Philistia I shout in triumph.'
}));

const notes = {
  '31:5':{title:'Into your hand I commit my spirit',body:'The Hebrew entrusts one’s ruach, “spirit/breath,” to God. Luke 23:46 later places this line on Jesus’ lips; the psalm’s original setting remains a Jewish prayer of trust under threat.'},
  '32:3':{title:'Body and guilt language',body:'The psalm poetically links unacknowledged wrongdoing with bodily wasting. This must not be generalized into a claim that illness, disability, or chronic pain is caused by personal sin.'},
  '37:11':{title:'Inherit the land',body:'The Hebrew eretz can mean land or earth. This wisdom promise concerns the reversal of violent power; it is not a modern deed of territorial ownership or authorization for dispossession.'},
  '38:3':{title:'Illness and divine anger',body:'The speaker interprets bodily suffering through guilt and divine anger. That is the psalmist’s theological experience, not a universal diagnosis of sickness.'},
  '40:6':{title:'Ears opened / body prepared',body:'The Masoretic Hebrew reads literally “ears you have dug/opened for me.” The Greek Septuagint has “a body you prepared for me,” the form cited in Hebrews 10:5. Both witnesses should remain visible rather than harmonized.'},
  '42:1':{title:'Psalms 42–43',body:'Psalms 42 and 43 share a repeated refrain and are widely understood as parts of a single composition. The received Hebrew chapter division is retained while the literary unity is flagged.'},
  '43:1':{title:'Psalms 42–43',body:'Psalm 43 continues Psalm 42’s language and refrain without a separate superscription. Many interpreters treat the two as one poem.'},
  '44:22':{title:'For your sake we are killed all day',body:'This communal lament describes innocent suffering rather than deserved punishment. Paul later cites it in Romans 8:36; neither context permits blaming victims for persecution.'},
  '45:6':{title:'Royal/divine address',body:'The Hebrew can be read as directly addressing the king as elohim (“O God”) or as describing a throne grounded in God/divine authority. Hebrews 1:8 later cites the Greek form. The ambiguity should remain visible.'},
  '48:2':{title:'Zion language',body:'Zion is sacred-poetic geography in the psalm. Devotional attachment to Jerusalem must not be turned into a blanket modern territorial entitlement or a denial of another people’s dignity.'},
  '51:1':{title:'David, Bathsheba, and Uriah',body:'The superscription links this psalm to David after Nathan confronted him concerning Bathsheba. Any penitential reading must keep Bathsheba’s violated agency and Uriah’s killing visible rather than reducing the story to David’s private spiritual crisis.'},
  '51:4':{title:'“Against you only”',body:'“Against you, you only, have I sinned” is confessional rhetoric before God; it cannot erase the concrete human beings harmed in the narrative associated with the psalm, especially Bathsheba and Uriah.'},
  '53:1':{title:'Parallel to Psalm 14',body:'Psalm 53 closely parallels Psalm 14, with notable differences including a preference for Elohim where Psalm 14 often uses YHWH. The duplicate tradition is textual evidence, not an error to be removed.'},
  '58:1':{title:'Difficult opening',body:'The Hebrew opening is textually and lexically difficult; translations range from “congregation” to “mighty ones/gods” and other reconstructions. The restored line flags rather than conceals the uncertainty.'},
  '58:8':{title:'Miscarriage imagery',body:'The psalm uses shocking imprecatory images, including a pregnancy-loss image. Such language belongs to rage poetry and must not be used to stigmatize miscarriage, infertility, pregnancy loss, or children.'},
  '60:1':{title:'National defeat and lament',body:'Psalm 60 interprets military defeat within ancient Israelite theology. It is not a warrant to read modern wars as direct divine favor or rejection.'},
  '60:8':{title:'Moab, Edom, Philistia',body:'These are ancient geopolitical enemies in royal war poetry. They must never be mapped onto modern ethnic, national, religious, or political populations.'}
};

const meta = {
31:['Refuge, siege, shame, illness imagery, enemies, trust, truth, and committing one’s spirit.','Enemy and punishment language is lament poetry, not authorization for retaliation. Illness language must not be moralized.','Trust can become an act of placing the whole self into hands larger than fear.'],
32:['Forgiveness, confession, bodily distress, instruction, and joy.','Do not turn the psalm’s guilt/body imagery into a claim that illness or disability proves sin.','Honesty loosens what secrecy tightens.'],
33:['Creation by divine speech, praise, nations, armies, kings, and trust.','“Blessed nation” language cannot establish modern national supremacy or theocracy. Military strength is explicitly relativized.','A larger order exposes how little violence can finally secure.'],
34:['Deliverance, fear, the poor, angelic protection, speech ethics, suffering, and refuge.','Poverty and suffering are not moral failure; promises of rescue must not be used to blame people whose suffering continues.','Taste, speech, and attention turn faith into embodied practice.'],
35:['Imprecation, false witnesses, violence, betrayal, and public vindication.','Calls for enemies’ ruin are preserved as rage-prayer, never as permission for revenge, stalking, harassment, or violence.','Prayer can hold anger without handing the body over to retaliation.'],
36:['Human wickedness, steadfast love, refuge, abundance, fountain of life, and light.','Descriptions of the wicked are moral critique, not labels for hated groups.','Life is pictured as a spring that cannot be owned.'],
37:['Wisdom, evildoers, land inheritance, wealth, violence, and patience.','Land promises are not modern property deeds; “wicked” must not become an ethnic or political category.','Do not let another person’s violence dictate the shape of your own life.'],
38:['Sin, bodily pain, isolation, guilt, enemies, and plea for help.','The speaker’s interpretation of sickness must not be universalized into illness-as-punishment or disability stigma.','Pain can speak in theological language without becoming a diagnosis for everyone else.'],
39:['Mortality, silence, anger, breath, wealth, and human transience.','Mortality reflection is not an invitation to self-harm or nihilism.','Knowing life is brief can clarify what deserves our voice.'],
40:['Waiting, rescue, sacrifice, Torah, proclamation, enemies, and textual-witness difference.','Sacrifice critique is not contempt for Judaism; later Christian reception must not erase the Hebrew form.','Listening can become a deeper offering than performance.'],
41:['Care for the poor, sickness, betrayal, enemies, and restoration.','Sickness is not evidence of guilt, and care for poor people is not transactional magic guaranteeing health.','How a community treats the vulnerable is a spiritual measure.'],
42:['Longing, thirst, tears, depression-like lament, memory, deep waters, and hope.','Emotional despair is voiced without shame. Do not use the refrain to dismiss depression or demand instant recovery.','Deep calls to deep when ordinary language runs out.'],
43:['Vindication, hostile opposition, light, truth, altar, and the Psalm 42 refrain.','Enemy language remains poetic and cannot justify harm.','Light and truth are imagined as guides back toward belonging.'],
44:['Communal defeat, ancestral memory, innocence protest, shame, slaughter, and divine hiddenness.','The psalm explicitly resists victim-blaming: suffering is not proof of communal guilt. Violent defeat must not justify holy war in response.','A community can protest to God rather than manufacture guilt for catastrophe.'],
45:['Royal wedding, beauty, warfare, throne language, bride, daughters, and dynastic hope.','Royal and gender hierarchy belongs to an ancient court poem; it cannot justify coercive marriage, patriarchy, or leader immunity.','Splendor is ethically empty unless the scepter bends toward justice.'],
46:['Refuge, earthquake, river, Zion, war, weapons, stillness, and divine presence.','The ending of war is the ethical horizon; the psalm is not permission for sacred violence or militarized nationalism.','Stillness is not passivity; it is a refusal to let chaos become sovereign.'],
47:['Divine kingship, peoples, nations, land, and praise.','Kingship language cannot be converted into theocratic domination or ethnic supremacy.','Praise imagines many peoples inside one horizon rather than one people erasing the rest.'],
48:['Zion, kings, city imagery, fear, temple, steadfast love, and memory.','Sacred geography must not be used to deny modern human rights, justify dispossession, or flatten contested history.','A holy place is remembered through justice and steadfast love, not only walls.'],
49:['Wealth, wisdom, mortality, ransom, Sheol, and human equality in death.','Wealth is not evidence of divine favor, and poverty is not evidence of failure.','Death levels the status games that wealth tries to make permanent.'],
50:['Divine judgment, sacrifice, covenant, gratitude, ethics, and hypocrisy.','Critique of sacrifice occurs within Israel’s own tradition and must never be used for anti-Jewish or supersessionist claims.','Ritual without ethical truth cannot purchase integrity.'],
51:['Repentance, Bathsheba/Uriah superscription, sin, cleansing, spirit, sacrifice, and restoration.','Repentance must name harm to people, not erase victims behind private God-talk. The psalm must not excuse sexual abuse, murder, or leader immunity.','A clean heart begins where self-protection stops hiding the people harmed.'],
52:['Doeg, abusive power, deceit, killing, wealth, judgment, and rooted trust.','Ancient villain labels cannot be mapped onto modern populations; judgment is not a license for revenge.','Power that feeds on harm is loud but not deeply rooted.'],
53:['Corruption, practical atheism, oppression, fear, restoration, and the Psalm 14 parallel.','“No God” language must not justify persecution of atheists; the poem’s target is corrupt and exploitative conduct.','A duplicate poem can preserve history through its differences.'],
54:['Ziphite superscription, betrayal, enemies, rescue, and thanksgiving.','The Ziphites are an ancient narrative group, not a modern ethnic code.','Betrayal narrows the world; trust opens it again.'],
55:['City violence, betrayal by a companion, fear, escape longing, imprecation, and burden-bearing.','The psalm’s death wishes are not permission for violence. Longing to flee danger can be a survival response, not cowardice.','Sometimes the deepest wound is not the enemy outside but the trusted person who breaks covenant.'],
56:['Capture, fear, tears, enemies, trust, vows, and life.','Fear is not spiritual failure; enemies in the superscription cannot be mapped to modern ethnic groups.','Even tears are counted as part of a life worth remembering.'],
57:['Cave superscription, refuge, lions, danger, steadfast heart, and praise.','Violent animal/enemy imagery is metaphorical lament and not a directive to attack people.','A cave can become a sanctuary before circumstances change.'],
58:['Corrupt rulers/judges, venom, broken teeth, miscarriage imagery, vengeance, and justice.','This is extreme imprecatory poetry. It must never authorize mutilation, killing, harm to children, pregnancy-loss stigma, or celebration of real bloodshed.','Rage at corrupt power should be preserved without turning rage into a weapon.'],
59:['Saul superscription, surveillance, violent pursuers, city imagery, judgment, and refuge.','The psalm’s enemies are ancient narrative opponents; do not turn them into modern target groups or justify vigilantism.','Being watched by hostile power intensifies fear, but refuge keeps identity from collapsing into pursuit.'],
60:['Military defeat, divine rejection language, tribal geography, Moab/Edom/Philistia, battle, and restoration.','Ancient war taunts and territorial claims are not modern political mandates. Never map these peoples onto living populations or use the psalm to justify war.','Defeat can puncture triumphalism and force power to reckon with dependence.']
};

function specialNote(ch,v){const n=notes[`${ch}:${v}`];return n?[n]:[];}
function terms(ch,v,text){
  const out=[]; const lower=text.toLowerCase();
  if(/\byhwh\b/i.test(text)) out.push({display:'YHWH',source:'יהוה',language:'Hebrew',glossary_id:'yhwh'});
  if(ch===36&&v===7) out.push({display:'steadfast love',source:'חֶסֶד',language:'Hebrew',glossary_id:'hesed'});
  if(ch===49&&v===15) out.push({display:'Sheol',source:'שְׁאוֹל',language:'Hebrew',glossary_id:'sheol'});
  if(ch===51&&v===10) out.push({display:'heart',source:'לֵב',language:'Hebrew',glossary_id:'lev'},{display:'spirit',source:'רוּחַ',language:'Hebrew',glossary_id:'ruach'});
  if(ch===51&&v===11) out.push({display:'holy spirit',source:'רוּחַ קָדְשְׁךָ',language:'Hebrew',glossary_id:'ruach-qodesh'});
  if(ch===58&&v===1) out.push({display:'mighty ones / difficult term',source:'אֵלֶם',language:'Hebrew',glossary_id:'elem-ps58'});
  return out;
}
function tags(text,ch,v){
  const t=['psalms','poetry']; const s=text.toLowerCase();
  if(/king|throne|sceptre|scepter/.test(s)) t.push('kingship');
  if(/poor|needy|oppress/.test(s)) t.push('poverty-justice');
  if(/sword|battle|war|blood|slay|kill|break.*teeth|smite|destroy|enemy|enemies/.test(s)) t.push('violence-war');
  if(/trust|refuge|shield/.test(s)) t.push('trust-refuge');
  if(/sick|disease|wound|bones|pain/.test(s)) t.push('suffering-body');
  if(/nation|people|land|earth/.test(s)) t.push('peoples-land');
  if(/praise|sing|song|worship/.test(s)) t.push('praise-worship');
  if(ch===42||ch===43) t.push('psalm-42-43-unity');
  if(ch===53) t.push('psalm-14-parallel');
  return [...new Set(t)];
}
function flags(text,ch,v){
  const out=[]; const s=text.toLowerCase();
  if(/enemy|enemies|destroy|slay|kill|blood|sword|battle|war|break.*teeth|smite|venge/.test(s)) out.push('poetic-violence-description-not-modern-authorization');
  if([37,44,48,54,56,59,60].includes(ch)) out.push('ancient-peoples-land-not-modern-target');
  if([32,38,41].includes(ch) && /sick|disease|bones|wound|pain|iniquity|sin/.test(s)) out.push('illness-disability-nonstigmatizing');
  if(ch===45) out.push('royal-gender-power-audit');
  if(ch===51 && (v===1||v===4)) out.push('victims-not-erased-by-leader-repentance');
  if(ch===58) out.push('imprecatory-violence-no-harm-authorization');
  return [...new Set(out)];
}
function crossRefs(ch,v){
  if(ch===31&&v===5) return [{reference:'Luke 23:46',relationship:'later-reception'}];
  if(ch===37&&v===11) return [{reference:'Matthew 5:5',relationship:'later-reception'}];
  if(ch===40&&v===6) return [{reference:'Hebrews 10:5-7',relationship:'LXX-based-later-reception'}];
  if(ch===42||ch===43) return [{reference:ch===42?'Psalm 43':'Psalm 42',relationship:'literary-continuation'}];
  if(ch===44&&v===22) return [{reference:'Romans 8:36',relationship:'later-reception'}];
  if(ch===45&&v===6) return [{reference:'Hebrews 1:8-9',relationship:'later-reception'}];
  if(ch===51) return [{reference:'2 Samuel 11-12',relationship:'superscription-reception-context'}];
  if(ch===53) return [{reference:'Psalm 14',relationship:'parallel-tradition'}];
  if(ch===60) return [{reference:'Psalm 108:6-13',relationship:'parallel-reuse'}];
  return [];
}
function mystical(ch,v,count){
  const m=meta[ch];
  if(v===1) return m[2];
  if(v===count) return `The prayer closes without erasing its tension: ${m[2].charAt(0).toLowerCase()+m[2].slice(1)}`;
  const third=count/3;
  if(v<=third) return `The poem enters through ${m[0].split(',').slice(0,3).join(',').toLowerCase()}, allowing what is real to be named before it is transformed.`;
  if(v<=third*2) return `Its center asks what becomes possible when fear, power, memory, and relationship are held in the presence of the Divine rather than acted out automatically.`;
  return m[2];
}

const bookDir=path.join(root,'scripture',BOOK_ID);
const mysticalDir=path.join(bookDir,'mystical');
fs.mkdirSync(bookDir,{recursive:true}); fs.mkdirSync(mysticalDir,{recursive:true});

for(let ch=START;ch<=END;ch++){
  const src=chapters.get(ch); if(!src?.length) throw new Error(`Missing Psalms ${ch}`);
  const m=meta[ch]; if(!m) throw new Error(`Missing metadata for Psalm ${ch}`);
  const verses=src.map(v=>{
    const n=Number(v.verse); const restored=overrides.get(`${ch}:${n}`)||restoreBase(v.text);
    return {verse:n,restored,familiar:{source:'KJV',text:v.text},notes:specialNote(ch,n),terms:terms(ch,n,restored),tags:tags(restored,ch,n),cross_references:crossRefs(ch,n),editorial_flags:flags(restored,ch,n)};
  });
  const restoredDoc={book:BOOK,book_id:BOOK_ID,chapter:ch,audit_status:{status:'draft-pending-deep-source-audit',source_base:'ChatGPT-authored Psalms completion draft using public-domain KJV as familiar alignment scaffold with curated Hebrew/textual overrides; full WLC/OSHB/source-witness audit pending',review_note:m[0]},verses,translation_notes:['This chapter completes corpus coverage as a ChatGPT-authored draft. KJV is retained as a familiar comparison layer; a separate automated reference pass adds BSB and pointed Hebrew without replacing the restored draft.'],safety_note:m[1],source_witness_audit_flags:['Compare directly with WLC/OSHB, Septuagint, Dead Sea Psalms witnesses where extant, and other textual witnesses during the global audit. Preserve poetic parallelism, superscriptions, duplicate/parallel psalms, and significant Hebrew/Greek divergences rather than harmonizing them.'],layer_status:{restored:true,familiar:'complete-KJV',verse_notes:'selective',source_terms:'selective-pending-deep-audit',tags:'baseline',cross_references:'selective',editorial_flags:'baseline',mystical_companion:'separate-file',modern_comparison:'pending-reference-backfill',original_language:'pending-reference-backfill'},generation_status:{status:'chatgpt-authored-completion-draft',intelligence:'ChatGPT conversation',external_ai_runner:false,continuity_audit:'pending-global-pass'}};
  const myst={book:BOOK,book_id:BOOK_ID,chapter:ch,layer:'mystical-companion',verses:src.map(v=>({verse:Number(v.verse),mystical_translation:mystical(ch,Number(v.verse),src.length)})),contemplative_note:m[2],safety_note:m[1],generation_status:{status:'chatgpt-authored-contemplative-draft',aligned_to_restored_chapter:true,continuity_audit:'pending-global-pass'}};
  fs.writeFileSync(path.join(bookDir,`${BOOK_ID}-${pad(ch)}.json`),JSON.stringify(restoredDoc,null,2)+'\n');
  fs.writeFileSync(path.join(mysticalDir,`${BOOK_ID}-${pad(ch)}-mystical.json`),JSON.stringify(myst,null,2)+'\n');
  console.log(`Prepared Psalm ${ch}: ${verses.length} verses`);
}

fs.writeFileSync(path.join(root,'metadata','psalms-progress.json'),JSON.stringify({book:BOOK,book_id:BOOK_ID,total_chapters:150,restored_chapters:60,mystical_chapters:60,complete:false,status:'in-progress-chatgpt-authored-draft',generation_model:'ChatGPT conversation',last_batch:'Psalms 31-60',continuity_audit:'pending-global-pass'},null,2)+'\n');
