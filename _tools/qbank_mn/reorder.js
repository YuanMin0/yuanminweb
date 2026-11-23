/* 精确重排：按题干关键词把每道题放到唯一目标知识点
   先 dry-run（不写文件），确认分配合理后再 --write */
'use strict';
const fs = require('fs');

const PLANS = {
  'internal-nursing': {
    chapters: 6,
    rules: [
      { re: /肺炎|肺脓肿|支气管扩张|体位引流/, ch: 1, k: 1, name: '肺炎/肺脓肿/支扩' },
      { re: /肺结核|哮喘|COPD|慢性阻塞|肺源性心脏病|缩唇/, ch: 1, k: 2, name: '肺结核/哮喘/COPD' },
      { re: /呼吸衰竭|气胸|机械通气|ARDS|氧合指数|胸腔闭式/, ch: 1, k: 3, name: '呼衰/气胸/机械通气' },
      { re: /咯血|咳痰|咳嗽|氧疗|铁锈色痰|粉红色泡沫痰|吸痰|叩击|痰液/, ch: 1, k: 0, name: '呼吸症状/排痰/氧疗' },
      { re: /心力衰竭|心衰|洋地黄|肺水肿|利尿剂/, ch: 2, k: 0, name: '心力衰竭' },
      { re: /高血压|心绞痛|心肌梗死|冠心病|硝酸甘油/, ch: 2, k: 1, name: '高血压/冠心病' },
      { re: /溃疡|上消化道出血|黑便|三腔|呕血|大出血/, ch: 3, k: 0, name: '溃疡/上消化道出血' },
      { re: /肝硬化|肝性脑病|腹水|灌肠/, ch: 3, k: 1, name: '肝硬化/肝性脑病' },
      { re: /尿路|肾衰|透析|内瘘|膀胱|尿路感染/, ch: 4, k: 0, name: '泌尿护理' },
      { re: /贫血|白血病|血小板|铁剂|DIC|弥散性血管内凝血|化疗/, ch: 5, k: 0, name: '血液护理' },
      { re: /甲亢|甲状腺|抗甲状腺|碘剂|甲状腺危象/, ch: 6, k: 0, name: '甲亢护理' },
      { re: /糖尿病|血糖|胰岛素|低血糖|酮症|DKA|糖化|糖尿病足|五驾马车/, ch: 6, k: 1, name: '糖尿病护理' }
    ],
    fallback: { ch: 1, k: 0 }
  },
  endocrinology: {
    chapters: 3,
    rules: [
      { re: /Graves|甲亢|甲状腺功能亢进|甲状腺危象|抗甲状腺|放射性碘|胫前|突眼|甲状腺功能最敏感/, ch: 2, k: 0, name: '甲亢' },
      { re: /甲减|甲状腺功能减退|甲状腺炎|桥本|亚急性甲状腺|L-T4|左甲状腺素|黏液性水肿/, ch: 2, k: 1, name: '甲减/甲状腺炎' },
      { re: /糖尿病酮症|DKA|高渗高血糖|酮症酸中毒/, ch: 3, k: 1, name: '糖尿病急性并发症' },
      { re: /二甲双胍|降糖|α-糖苷酶|胰岛素治疗|低血糖|心肾保护/, ch: 3, k: 2, name: '糖尿病治疗' },
      { re: /糖尿病|OGTT|空腹血糖|HbA1c|糖化血红蛋白|血糖控制|1 型|2 型|胰岛素抵抗/, ch: 3, k: 0, name: '糖尿病诊断分型' },
      { re: /反馈|三层诊断|诊断层次|定位诊断|垂体|PTH|甲状旁腺|促激素|TSH|靶腺/, ch: 1, k: 1, name: '反馈/诊断体系' },
      { re: /激素|受体|分泌方式|允许作用|自分泌|旁分泌|皮质醇/, ch: 1, k: 0, name: '激素分类与机制' }
    ],
    fallback: { ch: 1, k: 0 }
  },
  'surgery-nursing': {
    chapters: 5,
    rules: [
      { re: /低钾|高钾|补钾|酸碱|代谢性酸|代谢性碱|钾代谢/, ch: 1, k: 1, name: '钾/酸碱' },
      { re: /缺水|脱水|等渗|低渗|高渗|补液/, ch: 1, k: 0, name: '缺水/补液' },
      { re: /CVP|中心静脉压|休克护理|休克体位|休克病人应/, ch: 2, k: 1, name: '休克护理/CVP' },
      { re: /休克|休克指数|感染性休克|失血性休克/, ch: 2, k: 0, name: '休克分期' },
      { re: /麻醉|腰麻|硬膜外|全麻|局麻|气管插管/, ch: 3, k: 0, name: '麻醉' },
      { re: /术前|术后|禁食|切口|深静脉血栓|早期活动/, ch: 3, k: 1, name: '围手术期' },
      { re: /破伤风|丹毒|疖|痈|外科感染|危险三角/, ch: 4, k: 0, name: '外科感染' },
      { re: /烧伤|焦痂|水疱|面积/, ch: 4, k: 1, name: '烧伤' },
      { re: /肿瘤|化疗|放疗|癌痛|白细胞/, ch: 4, k: 2, name: '肿瘤护理' },
      { re: /胸腔闭式|气胸|引流|反常呼吸|肋骨骨折/, ch: 5, k: 0, name: '胸部损伤/引流' },
      { re: /腹膜炎|胆囊|胆总管|T 管|急腹症|Charcot|Murphy/, ch: 5, k: 1, name: '急腹症/胆道' },
      { re: /骨折|石膏|牵引|骨筋膜|脂肪栓塞|脊柱骨折/, ch: 5, k: 2, name: '骨折/骨科' }
    ],
    fallback: { ch: 1, k: 0 }
  }
};

const norm = s => String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!\"']/g, '').toLowerCase();
const WRITE = process.argv.includes('--write');

for (const [id, plan] of Object.entries(PLANS)) {
  const p = 'data/' + id + '.js';
  let cap = null;
  const WB = { register: o => { cap = o; }, registerExam: () => {} };
  new Function('window', 'WB', fs.readFileSync(p, 'utf8'))({ WB }, WB);

  // 收集全部题
  const all = [];
  cap.chapters.forEach(c => (c.knowledge || []).forEach(k => {
    (k.quiz || []).forEach(q => all.push(q));
  }));

  // 清空
  cap.chapters.forEach(c => (c.knowledge || []).forEach(k => { k.quiz = []; }));

  const stat = {};
  const unmatched = [];
  for (const q of all) {
    let hit = null;
    for (const r of plan.rules) { if (r.re.test(q.stem)) { hit = r; break; } }
    if (!hit) { hit = Object.assign({ name: '未匹配→默认' }, plan.fallback); unmatched.push(q.stem.slice(0, 30)); }
    const ch = cap.chapters[hit.ch - 1];
    const k = ch && (ch.knowledge || [])[hit.k];
    if (!k) continue;
    if (k.quiz.some(x => norm(x.stem) === norm(q.stem))) continue;
    k.quiz.push(q);
    stat[hit.name] = (stat[hit.name] || 0) + 1;
  }

  console.log('#####', id, 'total', all.length);
  Object.entries(stat).forEach(([k, v]) => console.log('  ', String(v).padStart(3), k));
  console.log('   未匹配', unmatched.length, unmatched.slice(0, 6));

  if (WRITE) {
    fs.writeFileSync(p, 'WB.register(' + JSON.stringify(cap, null, 2) + ');\n', 'utf8');
    console.log('   written');
  }
}
