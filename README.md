# MediLearn · 医学学习站

一个面向医学院校学生的**纯静态**复习站点。把课程资料整理成结构化知识点，配自测题与错题本，
再用 Markdown 导出打通「看 → 练 → 回顾 → 带走」的闭环。

> 无构建步骤 · 无第三方依赖 · 可直接双击打开 · 可离线使用
>
> **作者**：元泯　·　**联系邮箱**：[1959940664@qq.com](mailto:1959940664@qq.com)

---

## 目录结构

```
medilearn/
├── login.html          访问验证：密钥登录、粒子背景、玻璃卡片、失败抖动、锁定倒计时
├── index.html          总览：全站统计、快捷入口、科目卡片、进度环
├── subjects.html       全部科目 + 全站知识点搜索（按 / 聚焦搜索框）
├── subject.html        科目详情：章节手风琴、知识点列表、标记已学、下载全册
├── knowledge.html      知识点正文：目录高亮、上/下条切换、下载与打印
├── quiz.html           在线练习：四种题型、即时解析、计时、结果页与彩蛋
├── wrongbook.html      错题本：按科目筛选、重做、移除、导出
├── about.html          站点说明、作者信息、数据来源
├── 404.html            未找到页面
├── css/
│   └── style.css       设计系统 + 高级视觉层（极光背景 / 玻璃拟态 / 滚动揭示）
├── js/
│   ├── auth.js         访问门禁：SHA-256 校验、令牌、失败计数与锁定
│   ├── core.js         核心运行时：数据注册、存储、主题、渲染、导出、搜索
│   ├── fx.js           特效引擎：极光、光斑跟随、涟漪、数字滚动、视差、彩带
│   └── viz.js          交互动画：统计学 7 个可拖拽图表（纯 SVG，按容器宽度绘制）
└── data/
    ├── xssx.js                     习近平新时代中国特色社会主义思想概论
    ├── ethics.js                   医学伦理学
    ├── bigdata.js                  医学大数据
    ├── statistics.js               医学统计学
    ├── pharmacology.js             药理学
    ├── respiratory.js              呼吸系统
    ├── cardiology.js               心血管系统
    ├── hematology.js               血液系统
    ├── endocrinology.js            内分泌系统
    ├── diagnostics.js              诊断学
    └── surgery.js                  外科学与治疗
```

---

## 主要特性

| 能力 | 说明 |
| --- | --- |
| 结构化知识点 | 11 个科目 · 53 章 · 151 个知识点，块级内容（标题/段落/列表/表格/提示/术语/键值/图示/代码） |
| 在线练习 | 850 道题，单选/多选/判断/填空四型；**每次练习题目与选项顺序都会重新打乱**，避免靠位置记忆 |
| 错题本 | 答错自动收录，按科目筛选、重做、移除、导出 Markdown |
| 学习进度 | 逐知识点标记「已学」，首页与科目页显示进度环，全部存在浏览器本地 |
| 导出 | 单知识点或整册导出 Markdown，可复制、下载或打印为 PDF |
| 交互动画 | 医学统计学内置 7 个可拖拽图表：频数直方图（组距合并）、正态曲线（μ/σ）、u 变换、参考值范围（单双侧）、标准误（样本量）、t 分布（自由度）、两类错误（α/β） |
| 视觉与动效 | 极光背景、玻璃拟态悬浮按钮、滚动揭示、光斑跟随、涟漪、数字滚动、视差、彩带 |
| 主题 | 浅色 / 深色一键切换，跟随系统偏好，选择本地记忆 |
| 响应式 | 手机端专用适配层：安全区、44px 触摸热区、抽屉导航、表格横滚、动效降级 |
| 无障碍 | 键盘可达、`prefers-reduced-motion` 尊重系统设置、图表带 `aria-label` |

---

## 访问门禁（登录）

首次打开任意页面都会跳转到 `login.html`，输入正确密钥后才能进入。登录状态默认记住 **30 天**；
连续输错 **5 次**会锁定 **60 秒**。

> **重要说明**：本站是纯静态站点，没有服务端，因此这属于**前端门禁**——可以挡住随手点进来的访客，
> 但懂技术的人查看网页源码是能绕过的。请勿把它当作真正的账号密码安全来使用。

### 默认密钥

```
yuanmin0106
```

### 更换密钥

源码中**不保存明文密钥**，只保存它的 SHA-256 哈希，所以换密钥分两步。

**第 1 步：算出新密钥的哈希**

打开站点任意页面，按 `F12` 打开控制台，输入（把 `新密钥` 换成你要的内容）：

```js
WB.auth.sha256('新密钥')
```

回车后会输出一串 64 位十六进制字符串，复制它。

> 也可以用 Node.js：`node -e "console.log(require('crypto').createHash('sha256').update('新密钥').digest('hex'))"`

**第 2 步：替换哈希**

打开 `js/auth.js`，找到 `CFG` 里的这一行，把值换成新哈希：

```js
HASH: '313e7f9bd2dc3b6a1f921165506c3c2dc195613fc89e06b74cfd32a3829f4ca1',
```

提交后等 1～2 分钟部署生效即可。**改完记得用新密钥登录一次**，旧密钥会立即失效。

### 其他可调参数

同样在 `js/auth.js` 的 `CFG` 中：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `DAYS` | `30` | 登录状态记住多少天 |
| `MAX_FAIL` | `5` | 连续输错几次后锁定 |
| `LOCK_SEC` | `60` | 锁定时长（秒） |

### 忘记密钥了怎么办

密钥就是你在 `js/auth.js` 里设定哈希的那个原始字符串，源码里查不到明文。
如果确实想不起来了，直接按上面的步骤**换一个新密钥**即可。

### 退出登录

站内任意页面的右上角有 ⏻ 按钮，点击后确认即可退出，需要重新输入密钥。

---

## 内容规模

| 科目 | 章节 | 知识点 | 练习题 |
|---|---:|---:|---:|
| 习近平新时代中国特色社会主义思想概论 | 7 | 20 | 115 |
| 医学伦理学 | 7 | 18 | 105 |
| 医学大数据 | 6 | 19 | 95 |
| 医学统计学 | 6 | 17 | 95 |
| 药理学 | 6 | 22 | 132 |
| 呼吸系统 | 4 | 12 | 64 |
| 心血管系统 | 4 | 9 | 48 |
| 血液系统 | 3 | 9 | 49 |
| 内分泌系统 | 3 | 7 | 41 |
| 诊断学 | 3 | 9 | 52 |
| 外科学与治疗 | 4 | 9 | 54 |
| **合计** | **53** | **151** | **850** |

另有 1620 个内容块、220 张对比表格、301 条键值对照、48 套考前速览速记卡。

---

## 功能特性

### 学习闭环
- **知识点浏览**：表格、要点框、术语卡、公式块、口诀引用统一渲染
- **在线刷题**：单选 / 多选 / 判断 / 填空四种题型，每题都有解析
- **错题本**：答错自动收录，记录错误次数，支持筛选、重做与移除
- **进度追踪**：知识点可标记「已学」，科目卡片显示进度环，数据存于 localStorage
- **一键导出**：Markdown（含/不含习题与答案）、复制到剪贴板、打印为 PDF

### 视觉与交互
- **登录页**：粒子连线背景、玻璃卡片 3D 倾斜、流光描边、密钥显隐切换、
  失败抖动、大写锁定提醒、锁定倒计时环、成功勾选动画 + 彩带
- **玻璃拟态悬浮按钮**：backdrop-blur + 内高光 + 悬停浮起 + 光带扫过
- **极光背景**：三团渐变光斑缓慢漂移，并随鼠标做轻微视差
- **滚动揭示**：内容块进入视口时依次上浮淡入
- **光斑跟随**：鼠标经过卡片时出现跟随的径向高光
- **涟漪反馈**：按钮点击位置扩散涟漪
- **数字滚动**：统计数字进入视口时递增动画
- **顶部滚动进度条**、**悬浮操作坞**、**答对彩带**、**深色模式**
- 全部动效遵循 `prefers-reduced-motion`，系统开启「减少动态效果」时自动关闭

---

## 本地运行

站点无构建步骤，三种方式任选：

```bash
# 方式一：直接打开
双击 index.html

# 方式二：起一个本地服务（推荐，避免个别浏览器的本地文件限制）
python -m http.server 8080
# 然后访问 http://localhost:8080

# 方式三：Node
npx serve .
```

---

## 部署到 GitHub + Cloudflare Pages

### 1. 推送到 GitHub

```bash
cd medilearn
git init
git add .
git commit -m "feat: MediLearn 医学学习站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. Cloudflare Pages 连接仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. 点击 **Create** → 选择 **Pages** 标签 → **Connect to Git**
3. 授权并选择刚推送的仓库
4. 构建设置：
   - **Framework preset**：`None`
   - **Build command**：*留空*
   - **Build output directory**：`/`（若仓库根目录就是站点，填 `/`；若站点在子目录，填 `medilearn`）
5. 点击 **Save and Deploy**，等待数十秒即可获得 `https://<项目名>.pages.dev` 地址

### 3. 后续更新

推送到 `main` 分支即自动重新部署。

> **GitHub Pages 备选**：仓库 Settings → Pages → Source 选择 `main` 分支 `/ (root)`，保存后访问
> `https://<用户名>.github.io/<仓库名>/`。仓库中已包含 `.nojekyll`，避免 Jekyll 处理下划线开头的文件。

---

## 数据文件编写规范

每个科目是一个纯 JS 文件，调用 `WB.register({...})` 注册。

### 科目骨架

```js
WB.register({
  id: 'subject-id',            // kebab-case
  name: '科目中文名',
  en: 'English Name',
  icon: '📈',                  // 单个 emoji
  accent: 'var(--brand)',      // 与 accentSoft 必须成对
  accentSoft: 'var(--brand-soft)',
  order: 4,                    // 越小越靠前
  desc: '卡片上的一句话介绍（30-50 字）',
  intro: '科目页头部的课程说明（2-3 句）',
  source: '素材来源：……',
  chapters: [ /* 章节数组 */ ],
  cheatsheet: [ /* 考前速览模块 */ ]
});
```

可选配色对：`--brand`、`--teal`、`--rose`、`--amber`、`--violet`、`--cyan`（各带 `-soft` 变体）。

### 知识点

```js
{
  title: '知识点标题',
  summary: '40-70 字概要，列表页显示',
  tags: ['考点', '计算'],
  content: [ /* 内容块 */ ],
  quiz: [ /* 题目 */ ]
}
```

### 内容块类型

| type | 字段 | 说明 |
|---|---|---|
| `h` | `level`(3/4), `text` | 小标题，level 3 会进入右侧目录 |
| `p` | `text` | 段落 |
| `list` | `items[]`, `ordered` | 列表 |
| `table` | `head[]`, `rows[][]` | 表格，`rows` 每行长度须等于 `head` |
| `note` | `variant`, `title`, `text` | 提示框，variant ∈ `info` `tip` `warn` `key` |
| `terms` | `items[{en,cn,note}]` | 术语卡片网格 |
| `kv` | `items[{k,v}]` | 键值对照行 |
| `code` | `text` | 等宽代码/公式块 |
| `quote` | `text` | 引用 / 口诀 |

### 题目类型

```js
{ type: 'single',   stem: '…', options: ['A','B','C','D'], answer: 1,        explain: '…' }
{ type: 'multiple', stem: '…', options: ['A','B','C','D'], answer: [0, 2],    explain: '…' }
{ type: 'judge',    stem: '…', answer: true,                                  explain: '…' }
{ type: 'fill',     stem: '… ____ …', answer: ['标准答案', '同义写法'],        explain: '…' }
```

- `single` 的 `answer` 是**下标数字**（0 起）
- `multiple` 的 `answer` 是**下标数组**（2-3 个正确项）
- `judge` 的 `answer` 是布尔值
- `fill` 的 `answer` 是字符串数组，匹配时忽略大小写与空格

### 富文本

仅支持三种标记，其余 HTML 会被转义显示：

- `**加粗**`
- `[[行内代码]]`
- `<br>` 换行

> **注意**：中文内容里若出现英文单引号（如 `patient's`），请改写成 `the patient` 或使用中文引号，
> 避免破坏 JS 字符串。文件必须能通过 `node --check`。

---

## 浏览器支持

Chrome / Edge / Firefox / Safari 近两年版本。使用到的现代特性：`backdrop-filter`、
`color-mix()`、`IntersectionObserver`、CSS 自定义属性、`aspect-ratio`。
不支持 `color-mix()` 的旧浏览器会退化为无染色效果，功能不受影响。

---

## 数据与隐私

所有学习进度、错题记录、做题日志均保存在**浏览器 localStorage**，不上传任何服务器。
清除浏览器数据会同时清空这些记录，并需要重新登录。关于页提供「重置全部数据」入口。

localStorage 中使用的键：

| 键 | 内容 |
|---|---|
| `medilearn.auth.v1` | 登录令牌（含到期时间） |
| `medilearn.authfail.v1` | 失败次数与锁定截止时间 |
| `medilearn.progress.v1` | 知识点已学标记 |
| `medilearn.wrong.v1` | 错题本（按题目 uid 索引的对象） |
| `medilearn.quizlog.v1` | 做题日志 |
| `medilearn.last.v1` | 上次学习的知识点 |
| `medilearn.theme` | 浅色 / 深色主题 |

---

## 许可

MIT License，详见 [LICENSE](LICENSE)。

知识点内容整理自本人课程资料，仅供个人学习使用；如需引用请自行核对原始出处。
