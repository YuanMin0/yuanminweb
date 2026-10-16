/* ==========================================================================
   科目数据 · 医学英语 (Medical English)
   --------------------------------------------------------------------------
   内容块类型：h / p / list / table / note / terms / kv / svg / quote / code
   题型：single(单选) / multiple(多选) / judge(判断) / fill(填空)
   ========================================================================== */
WB.register({
  id: 'medical-english',
  name: '医学英语',
  en: 'Medical English',
  icon: '🩺',
  accent: 'var(--cyan)',
  accentSoft: 'var(--cyan-soft)',
  order: 6,
  desc: '从构词法到文献阅读与临床沟通，系统掌握医学术语的拆解、理解与表达。',
  intro: '医学英语的核心不是背单词，而是掌握一套「可推导」的构词规则。本课程按「词素 → 词汇 → 阅读 → 沟通 → 写作」五层递进，每章都配有可直接下载的知识点讲义与自测题。',
  source: '素材来源：医学英语通用构词规则与临床术语规范（词根/前缀/后缀表、器官系统术语、病历缩写、文献结构）',
  chapters: [
    /* ================= 第 1 章 ================= */
    {
      title: '医学术语构词法',
      desc: '拆解一切医学术语的底层规则：词根、前缀、后缀与连接元音。',
      knowledge: [
        {
          title: '医学词根（Roots）：器官与部位',
          summary: '掌握 20 个高频器官词根，即可推断大量陌生术语的基本含义。',
          tags: ['构词法', '词根', '词汇'],
          content: [
            { type: 'p', text: '医学英语中约 **90%** 的专业术语由希腊语、拉丁语词素拼合而成。这意味着：只要掌握有限数量的词素，就能对从未见过的术语做出相当准确的语义推断。' },
            { type: 'h', level: 3, text: '构词三要素' },
            { type: 'kv', items: [
              { k: '词根 Root', v: '承载核心含义，通常指某个器官、组织或部位，如 [[cardi-]] 心、[[hepat-]] 肝。' },
              { k: '前缀 Prefix', v: '修饰词根，表示位置、方向、数量、程度或否定，如 [[peri-]] 周围、[[brady-]] 缓慢。' },
              { k: '后缀 Suffix', v: '决定词性，表示疾病、症状、手术、检查或学科，如 [[-itis]] 炎症、[[-ectomy]] 切除术。' }
            ]},
            { type: 'note', variant: 'tip', title: '读法规则', text: '先看后缀定「是什么」，再看前缀定「怎么样」，最后看词根定「在哪里」。例如 **pericarditis**：-itis 炎症 → peri- 周围 → cardi- 心 = 心包炎。' },
            { type: 'h', level: 3, text: '高频器官词根表' },
            { type: 'table', head: ['词根', '含义', '例词', '释义'], rows: [
              ['cardi-', '心', 'cardiology', '心脏病学'],
              ['angi-', '血管', 'angiography', '血管造影术'],
              ['gastr-', '胃', 'gastritis', '胃炎'],
              ['enter-', '肠', 'enteritis', '肠炎'],
              ['hepat-', '肝', 'hepatomegaly', '肝肿大'],
              ['nephr-', '肾', 'nephritis', '肾炎'],
              ['cyst-', '膀胱 / 囊', 'cystitis', '膀胱炎'],
              ['pneum-', '肺 / 气', 'pneumonia', '肺炎'],
              ['neur-', '神经', 'neurology', '神经病学'],
              ['encephal-', '脑', 'encephalitis', '脑炎'],
              ['my-', '肌', 'myalgia', '肌痛'],
              ['oste-', '骨', 'osteoporosis', '骨质疏松症'],
              ['arthr-', '关节', 'arthritis', '关节炎'],
              ['derm-', '皮肤', 'dermatitis', '皮炎'],
              ['ophthalm-', '眼', 'ophthalmology', '眼科学'],
              ['ot-', '耳', 'otitis', '中耳炎'],
              ['rhin-', '鼻', 'rhinitis', '鼻炎'],
              ['hyster-', '子宫', 'hysterectomy', '子宫切除术'],
              ['cyt-', '细胞', 'cytology', '细胞学'],
              ['haem(at)- / hem(at)-', '血', 'hematology', '血液学']
            ]},
            { type: 'h', level: 3, text: '连接元音 -o-' },
            { type: 'p', text: '当词根与后缀直接相连会造成发音困难时，通常插入连接元音 **-o-**（少数情况用 **-i-**）。它本身不携带含义，只起「润滑」作用。' },
            { type: 'list', items: [
              'gastr + o + enter + o + logy → **gastroenterology** 胃肠病学',
              'cardi + o + myo + pathy → **cardiomyopathy** 心肌病',
              'nephr + o + lith + iasis → **nephrolithiasis** 肾结石病',
              'arthr + o + scopy → **arthroscopy** 关节镜检查'
            ]},
            { type: 'note', variant: 'warn', title: '常见陷阱', text: '同一含义常有多个变体：血可以是 [[haem-]]、[[hem-]]、[[haemat-]]、[[hemat-]]。以 -y 结尾的词根接后缀时往往去掉 -y，如 [[gastr-]] 由希腊语 gaster 演变而来。' },
            { type: 'note', variant: 'key', title: '应试提示', text: '遇到完全陌生的长词，先在草稿上划出后缀、前缀、词根三块，再逐块翻译，最后按中文语序组合。这个「三段切分法」能解决大部分术语题。' }
          ],
          quiz: [
            { type: 'single', stem: '术语 gastroenterology 中，词根 enter- 的含义是：', options: ['胃', '肠', '肝', '肾'], answer: 1, explain: 'enter- 意为肠。gastr- 为胃，hepat- 为肝，nephr- 为肾。' },
            { type: 'single', stem: '下列哪一项表示「关节炎」？', options: ['arthralgia', 'arthritis', 'arthroscopy', 'arthroplasty'], answer: 1, explain: '-itis 表示炎症，arthr- 表示关节，故 arthritis 为关节炎；-algia 为疼痛，-scopy 为镜检查。' },
            { type: 'multiple', stem: '下列词根与含义匹配正确的有：', options: ['cardi- 心', 'nephr- 肾', 'rhin- 喉', 'encephal- 脑'], answer: [0, 1, 3], explain: 'rhin- 表示鼻而非喉；喉对应 laryng-。' },
            { type: 'fill', stem: '请写出「肝肿大」的英文术语（小写）。', answer: ['hepatomegaly'], explain: 'hepat-（肝）+ -megaly（肿大）= hepatomegaly。' },
            { type: 'judge', stem: '连接元音 -o- 本身不携带语义，仅用于连接词素以便发音。', answer: true, explain: '正确。它是纯语音连接成分，不参与构词含义。' }
          ]
        },
        {
          title: '医学前缀（Prefixes）：位置、数量与程度',
          summary: '前缀决定「在哪儿、有多少、多严重、有没有」，是区分近义术语的关键。',
          tags: ['构词法', '前缀', '词汇'],
          content: [
            { type: 'p', text: '前缀本身不改变词根的基本含义，只在其上叠加一层限定信息。临床上大量近义术语的差别，恰恰来自前缀。' },
            { type: 'h', level: 3, text: '一、位置与方向' },
            { type: 'table', head: ['前缀', '含义', '例词'], rows: [
              ['peri-', '周围', 'pericardium 心包'],
              ['endo-', '内部', 'endoscope 内窥镜'],
              ['epi-', '上方 / 表面', 'epidermis 表皮'],
              ['hypo-', '下方 / 不足', 'hypodermic 皮下的；hypoglycemia 低血糖'],
              ['hyper-', '上方 / 过度', 'hypertension 高血压'],
              ['sub-', '下方 / 次', 'subcutaneous 皮下的'],
              ['supra-', '上方 / 上', 'suprarenal 肾上腺的'],
              ['infra-', '下方', 'infrared 红外线'],
              ['retro-', '后方', 'retroperitoneal 腹膜后的'],
              ['trans-', '穿过 / 横过', 'transfusion 输血'],
              ['inter-', '之间', 'intercostal 肋间的'],
              ['intra-', '内部', 'intravenous 静脉内的']
            ]},
            { type: 'note', variant: 'warn', title: '易混对比', text: '**hypo-** 与 **sub-** 都可译作「下」，但 hypo- 常含「低于正常水平」之义（hypoxia 缺氧），sub- 更偏向解剖位置的「下方」（sublingual 舌下的）。' },
            { type: 'h', level: 3, text: '二、数量与数值' },
            { type: 'list', items: [
              '[[mono-]] / [[uni-]] 一：monocyte 单核细胞，unilateral 单侧的',
              '[[bi-]] / [[di-]] 二：bicuspid 二尖瓣的，diplegia 双侧瘫',
              '[[tri-]] 三：trigeminal 三叉的',
              '[[quadri-]] 四：quadriplegia 四肢瘫',
              '[[poly-]] / [[multi-]] 多：polyuria 多尿，multipara 经产妇',
              '[[oligo-]] 少：oliguria 少尿',
              '[[nulli-]] 无：nullipara 未产妇'
            ]},
            { type: 'h', level: 3, text: '三、否定前缀' },
            { type: 'table', head: ['前缀', '含义', '例词'], rows: [
              ['a- / an-', '无 / 缺', 'apnea 呼吸暂停，anemia 贫血'],
              ['dys-', '异常 / 困难', 'dyspnea 呼吸困难，dysphagia 吞咽困难'],
              ['anti-', '抗 / 反', 'antibiotic 抗生素，anticoagulant 抗凝剂'],
              ['contra-', '对抗 / 禁忌', 'contraindication 禁忌证'],
              ['mal-', '不良 / 异常', 'malnutrition 营养不良，malignant 恶性的'],
              ['ab-', '离开', 'abduction 外展']
            ]},
            { type: 'h', level: 3, text: '四、程度与速度' },
            { type: 'terms', items: [
              { en: 'brady-', cn: '缓慢', note: 'bradycardia 心动过缓' },
              { en: 'tachy-', cn: '快速', note: 'tachycardia 心动过速' },
              { en: 'eu-', cn: '正常 / 良好', note: 'eupnea 正常呼吸' },
              { en: 'pan-', cn: '全部', note: 'pancarditis 全心炎' },
              { en: 'iso-', cn: '相等 / 同', note: 'isotonic 等渗的' },
              { en: 'necr-', cn: '死亡 / 坏死', note: 'necrosis 坏死' }
            ]},
            { type: 'note', variant: 'tip', title: '解题思路', text: '题干出现「过缓 / 过速」「过多 / 过少」「内 / 外」这类对比时，答案通常只由前缀决定，词根完全一致。先锁定前缀，再核对词根。' }
          ],
          quiz: [
            { type: 'single', stem: '术语 tachycardia 表示：', options: ['心动过缓', '心动过速', '心律不齐', '心肌缺血'], answer: 1, explain: 'tachy- 表示快速，cardi- 表示心，-ia 表示状态，故为心动过速；brady- 才是缓慢。' },
            { type: 'single', stem: '下列哪一项表示「少尿」？', options: ['polyuria', 'anuria', 'oliguria', 'dysuria'], answer: 2, explain: 'oligo- 为少，-uria 为尿；polyuria 为多尿，anuria 为无尿，dysuria 为排尿困难。' },
            { type: 'multiple', stem: '关于 hypo- 与 hyper-，下列说法正确的有：', options: ['hypo- 可表示低于正常水平', 'hyper- 可表示过度或过高', 'hypoglycemia 指高血糖', 'hypertension 指低血压'], answer: [0, 1], explain: 'hypoglycemia 为低血糖，hypertension 为高血压，C、D 两项说反了。' },
            { type: 'fill', stem: '「皮下的」对应术语 subcutaneous，其前缀 sub- 的含义是____（用中文回答）。', answer: ['下方', '下', '下面'], explain: 'sub- 表示位置上的「下方」。' },
            { type: 'judge', stem: 'dys- 前缀既可表示「异常」，也可表示「困难」，如 dyspnea 呼吸困难、dysphagia 吞咽困难。', answer: true, explain: '正确。dys- 的具体译法需结合词根语境判断。' }
          ]
        },
        {
          title: '医学后缀（Suffixes）：疾病、症状与操作',
          summary: '后缀决定术语的「类别」——是病、是痛、是手术，还是检查。',
          tags: ['构词法', '后缀', '词汇'],
          content: [
            { type: 'p', text: '如果说词根告诉我们「哪里」，后缀就告诉我们「怎么了」。临床术语中最高频的后缀集中在四类：疾病状态、症状体征、诊疗操作、学科门类。' },
            { type: 'h', level: 3, text: '一、疾病与病理状态' },
            { type: 'table', head: ['后缀', '含义', '例词'], rows: [
              ['-itis', '炎症', 'gastritis 胃炎'],
              ['-osis', '异常状态 / 病', 'neurosis 神经症；scoliosis 脊柱侧弯'],
              ['-pathy', '疾病', 'cardiomyopathy 心肌病'],
              ['-megaly', '肿大', 'splenomegaly 脾大'],
              ['-emia', '血液状态', 'leukemia 白血病；anemia 贫血'],
              ['-oma', '肿瘤', 'carcinoma 癌；lipoma 脂肪瘤'],
              ['-plasia', '形成 / 生长', 'hyperplasia 增生'],
              ['-necrosis', '坏死', 'osteonecrosis 骨坏死'],
              ['-sclerosis', '硬化', 'arteriosclerosis 动脉硬化'],
              ['-stenosis', '狭窄', 'aortic stenosis 主动脉瓣狭窄']
            ]},
            { type: 'note', variant: 'key', title: '重点区分', text: '**-oma** 是肿瘤的通用后缀，但 -oma 不等于恶性。lipoma（脂肪瘤）为良性，carcinoma（癌，源自上皮）与 sarcoma（肉瘤，源自间叶组织）才是恶性。' },
            { type: 'h', level: 3, text: '二、症状与体征' },
            { type: 'list', items: [
              '[[-algia]] / [[-dynia]] 疼痛：myalgia 肌痛，gastrodynia 胃痛',
              '[[-emia]] 血液：hyperglycemia 高血糖',
              '[[-uria]] 尿：hematuria 血尿，proteinuria 蛋白尿',
              '[[-rrhea]] 流 / 漏：diarrhea 腹泻，rhinorrhea 鼻漏',
              '[[-rrhexis]] 破裂：angiorrhexis 血管破裂',
              '[[-ptosis]] 下垂：nephroptosis 肾下垂',
              '[[-spasm]] 痉挛：angiospasm 血管痉挛',
              '[[-plegia]] 瘫痪：hemiplegia 偏瘫'
            ]},
            { type: 'h', level: 3, text: '三、诊疗操作' },
            { type: 'table', head: ['后缀', '含义', '例词'], rows: [
              ['-scopy', '镜检查', 'gastroscopy 胃镜检查'],
              ['-graphy', '造影 / 记录', 'angiography 血管造影'],
              ['-gram', '图像 / 记录图', 'electrocardiogram 心电图'],
              ['-ectomy', '切除术', 'appendectomy 阑尾切除术'],
              ['-tomy', '切开术', 'tracheotomy 气管切开'],
              ['-stomy', '造口术', 'colostomy 结肠造口'],
              ['-plasty', '成形术', 'rhinoplasty 鼻成形术'],
              ['-pexy', '固定术', 'nephropexy 肾固定术'],
              ['-lysis', '溶解 / 松解', 'thrombolysis 溶栓'],
              ['-centesis', '穿刺术', 'amniocentesis 羊膜穿刺']
            ]},
            { type: 'h', level: 3, text: '四、学科与专业' },
            { type: 'terms', items: [
              { en: '-logy', cn: '学科', note: 'cardiology 心脏病学' },
              { en: '-logist', cn: '专科医师', note: 'neurologist 神经科医师' },
              { en: '-iatry / -iatrics', cn: '治疗学 / 儿科', note: 'psychiatry 精神病学；pediatrics 儿科学' },
              { en: '-genic', cn: '产生 / 源于', note: 'pathogenic 致病的' },
              { en: '-pathy', cn: '疗法（另义）', note: 'hydrotherapy 水疗' }
            ]},
            { type: 'note', variant: 'tip', title: '组合验证', text: '把学过的三块拼起来：**nephr + o + lith + iasis** = 肾 + 石 + 病态 = 肾结石病；**cardi + o + myo + pathy** = 心 + 肌 + 疾病 = 心肌病。能自己拼出术语，说明构词法已经内化。' }
          ],
          quiz: [
            { type: 'single', stem: '下列哪个后缀表示「切除术」？', options: ['-tomy', '-stomy', '-ectomy', '-scopy'], answer: 2, explain: '-ectomy 为切除术；-tomy 为切开术；-stomy 为造口术；-scopy 为镜检查。' },
            { type: 'single', stem: '术语 hematuria 的含义是：', options: ['血尿', '蛋白尿', '多尿', '尿痛'], answer: 0, explain: 'hemat-（血）+ -uria（尿）= 血尿。' },
            { type: 'multiple', stem: '下列后缀中表示「诊疗操作」的有：', options: ['-plasty', '-megaly', '-centesis', '-pexy'], answer: [0, 2, 3], explain: '-megaly 表示肿大，属于病理状态而非操作。' },
            { type: 'fill', stem: '「胃镜检查」的英文术语是____（小写）。', answer: ['gastroscopy'], explain: 'gastr-（胃）+ -o- + -scopy（镜检查）= gastroscopy。' },
            { type: 'judge', stem: '后缀 -oma 只表示恶性肿瘤。', answer: false, explain: '错误。-oma 泛指肿瘤，lipoma、adenoma 等均为良性；恶性以上皮来源的 -carcinoma 和间叶来源的 -sarcoma 表示。' }
          ]
        }
      ]
    },
    /* ================= 第 2 章 ================= */
    {
      title: '器官系统术语（Organ Systems）',
      desc: '把构词规则落到具体器官系统上，掌握心血管、呼吸、消化、泌尿、内分泌、神经与骨骼肌肉的常用术语。',
      knowledge: [
        {
          title: '心血管与呼吸系统术语',
          summary: '心血管以 cardi-/angi-/vascul- 为核心，呼吸以 pneum-/pulmon-/bronch- 为核心，配合功能后缀构成完整术语体系。',
          tags: ['词汇', '器官系统', '高频'],
          content: [
            { type: 'h', level: 3, text: '一、心血管系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['cardiology', '心脏病学', 'cardi-（心）+ -logy（学科）'],
              ['myocardium', '心肌', 'my-（肌）+ cardi-（心）+ -um'],
              ['pericarditis', '心包炎', 'peri-（周围）+ cardi-（心）+ -itis（炎）'],
              ['endocarditis', '心内膜炎', 'endo-（内）+ cardi-（心）+ -itis'],
              ['myocardial infarction', '心肌梗死', 'myo- + cardi- + -al（形容词）+ infarction（梗死）'],
              ['angiography', '血管造影术', 'angi-（血管）+ -o- + -graphy（造影）'],
              ['arteriosclerosis', '动脉硬化', 'arteri-（动脉）+ -o- + -sclerosis（硬化）'],
              ['thrombophlebitis', '血栓性静脉炎', 'thromb-（血栓）+ -o- + phleb-（静脉）+ -itis'],
              ['hypertension', '高血压', 'hyper-（过度）+ tension（张力）'],
              ['bradycardia', '心动过缓', 'brady-（缓慢）+ cardi- + -ia（状态）']
            ]},
            { type: 'note', variant: 'key', title: '重点对比', text: '**-emia** 表示血液状态：anemia 贫血、leukemia 白血病、hyperlipidemia 高脂血症。**-pathy** 表示疾病：cardiomyopathy 心肌病、vasculopathy 血管病。**-megaly** 表示肿大：cardiomegaly 心脏扩大。' },
            { type: 'h', level: 3, text: '二、呼吸系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['pneumonia', '肺炎', 'pneumon-（肺/气）+ -ia（状态）'],
              ['pneumothorax', '气胸', 'pneumo-（气）+ thorax（胸）'],
              ['pneumonectomy', '肺切除术', 'pneumon-（肺）+ -ectomy（切除）'],
              ['bronchitis', '支气管炎', 'bronch-（支气管）+ -itis'],
              ['bronchoscopy', '支气管镜检查', 'bronch- + -o- + -scopy'],
              ['laryngitis', '喉炎', 'laryng-（喉）+ -itis'],
              ['pharyngitis', '咽炎', 'pharyng-（咽）+ -itis'],
              ['dyspnea', '呼吸困难', 'dys-（困难）+ -pnea（呼吸）'],
              ['apnea', '呼吸暂停', 'a-（无）+ -pnea'],
              ['hemoptysis', '咯血', 'hemo-（血）+ -ptysis（咳出）']
            ]},
            { type: 'note', variant: 'warn', title: '易混', text: '**pneumo-** 有两种含义：一是「肺」（pneumonia 肺炎、pneumonectomy 肺切除），二是「气」（pneumothorax 气胸、pneumoperitoneum 气腹）。需结合后半部分判断。' },
            { type: 'terms', items: [
              { en: 'pulmon-', cn: '肺（拉丁词根）', note: 'pulmonary 肺的；pulmonologist 呼吸科医师' },
              { en: 'pleur-', cn: '胸膜', note: 'pleurisy 胸膜炎；pleural effusion 胸腔积液' },
              { en: 'spir-', cn: '呼吸', note: 'spirometry 肺量测定；respiration 呼吸' },
              { en: 'thorac-', cn: '胸', note: 'thoracotomy 开胸术；thoracentesis 胸腔穿刺' }
            ]}
          ],
          quiz: [
            { type: 'single', stem: '术语 myocardial infarction 的中文含义是', options: ['心肌炎', '心肌病', '心肌梗死', '心包炎'], answer: 2, explain: 'myo-（肌）+ cardi-（心）+ -al（形容词后缀）+ infarction（梗死）= 心肌梗死。-itis 才是炎症，-pathy 是疾病。' },
            { type: 'single', stem: '术语 hemoptysis 的含义是', options: ['呕血', '咯血', '鼻出血', '血尿'], answer: 1, explain: 'hemo-（血）+ -ptysis（咳出）= 咯血。呕血为 hematemesis，鼻出血为 epistaxis，血尿为 hematuria。' },
            { type: 'single', stem: '术语 bronchoscopy 中 -scopy 表示', options: ['切开术', '切除术', '镜检查', '造口术'], answer: 2, explain: '-scopy 表示镜检查；-tomy 为切开术；-ectomy 为切除术；-stomy 为造口术。' },
            { type: 'multiple', stem: '下列关于呼吸系统术语的说法正确的有', options: ['dyspnea 表示呼吸困难', 'apnea 表示呼吸暂停', 'laryngitis 表示喉炎', 'pneumothorax 表示肺炎'], answer: [0, 1, 2], explain: 'pneumothorax 由 pneumo-（气）+ thorax（胸）构成，表示气胸；肺炎是 pneumonia。' },
            { type: 'fill', stem: '「心动过缓」的英文术语是 ____ （小写）。', answer: ['bradycardia'], explain: 'brady-（缓慢）+ cardi-（心）+ -ia（状态）= bradycardia 心动过缓；tachycardia 才是心动过速。' }
          ]
        },
        {
          title: '消化、泌尿与内分泌系统术语',
          summary: '消化系统以 gastr-/enter-/hepat-/col- 为主，泌尿系统以 nephr-/cyst-/ur- 为主，内分泌以 -crine 类词根为主。',
          tags: ['词汇', '器官系统'],
          content: [
            { type: 'h', level: 3, text: '一、消化系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['gastroenterology', '胃肠病学', 'gastr- + -o- + enter- + -o- + -logy'],
              ['hepatomegaly', '肝肿大', 'hepat-（肝）+ -o- + -megaly（肿大）'],
              ['hepatitis', '肝炎', 'hepat-（肝）+ -itis'],
              ['cholecystitis', '胆囊炎', 'chol-（胆）+ -e- + cyst-（囊）+ -itis'],
              ['cholelithiasis', '胆石症', 'chol-（胆）+ -e- + lith-（石）+ -iasis（病态）'],
              ['appendectomy', '阑尾切除术', 'append-（阑尾）+ -ectomy'],
              ['colostomy', '结肠造口术', 'col-（结肠）+ -o- + -stomy（造口）'],
              ['esophagitis', '食管炎', 'esophag-（食管）+ -itis'],
              ['dysphagia', '吞咽困难', 'dys-（困难）+ -phagia（吞咽）'],
              ['diarrhea', '腹泻', 'dia-（穿过）+ -rrhea（流）']
            ]},
            { type: 'note', variant: 'tip', title: '构词对比', text: '**-lithiasis** 表示结石病（nephrolithiasis 肾结石、cholelithiasis 胆石症）；**-iasis** 泛指病态（elephantiasis 象皮病）。' },
            { type: 'h', level: 3, text: '二、泌尿系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['nephritis', '肾炎', 'nephr-（肾）+ -itis'],
              ['nephrolithiasis', '肾结石病', 'nephr- + -o- + lith- + -iasis'],
              ['nephroptosis', '肾下垂', 'nephr- + -o- + -ptosis（下垂）'],
              ['cystitis', '膀胱炎', 'cyst-（膀胱/囊）+ -itis'],
              ['cystoscopy', '膀胱镜检查', 'cyst- + -o- + -scopy'],
              ['hematuria', '血尿', 'hemat-（血）+ -uria（尿）'],
              ['proteinuria', '蛋白尿', 'protein（蛋白）+ -uria'],
              ['oliguria', '少尿', 'oligo-（少）+ -uria'],
              ['anuria', '无尿', 'an-（无）+ -uria'],
              ['polyuria', '多尿', 'poly-（多）+ -uria']
            ]},
            { type: 'note', variant: 'key', title: '尿量术语速记', text: '**polyuria 多尿 → oliguria 少尿 → anuria 无尿**，靠前缀 poly-/oligo-/an- 区分，词根 -uria 完全一致。' },
            { type: 'h', level: 3, text: '三、内分泌系统' },
            { type: 'terms', items: [
              { en: '-crine', cn: '分泌', note: 'endocrine 内分泌；exocrine 外分泌' },
              { en: 'thyroid-', cn: '甲状腺', note: 'hyperthyroidism 甲状腺功能亢进；thyroidectomy 甲状腺切除术' },
              { en: 'adren-', cn: '肾上腺', note: 'adrenal 肾上腺的；adrenaline 肾上腺素' },
              { en: 'pancreat-', cn: '胰腺', note: 'pancreatitis 胰腺炎；pancreatectomy 胰腺切除术' },
              { en: 'glyc- / gluc-', cn: '糖', note: 'hyperglycemia 高血糖；hypoglycemia 低血糖' },
              { en: 'insulin-', cn: '胰岛素', note: 'insulinoma 胰岛素瘤' }
            ]},
            { type: 'note', variant: 'warn', title: '易错', text: '**hypoglycemia** 是低血糖（hypo- 低），**hyperglycemia** 是高血糖（hyper- 高）。两者只差一个前缀，是选择题的高频陷阱。' }
          ],
          quiz: [
            { type: 'single', stem: '术语 cholelithiasis 的含义是', options: ['胆囊炎', '胆石症', '肝炎', '胰腺炎'], answer: 1, explain: 'chol-（胆）+ -e- + lith-（石）+ -iasis（病态）= 胆石症。胆囊炎是 cholecystitis，肝炎是 hepatitis。' },
            { type: 'single', stem: '表示「无尿」的术语是', options: ['polyuria', 'oliguria', 'anuria', 'dysuria'], answer: 2, explain: 'an-（无）+ -uria（尿）= 无尿。polyuria 为多尿，oliguria 为少尿，dysuria 为排尿困难。' },
            { type: 'single', stem: '术语 hypoglycemia 的含义是', options: ['高血糖', '低血糖', '尿糖', '糖尿病'], answer: 1, explain: 'hypo-（低于正常）+ glyc-（糖）+ -emia（血液状态）= 低血糖。hyperglycemia 才是高血糖。' },
            { type: 'multiple', stem: '下列术语中表示「诊疗操作」的有', options: ['appendectomy', 'colostomy', 'cystoscopy', 'nephritis'], answer: [0, 1, 2], explain: 'appendectomy（阑尾切除术）、colostomy（结肠造口术）、cystoscopy（膀胱镜检查）均为诊疗操作；nephritis（肾炎）是病理状态。' },
            { type: 'fill', stem: '「蛋白尿」的英文术语是 ____ （小写）。', answer: ['proteinuria'], explain: 'protein（蛋白）+ -uria（尿）= proteinuria 蛋白尿。' }
          ]
        },
        {
          title: '神经、骨骼肌肉与感觉器官术语',
          summary: '神经以 neur-/encephal-/myel- 为主，骨骼肌肉以 oste-/arthr-/my- 为主，感觉器官以 ophthalm-/ot-/rhin- 为主。',
          tags: ['词汇', '器官系统'],
          content: [
            { type: 'h', level: 3, text: '一、神经系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['neurology', '神经病学', 'neur-（神经）+ -o- + -logy'],
              ['neuralgia', '神经痛', 'neur- + -algia（疼痛）'],
              ['encephalitis', '脑炎', 'encephal-（脑）+ -itis'],
              ['electroencephalogram', '脑电图', 'electro-（电）+ encephal- + -o- + -gram（图）'],
              ['myelitis', '脊髓炎', 'myel-（脊髓/骨髓）+ -itis'],
              ['hemiplegia', '偏瘫', 'hemi-（半）+ -plegia（瘫痪）'],
              ['neuropathy', '神经病变', 'neur- + -o- + -pathy（疾病）'],
              ['meningitis', '脑膜炎', 'mening-（脑膜）+ -itis'],
              ['epilepsy', '癫痫', '源自希腊语 epilambanein（抓住）']
            ]},
            { type: 'note', variant: 'key', title: '记忆要点', text: '**-plegia** 表示瘫痪：hemiplegia 偏瘫、paraplegia 截瘫、quadriplegia 四肢瘫。**-paresis** 表示轻瘫，程度轻于 -plegia。' },
            { type: 'h', level: 3, text: '二、骨骼肌肉系统' },
            { type: 'table', head: ['术语', '中文', '构词拆解'], rows: [
              ['osteoporosis', '骨质疏松症', 'oste-（骨）+ -o- + por-（孔）+ -osis（病态）'],
              ['osteoarthritis', '骨关节炎', 'oste- + -o- + arthr-（关节）+ -itis'],
              ['arthritis', '关节炎', 'arthr-（关节）+ -itis'],
              ['arthroscopy', '关节镜检查', 'arthr- + -o- + -scopy'],
              ['arthroplasty', '关节成形术', 'arthr- + -o- + -plasty（成形术）'],
              ['myalgia', '肌痛', 'my-（肌）+ -algia（疼痛）'],
              ['myasthenia', '肌无力', 'my- + -asthenia（无力）'],
              ['tendinitis', '肌腱炎', 'tendin-（肌腱）+ -itis'],
              ['spondylitis', '脊椎炎', 'spondyl-（椎骨）+ -itis']
            ]},
            { type: 'note', variant: 'warn', title: '易混', text: '**my-** 可表示「肌」（myalgia 肌痛、myocardium 心肌），也可表示「骨髓」（myeloma 骨髓瘤）；**myel-** 则专指脊髓或骨髓。注意拼写差异：my- / myo- 与 myel-。' },
            { type: 'h', level: 3, text: '三、感觉器官' },
            { type: 'terms', items: [
              { en: 'ophthalm-', cn: '眼', note: 'ophthalmology 眼科学；ophthalmoscope 检眼镜' },
              { en: 'ot-', cn: '耳', note: 'otitis 耳炎；otoscopy 耳镜检查' },
              { en: 'rhin-', cn: '鼻', note: 'rhinitis 鼻炎；rhinorrhea 鼻漏' },
              { en: 'laryng-', cn: '喉', note: 'laryngitis 喉炎；laryngectomy 喉切除术' },
              { en: 'blephar-', cn: '眼睑', note: 'blepharitis 睑缘炎；blepharoplasty 眼睑成形术' },
              { en: 'kerat-', cn: '角膜', note: 'keratitis 角膜炎；keratoplasty 角膜移植术' }
            ]},
            { type: 'note', variant: 'tip', title: '组合验证', text: '试着拼出「眼睑成形术」：blephar-（眼睑）+ -o- + -plasty（成形术）= **blepharoplasty**。能自主拼词，说明器官词根已经成体系。' }
          ],
          quiz: [
            { type: 'single', stem: '术语 quadriplegia 的含义是', options: ['偏瘫', '截瘫', '四肢瘫', '肌无力'], answer: 2, explain: 'quadri-（四）+ -plegia（瘫痪）= 四肢瘫。hemiplegia 偏瘫，paraplegia 截瘫，myasthenia 肌无力。' },
            { type: 'single', stem: '术语 osteoarthritis 的含义是', options: ['骨质疏松症', '骨关节炎', '骨髓炎', '脊椎炎'], answer: 1, explain: 'oste-（骨）+ -o- + arthr-（关节）+ -itis（炎）= 骨关节炎。骨质疏松症是 osteoporosis，脊椎炎是 spondylitis。' },
            { type: 'single', stem: '术语 electroencephalogram 中 -gram 表示', options: ['记录图', '镜检查', '切开术', '造影剂'], answer: 0, explain: '-gram 表示图像或记录图（electroencephalogram 脑电图）；-graphy 表示造影或记录过程；-scopy 表示镜检查。' },
            { type: 'multiple', stem: '下列关于感觉器官词根的说法正确的有', options: ['ophthalm- 表示眼', 'ot- 表示耳', 'rhin- 表示鼻', 'laryng- 表示舌'], answer: [0, 1, 2], explain: 'laryng- 表示喉而非舌，舌对应 gloss- / lingu-（glossitis 舌炎）。' },
            { type: 'fill', stem: '「肌痛」的英文术语是 ____ （小写）。', answer: ['myalgia'], explain: 'my-（肌）+ -algia（疼痛）= myalgia 肌痛。' }
          ]
        }
      ]
    },

    /* ================= 第 3 章 ================= */
    {
      title: '病历与临床沟通',
      desc: '病历（medical record）的结构与常用缩写，以及问诊、查体、交接班中的高频表达。',
      knowledge: [
        {
          title: '病历结构与常用缩写',
          summary: 'SOAP 结构是病历书写的骨架；掌握高频缩写是读懂英文病历与医嘱的第一步。',
          tags: ['临床', '缩写', '高频'],
          content: [
            { type: 'h', level: 3, text: '一、病历书写结构' },
            { type: 'table', head: ['模块', '英文', '内容'], rows: [
              ['主诉', 'Chief Complaint (CC)', '患者就诊的主要症状与持续时间，一句话概括'],
              ['现病史', 'History of Present Illness (HPI)', '本次发病的发生、发展、诊疗经过与现状'],
              ['既往史', 'Past Medical History (PMH)', '既往疾病、手术、过敏史'],
              ['个人史与社会史', 'Social History (SH)', '吸烟、饮酒、职业、居住环境'],
              ['家族史', 'Family History (FH)', '直系亲属的疾病与死亡原因'],
              ['体格检查', 'Physical Examination (PE)', '生命体征与各系统查体结果'],
              ['辅助检查', 'Laboratory / Diagnostic Findings', '实验室、影像、心电图等结果'],
              ['评估', 'Assessment (A)', '诊断与鉴别诊断'],
              ['计划', 'Plan (P)', '治疗方案、随访与健康教育']
            ]},
            { type: 'note', variant: 'key', title: 'SOAP 结构', text: '**S**ubjective（主观资料）、**O**bjective（客观资料）、**A**ssessment（评估）、**P**lan（计划）。SOAP 是国际通用的病历书写与病程记录格式，四部分缺一不可。' },
            { type: 'h', level: 3, text: '二、高频缩写' },
            { type: 'table', head: ['缩写', '全称', '中文'], rows: [
              ['BP', 'blood pressure', '血压'],
              ['HR', 'heart rate', '心率'],
              ['RR', 'respiratory rate', '呼吸频率'],
              ['T', 'temperature', '体温'],
              ['CBC', 'complete blood count', '全血细胞计数'],
              ['ECG / EKG', 'electrocardiogram', '心电图'],
              ['CT', 'computed tomography', '计算机体层成像'],
              ['MRI', 'magnetic resonance imaging', '磁共振成像'],
              ['NPO', 'nil per os', '禁食'],
              ['PRN', 'pro re nata', '必要时'],
              ['q.d. / b.i.d. / t.i.d. / q.i.d.', 'once / twice / three / four times a day', '每日一次 / 二次 / 三次 / 四次'],
              ['I.V. / I.M. / P.O.', 'intravenous / intramuscular / per os', '静脉 / 肌内 / 口服'],
              ['Dx / Tx / Rx', 'diagnosis / treatment / prescription', '诊断 / 治疗 / 处方'],
              ['Hx', 'history', '病史'],
              ['Sx', 'symptoms', '症状']
            ]},
            { type: 'note', variant: 'warn', title: '安全提示', text: '缩写使用有严格规范：**q.d.**（每日一次）与 **q.i.d.**（每日四次）字形接近，误读可能造成严重用药错误，许多机构已要求改用完整拼写。**U**（单位）易被误读为 0，应写作 unit。' }
          ],
          quiz: [
            { type: 'single', stem: 'SOAP 病历结构中，字母 A 代表', options: ['Assessment（评估）', 'Admission（入院）', 'Allergy（过敏）', 'Antibiotic（抗生素）'], answer: 0, explain: 'SOAP 为 Subjective（主观资料）、Objective（客观资料）、Assessment（评估）、Plan（计划）。' },
            { type: 'single', stem: '缩写 NPO 的含义是', options: ['必要时', '禁食', '口服', '静脉注射'], answer: 1, explain: 'NPO 源自拉丁语 nil per os，意为禁食。PRN 才是必要时，P.O. 为口服，I.V. 为静脉注射。' },
            { type: 'single', stem: '缩写 b.i.d. 表示', options: ['每日一次', '每日两次', '每日三次', '每日四次'], answer: 1, explain: 'b.i.d. 为 bis in die，每日两次；q.d. 每日一次、t.i.d. 每日三次、q.i.d. 每日四次。' },
            { type: 'multiple', stem: '下列缩写与全称匹配正确的有', options: ['CBC — complete blood count', 'ECG — electrocardiogram', 'MRI — magnetic resonance imaging', 'BP — blood platelet'], answer: [0, 1, 2], explain: 'BP 是 blood pressure（血压），不是 blood platelet（血小板）。血小板常缩写为 PLT。' },
            { type: 'fill', stem: '现病史的英文缩写是 ____ 。', answer: ['HPI'], explain: 'HPI 为 History of Present Illness 的缩写，即现病史。' }
          ]
        },
        {
          title: '问诊与查体常用表达',
          summary: '问诊以开放式提问开场、以具体问题聚焦；查体与交接班表达强调准确、简洁、客观。',
          tags: ['沟通', '临床表达'],
          content: [
            { type: 'h', level: 3, text: '一、问诊常用句型' },
            { type: 'table', head: ['场景', '英文表达', '中文'], rows: [
              ['开场', 'What brings you in today?', '您今天为什么来看病？'],
              ['主诉', 'What seems to be the problem?', '有什么不舒服？'],
              ['起病', 'When did the symptoms start?', '症状什么时候开始的？'],
              ['性质', 'Can you describe the pain?', '能描述一下疼痛的性质吗？'],
              ['放射', 'Does the pain radiate anywhere?', '疼痛会向其他地方放射吗？'],
              ['诱因', 'What makes it better or worse?', '什么情况下会好转或加重？'],
              ['伴随', 'Any nausea, vomiting, or fever?', '有恶心、呕吐或发热吗？'],
              ['既往', 'Have you had this before?', '以前有过这种情况吗？'],
              ['用药', 'Are you taking any medications?', '您正在服用什么药物吗？'],
              ['过敏', 'Any allergies to drugs or food?', '对药物或食物过敏吗？']
            ]},
            { type: 'note', variant: 'key', title: 'OPQRST 疼痛问诊框架', text: '**O**nset（起病）、**P**rovocation / Palliation（诱因与缓解）、**Q**uality（性质）、**R**egion / Radiation（部位与放射）、**S**everity（程度）、**T**ime（时间）。这是急诊与疼痛问诊的标准框架。' },
            { type: 'h', level: 3, text: '二、查体与交接班表达' },
            { type: 'list', items: [
              'Vital signs are stable.（生命体征平稳。）',
              'The abdomen is soft and non-tender.（腹部柔软、无压痛。）',
              'Heart sounds are regular without murmurs.（心音规整，未闻及杂音。）',
              'Lungs are clear to auscultation bilaterally.（双肺听诊呼吸音清。）',
              'The patient is afebrile.（患者无发热。）',
              'No peripheral edema was noted.（未发现外周水肿。）',
              'He is on I.V. antibiotics and responds well.（他在用静脉抗生素，反应良好。）',
              'She is scheduled for surgery tomorrow morning.（她安排明早手术。）'
            ]},
            { type: 'note', variant: 'tip', title: '沟通要点', text: '与患者沟通宜用**开放式提问**（What / How）鼓励叙述，用**封闭式提问**（Yes / No）确认关键信息。查体与交接班表达则要求**客观、具体、可核实**，避免使用 vague 一类模糊词。' },
            { type: 'note', variant: 'warn', title: '禁忌表达', text: '避免使用 medical jargon（专业术语）直接对患者说，如把 myocardial infarction 换成 heart attack；把 dyspnea 换成 shortness of breath。专业术语用于病历记录，通俗表达用于患者沟通。' }
          ],
          quiz: [
            { type: 'single', stem: 'OPQRST 问诊框架中，字母 Q 代表', options: ['Quality（性质）', 'Quantity（数量）', 'Quick（快速）', 'Quiet（安静）'], answer: 0, explain: 'OPQRST 为 Onset（起病）、Provocation/Palliation（诱因与缓解）、Quality（性质）、Region/Radiation（部位与放射）、Severity（程度）、Time（时间）。' },
            { type: 'single', stem: '对患者描述心肌梗死时，更恰当的通俗表达是', options: ['myocardial infarction', 'heart attack', 'coronary thrombosis', 'cardiac ischemia'], answer: 1, explain: '与患者沟通应避免 medical jargon，把 myocardial infarction 换成 heart attack 更易理解。专业术语用于病历记录。' },
            { type: 'single', stem: '表达「双肺听诊呼吸音清」的英文是', options: ['Lungs are clear to auscultation bilaterally.', 'The abdomen is soft and non-tender.', 'Heart sounds are regular without murmurs.', 'The patient is afebrile.'], answer: 0, explain: 'Lungs are clear to auscultation bilaterally 意为双肺听诊呼吸音清。其余选项分别描述腹部、心音和体温。' },
            { type: 'judge', stem: '开放式提问（如 What / How）有助于鼓励患者叙述病情。', answer: true, explain: '开放式提问鼓励患者自由叙述，有助于获取完整信息；封闭式提问（Yes / No）则用于确认关键信息。两者应结合使用。' },
            { type: 'fill', stem: '查体中表达「患者无发热」的英文是 The patient is ____ 。', answer: ['afebrile'], explain: 'afebrile 意为无发热（a- 无 + febrile 发热的），是病历中的常用表达。' }
          ]
        }
      ]
    },

    /* ================= 第 4 章 ================= */
    {
      title: '医学文献阅读与写作',
      desc: 'IMRAD 文献结构、常见学术表达，以及摘要写作的规范与常见错误。',
      knowledge: [
        {
          title: '医学文献结构与阅读方法',
          summary: '医学论文采用 IMRAD 结构：Introduction、Methods、Results、and Discussion，摘要则要求结构化四要素。',
          tags: ['文献', '阅读', '高频'],
          content: [
            { type: 'h', level: 3, text: '一、IMRAD 结构' },
            { type: 'table', head: ['部分', '英文', '回答的问题', '阅读重点'], rows: [
              ['引言', 'Introduction', '为什么要做这项研究？', '研究背景、研究缺口、研究目的与假设'],
              ['方法', 'Methods', '怎么做的？', '研究设计、对象、干预、结局指标、统计方法'],
              ['结果', 'Results', '发现了什么？', '主要结局的效应量与置信区间、P 值、图表'],
              ['讨论', 'Discussion', '说明什么？', '结果解释、与既往研究比较、局限性、结论与意义']
            ]},
            { type: 'note', variant: 'key', title: '阅读顺序建议', text: '高效阅读不等于从头读到尾。推荐顺序：**读摘要 → 看图表 → 读讨论的结论段 → 回头读方法与结果**。若研究设计与自身课题无关，可在方法部分快速跳过。' },
            { type: 'h', level: 3, text: '二、结构化摘要四要素' },
            { type: 'list', ordered: true, items: [
              '**Background / Objective**：研究背景与目的',
              '**Methods**：设计、对象、干预与结局指标',
              '**Results**：关键数据，必须给出具体数值而非仅描述趋势',
              '**Conclusion**：基于结果的结论，不得超出数据支持范围'
            ]},
            { type: 'h', level: 3, text: '三、高频学术表达' },
            { type: 'table', head: ['功能', '常用表达'], rows: [
              ['研究目的', 'This study aimed to… / We sought to determine…'],
              ['研究设计', 'a randomized controlled trial / a retrospective cohort study / a cross-sectional survey'],
              ['纳入排除', 'were eligible if… / were excluded if…'],
              ['主要发现', 'The primary outcome was… / We found a significant association between…'],
              ['统计学表述', 'was significantly associated with (P < 0.05) / the 95% CI was…'],
              ['局限性', 'Several limitations should be noted. / This study was limited by…'],
              ['结论', 'In conclusion, these findings suggest that…']
            ]},
            { type: 'note', variant: 'warn', title: '常见误读', text: '**P 值小不等于效应大**。P < 0.05 只说明差异有统计学意义，效应大小应看效应量与置信区间。阅读结果部分时，先找 primary outcome（主要结局），再看 secondary outcomes（次要结局），避免被大量次要结果干扰。' }
          ],
          quiz: [
            { type: 'single', stem: 'IMRAD 结构中，字母 R 代表的第二部分是', options: ['Review（综述）', 'Results（结果）', 'Reference（参考文献）', 'Randomization（随机化）'], answer: 1, explain: 'IMRAD 为 Introduction、Methods、Results、and Discussion。其中 Results 回答「发现了什么」。' },
            { type: 'single', stem: '结构化摘要通常不包括下列哪一项', options: ['Background / Objective', 'Methods', 'Results', 'Acknowledgements'], answer: 3, explain: '结构化摘要四要素为 Background/Objective、Methods、Results、Conclusion。Acknowledgements（致谢）属于正文部分，不在摘要中。' },
            { type: 'single', stem: '阅读医学论文时，评价效应大小应主要参考', options: ['P 值大小', '效应量与置信区间', '样本量的绝对值', '参考文献数量'], answer: 1, explain: 'P 值小只说明差异有统计学意义，不代表效应大。效应大小应看效应量与置信区间。' },
            { type: 'multiple', stem: '下列属于论文 Methods 部分应包含内容的有', options: ['研究设计类型', '研究对象纳入与排除标准', '结局指标定义', '结果的临床解释'], answer: [0, 1, 2], explain: 'Methods 部分描述研究设计、对象、干预、结局指标与统计方法。结果的临床解释属于 Discussion 部分。' },
            { type: 'fill', stem: '论文中表达研究局限性的常用句式是 Several ____ should be noted.', answer: ['limitations'], explain: 'Several limitations should be noted 是讨论部分说明研究局限的标准句式。' }
          ]
        },
        {
          title: '学术写作规范与常见错误',
          summary: '学术写作要求客观、简洁、时态一致；避免主观夸大、口语化与中英直译。',
          tags: ['写作', '规范'],
          content: [
            { type: 'h', level: 3, text: '一、时态使用规范' },
            { type: 'table', head: ['部分', '常用时态', '示例'], rows: [
              ['引言（背景）', '一般现在时', 'Hypertension is a major risk factor for stroke.'],
              ['引言（目的）', '一般过去时 / 现在时', 'This study aimed to evaluate…'],
              ['方法', '一般过去时', 'Patients were randomly assigned to two groups.'],
              ['结果', '一般过去时', 'The intervention group showed a greater reduction.'],
              ['讨论（解释）', '一般现在时', 'These findings suggest that exercise improves outcomes.']
            ]},
            { type: 'note', variant: 'key', title: '记忆原则', text: '**方法与结果用过去时**（已发生的事实），**背景与结论用现在时**（普遍成立的知识）。时态混乱是审稿人最常见的退稿理由之一。' },
            { type: 'h', level: 3, text: '二、语态与句式' },
            { type: 'list', items: [
              '被动语态常用于方法部分：The samples were centrifuged at 3000 rpm.',
              '主动语态在表达作者观点时更清晰：We hypothesize that…',
              '避免冗长的名词化表达：用 We analyzed the data 而非 An analysis of the data was performed',
              '数字与单位之间留空格：5 mL、37 °C、P < 0.05',
              '统计符号斜体：P 值、n、t 检验、r 相关系数'
            ]},
            { type: 'h', level: 3, text: '三、常见错误' },
            { type: 'table', head: ['错误类型', '错误示例', '修改建议'], rows: [
              ['主观夸大', 'This is a breakthrough study.', '改为客观陈述：This study provides evidence that…'],
              ['口语化', 'The results were pretty good.', '改为：The results were favorable.'],
              ['中英直译', 'open the knife（开刀）', '改为 perform surgery'],
              ['过度推断', 'This drug cures all cancers.', '限定范围：This drug showed efficacy in this cohort.'],
              ['缩写未定义', 'Pts were given ACEI.', '首次出现须写全称：Patients were given angiotensin-converting enzyme inhibitors (ACEI).']
            ]},
            { type: 'note', variant: 'warn', title: '关键原则', text: '**结论不得超出数据支持的范围**。Discussion 中可以使用 suggest、indicate、may 等限定词，但不可使用 prove、cure、definitely 这类绝对化表述。' }
          ],
          quiz: [
            { type: 'single', stem: '描述研究方法时，通常应使用', options: ['一般过去时', '一般现在时', '一般将来时', '现在完成时'], answer: 0, explain: '方法与结果描述已发生的事实，用一般过去时；背景与结论用一般现在时。' },
            { type: 'single', stem: '下列表述中，符合学术写作规范的是', options: ['This is a breakthrough study.', 'This study provides evidence that the intervention reduces mortality.', 'The results were pretty good.', 'This drug cures all cancers.'], answer: 1, explain: '学术写作要求客观、有数据支撑，应避免主观夸大（breakthrough）、口语化（pretty good）与过度推断（cures all cancers）。' },
            { type: 'single', stem: '关于统计符号的书写规范，正确的是', options: ['P 值应斜体', 'P 值应加粗', 'P 值应加下划线', 'P 值应加引号'], answer: 0, explain: '统计符号通常斜体书写，包括 P 值、n、t 检验、r 相关系数等。数字与单位之间应留空格，如 5 mL、37 °C。' },
            { type: 'multiple', stem: '下列属于学术写作常见错误的有', options: ['使用 prove、cure 等绝对化表述', '首次出现缩写时不写全称', '数字与单位之间不留空格', '结论限定在数据支持范围内'], answer: [0, 1, 2], explain: '绝对化表述、缩写未定义、单位书写不规范均属常见错误。结论限定在数据支持范围内是正确的做法。' },
            { type: 'fill', stem: '论文讨论部分应使用 suggest、indicate、may 等 ____ 词，避免绝对化表述。', answer: ['限定', '限定词', 'hedging'], explain: '学术写作中常用 suggest、indicate、may、appear to 等限定词（hedging words）使结论表述严谨，避免过度推断。' }
          ]
        }
      ]
    },

    /* ================= 第 5 章 ================= */
    {
      title: '翻译技巧与应试策略',
      desc: '医学英语翻译的语序调整与术语处理，以及选择题、填空题、翻译题的高频陷阱与应对方法。',
      knowledge: [
        {
          title: '医学英语翻译要点',
          summary: '英译中需调整语序、保留术语准确性与临床习惯表达；中译英需注意名词单复数、冠词与被动语态。',
          tags: ['翻译', '技巧'],
          content: [
            { type: 'h', level: 3, text: '一、英译中：语序调整' },
            { type: 'p', text: '英文术语的修饰关系通常**由后向前**：后缀 → 词根 → 前缀。中文则按**由前向后**的顺序表达，即「部位 + 性质 + 类别」。' },
            { type: 'table', head: ['英文', '逐字直译', '规范译法'], rows: [
              ['acute suppurative appendicitis', '急性 化脓性 阑尾 炎', '急性化脓性阑尾炎'],
              ['chronic obstructive pulmonary disease', '慢性 阻塞性 肺 疾病', '慢性阻塞性肺疾病'],
              ['benign prostatic hyperplasia', '良性 前列腺 增生', '良性前列腺增生'],
              ['rheumatoid arthritis', '类风湿 关节炎', '类风湿关节炎']
            ]},
            { type: 'note', variant: 'key', title: '翻译原则', text: '① 术语必须用**规范译名**，不可随意意译；② 长句先划出主谓宾，再逐层安放修饰成分；③ 中文尽量避免「的」字连用，如把「肺的疾病的治疗的药物」简化为「肺病治疗药物」。' },
            { type: 'h', level: 3, text: '二、中译英：语法要点' },
            { type: 'list', items: [
              '**冠词**：可数名词单数前须加 a / an / the；泛指复数可省略',
              '**单复数**：患者、样本、剂量等通常用复数，如 patients、samples、doses',
              '**被动语态**：中文无标记的被动句在英文中常转为被动，如「药物经静脉给药」→ The drug is administered intravenously',
              '**名词化**：中文动词短语常转为英文名词短语，如「预防感染」→ prevention of infection',
              '**逻辑连接**：中文靠语序，英文靠连接词（because / although / whereas / therefore）'
            ]},
            { type: 'note', variant: 'tip', title: '实例对比', text: '中文：虽然手术风险较高，但患者术后恢复良好。<br>英文：**Although** the surgical risk was relatively high, the patient recovered well after the operation.（用 Although 显性表达转折）' },
            { type: 'h', level: 3, text: '三、临床习惯表达' },
            { type: 'table', head: ['中文', '英文习惯表达', '避免的直译'], rows: [
              ['做手术', 'perform / undergo surgery', 'do an operation'],
              ['开刀', 'perform surgery', 'open the knife'],
              ['打针', 'give an injection', 'hit a needle'],
              ['输液', 'administer an intravenous infusion', 'lose water'],
              ['患者主诉', 'The patient complains of…', 'The patient says…']
            ]},
            { type: 'note', variant: 'warn', title: '高频陷阱', text: '**Chinese English（中式英语）** 是翻译题的主要失分点。如把「吃药」译成 eat medicine（应为 take medicine）、把「体重大」译成 body weight is big（应为 the patient is overweight）。平时应积累习惯搭配。' }
          ],
          quiz: [
            { type: 'single', stem: 'acute suppurative appendicitis 的规范译法是', options: ['阑尾炎急性化脓性', '急性化脓性阑尾炎', '化脓性急性阑尾炎', '急性阑尾化脓性炎'], answer: 1, explain: '中文术语按「部位 + 性质 + 类别」的顺序表达，即急性化脓性阑尾炎。英文则相反，修饰成分由后向前。' },
            { type: 'single', stem: '「药物经静脉给药」的规范英文表达是', options: ['The drug gives through vein.', 'The drug is administered intravenously.', 'The drug eats by vein.', 'The drug goes into the vein by people.'], answer: 1, explain: '中文无标记被动句在英文中常转为被动语态，且应使用规范搭配 administer intravenously。' },
            { type: 'single', stem: '「吃药」的正确英文表达是', options: ['eat medicine', 'take medicine', 'drink medicine', 'have medicine'], answer: 1, explain: '「吃药」的固定搭配是 take medicine，不能用 eat。这是中式英语的典型错误。' },
            { type: 'multiple', stem: '中译英时需要注意的语法要点包括', options: ['名词单复数', '冠词的使用', '被动语态的转换', '完全按中文语序逐字翻译'], answer: [0, 1, 2], explain: '中译英需注意单复数、冠词、被动语态、名词化与逻辑连接。完全按中文语序逐字翻译是造成中式英语的主要原因。' },
            { type: 'fill', stem: '「患者主诉头痛」的规范英文是 The patient ____ of headache.', answer: ['complains', 'complains'], explain: '病历中「主诉」的标准表达为 The patient complains of…，不用 The patient says…。' }
          ]
        },
        {
          title: '应试策略与高频陷阱',
          summary: '术语题先切分再判断，辨析题抓对比项，翻译题先定主谓；注意双义词根、相似后缀与拼写陷阱。',
          tags: ['应试', '策略'],
          content: [
            { type: 'h', level: 3, text: '一、各类题型的解题顺序' },
            { type: 'table', head: ['题型', '解题顺序'], rows: [
              ['术语释义题', '切分后缀 → 切分前缀 → 定位词根 → 组合含义'],
              ['近义辨析题', '先找出各选项**不同的那个词素**，差异往往就在此处'],
              ['组合拼写题', '先确定词根，再判断是否需要连接元音 -o-'],
              ['翻译题', '先划出主谓宾，再逐层安放定语与状语'],
              ['判断题', '重点检查含 only、all、never、must 的绝对化表述']
            ]},
            { type: 'note', variant: 'key', title: '核心方法', text: '**「三段切分法」**：任何陌生长术语，先划后缀（定类别）、再划前缀（定限定）、最后定位词根（定部位），最后按中文语序组合。这是应对术语题最稳定的方法。' },
            { type: 'h', level: 3, text: '二、高频陷阱清单' },
            { type: 'table', head: ['陷阱类型', '示例', '辨析要点'], rows: [
              ['双义词根', 'pneumo- 肺 / 气', 'pneumonia 肺炎 vs pneumothorax 气胸，看后半部分'],
              ['双义词根', 'my- 肌 / 骨髓', 'myalgia 肌痛 vs myeloma 骨髓瘤'],
              ['相似后缀', '-tomy / -stomy / -ectomy', '切开 / 造口 / 切除，务必逐一核对'],
              ['相似后缀', '-plasia / -plasty', '增生（生长）vs 成形术（操作）'],
              ['前缀方向', 'ab- 离开 vs ad- 朝向', 'abduction 外展 vs adduction 内收'],
              ['拼写近似', 'ileum 回肠 vs ilium 髂骨', '拼写仅差一个字母，含义完全不同'],
              ['拉丁复数', 'criterion → criteria；bacterium → bacteria', '学术写作中须用正确复数形式']
            ]},
            { type: 'note', variant: 'warn', title: '必记辨析', text: '**ileum（回肠）与 ilium（髂骨）**、**hypo-（低）与 hyper-（高）**、**-algia（痛）与 -plegia（瘫）** 是历年最高频的三组陷阱，考试前务必反复核对。' },
            { type: 'h', level: 3, text: '三、术语记忆方法' },
            { type: 'list', ordered: true, items: [
              '**按系统归类**：把同一器官的词根、相关后缀集中记忆，形成知识块',
              '**按构词反推**：看到一个术语，主动拆解并口述其构词过程',
              '**主动产出**：给出中文，尝试自己拼出英文术语，比被动识记更有效',
              '**对比记忆**：把易混词素列成对照表，标注唯一差异点',
              '**语境记忆**：把术语放进病历或文献句子中记忆，避免孤立背诵'
            ]},
            { type: 'note', variant: 'tip', title: '备考建议', text: '考前应重点复习**高频词根表**与**高频后缀表**（各约 20 个），这两张表可覆盖绝大多数术语题的构成要素；同时整理自己的易混词清单，反复核对。' }
          ],
          quiz: [
            { type: 'single', stem: '术语 ileum 与 ilium 分别表示', options: ['回肠与髂骨', '髂骨与回肠', '空肠与回肠', '结肠与髂骨'], answer: 0, explain: 'ileum 为回肠（小肠的一部分），ilium 为髂骨（骨盆骨的一部分）。两者拼写仅差一个字母，是高频拼写陷阱。' },
            { type: 'single', stem: '区分 abduction 与 adduction 的关键在于前缀', options: ['ab- 表示离开，ad- 表示朝向', 'ab- 表示朝向，ad- 表示离开', '两者前缀相同', '取决于词根'], answer: 0, explain: 'ab- 表示离开，abduction 为外展；ad- 表示朝向，adduction 为内收。前缀方向相反，词根完全相同。' },
            { type: 'single', stem: '应对陌生的长术语，最稳定的方法是', options: ['凭语感猜测', '三段切分法：后缀 → 前缀 → 词根', '只记首字母', '跳过不做'], answer: 1, explain: '三段切分法：先划后缀定类别，再划前缀定限定，最后定位词根定部位，最后按中文语序组合。这是应对术语题最稳定的方法。' },
            { type: 'multiple', stem: '下列属于医学英语高频陷阱的有', options: ['pneumo- 既可表示肺也可表示气', 'my- 既可表示肌也可表示骨髓', '-tomy、-stomy、-ectomy 字形相近', 'criterion 的复数是 criteria'], answer: [0, 1, 2, 3], explain: '四项均属需要注意的陷阱：双义词根、相似后缀、以及拉丁语不规则复数（criterion → criteria）。' },
            { type: 'fill', stem: '后缀 -plasia 表示形成或生长，如 hyperplasia 表示 ____ 。', answer: ['增生'], explain: 'hyper-（过度）+ -plasia（形成/生长）= hyperplasia 增生。注意与 -plasty（成形术，一种操作）区分。' }
          ]
        }
      ]
    },
  ],

  cheatsheet: [
    {
      title: '构词三要素',
      items: [
        '读法顺序：先看后缀定「是什么」，再看前缀定「怎么样」，最后看词根定「在哪里」',
        '例：pericarditis = -itis 炎 + peri- 周围 + cardi- 心 = 心包炎',
        '连接元音 -o- 不携带含义，仅起连接发音作用',
        '约 90% 医学专业术语由希腊语、拉丁语词素拼合而成',
        '同义变体：血 = haem- / hem- / haemat- / hemat-',
        '三段切分法：后缀 → 前缀 → 词根，是术语题最稳定的解法',
        '陌生长词先在草稿上划出三块，再逐块翻译，最后按中文语序组合'
      ]
    },
    {
      title: '高频词根（器官）',
      items: [
        'cardi- 心 / angi- 血管 / vascul- 血管',
        'pneum- 肺、气 / pulmon- 肺 / bronch- 支气管 / pleur- 胸膜',
        'gastr- 胃 / enter- 肠 / col- 结肠 / hepat- 肝 / chol- 胆 / pancreat- 胰',
        'nephr- 肾 / cyst- 膀胱、囊 / ur- 尿 / lith- 石',
        'neur- 神经 / encephal- 脑 / myel- 脊髓、骨髓 / mening- 脑膜',
        'oste- 骨 / arthr- 关节 / my- 肌、骨髓 / tendin- 肌腱 / spondyl- 椎骨',
        'derm- 皮肤 / ophthalm- 眼 / ot- 耳 / rhin- 鼻 / laryng- 喉',
        'cyt- 细胞 / hyster- 子宫 / thyroid- 甲状腺 / adren- 肾上腺'
      ]
    },
    {
      title: '高频前缀与后缀',
      items: [
        '位置：peri- 周围 / endo- 内 / epi- 上 / hypo- 下 / hyper- 上、过度 / sub- 下 / retro- 后 / trans- 穿过 / inter- 之间 / intra- 内',
        '数量：mono-/uni- 一 / bi-/di- 二 / tri- 三 / quadri- 四 / poly-/multi- 多 / oligo- 少 / an- 无',
        '否定：a-/an- 无 / dys- 异常、困难 / anti- 抗 / contra- 对抗 / mal- 不良',
        '程度：brady- 缓慢 / tachy- 快速 / eu- 正常 / pan- 全部 / iso- 相等',
        '疾病：-itis 炎 / -osis 病态 / -pathy 疾病 / -megaly 肿大 / -emia 血液状态 / -oma 肿瘤 / -sclerosis 硬化 / -stenosis 狭窄',
        '症状：-algia/-dynia 痛 / -uria 尿 / -rrhea 流 / -ptosis 下垂 / -plegia 瘫痪 / -spasm 痉挛 / -ptysis 咳出',
        '操作：-scopy 镜检查 / -graphy 造影 / -gram 记录图 / -ectomy 切除 / -tomy 切开 / -stomy 造口 / -plasty 成形 / -pexy 固定 / -lysis 溶解 / -centesis 穿刺',
        '学科：-logy 学科 / -logist 专科医师 / -iatry 治疗学 / -genic 产生的'
      ]
    },
    {
      title: '临床缩写与病历',
      items: [
        'SOAP：Subjective 主观 / Objective 客观 / Assessment 评估 / Plan 计划',
        '病历模块：CC 主诉 / HPI 现病史 / PMH 既往史 / SH 社会史 / FH 家族史 / PE 体格检查',
        '生命体征：BP 血压 / HR 心率 / RR 呼吸频率 / T 体温',
        '检查：CBC 全血细胞计数 / ECG 心电图 / CT 计算机体层成像 / MRI 磁共振成像',
        '用药频率：q.d. 每日一次 / b.i.d. 每日两次 / t.i.d. 每日三次 / q.i.d. 每日四次 / PRN 必要时',
        '给药途径：I.V. 静脉 / I.M. 肌内 / P.O. 口服 / NPO 禁食',
        '诊断治疗：Dx 诊断 / Tx 治疗 / Rx 处方 / Hx 病史 / Sx 症状',
        '疼痛问诊框架 OPQRST：起病、诱因缓解、性质、部位放射、程度、时间',
        '缩写安全：q.d. 与 q.i.d. 易误读，U 易误读为 0，应写作 unit'
      ]
    },
    {
      title: '文献、写作与应试',
      items: [
        'IMRAD：Introduction 引言 / Methods 方法 / Results 结果 / Discussion 讨论',
        '摘要四要素：Background-Objective / Methods / Results / Conclusion',
        '时态：方法与结果用过去时；背景与结论用现在时',
        '效应大小看效应量与置信区间，不看 P 值',
        '结论不得超出数据支持范围，多用 suggest / indicate / may 等限定词',
        '数字与单位之间留空格：5 mL、37 °C；统计符号斜体：P、n、t、r',
        '英译中语序：英文由后向前，中文由前向后（部位 + 性质 + 类别）',
        '中译英要点：冠词、单复数、被动语态、名词化、逻辑连接词',
        '高频辨析：ileum 回肠 vs ilium 髂骨；hypo- 低 vs hyper- 高；-algia 痛 vs -plegia 瘫',
        '拉丁复数：criterion → criteria；bacterium → bacteria'
      ]
    }
  ]
});
