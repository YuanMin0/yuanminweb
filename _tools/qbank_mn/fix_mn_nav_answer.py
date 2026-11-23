# -*- coding: utf-8 -*-
"""给所有 mn/*.html 注入：
1) 左侧导航底部的「题库 · N 题」入口
2) 答案展开/收起脚本（点击 .answer-toggle 切换 .answer-panel）
可重复执行：已存在的导航会更新题数，脚本已存在则跳过。
"""
import glob
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MN = os.path.join(ROOT, 'mn')

ANSWER_JS = r"""
<script>
/* 题库答案展开 / 收起（所有速记页共用） */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.answer-toggle') : null;
    if (!btn) return;
    var card = btn.closest('.qa-card') || btn.parentNode;
    var panel = card ? card.querySelector('.answer-panel') : null;
    if (!panel) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    if (open) {
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '点击查看答案';
      panel.classList.add('closing');
      setTimeout(function () { panel.hidden = true; panel.classList.remove('closing'); }, 240);
    } else {
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = '收起答案';
      panel.hidden = false;
      panel.classList.remove('closing');
    }
  });
  /* 键盘：Enter / 空格 同样可切换 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var btn = e.target.closest ? e.target.closest('.answer-toggle') : null;
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });
})();
</script>
"""


def patch(path):
    s = open(path, encoding='utf-8').read()
    sid = os.path.basename(path)[:-5]
    cards = len(re.findall(r'<article class="qa-card', s))
    if cards == 0:
        return sid, 0, 'skip-no-bank'

    changed = []

    # 1) 导航入口
    nav = ('<div class="nav-question-bank"><a class="nav-chapter" href="#question-bank">'
           '题库 · %d 题</a></div>' % cards)
    if '<div class="nav-question-bank">' in s:
        s2 = re.sub(r'<div class="nav-question-bank">.*?</div>', nav, s, count=1, flags=re.S)
        if s2 != s:
            s = s2
            changed.append('nav-update')
    else:
        if '</aside>' in s:
            s = s.replace('</aside>', nav + '</aside>', 1)
            changed.append('nav-add')

    # 2) 答案脚本
    if '题库答案展开 / 收起' not in s:
        if '</body>' in s:
            s = s.replace('</body>', ANSWER_JS + '</body>', 1)
            changed.append('answer-js')

    if changed:
        open(path, 'w', encoding='utf-8', newline='\n').write(s)
    return sid, cards, ','.join(changed) or 'ok'


if __name__ == '__main__':
    rows = []
    for p in sorted(glob.glob(os.path.join(MN, '*.html'))):
        if p.endswith('index.html'):
            continue
        rows.append(patch(p))
    for sid, n, st in rows:
        print(f'{sid:20} {n:>4}  {st}')
    print('pages', len(rows))
