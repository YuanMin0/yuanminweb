# -*- coding: utf-8 -*-
"""器官3 大题速背页用的自绘 SVG 示意图（莫奈配色，viewBox 720 宽）。"""

# 通用配色
C = dict(
    ink='#2E2A24', sub='#6B6255', line='#C9BFA8',
    blue='#5B84A8', blueL='#E3EDF5', blueD='#3E5F7D',
    red='#C0554A', redL='#F8E4E0',
    gold='#D9A75E', goldL='#FBF0DA',
    green='#8FA96B', greenL='#EDF2E2',
    violet='#8E7BA8', violetL='#EFE9F4',
    paper='#FDFBF4',
)

def _t(x, y, s, size=13, fill=None, anchor='start', weight='400', family='sans'):
    fill = fill or C['ink']
    return ('<text x="%d" y="%d" font-size="%d" fill="%s" text-anchor="%s" '
            'font-weight="%s" font-family="%s">%s</text>') % (x, y, size, fill, anchor, weight, family, s)

def _box(x, y, w, h, fill, stroke=None, rx=8, sw=1.4, dash=''):
    stroke = stroke or C['line']
    d = ' stroke-dasharray="%s"' % dash if dash else ''
    return ('<rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s" stroke="%s" '
            'stroke-width="%s"%s/>') % (x, y, w, h, rx, fill, stroke, sw, d)

def _arrow(x1, y1, x2, y2, color=None, w=1.8, dash=''):
    color = color or C['blueD']
    d = ' stroke-dasharray="%s"' % dash if dash else ''
    return ('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%s" '
            'marker-end="url(#ah)"%s/>') % (x1, y1, x2, y2, color, w, d)

DEFS = ('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
        'markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" '
        'fill="%s"/></marker></defs>') % C['blueD']


def wrap(body, w=720, h=320, title=''):
    import hashlib
    uid = 'ah' + hashlib.md5(title.encode('utf-8')).hexdigest()[:6]
    defs = DEFS.replace('id="ah"', 'id="%s"' % uid)
    body = body.replace('url(#ah)', 'url(#%s)' % uid)
    return ('<svg class="fig-svg" viewBox="0 0 %d %d" role="img" aria-label="%s" '
            'xmlns="http://www.w3.org/2000/svg">%s<rect width="%d" height="%d" fill="%s"/>%s</svg>'
            ) % (w, h, title, defs, w, h, C['paper'], body)


# ---------------- 1. 两类肾单位 ----------------
SVG_NEPHRON = wrap(
    # 左：皮质肾单位
    _box(20, 40, 310, 240, C['blueL'], C['blue'], 12) +
    _t(175, 66, '皮质肾单位（85%～90%）', 13.5, C['blueD'], 'middle', '700') +
    '<circle cx="110" cy="112" r="24" fill="%s" stroke="%s" stroke-width="2"/>' % (C['paper'], C['red']) +
    _t(110, 117, '肾小体', 11, C['red'], 'middle') +
    '<path d="M110 136 L110 182 Q110 216 150 228 L196 240" fill="none" stroke="%s" stroke-width="2.6" stroke-linecap="round"/>' % C['blueD'] +
    _t(146, 190, '髓袢短', 12, C['blueD'], 'start', '700') +
    _t(40, 262, '入球＞出球 · 管周毛细血管胶渗压高', 11, C['sub']) +
    # 右：近髓肾单位
    _box(390, 40, 310, 240, C['violetL'], C['violet'], 12) +
    _t(545, 66, '近髓肾单位（10%～15%）', 13.5, C['violet'], 'middle', '700') +
    '<circle cx="470" cy="112" r="24" fill="%s" stroke="%s" stroke-width="2"/>' % (C['paper'], C['red']) +
    _t(470, 117, '肾小体', 11, C['red'], 'middle') +
    # 髓袢（实线，长）
    '<path d="M470 136 L470 182 Q470 240 505 254 L540 264" fill="none" stroke="%s" stroke-width="2.6" stroke-linecap="round"/>' % C['violet'] +
    # 直小血管（虚线，与髓袢并行）
    '<path d="M492 142 L492 186 Q492 236 522 248 L552 258" fill="none" stroke="%s" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>' % C['blue'] +
    _t(498, 188, '髓袢长', 12, C['violet'], 'start', '700') +
    _t(600, 200, '直小血管', 11.5, C['blueD'], 'start', '700') +
    '<line x1="596" y1="205" x2="560" y2="240" stroke="%s" stroke-width="1.3" stroke-dasharray="3 3"/>' % C['blue'] +
    # 底部总结
    _t(360, 312, '两类肾单位的数量、髓袢长度、入/出球口径、出球后血管与功能均不同', 12, C['sub'], 'middle'),
    720, 330, '两类肾单位的结构对比')

# ---------------- 2. 滤过膜三层 ----------------
SVG_FILTRATION = wrap(
    _t(30, 40, '血液侧', 13, C['sub']) + _t(640, 40, '肾小囊侧', 13, C['sub'], 'end') +
    _box(60, 60, 90, 170, C['redL'], C['red']) + _t(105, 150, '内皮', 13, C['red'], 'middle', '700') +
    _t(105, 170, '窗孔', 12, C['sub'], 'middle') +
    _box(200, 60, 110, 170, C['goldL'], C['gold']) + _t(255, 150, '基膜', 13, C['gold'], 'middle', '700') +
    _t(255, 170, '主要屏障', 11, C['sub'], 'middle') +
    _box(360, 60, 110, 170, C['greenL'], C['green']) + _t(415, 145, '足细胞', 13, C['green'], 'middle', '700') +
    _t(415, 165, '裂孔膜', 12, C['sub'], 'middle') +
    _arrow(150, 145, 198, 145, C['blueD']) + _arrow(310, 145, 358, 145, C['blueD']) +
    _arrow(470, 145, 540, 145, C['blueD']) +
    _t(575, 140, '原尿', 14, C['blueD'], 'middle', '700') +
    _box(30, 250, 660, 56, C['blueL'], C['blue'], 8) +
    _t(44, 272, '分子屏障：有效半径 ＜1.8 nm 可通过；＞3.6 nm（白蛋白 70 kDa）不能通过', 12, C['ink']) +
    _t(44, 294, '电荷屏障：基膜带负电荷，同样大小 正电荷 ＞ 中性 ＞ 负电荷（白蛋白带负电被排斥）', 12, C['ink']),
    720, 320, '滤过膜三层与双重屏障')

# ---------------- 3. 有效滤过压 ----------------
SVG_EFP = wrap(
    _box(40, 60, 300, 190, C['paper'], C['blue']) +
    _t(190, 88, '有效滤过压', 15, C['blueD'], 'middle', '700') +
    _t(190, 128, '＝ 肾小球毛细血管血压', 14, C['red'], 'middle', '700') +
    _t(190, 156, '－（血浆胶体渗透压 ＋ 囊内压）', 14, C['green'], 'middle', '700') +
    _t(190, 190, '动力 − 阻力', 12, C['sub'], 'middle') +
    _t(190, 220, '正常约 45 −（25＋10）＝ 10 mmHg', 12, C['sub'], 'middle') +
    _box(380, 60, 300, 88, C['redL'], C['red']) +
    _t(394, 84, '动力：肾小球毛细血管血压', 13, C['red'], 'start', '700') +
    _t(394, 108, '入球端高、出球端略低', 12, C['sub']) +
    _t(394, 132, '受动脉血压与入/出球阻力影响', 12, C['sub']) +
    _box(380, 162, 300, 88, C['greenL'], C['green']) +
    _t(394, 186, '阻力：胶渗压 ＋ 囊内压', 13, C['green'], 'start', '700') +
    _t(394, 210, '胶渗压沿毛细血管升高（滤过平衡点）', 12, C['sub']) +
    _t(394, 234, '囊内压升高见于尿路梗阻、管型阻塞', 12, C['sub']) +
    _t(360, 292, '有效滤过压降至 0 处即滤过平衡点；肾血浆流量增加使平衡点后移、GFR 升高', 12, C['sub'], 'middle'),
    720, 310, '有效滤过压的构成')

# ---------------- 4. 管球反馈 ----------------
SVG_TGF = wrap(
    _box(240, 50, 240, 70, C['blueL'], C['blue'], 10) +
    _t(360, 78, 'GFR 升高', 14, C['blueD'], 'middle', '700') +
    _t(360, 102, '滤出增多', 12, C['sub'], 'middle') +
    _arrow(360, 122, 360, 158) +
    _box(240, 160, 240, 70, C['goldL'], C['gold'], 10) +
    _t(360, 188, '致密斑感受 NaCl ↑', 14, C['gold'], 'middle', '700') +
    _t(360, 212, '（远曲小管起始部）', 12, C['sub'], 'middle') +
    _arrow(360, 232, 360, 268) +
    _box(240, 270, 240, 70, C['greenL'], C['green'], 10) +
    _t(360, 298, '入球小动脉收缩', 14, C['green'], 'middle', '700') +
    _t(360, 322, '肾血浆流量与 GFR 回落', 12, C['sub'], 'middle') +
    '<path d="M240 305 Q120 305 120 200 Q120 85 238 85" fill="none" stroke="%s" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#ah)"/>' % C['violet'] +
    _t(126, 196, '负反馈', 12, C['violet'], 'middle', '700') +
    _t(560, 120, 'GFR 下降时', 12, C['sub'], 'middle') +
    _t(560, 142, '致密斑 NaCl ↓', 12, C['sub'], 'middle') +
    _t(560, 164, '→ 入球舒张', 12, C['sub'], 'middle') +
    _t(560, 186, '→ GFR 回升', 12, C['sub'], 'middle'),
    720, 350, '管球反馈机制')

# ---------------- 5. 逆流倍增 ----------------
SVG_COUNTER = wrap(
    '<path d="M180 60 L180 250 Q180 280 210 280 L250 280 Q280 280 280 250 L280 60" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round"/>' % C['blue'] +
    _t(160, 80, '降支', 13, C['blueD'], 'end', '700') +
    _t(160, 104, '透水', 12, C['sub'], 'end') +
    _t(160, 126, '不透 NaCl', 12, C['sub'], 'end') +
    _t(300, 80, '升支', 13, C['red'], 'start', '700') +
    _t(300, 104, '透 NaCl', 12, C['sub']) +
    _t(300, 126, '不透水', 12, C['sub']) +
    _arrow(214, 120, 250, 120, C['blue'], 1.4, '4 3') +
    _t(232, 112, '水出', 11, C['blue'], 'middle') +
    _arrow(250, 200, 214, 200, C['red'], 1.4, '4 3') +
    _t(232, 192, '盐出', 11, C['red'], 'middle') +
    _box(380, 55, 300, 60, C['goldL'], C['gold'], 8) +
    _t(394, 78, '外髓：约 300 → 600 mOsm/L', 13, C['gold'], 'start', '700') +
    _t(394, 100, '升支粗段 NKCC2 主动泵出 NaCl', 11, C['sub']) +
    _box(380, 130, 300, 60, C['redL'], C['red'], 8) +
    _t(394, 153, '内髓：可达 1200 mOsm/L', 13, C['red'], 'start', '700') +
    _t(394, 175, '尿素再循环参与建梯度', 11, C['sub']) +
    _box(380, 205, 300, 60, C['blueL'], C['blue'], 8) +
    _t(394, 228, '直小血管：逆流交换', 13, C['blueD'], 'start', '700') +
    _t(394, 250, '供血但不冲走溶质', 11, C['sub']) +
    _t(360, 300, 'ADH 使集合管 AQP2 插入 → 水沿梯度重吸收 → 尿浓缩；ADH 缺乏 → 尿崩症', 12, C['sub'], 'middle'),
    720, 315, '逆流倍增与尿液浓缩')

# ---------------- 6. RAAS ----------------
SVG_RAAS = wrap(
    _box(30, 40, 130, 52, C['blueL'], C['blue'], 8) + _t(95, 72, '肾缺血', 13, C['blueD'], 'middle', '700') +
    _arrow(160, 66, 196, 66) +
    _box(198, 40, 150, 52, C['goldL'], C['gold'], 8) + _t(273, 72, '球旁细胞→肾素', 13, C['gold'], 'middle', '700') +
    _arrow(348, 66, 384, 66) +
    _box(386, 40, 150, 52, C['greenL'], C['green'], 8) + _t(461, 72, '血管紧张素原', 13, C['green'], 'middle', '700') +
    _arrow(536, 66, 572, 66) +
    _box(574, 40, 118, 52, C['violetL'], C['violet'], 8) + _t(633, 72, 'AngⅠ', 13, C['violet'], 'middle', '700') +
    _arrow(633, 92, 633, 124) +
    _t(650, 112, 'ACE（肺）', 11, C['sub']) +
    _box(574, 126, 118, 52, C['redL'], C['red'], 8) + _t(633, 158, 'AngⅡ', 13, C['red'], 'middle', '700') +
    _arrow(574, 152, 540, 152) +
    _box(380, 126, 158, 52, C['redL'], C['red'], 8) + _t(459, 158, '醛固酮 ↑', 13, C['red'], 'middle', '700') +
    _arrow(380, 152, 344, 152) +
    _box(198, 126, 144, 52, C['blueL'], C['blue'], 8) + _t(270, 158, '保钠排钾保水', 13, C['blueD'], 'middle', '700') +
    _box(30, 210, 660, 74, C['paper'], C['line'], 8) +
    _t(44, 234, 'AngⅡ 的其他作用：微动脉收缩→外周阻力↑、血压↑；静脉收缩→回心血量↑；', 12, C['ink']) +
    _t(44, 256, '交感缩血管中枢兴奋；渴感↑、ADH↑；肾小管 Na⁺ 与水重吸收↑', 12, C['ink']) +
    _t(44, 278, '临床：ACEI/ARB 阻断此轴 → 降压、减少蛋白尿、延缓肾衰', 12, C['red']),
    720, 300, '肾素-血管紧张素-醛固酮系统')

# ---------------- 7. 三种脱水 ----------------
SVG_DEHYD = wrap(
    _box(20, 40, 220, 230, C['redL'], C['red'], 10) +
    _t(130, 66, '高渗性脱水', 15, C['red'], 'middle', '700') +
    _t(130, 90, '失水 ＞ 失钠', 12, C['sub'], 'middle') +
    _t(130, 118, '血 Na⁺ ＞150', 13, C['ink'], 'middle', '700') +
    _t(130, 142, '渗透压 ↑', 12, C['ink'], 'middle') +
    _t(130, 170, '细胞内液减少为主', 12, C['ink'], 'middle') +
    _t(130, 198, '口渴明显 · 不易休克', 12, C['red'], 'middle', '700') +
    _t(130, 226, '补 5% 葡萄糖', 12, C['blueD'], 'middle') +
    _box(250, 40, 220, 230, C['blueL'], C['blue'], 10) +
    _t(360, 66, '低渗性脱水', 15, C['blueD'], 'middle', '700') +
    _t(360, 90, '失钠 ＞ 失水', 12, C['sub'], 'middle') +
    _t(360, 118, '血 Na⁺ ＜135', 13, C['ink'], 'middle', '700') +
    _t(360, 142, '渗透压 ↓', 12, C['ink'], 'middle') +
    _t(360, 170, '细胞外液明显减少', 12, C['ink'], 'middle') +
    _t(360, 198, '不口渴 · 最易休克', 12, C['red'], 'middle', '700') +
    _t(360, 226, '补含盐液/高渗盐水', 12, C['blueD'], 'middle') +
    _box(480, 40, 220, 230, C['greenL'], C['green'], 10) +
    _t(590, 66, '等渗性脱水', 15, C['green'], 'middle', '700') +
    _t(590, 90, '水钠成比例丢失', 12, C['sub'], 'middle') +
    _t(590, 118, '血 Na⁺ 135～150', 13, C['ink'], 'middle', '700') +
    _t(590, 142, '渗透压 正常', 12, C['ink'], 'middle') +
    _t(590, 170, '细胞外液为主', 12, C['ink'], 'middle') +
    _t(590, 198, '口渴 · 偶发休克', 12, C['red'], 'middle', '700') +
    _t(590, 226, '补平衡盐溶液', 12, C['blueD'], 'middle') +
    _t(360, 296, '判断口诀：看血钠与渗透压 —— 高则补水、低则补盐、正常则补平衡液', 12, C['sub'], 'middle'),
    720, 315, '三种脱水类型对比')

# ---------------- 8. 休克三期 ----------------
SVG_SHOCK = wrap(
    _box(20, 50, 210, 200, C['goldL'], C['gold'], 10) +
    _t(125, 76, 'Ⅰ 缺血期', 15, C['gold'], 'middle', '700') +
    _t(125, 100, '代偿期', 11, C['sub'], 'middle') +
    _t(125, 132, '少灌少流', 13, C['ink'], 'middle', '700') +
    _t(125, 156, '前紧后松', 12, C['ink'], 'middle') +
    _t(125, 184, '面白肢冷脉压小', 12, C['red'], 'middle') +
    _t(125, 206, '神清脉快尿量少', 12, C['red'], 'middle') +
    _t(125, 232, '自身输血 + 自身输液', 11, C['sub'], 'middle') +
    _box(250, 50, 210, 200, C['redL'], C['red'], 10) +
    _t(355, 76, 'Ⅱ 淤血期', 15, C['red'], 'middle', '700') +
    _t(355, 100, '失代偿期', 11, C['sub'], 'middle') +
    _t(355, 132, '多灌少流', 13, C['ink'], 'middle', '700') +
    _t(355, 156, '前松后紧', 12, C['ink'], 'middle') +
    _t(355, 184, '昏迷血压降', 12, C['red'], 'middle') +
    _t(355, 206, '发绀无尿量', 12, C['red'], 'middle') +
    _t(355, 232, '自身输血/输液停止', 11, C['sub'], 'middle') +
    _box(480, 50, 220, 200, C['violetL'], C['violet'], 10) +
    _t(590, 76, 'Ⅲ 衰竭期', 15, C['violet'], 'middle', '700') +
    _t(590, 100, '难治期', 11, C['sub'], 'middle') +
    _t(590, 132, '不灌不流', 13, C['ink'], 'middle', '700') +
    _t(590, 156, '血管麻痹 + DIC', 12, C['ink'], 'middle') +
    _t(590, 184, '低压难复开', 12, C['red'], 'middle') +
    _t(590, 206, '凝血多脏衰', 12, C['red'], 'middle') +
    _t(590, 232, 'MODS', 11, C['sub'], 'middle') +
    _arrow(230, 150, 248, 150, C['sub']) + _arrow(460, 150, 478, 150, C['sub']) +
    _t(360, 288, '共同本质：有效循环血量↓ → 组织灌注不足 → 细胞缺氧、代谢紊乱 → 器官功能障碍', 12, C['sub'], 'middle'),
    720, 305, '休克三期的微循环变化')

# ---------------- 9. 酸碱五步 ----------------
SVG_AB = wrap(
    _box(20, 40, 660, 40, C['blueL'], C['blue'], 8) +
    _t(34, 65, '① 看 pH：＜7.35 酸中毒 · ＞7.45 碱中毒 · 7.35～7.45 为代偿或混合', 12, C['ink']) +
    _box(20, 88, 660, 40, C['goldL'], C['gold'], 8) +
    _t(34, 113, '② 看原发：HCO₃⁻ 原发改变 → 代谢性；PaCO₂ 原发改变 → 呼吸性（与 pH 同向者为原发）', 12, C['ink']) +
    _box(20, 136, 660, 40, C['greenL'], C['green'], 8) +
    _t(34, 161, '③ 看代偿：代酸 PaCO₂＝1.5×HCO₃⁻＋8±2；超出预计 → 混合性', 12, C['ink']) +
    _box(20, 184, 660, 40, C['violetL'], C['violet'], 8) +
    _t(34, 209, '④ 算 AG＝Na⁺−(Cl⁻＋HCO₃⁻)，正常 12±4；AG↑ 为 AG 增高型代酸，AG 正常而 Cl⁻↑ 为高氯型', 12, C['ink']) +
    _box(20, 232, 660, 40, C['redL'], C['red'], 8) +
    _t(34, 257, '⑤ 判混合：代偿超出预计范围、AG 与 HCO₃⁻ 变化不匹配 → 混合性酸碱失衡', 12, C['ink']) +
    _t(360, 300, '例：pH 7.30、HCO₃⁻ 15、PaCO₂ 30 → 代酸（预计 PaCO₂ 30.5，符合单纯代酸）', 12, C['sub'], 'middle'),
    720, 315, '酸碱失衡五步判断法')

# ---------------- 10. 抗菌药五位点 ----------------
SVG_ABX = wrap(
    _box(250, 30, 220, 250, C['paper'], C['blue'], 14, 2) +
    _t(360, 54, '细菌', 14, C['blueD'], 'middle', '700') +
    _box(268, 66, 184, 34, C['redL'], C['red'], 7) + _t(360, 89, '① 细胞壁合成', 12, C['red'], 'middle', '700') +
    _box(268, 108, 184, 34, C['goldL'], C['gold'], 7) + _t(360, 131, '② 胞质膜通透性', 12, C['gold'], 'middle', '700') +
    _box(268, 150, 184, 34, C['greenL'], C['green'], 7) + _t(360, 173, '③ 蛋白质合成', 12, C['green'], 'middle', '700') +
    _box(268, 192, 184, 34, C['blueL'], C['blue'], 7) + _t(360, 215, '④ 核酸代谢', 12, C['blueD'], 'middle', '700') +
    _box(268, 234, 184, 34, C['violetL'], C['violet'], 7) + _t(360, 257, '⑤ 叶酸代谢', 12, C['violet'], 'middle', '700') +
    _t(30, 82, '青霉素/头孢', 12, C['red'], 'start', '700') + _t(30, 102, '万古霉素', 11, C['sub']) +
    _t(30, 124, '多粘菌素', 12, C['gold'], 'start', '700') + _t(30, 144, '两性霉素B', 11, C['sub']) +
    _t(30, 166, '氨基糖苷(30S)', 12, C['green'], 'start', '700') + _t(30, 186, '四环素(30S)', 11, C['sub']) +
    _t(30, 206, '大环内酯(50S)', 11, C['sub']) +
    _t(500, 82, '喹诺酮(DNA)', 12, C['blueD'], 'start', '700') + _t(500, 102, '利福平(RNA)', 11, C['sub']) +
    _t(500, 124, '磺胺(二氢蝶酸)', 12, C['violet'], 'start', '700') + _t(500, 144, '甲氧苄啶(DHFR)', 11, C['sub']) +
    _t(500, 190, '人体细胞无细胞壁', 11, C['sub']) +
    _t(500, 210, '→ β-内酰胺类最安全', 11, C['red']) +
    _t(360, 300, '五位点记忆：壁 — 膜 — 蛋白（30S/50S）— 核酸（DNA/RNA）— 叶酸', 12, C['sub'], 'middle'),
    720, 315, '抗菌药物作用机制五个位点')

# ---------------- 11. 肾病综合征 ----------------
SVG_NS = wrap(
    _box(30, 45, 300, 210, C['blueL'], C['blue'], 10) +
    _t(180, 72, '肾小球滤过屏障破坏', 14, c if False else C['blueD'], 'middle', '700') +
    _t(180, 100, '分子屏障 / 电荷屏障', 12, C['sub'], 'middle') +
    _arrow(180, 118, 180, 150) +
    _t(180, 142, '蛋白漏出', 12, C['red'], 'middle', '700') +
    _box(80, 156, 200, 80, C['redL'], C['red'], 8) +
    _t(180, 182, '大量蛋白尿', 13, C['red'], 'middle', '700') +
    _t(180, 204, '＞3.5 g/24h', 12, C['sub'], 'middle') +
    _t(180, 224, '→ 低蛋白血症', 12, C['ink'], 'middle') +
    _arrow(330, 150, 380, 150) +
    _box(384, 45, 306, 66, C['goldL'], C['gold'], 8) +
    _t(398, 68, '低蛋白血症 ＜30 g/L', 13, C['gold'], 'start', '700') +
    _t(398, 92, '血浆胶体渗透压↓ → 组织液增多', 12, C['sub']) +
    _box(384, 122, 306, 66, C['greenL'], C['green'], 8) +
    _t(398, 145, '水肿（眼睑、下肢，可全身）', 13, C['green'], 'start', '700') +
    _t(398, 169, '兼有钠水潴留', 12, C['sub']) +
    _box(384, 199, 306, 66, C['violetL'], C['violet'], 8) +
    _t(398, 222, '高脂血症', 13, C['violet'], 'start', '700') +
    _t(398, 246, '肝合成脂蛋白↑、清除↓', 12, C['sub']) +
    _t(360, 292, '三高一低：大量蛋白尿、水肿、高脂血症、低蛋白血症；并发症：感染、血栓、急性肾损伤', 12, C['sub'], 'middle'),
    720, 310, '肾病综合征的三高一低')

# ---------------- 12. 新月体 ----------------
SVG_CRESCENT = wrap(
    # 球囊壁
    '<circle cx="196" cy="165" r="100" fill="%s" stroke="%s" stroke-width="2"/>' % (C['paper'], C['blue']) +
    # 毛细血管丛
    '<circle cx="196" cy="165" r="70" fill="%s" stroke="%s" stroke-width="2"/>' % (C['redL'], C['red']) +
    # 新月体：外弧 r=100、内弧 r=70，覆盖右侧约 200 度
    '<path d="M178.6 66.5 A100 100 0 1 1 178.6 263.5 A70 70 0 1 0 178.6 66.5 Z" fill="%s" stroke="%s" stroke-width="1.6" fill-opacity="0.95"/>' % (C['violetL'], C['violet']) +
    _t(196, 160, '毛细血管丛', 12, C['red'], 'middle', '700') +
    _t(196, 180, '受压萎缩', 11, C['sub'], 'middle') +
    # 引线 + 标签移到圆外
    '<line x1="290" y1="132" x2="330" y2="132" stroke="%s" stroke-width="1.4" stroke-dasharray="4 3"/>' % C['violet'] +
    _t(336, 128, '新月体', 13, C['violet'], 'start', '700') +
    _t(336, 148, '壁层上皮细胞', 11, C['sub']) +
    _t(336, 166, '＋ 单核细胞', 11, C['sub']) +
    _box(420, 50, 270, 60, C['redL'], C['red'], 8) +
    _t(434, 73, 'Ⅰ 型：IgG 线样沉积', 12, C['red'], 'start', '700') +
    _t(434, 95, '抗 GBM；伴肺出血＝Goodpasture', 11, C['sub']) +
    _box(420, 122, 270, 60, C['goldL'], C['gold'], 8) +
    _t(434, 145, 'Ⅱ 型：IgG/C3 颗粒沉积', 12, C['gold'], 'start', '700') +
    _t(434, 167, '免疫复合物型（链球菌后、SLE 等）', 11, C['sub']) +
    _box(420, 194, 270, 60, C['greenL'], C['green'], 8) +
    _t(434, 217, 'Ⅲ 型：寡免疫复合物', 12, C['green'], 'start', '700') +
    _t(434, 239, 'ANCA 相关（多血管炎）', 11, C['sub']) +
    _t(360, 300, '新月体压迫毛细血管 → GFR 急剧下降 → 数周至数月肾衰竭', 12, C['sub'], 'middle'),
    720, 320, '新月体与急进性肾炎三型')

# ---------------- 13. 急性肾衰一低四高 ----------------
SVG_ARF = wrap(
    _box(240, 30, 240, 46, C['blueL'], C['blue'], 8) + _t(360, 60, '急性肾衰 · 少尿期', 14, C['blueD'], 'middle', '700') +
    _box(30, 100, 130, 92, C['goldL'], C['gold'], 8) + _t(95, 126, '一低', 13, C['gold'], 'middle', '700') +
    _t(95, 150, '尿量少', 12, C['ink'], 'middle') + _t(95, 172, '＜400 ml/d', 11, C['sub'], 'middle') +
    _box(174, 100, 130, 92, C['redL'], C['red'], 8) + _t(239, 126, '水高', 13, C['red'], 'middle', '700') +
    _t(239, 150, '水肿', 12, C['ink'], 'middle') + _t(239, 172, '脑/肺水肿', 11, C['sub'], 'middle') +
    _box(318, 100, 130, 92, C['redL'], C['red'], 8) + _t(383, 126, '钾高', 13, C['red'], 'middle', '700') +
    _t(383, 150, '高钾血症', 12, C['ink'], 'middle') + _t(383, 172, '首要死因', 11, C['sub'], 'middle') +
    _box(462, 100, 130, 92, C['redL'], C['red'], 8) + _t(527, 126, '氢高', 13, C['red'], 'middle', '700') +
    _t(527, 150, '代谢性酸中毒', 11, C['ink'], 'middle') + _t(527, 172, '泌 H⁺ 障碍', 11, C['sub'], 'middle') +
    _box(606, 100, 90, 92, C['redL'], C['red'], 8) + _t(651, 126, '氮高', 13, C['red'], 'middle', '700') +
    _t(651, 150, '氮质血症', 11, C['ink'], 'middle') + _t(651, 172, 'NPN↑', 11, C['sub'], 'middle') +
    _box(30, 210, 660, 60, C['paper'], C['line'], 8) +
    _t(44, 234, '机制：肾血流↓ + 肾小管阻塞 + 原尿返漏 → GFR↓ → 少尿；', 12, C['ink']) +
    _t(44, 256, '高钾原因：排钾↓、组织损伤与代酸使 K⁺ 外移、摄入多（库存血）；原则「见尿补钾」', 12, C['ink']) +
    _t(360, 296, '少尿期最危险：高钾血症（可致心脏骤停）→ 监测血钾与心电图', 12, C['red'], 'middle', '700'),
    720, 310, '急性肾衰少尿期一低四高')

# ---------------- 14. DIC ----------------
SVG_DIC = wrap(
    _box(30, 40, 660, 54, C['goldL'], C['gold'], 8) +
    _t(44, 64, '① 凝血系统过度激活', 13, C['gold'], 'start', '700') +
    _t(44, 86, '感染（内毒素）、创伤、恶性肿瘤、产科意外 → 组织因子释放、凝血酶大量生成', 12, C['sub']) +
    _arrow(360, 94, 360, 116) +
    _box(30, 118, 660, 54, C['redL'], C['red'], 8) +
    _t(44, 142, '② 广泛微血栓形成', 13, C['red'], 'start', '700') +
    _t(44, 164, '微循环阻塞 → 回心血量↓、器官缺血 → 休克、MODS；红细胞被纤维蛋白丝割破 → 溶血性贫血', 12, C['sub']) +
    _arrow(360, 172, 360, 194) +
    _box(30, 196, 660, 54, C['blueL'], C['blue'], 8) +
    _t(44, 220, '③ 凝血因子与血小板大量消耗 + 继发纤溶亢进', 13, C['blueD'], 'start', '700') +
    _t(44, 242, '→ 消耗性低凝、FDP 抗凝 → 广泛出血（皮肤瘀斑、穿刺点渗血）', 12, C['sub']) +
    _t(360, 288, '四大表现：出血 · 休克 · MODS · 微血管病性溶血性贫血；治疗以治原发病为主，早期肝素', 12, C['sub'], 'middle'),
    720, 300, 'DIC 的发生过程与表现')

# ---------------- 15. 利尿药作用部位 ----------------
SVG_DIUR = wrap(
    # 表头
    _t(36, 40, '作用部位', 12, C['sub'], 'start', '700') +
    _t(220, 40, '代表药物（强度）', 12, C['sub'], 'start', '700') +
    _t(470, 40, '机制', 12, C['sub'], 'start', '700') +
    '<line x1="30" y1="50" x2="690" y2="50" stroke="%s" stroke-width="1"/>' % C['line'] +
    # 第 1 行 近曲小管
    _t(36, 82, '近曲小管', 13, C['ink'], 'start', '700') +
    _t(36, 100, '重吸收约 65%', 10.5, C['sub']) +
    _box(210, 62, 220, 40, C['goldL'], C['gold'], 7) +
    _t(320, 88, '乙酰唑胺（弱）', 12, C['gold'], 'middle', '700') +
    _t(470, 88, '抑制碳酸酐酶', 12, C['ink']) +
    # 第 2 行 髓袢
    _t(36, 142, '髓袢升支粗段', 13, C['ink'], 'start', '700') +
    _t(36, 160, '重吸收约 25%', 10.5, C['sub']) +
    _box(210, 122, 220, 40, C['redL'], C['red'], 7) +
    _t(320, 148, '呋塞米（最强）', 12, C['red'], 'middle', '700') +
    _t(470, 148, '抑制 NKCC2', 12, C['ink']) +
    # 第 3 行 远曲小管
    _t(36, 202, '远曲小管', 13, C['ink'], 'start', '700') +
    _t(36, 220, '重吸收约 8%', 10.5, C['sub']) +
    _box(210, 182, 220, 40, C['greenL'], C['green'], 7) +
    _t(320, 208, '氢氯噻嗪（中）', 12, C['green'], 'middle', '700') +
    _t(470, 208, '抑制 NCC', 12, C['ink']) +
    # 第 4 行 集合管
    _t(36, 262, '集合管', 13, C['ink'], 'start', '700') +
    _t(36, 280, '重吸收约 2%', 10.5, C['sub']) +
    _box(210, 242, 220, 40, C['violetL'], C['violet'], 7) +
    _t(320, 268, '螺内酯（弱·保钾）', 12, C['violet'], 'middle', '700') +
    _t(470, 268, '拮抗醛固酮受体', 12, C['ink']) +
    # 底部结论
    _box(30, 300, 660, 34, C['blueL'], C['blue'], 8) +
    _t(360, 322, '作用部位越靠后 → 回收钠越少 → 利尿越弱', 12, C['blueD'], 'middle', '700'),
    720, 348, '利尿药的作用部位与强度')

# ---------------- 16. 肾病综合征五型对比 ----------------
ROWS = [
    ('微小病变', '光镜基本正常', '足突弥漫融合', '儿童最常见 · 激素敏感', C['green'], C['greenL']),
    ('膜性肾病', '基底膜增厚、钉突', '上皮下沉积 · IgG/C3', '成人最常见 · 易血栓', C['gold'], C['goldL']),
    ('FSGS', '局灶节段性硬化', '足突融合', '激素抵抗 · 预后较差', C['red'], C['redL']),
    ('膜增生性', '系膜插入、双轨征', 'C3 沉积为主', '常伴低补体血症', C['violet'], C['violetL']),
    ('系膜增生性', '系膜细胞与基质增生', '系膜区沉积', '我国常见 · 可伴 IgA', C['blue'], C['blueL']),
]
_body = [
    _t(30, 34, '类型', 11.5, C['sub'], 'start', '700'),
    _t(180, 34, '光镜特点', 11.5, C['sub'], 'start', '700'),
    _t(370, 34, '电镜 / 免疫', 11.5, C['sub'], 'start', '700'),
    _t(545, 34, '临床要点', 11.5, C['sub'], 'start', '700'),
    '<line x1="26" y1="44" x2="694" y2="44" stroke="%s" stroke-width="1"/>' % C['line'],
]
_y = 52
for name, lm, em, cl, col, coll in ROWS:
    _body.append('<rect x="26" y="%d" width="668" height="44" rx="6" fill="%s" stroke="%s" stroke-width="1"/>' % (_y, coll, col))
    _body.append(_t(38, _y + 27, name, 12, col, 'start', '700'))
    _body.append(_t(180, _y + 27, lm, 11, C['ink']))
    _body.append(_t(370, _y + 27, em, 11, C['ink']))
    _body.append(_t(545, _y + 27, cl, 10.5, C['sub']))
    _y += 50
_body.append(_t(360, 322, '肾活检是诊断金标准：光镜 + 免疫荧光 + 电镜三者结合定型', 11.5, C['sub'], 'middle'))
SVG_NS_TYPES = wrap(''.join(_body), 720, 336, '肾病综合征五大病理类型对比')

FIGURES = {
    'svg-nephron': SVG_NEPHRON,
    'svg-filtration': SVG_FILTRATION,
    'svg-efp': SVG_EFP,
    'svg-tgf': SVG_TGF,
    'svg-countercurrent': SVG_COUNTER,
    'svg-raas': SVG_RAAS,
    'svg-dehydration': SVG_DEHYD,
    'svg-shock': SVG_SHOCK,
    'svg-acidbase': SVG_AB,
    'svg-antibacterial': SVG_ABX,
    'svg-ns': SVG_NS,
    'svg-crescent': SVG_CRESCENT,
    'svg-arf': SVG_ARF,
    'svg-dic': SVG_DIC,
    'svg-diuretics': SVG_DIUR,
    'svg-ns-types': SVG_NS_TYPES,
}
