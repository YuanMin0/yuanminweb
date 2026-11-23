/* 补题批次 1：pathology +2、hematology +5、infectious +8、cardiology +8 */
'use strict';
const fs = require('fs');

const ADD = {
  pathology: [
    { ch: 2, q: { type: 'single', stem: '骨折愈合过程中，使骨折达到临床愈合的是：', options: ['血肿形成', '纤维性骨痂', '骨性骨痂', '软骨组织'], answer: 2, explain: '骨折愈合分四期：血肿形成 → 纤维性骨痂 → 骨性骨痂 → 骨痂改建。<b>骨性骨痂</b>将骨折断端牢固连接，达到临床愈合；此后经改建恢复原有结构。纤维性骨痂只是初步连接，尚不能承受负重。', source: '《病理学》教材·损伤的修复（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 2, q: { type: 'single', stem: '关于瘢痕组织的特点，错误的是：', options: ['由大量胶原纤维构成', '血管丰富、细胞多', '质地坚硬、缺乏弹性', '可发生收缩'], answer: 1, explain: '瘢痕组织是肉芽组织经纤维化转变而来，<b>胶原纤维多、血管和细胞少</b>，故质地硬、弹性差，可收缩引起器官变形或狭窄。血管丰富、细胞多是肉芽组织的特点，不是瘢痕组织。', source: '《病理学》教材·损伤的修复（拓展题）', freq: '低频', tested: '未考过' } }
  ],
  hematology: [
    { ch: 1, q: { type: 'single', stem: '提示红细胞破坏增加（溶血）最直接的实验室依据是：', options: ['网织红细胞减少', '血清结合珠蛋白升高', '血清游离胆红素升高', '血清铁蛋白降低'], answer: 2, explain: '溶血时红细胞破坏增多，血红蛋白分解产生大量<b>游离胆红素</b>，超过肝脏处理能力即升高。同时结合珠蛋白被消耗而<b>降低</b>、网织红细胞代偿性<b>升高</b>。因此「结合珠蛋白升高」「网织红细胞减少」均与溶血相反。', source: '《血液系统》教材·贫血总论（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 1, q: { type: 'single', stem: '阵发性睡眠性血红蛋白尿（PNH）最有诊断价值的指标是：', options: ['CD55/CD59 表达缺失', 'Coombs 试验阳性', '血红蛋白电泳异常', '骨髓铁染色细胞外铁增多'], answer: 0, explain: 'PNH 是获得性红细胞膜<b>GPI 锚连蛋白（CD55、CD59）缺失</b>，导致补体调节缺陷、血管内溶血。流式细胞术检测 CD55/CD59 表达缺失是确诊依据。Coombs 试验阳性见于自身免疫性溶血；血红蛋白电泳异常见于地中海贫血。', source: '《血液系统》教材·溶血性贫血（拓展题）', freq: '低频', tested: '未考过' } },
    { ch: 1, q: { type: 'single', stem: '温抗体型自身免疫性溶血性贫血的首选治疗是：', options: ['脾切除', '糖皮质激素', '环孢素', '反复输血'], answer: 1, explain: '温抗体型 AIHA 一线治疗为<b>糖皮质激素</b>（如泼尼松），多数可获缓解；激素无效或需大剂量维持者考虑脾切除，二线可用利妥昔单抗、免疫抑制剂。输血仅用于重度贫血的应急支持，不是首选。', source: '《血液系统》教材·溶血性贫血（拓展题）', freq: '低频', tested: '未考过' } },
    { ch: 3, q: { type: 'single', stem: '输血过程中最严重的即时不良反应是：', options: ['发热反应', '过敏反应', '急性溶血反应', '循环超负荷'], answer: 2, explain: '急性溶血反应多因 ABO 血型不合，输入的红细胞被迅速破坏，可出现寒战高热、腰背痛、血红蛋白尿、低血压甚至 DIC 和急性肾损伤，<b>病死率高</b>，是最严重的即时反应。发热、过敏反应常见但多轻微。', source: '《血液系统》教材·输血并发症（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 1, q: { type: 'single', stem: '长期反复输血的重型地中海贫血患者最需警惕的并发症是：', options: ['缺铁性贫血', '铁过载', '叶酸缺乏', '维生素 B₁₂ 缺乏'], answer: 1, explain: '每单位红细胞含铁约 200 mg，长期输血而人体缺乏主动排铁途径，铁沉积于<b>心脏、肝脏、内分泌腺</b>，导致心功能不全、肝纤维化、糖尿病等，需定期监测血清铁蛋白并驱铁治疗。地中海贫血本身不缺铁，反复输血不会导致缺铁。', source: '《血液系统》教材·贫血治疗（拓展题）', freq: '低频', tested: '未考过' } }
  ],
  infectious: [
    { ch: 1, q: { type: 'single', stem: '病原体侵入人体后仅诱导特异性免疫应答、不出现临床症状，称为：', options: ['病原体被清除', '隐性感染', '显性感染', '病原携带状态'], answer: 1, explain: '隐性感染（亚临床感染）指病原体侵入后机体产生特异性免疫应答而<b>无明显临床症状</b>，是大多数传染病最常见的表现，也是重要的传染源来源。病原携带状态有病原体排出但可无免疫应答；显性感染即出现典型症状。', source: '《传染病学》教材·总论（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 2, q: { type: 'single', stem: '乙型肝炎「大三阳」是指下列哪组标志物阳性：', options: ['HBsAg、抗-HBe、抗-HBc', 'HBsAg、HBeAg、抗-HBc', '抗-HBs、抗-HBe、抗-HBc', 'HBsAg、抗-HBs、HBeAg'], answer: 1, explain: '「大三阳」为 <b>HBsAg、HBeAg、抗-HBc</b> 阳性，提示病毒复制活跃、传染性强。「小三阳」为 HBsAg、抗-HBe、抗-HBc 阳性。抗-HBs 是保护性抗体，单独阳性提示免疫成功。', source: '《传染病学》教材·病毒性肝炎（拓展题）', freq: '高频', tested: '未考过' } },
    { ch: 2, q: { type: 'single', stem: '丙型肝炎最主要的传播途径是：', options: ['粪-口传播', '血液及体液传播', '呼吸道飞沫传播', '虫媒传播'], answer: 1, explain: 'HCV 主要经<b>血液、血制品、性接触及母婴</b>传播，静脉药瘾共用注射器是重要途径。粪-口传播是甲型、戊型肝炎的主要途径；呼吸道与虫媒不是肝炎病毒的传播方式。', source: '《传染病学》教材·病毒性肝炎（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 3, q: { type: 'single', stem: '流行性脑脊髓膜炎的病原体是：', options: ['脑膜炎奈瑟菌', '乙型脑炎病毒', '肺炎链球菌', '流感嗜血杆菌'], answer: 0, explain: '流脑由<b>脑膜炎奈瑟菌（脑膜炎球菌）</b>引起，经呼吸道传播，冬春季高发，表现为高热、头痛、皮肤瘀点瘀斑、脑膜刺激征。乙脑由病毒引起、经蚊传播；肺炎链球菌与流感嗜血杆菌可引起化脓性脑膜炎但非流脑病原。', source: '《传染病学》教材·细菌性感染（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 3, q: { type: 'single', stem: '流行性脑脊髓膜炎的脑脊液典型改变是：', options: ['细胞数正常、糖正常', '白细胞显著升高、以中性粒细胞为主、糖明显降低', '淋巴细胞为主、糖正常', '蛋白明显降低'], answer: 1, explain: '化脓性脑膜炎（含流脑）脑脊液呈<b>化脓性改变</b>：压力升高、白细胞显著增多且以中性粒细胞为主、蛋白升高、<b>糖明显降低</b>、氯化物降低。病毒性脑炎多淋巴细胞为主、糖正常；结核性脑膜炎以淋巴细胞为主、糖降低但程度较轻。', source: '《传染病学》教材·中枢神经系统感染（拓展题）', freq: '高频', tested: '未考过' } },
    { ch: 5, q: { type: 'single', stem: '伤寒患者解除隔离的实验室标准是：', options: ['体温恢复正常', '症状完全消失', '连续两次粪便培养阴性', '肥达反应转阴'], answer: 2, explain: '伤寒患者临床症状消失后仍可经粪便排菌，必须<b>连续两次粪便（或尿）培养阴性</b>方可解除隔离。体温正常、症状消失只是临床治愈，不能排除带菌状态；肥达反应转阴慢且不用于解除隔离。', source: '《传染病学》教材·伤寒（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 5, q: { type: 'single', stem: '阿米巴痢疾的典型粪便性状是：', options: ['米泔水样便', '黏液脓血便', '果酱样腥臭便', '柏油样便'], answer: 2, explain: '阿米巴痢疾由溶组织内阿米巴侵袭结肠形成烧瓶样溃疡，粪便呈<b>暗红色果酱样、腥臭</b>，镜检可见吞噬红细胞的滋养体。米泔水样便见于霍乱；黏液脓血便伴里急后重见于细菌性痢疾；柏油样便提示上消化道出血。', source: '《传染病学》教材·原虫病（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 1, q: { type: 'single', stem: '医院感染中最常见的多重耐药菌是：', options: ['肺炎链球菌', '耐甲氧西林金黄色葡萄球菌（MRSA）', '麻疹病毒', '甲型流感病毒'], answer: 1, explain: '医院感染常见病原体包括 <b>MRSA、产 ESBL 肠杆菌、铜绿假单胞菌、鲍曼不动杆菌、艰难梭菌</b>等，其中 MRSA 最具代表性。肺炎链球菌多为社区获得；麻疹与流感为病毒感染，不属典型医院感染耐药菌。', source: '《传染病学》教材·医院感染（拓展题）', freq: '低频', tested: '未考过' } }
  ],
  cardiology: [
    { ch: 1, q: { type: 'single', stem: '鉴别呼吸困难由心衰还是肺源性引起，最有价值的血液指标是：', options: ['肌钙蛋白', 'BNP / NT-proBNP', 'D-二聚体', '乳酸'], answer: 1, explain: '心室壁张力增高时分泌 <b>BNP/NT-proBNP</b>，心衰时显著升高，是鉴别心源性与肺源性呼吸困难最有价值的指标，也可用于评估严重程度与预后。肌钙蛋白反映心肌损伤；D-二聚体反映血栓形成与纤溶。', source: '《心血管系统》教材·心力衰竭（拓展题）', freq: '高频', tested: '未考过' } },
    { ch: 1, q: { type: 'single', stem: '地高辛中毒最常见的心律失常是：', options: ['室性期前收缩', '心房颤动', '窦性心动过速', '窦性心动过缓'], answer: 0, explain: '洋地黄中毒可引起几乎所有类型心律失常，其中<b>室性期前收缩</b>最常见（尤其二联律），也可出现房室传导阻滞、室上性心动过速伴传导阻滞。低钾血症会加重中毒，故用药期间需监测血钾。', source: '《心血管系统》教材·心衰药物（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '长期服用胺碘酮最需警惕的器官毒性是：', options: ['肾毒性', '肺纤维化与肝损害', '骨髓抑制', '耳毒性'], answer: 1, explain: '胺碘酮含碘，长期使用可致<b>肺间质纤维化（最严重）、肝功能损害、甲状腺功能异常、角膜微沉积</b>及 QT 延长。用药期间需定期查胸片/肺功能、肝功、甲功与心电图。肾毒性见于氨基糖苷类，耳毒性同理。', source: '《心血管系统》教材·抗心律失常药（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '肥厚型梗阻性心肌病患者应避免使用的药物是：', options: ['β 受体拮抗剂', '硝酸酯类', '维拉帕米', '丙吡胺'], answer: 1, explain: '肥厚型梗阻性心肌病存在左室流出道梗阻，<b>硝酸酯类、强效利尿剂、洋地黄</b>会减少回心血量或增强收缩力，加重梗阻与低血压，应避免。β 受体拮抗剂、维拉帕米可减慢心率、减轻梗阻，是常用药。', source: '《心血管系统》教材·心肌病（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '急性心包炎最典型的心电图改变是：', options: ['ST 段弓背向上抬高', '广泛导联 ST 段凹面向上抬高', 'T 波高尖', 'QRS 波增宽'], answer: 1, explain: '急性心包炎因心外膜下心肌受累，心电图表现为<b>除 aVR 外广泛导联 ST 段凹面向上抬高</b>，常伴 PR 段压低，随后 T 波倒置。弓背向上抬高见于急性心肌梗死，且导联分布与梗死部位一致。', source: '《心血管系统》教材·心包炎（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '感染性心内膜炎最常见的病原体是：', options: ['金黄色葡萄球菌', '草绿色链球菌', '大肠埃希菌', '真菌'], answer: 1, explain: '自体瓣膜感染性心内膜炎最常见的病原体是<b>草绿色链球菌</b>；静脉药瘾者、人工瓣膜及院内感染者则以金黄色葡萄球菌为主。确诊依靠血培养（用药前采血 3 次）与超声心动图发现赘生物。', source: '《心血管系统》教材·感染性心内膜炎（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '二尖瓣狭窄最常见的病因是：', options: ['风湿热', '感染性心内膜炎', '先天性畸形', '瓣膜退行性变'], answer: 0, explain: '二尖瓣狭窄绝大多数由<b>风湿热</b>反复发作引起，瓣叶增厚粘连、瓣口缩小，表现为舒张期隆隆样杂音、左房增大、肺淤血，易并发房颤与左房血栓。主动脉瓣狭窄的常见病因才是退行性钙化与先天二叶瓣。', source: '《心血管系统》教材·瓣膜病（拓展题）', freq: '中频', tested: '未考过' } },
    { ch: 4, q: { type: 'single', stem: '评估非瓣膜性房颤患者卒中风险常用的评分是：', options: ['CHA₂DS₂-VASc', 'GRACE', 'TIMI', 'Killip'], answer: 0, explain: '<b>CHA₂DS₂-VASc</b> 评分用于非瓣膜性房颤的卒中风险分层，评分越高越需口服抗凝。GRACE、TIMI 用于急性冠脉综合征风险分层；Killip 用于急性心肌梗死合并心衰的分级。', source: '《心血管系统》教材·心房颤动（拓展题）', freq: '中频', tested: '未考过' } }
  ]
};

const norm = s => String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!\"']/g, '').toLowerCase();

for (const [id, items] of Object.entries(ADD)) {
  const p = 'data/' + id + '.js';
  let cap = null;
  const WB = { register: o => { cap = o; }, registerExam: () => {} };
  new Function('window', 'WB', fs.readFileSync(p, 'utf8'))({ WB }, WB);
  const seen = new Set();
  for (const c of cap.chapters) for (const k of c.knowledge || []) for (const q of k.quiz || []) seen.add(norm(q.stem));

  let n = 0, skipped = [];
  for (const it of items) {
    const ch = cap.chapters[it.ch - 1];
    if (!ch) { skipped.push('no-ch-' + it.ch); continue; }
    const k = (ch.knowledge || [])[0];
    if (!k) { skipped.push('no-k-' + it.ch); continue; }
    const key = norm(it.q.stem);
    if (seen.has(key)) { skipped.push('dup:' + it.q.stem.slice(0, 20)); continue; }
    k.quiz = k.quiz || [];
    k.quiz.push(it.q);
    seen.add(key);
    n++;
  }
  fs.writeFileSync(p, 'WB.register(' + JSON.stringify(cap, null, 2) + ');\n', 'utf8');
  console.log(id, 'added', n, skipped.length ? skipped : '');
}
