/* 修复题目章节错位：按题干关键词把题移回正确章节的知识点
   只处理明确错位的科目，规则保守，避免误移。 */
'use strict';
const fs = require('fs');

const PLAN = {
  'internal-nursing': [
    { re: /糖尿病|血糖|胰岛素|低血糖|酮症|DKA|糖化血红蛋白/, ch: 6, k: 1 },
    { re: /甲亢|甲状腺|抗甲状腺|碘剂/, ch: 6, k: 0 },
    { re: /贫血|白血病|血小板|凝血|DIC|铁剂/, ch: 5, k: 0 },
    { re: /尿路|肾衰|透析|内瘘|膀胱/, ch: 4, k: 0 },
    { re: /肺炎|哮喘|肺结核|COPD|呼吸衰竭|气胸|咯血|痰/, ch: 1, k: 0 },
    { re: /心力衰竭|洋地黄|心衰|高血压|心绞痛|心肌梗死|冠心病/, ch: 2, k: 0 },
    { re: /溃疡|上消化道出血|肝硬化|肝性脑病|三腔/, ch: 3, k: 0 }
  ],
  endocrinology: [
    { re: /Graves|甲亢|甲状腺|TSH|甲减|桥本|L-T4|左甲状腺素|甲状腺危象|胫前/, ch: 2, k: 0 },
    { re: /糖尿病|血糖|胰岛素|酮症|DKA|二甲双胍|HbA1c|糖化|高渗/, ch: 3, k: 0 },
    { re: /激素|受体|反馈|垂体|PTH|甲状旁腺|内分泌/, ch: 1, k: 0 }
  ],
  'surgery-nursing': [
    { re: /骨折|石膏|牵引|骨筋膜|脂肪栓塞|脊柱/, ch: 5, k: 2 },
    { re: /肿瘤|化疗|放疗|癌痛|白细胞/, ch: 4, k: 2 },
    { re: /烧伤|面积|焦痂|水疱/, ch: 4, k: 1 },
    { re: /休克|CVP|中心静脉压/, ch: 2, k: 0 },
    { re: /麻醉|腰麻|硬膜外|全麻|局麻/, ch: 3, k: 0 },
    { re: /缺水|补钾|低钾|高钾|酸碱|等渗|高渗|低渗/, ch: 1, k: 0 },
    { re: /胸腔闭式|气胸|引流|腹膜炎|胆囊|胆总管|T 管/, ch: 5, k: 0 }
  ]
};

const norm = s => String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!\"']/g, '').toLowerCase();

for (const [id, rules] of Object.entries(PLAN)) {
  const p = 'data/' + id + '.js';
  let cap = null;
  const WB = { register: o => { cap = o; }, registerExam: () => {} };
  new Function('window', 'WB', fs.readFileSync(p, 'utf8'))({ WB }, WB);

  const moved = [];
  // 先全部摘出
  const all = [];
  cap.chapters.forEach((c, ci) => (c.knowledge || []).forEach((k, ki) => {
    const keep = [];
    (k.quiz || []).forEach(q => {
      let target = null;
      for (const r of rules) {
        if (r.re.test(q.stem)) { target = r; break; }
      }
      if (target && (target.ch !== ci + 1 || target.k !== ki)) {
        all.push({ q, ch: target.ch, k: target.k, from: `ch${ci + 1}-k${ki + 1}` });
      } else {
        keep.push(q);
      }
    });
    k.quiz = keep;
  }));

  // 再插入目标位置（去重）
  for (const it of all) {
    const ch = cap.chapters[it.ch - 1];
    const k = ch && (ch.knowledge || [])[it.k];
    if (!k) continue;
    k.quiz = k.quiz || [];
    if (k.quiz.some(x => norm(x.stem) === norm(it.q.stem))) continue;
    k.quiz.push(it.q);
    moved.push(`${it.from}→ch${it.ch}-k${it.k + 1}: ${it.q.stem.slice(0, 22)}`);
  }

  fs.writeFileSync(p, 'WB.register(' + JSON.stringify(cap, null, 2) + ');\n', 'utf8');
  console.log(id, 'moved', moved.length);
  moved.slice(0, 12).forEach(m => console.log('   ', m));
}
