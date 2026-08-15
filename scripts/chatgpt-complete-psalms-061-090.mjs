import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const basePath='scripts/chatgpt-complete-psalms-031-060.mjs';
let src=fs.readFileSync(basePath,'utf8');

const overrides=`const overrides = new Map(Object.entries({
  '61:2':'From the end of the earth I call to you when my heart grows faint; lead me to a rock higher than I.',
  '62:1':'For God alone my soul waits in silence; from him comes my salvation.',
  '63:1':'God, you are my God; I seek you earnestly. My soul thirsts for you; my flesh longs for you in a dry and weary land where there is no water.',
  '65:4':'Blessed is the one you choose and bring near to dwell in your courts; we are satisfied with the goodness of your house, your holy temple.',
  '68:4':'Sing to God; sing praises to his name. Lift up a song to the one who rides through the deserts [or clouds]; his name is YHWH. Rejoice before him.',
  '68:18':'You ascended on high; you led captives in your train; you received gifts among humanity—even among the rebellious—that YHWH God might dwell there.',
  '69:21':'They gave me poison for food, and for my thirst they gave me vinegar to drink.',
  '71:9':'Do not cast me away in the time of old age; do not forsake me when my strength fails.',
  '72:4':'May he judge the poor of the people, save the children of the needy, and crush the oppressor.',
  '72:12':'For he delivers the needy who cries out, the poor also, and the one who has no helper.',
  '73:17':'Until I entered the sanctuaries of God; then I understood their end.',
  '74:14':'You crushed the heads of Leviathan; you gave him as food to creatures of the wilderness.',
  '78:39':'He remembered that they were flesh, a passing wind that does not return.',
  '82:1':'God stands in the divine assembly; in the midst of the gods he judges.',
  '82:6':'I said, “You are gods, all of you children of the Most High.”',
  '84:5':'Blessed are those whose strength is in you, whose hearts are set on pilgrimage [literally: highways are in their heart].',
  '85:10':'Steadfast love and faithfulness meet; righteousness and peace kiss.',
  '87:4':'I will mention Rahab and Babylon among those who know me; behold Philistia and Tyre, with Cush—“This one was born there.”',
  '88:18':'You have put lover and friend far from me; darkness is my closest companion [Hebrew wording compressed].',
  '89:27':'I will also make him firstborn, highest of the kings of the earth.',
  '90:10':'The days of our years are seventy, or eighty if strength endures; yet their span is toil and trouble, for they pass quickly and we fly away.',
  '90:12':'Teach us to number our days so that we may gain a heart of wisdom.'
}));`;

const notes=`const notes = {
  '61:2':{title:'End of the earth',body:'This is poetic distance and disorientation, not a cosmological map. The prayer moves from faintness toward refuge.'},
  '68:4':{title:'Rider in the ʿaravot',body:'Hebrew ba-aravot is difficult in context and has been understood as deserts/steppes or linked poetically with cloud-rider imagery. The uncertainty should remain visible.'},
  '68:18':{title:'Received gifts / gave gifts',body:'The Hebrew text says the ascending figure “received gifts among humanity.” Ephesians 4:8 cites a form saying “gave gifts to people.” The reception difference is significant and should not be harmonized away.'},
  '69:21':{title:'Poison and vinegar',body:'This lament later shaped Gospel passion narratives. Its original setting remains a Jewish sufferer’s prayer and should not be erased by later Christian reception.'},
  '71:9':{title:'Old age',body:'The prayer asks not to be abandoned in aging. It should strengthen dignity for older people rather than frame age, dependence, or declining strength as spiritual failure.'},
  '72:1':{title:'Royal justice',body:'The psalm evaluates royal power by justice for poor and oppressed people. It does not grant sacred immunity to rulers.'},
  '72:8':{title:'Sea to sea',body:'Universal royal language is ancient court poetry. It must not become a mandate for empire, colonialism, conquest, or modern territorial domination.'},
  '73:3':{title:'Prosperity of the wicked',body:'The psalm openly observes that harmful people can prosper. Material success is therefore not reliable evidence of divine favor or moral worth.'},
  '74:13':{title:'Sea monsters and Leviathan',body:'The poem uses ancient chaos-combat imagery involving sea creatures and Leviathan. This is mythopoetic language, not zoology or a command to identify human enemies with monsters.'},
  '78:1':{title:'Historical recital',body:'Psalm 78 retells Israel’s past theologically and poetically. Its purpose differs from modern critical historiography, and tensions with other biblical accounts should be preserved.'},
  '79:1':{title:'Destroyed Jerusalem',body:'This communal lament speaks from catastrophe, desecration, killing, and grief. Such trauma must not be converted into permission for revenge or collective punishment.'},
  '82:1':{title:'Divine assembly',body:'Hebrew elohim appears both for God and for the beings/judges within the divine assembly. The verse preserves an ancient divine-council image rather than flattening every occurrence into the same referent.'},
  '82:6':{title:'“You are gods”',body:'The address to elohim is debated: divine beings, rulers, or judges have all been proposed. John 10:34 later cites this verse. The original ambiguity remains important.'},
  '83:1':{title:'Enemy coalition',body:'The named peoples belong to ancient poetic geography. They must never be mapped onto modern Jews, Palestinians, Arabs, Muslims, Christians, nations, ethnicities, or political opponents.'},
  '84:5':{title:'Highways in the heart',body:'The Hebrew phrase is compact and can evoke pilgrimage roads held inwardly. English versions differ in how much interpretation they supply.'},
  '85:10':{title:'Hesed and emet',body:'The line pairs hesed (steadfast/covenant love), emet (faithfulness/truth), righteousness, and peace in poetic personification.'},
  '87:4':{title:'Rahab here',body:'Rahab in this verse is a poetic name for Egypt, not the woman Rahab of Joshua. The striking point is the inclusion of former or foreign powers among those who “know” God.'},
  '88:18':{title:'Ending in darkness',body:'Psalm 88 closes without a conventional turn to praise. Scripture preserves unresolved despair. This must not be used to shame depression, demand forced optimism, or romanticize self-harm.'},
  '89:38':{title:'Covenant crisis',body:'The psalm boldly says the promised Davidic order appears rejected and broken. The contradiction between promise and experience is part of the text’s theology and should not be harmonized away.'},
  '90:10':{title:'Seventy or eighty years',body:'This poetic observation about human mortality is not a divinely fixed maximum lifespan and should not be treated as a medical or prophetic rule.'}
};`;

const meta=`const meta = {
61:['Distance, refuge, king imagery, vows, protection, and faintness.','Royal and enemy language is devotional poetry, not leader immunity or permission to harm opponents.','When the heart grows faint, refuge can be imagined as ground higher than the crisis.'],
62:['Silence, salvation, violence, status, wealth, and trust.','Wealth and rank are unstable measures of worth; violence and extortion are rejected rather than sanctified.','Silence becomes a place where identity is no longer negotiated with every threat.'],
63:['Thirst, wilderness, embodied longing, praise, king, and enemies.','Enemy language must not become modern targeting; embodied spiritual longing should not be used to deny physical needs.','Desire becomes prayer when the whole body is allowed to tell the truth about thirst.'],
64:['Secret plots, weaponized speech, fear, judgment, and refuge.','The psalm condemns conspiratorial harm but must not justify paranoia, harassment, or violence toward suspected enemies.','Hidden speech can wound; truth asks us not to become what we fear.'],
65:['Forgiveness, temple, creation, rain, harvest, abundance, and praise.','Agricultural abundance is gratitude poetry, not a promise that faithful people will avoid drought, poverty, or disaster.','Creation is pictured as a field receiving enough to sing.'],
66:['Communal praise, testing, fire, water, vows, and testimony.','Hardship language must not become a theology that God deliberately abuses people for growth.','Survival can become testimony without pretending the fire was good.'],
67:['Blessing, nations, earth, harvest, and divine justice.','Blessing is expansive rather than ethnically exclusive; it must not support supremacy or coercive mission.','The poem imagines blessing widening until many peoples can rejoice.'],
68:['Divine procession, difficult Hebrew, Sinai, vulnerable people, war, kings, gifts, and sanctuary.','Ancient divine-war imagery and defeated-enemy language are not authorization for holy war, ethnic hatred, or modern violence.','Power is reimagined beside care for orphans, widows, the lonely, and the oppressed.'],
69:['Flood imagery, shame, zeal, enemies, poison/vinegar, imprecation, poor people, and praise.','Extreme curses remain lament language, not permission for revenge. Later Christian reception must not erase the psalm’s Jewish voice.','A drowning prayer can still name both injury and the hope of being heard.'],
70:['Urgent rescue, enemies, shame, seeking, and praise.','Requests for enemies’ shame are prayer-poetry and cannot authorize harassment or retaliation.','Urgency itself can be prayer when there is no time for polished language.'],
71:['Aging, lifelong trust, enemies, bodily weakness, memory, and praise.','Old age, disability, and declining strength carry full dignity and must never be framed as abandonment or moral failure.','A life can keep becoming prayer even as strength changes.'],
72:['Royal justice, poor and needy people, empire-scale language, tribute, abundance, and peace.','Kingship is judged by protection of vulnerable people; universal rule language cannot justify colonialism, theocracy, or leader immunity.','The measure of a throne is whether the person with no helper is heard.'],
73:['Envy, prosperity of harmful people, doubt, sanctuary insight, body, and nearness to God.','Prosperity is explicitly shown as morally unreliable; suffering is not proof of failure and wealth is not proof of blessing.','Envy loses some of its spell when the story is viewed from beyond the present moment.'],
74:['Temple destruction, communal catastrophe, enemy violence, creation, sea monsters, and lament.','Sacred-site destruction and enemy language must not justify retaliation against modern religions, ethnicities, or civilians.','Trauma asks memory to hold both ruined sanctuary and a world that still belongs to the Creator.'],
75:['Thanksgiving, judgment, arrogant power, cup imagery, and divine sovereignty.','Judgment language does not license humans to punish ideological opponents in God’s name.','Power is unstable when it forgets that no throne is self-created.'],
76:['Judah/Zion, weapons, battle, judgment, fear, and vows.','Divine-war poetry cannot authorize militarism, nationalism, or violence against modern peoples.','The poem imagines weapons losing their final word.'],
77:['Sleepless distress, memory, doubt, wonders, waters, and exodus imagery.','Spiritual anguish and sleeplessness are not failures of faith; the psalm permits difficult questions without shame.','Memory becomes a rope across the gap when present experience feels silent.'],
78:['Teaching, generational memory, rebellion, miracles, plagues, wilderness, war, David, and historical recital.','Violence, plague, and punishment in theological history must not justify collective punishment, child harm, disease moralization, or ethnic hatred.','Memory is useful when it teaches responsibility rather than inherited superiority.'],
79:['Jerusalem destroyed, bodies, blood, grief, nations, vengeance, and communal survival.','This atrocity lament must never authorize revenge, genocide, collective punishment, or modern enemy-mapping.','Grief names desecration honestly without requiring survivors to become destroyers.'],
80:['Shepherd imagery, national lament, tears, vine, restoration, and divine presence.','The vine/land imagery is ancient covenant poetry, not a modern territorial deed or justification for displacement.','Restoration is imagined as a face turning again toward people who feel uprooted.'],
81:['Festival, exodus memory, divine voice, other gods, warning, and abundance.','Religious exclusivity language belongs to ancient Israel’s covenant setting and must not justify persecution of other faiths or spiritual practices.','Listening is pictured as the road not taken—the opening where coercion gives way to relationship.'],
82:['Divine council, elohim, unjust judgment, poor and needy people, gods, mortality, and justice.','The psalm’s target is corrupt power. “Gods” language must not be used to dehumanize people or claim unquestionable authority for leaders.','Even heavenly-sounding authority is judged by how it treats the weak.'],
83:['Enemy coalition, named ancient peoples, conspiracy, violent imprecation, land, and divine-name petition.','This psalm carries extreme modern reception risk. Ancient names must never be mapped onto living ethnic, national, religious, or political groups, and its curses cannot authorize violence.','Fear of encirclement is preserved as prayer without turning ancient names into contemporary targets.'],
84:['Temple longing, pilgrimage, sparrow imagery, strength, thresholds, and blessing.','Sacred-space longing must not be weaponized to exclude others or justify control of contested holy places.','Pilgrimage begins before the road when the heart makes room for a path.'],
85:['Restoration, land, forgiveness, steadfast love, faithfulness, righteousness, peace, and harvest.','Land restoration is ancient communal poetry, not a modern entitlement to dispossession.','Love and faithfulness meet where justice and peace are allowed to kiss.'],
86:['Prayer of the poor, mercy, nations, instruction, enemies, and compassion.','Poverty is not failure; enemy language cannot become permission for harm or ethnic targeting.','An undivided heart is not a flawless heart but one learning where to turn.'],
87:['Zion, nations, Rahab/Egypt, Babylon, Philistia, Tyre, Cush, birth, and belonging.','The psalm’s surprising inclusion of foreign peoples should not be reversed into ethnic exclusion or territorial supremacy.','Belonging expands when former outsiders are spoken of as born within the city of God.'],
88:['Unrelieved lament, death, Sheol, isolation, divine hiddenness, friends, and darkness.','This psalm preserves profound despair without blaming the sufferer. It must not romanticize self-harm or be used to shame depression or require forced optimism.','Some prayers end in darkness; their presence in scripture means darkness is still allowed to speak.'],
89:['Steadfast love, covenant, divine council, Davidic king, creation, military power, rejection, broken promise, and lament.','Royal covenant language does not grant modern leaders immunity or create a modern territorial mandate. The psalm itself challenges apparent covenant failure.','Faith can include bringing a broken promise back to the One who made it.'],
90:['Moses superscription, eternity, mortality, divine anger, lifespan, wisdom, work, and compassion.','Mortality language is not a fixed lifespan rule, and suffering must not be reduced to punishment.','Numbering days means letting finitude teach attention rather than fear.' ]
};`;

const functions=`function specialNote(ch,v){const n=notes[\`${'${ch}:${v}'}\`];return n?[n]:[];}
function terms(ch,v,text){
  const out=[];
  if(/\\byhwh\\b/i.test(text)) out.push({display:'YHWH',source:'יהוה',language:'Hebrew',glossary_id:'yhwh'});
  if(ch===82&&(v===1||v===6)) out.push({display:'elohim / gods',source:'אֱלֹהִים',language:'Hebrew',glossary_id:'elohim-divine-council'});
  if(ch===85&&v===10) out.push({display:'steadfast love',source:'חֶסֶד',language:'Hebrew',glossary_id:'hesed'},{display:'faithfulness',source:'אֱמֶת',language:'Hebrew',glossary_id:'emet'},{display:'peace',source:'שָׁלוֹם',language:'Hebrew',glossary_id:'shalom'});
  if(ch===88&&v===18) out.push({display:'darkness',source:'מַחְשָׁךְ',language:'Hebrew',glossary_id:'machshak'});
  return out;
}
function tags(text,ch,v){
  const t=['psalms','poetry'];
  if(/\\b(?:king|kings|throne|sceptre|scepter)\\b/i.test(text)) t.push('kingship');
  if(/\\b(?:poor|poverty|needy|oppress|oppressed|oppressor)\\b/i.test(text)) t.push('poverty-justice');
  if(/\\b(?:enemy|enemies|destroy|destroys|destroyed|slay|slays|slain|kill|kills|killed|blood|bloodshed|sword|swords|battle|battles|war|wars|smite|smites|smitten|vengeance|violent|violence|weapon|weapons|spear|spears|arrow|arrows)\\b|break(?:s|ing)?\\s+(?:their\\s+)?teeth|dash(?:ed|es|ing)?\\s+.*pieces/i.test(text)) t.push('violence-war');
  if(/\\b(?:trust|refuge|shield)\\b/i.test(text)) t.push('trust-refuge');
  if(/\\b(?:sick|disease|wound|wounds|bones|pain|weakness)\\b/i.test(text)) t.push('suffering-body');
  if(/\\b(?:nation|nations|people|peoples|land|earth)\\b/i.test(text)) t.push('peoples-land');
  if(/\\b(?:praise|sing|song|worship)\\b/i.test(text)) t.push('praise-worship');
  if(ch===82) t.push('divine-council');
  if(ch===83) t.push('ancient-enemy-coalition');
  if(ch===88) t.push('unresolved-lament');
  if(ch===89) t.push('covenant-crisis');
  return [...new Set(t)];
}
function flags(text,ch,v){
  const out=[];
  if(/\\b(?:enemy|enemies|destroy|destroys|destroyed|slay|slays|slain|kill|kills|killed|blood|bloodshed|sword|swords|battle|battles|war|wars|smite|smites|smitten|vengeance|violent|violence|weapon|weapons|spear|spears|arrow|arrows)\\b|break(?:s|ing)?\\s+(?:their\\s+)?teeth|dash(?:ed|es|ing)?\\s+.*pieces/i.test(text)) out.push('poetic-violence-description-not-modern-authorization');
  if([68,74,76,78,79,80,83,87,89].includes(ch)) out.push('ancient-peoples-land-not-modern-target');
  if(ch===71) out.push('aging-disability-dignity');
  if(ch===72) out.push('leader-accountability-no-sacred-immunity');
  if(ch===73) out.push('prosperity-not-moral-proof');
  if(ch===78) out.push('collective-punishment-and-disease-nonendorsement');
  if(ch===79||ch===83) out.push('imprecatory-violence-no-harm-authorization');
  if(ch===82) out.push('authority-accountability');
  if(ch===88) out.push('despair-nonstigmatizing-no-self-harm-romanticization');
  if(ch===89) out.push('leader-accountability-no-sacred-immunity');
  return [...new Set(out)];
}
function crossRefs(ch,v){
  if(ch===68&&v===18) return [{reference:'Ephesians 4:8',relationship:'variant-later-reception'}];
  if(ch===69&&v===9) return [{reference:'John 2:17',relationship:'later-reception'}];
  if(ch===69&&v===21) return [{reference:'Matthew 27:34,48; John 19:28-30',relationship:'later-reception'}];
  if(ch===72) return [{reference:'Isaiah 11:1-5',relationship:'royal-justice-theme'}];
  if(ch===78) return [{reference:'Exodus 7-17',relationship:'historical-retelling'}];
  if(ch===82&&v===6) return [{reference:'John 10:34-36',relationship:'later-reception'}];
  if(ch===89) return [{reference:'2 Samuel 7',relationship:'davidic-covenant-dialogue'}];
  if(ch===90) return [{reference:'Deuteronomy 32-33',relationship:'moses-tradition'}];
  return [];
}
function mystical(ch,v,count){
  const m=meta[ch];
  if(v===1) return m[2];
  if(v===count) return \`The prayer closes without erasing its tension: \${m[2].charAt(0).toLowerCase()+m[2].slice(1)}\`;
  const third=count/3;
  if(v<=third) return \`The poem enters through \${m[0].split(',').slice(0,3).join(',').toLowerCase()}, allowing what is real to be named before it is transformed.\`;
  if(v<=third*2) return 'Its center asks what becomes possible when fear, power, memory, and relationship are held in the presence of the Divine rather than acted out automatically.';
  return m[2];
}`;

src=src.replace('const START = 31;','const START = 61;').replace('const END = 60;','const END = 90;');
src=src.replace(/const overrides = new Map\(Object\.entries\(\{[\s\S]*?\}\)\);/,overrides);
src=src.replace(/const notes = \{[\s\S]*?\n\};\n\nconst meta =/,notes+'\n\nconst meta =');
src=src.replace(/const meta = \{[\s\S]*?\n\};\n\nfunction specialNote[\s\S]*?\nfunction mystical\(ch,v,count\)\{[\s\S]*?\n\}/,meta+'\n\n'+functions);
src=src.replace('restored_chapters:60,mystical_chapters:60','restored_chapters:90,mystical_chapters:90').replace("last_batch:'Psalms 31-60'","last_batch:'Psalms 61-90'");

const generated='scripts/.chatgpt-psalms-061-090.generated.mjs';
fs.writeFileSync(generated,src);
const result=spawnSync(process.execPath,[generated],{stdio:'inherit'});
fs.rmSync(generated,{force:true});
if(result.status!==0) process.exit(result.status??1);
