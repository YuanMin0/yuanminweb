/* ==========================================================================
   Cloudflare R2 公共访问配置
   --------------------------------------------------------------------------
   全站只有这一个文件需要改。修改后刷新页面即可生效。

   R2_BASE   ：R2 桶的公共访问地址，末尾带 /
               当前用 R2 的公共开发地址（r2.dev），已验证可读取。
               若要更稳定，可在桶 Settings → Custom Domains 添加
               files.yuanminstudy.uk，然后把这里换成 https://files.yuanminstudy.uk/
   R2_PREFIX ：对象键的统一前缀。桶内文件都在 materials/ 目录下，故为 'materials/'。
   R2_AUTOPROBE：是否在页面加载时用 HEAD 探测前缀。前缀已确认，保持 false 即可；
               若以后改了桶内目录结构，改成 true 可自动寻找。
   ========================================================================== */
window.R2_BASE = 'https://pub-187b4a1562f046bf8ee3f7f8f4d792a9.r2.dev/';
window.R2_PREFIX = 'materials/';
window.R2_AUTOPROBE = false;

/* 尚未上传到 R2 的对象（上传后把对应行删掉即可）。
   目前桶里是 92 份 22MB 以内的文档；下面 8 个大 PDF 及其扫描页图还没传。 */
window.R2_MISSING = [
  'statistics/统计学题目整理.pdf',
  'pharmacology/lx药理笔记（选择题）.pdf',
  'pharmacology/药品汇总表格 有笔记.pdf',
  'respiratory/病例分析-呼吸系统.pdf',
  'respiratory/呼吸笔记本(by_ lx).pdf',
  'cardiology/2023级心血管笔记本by lx.pdf',
  'hematology/血液系统笔记本（by lx）.pdf',
  'endocrinology/内分泌笔记本by_lx.pdf'
];
/* 阅读页的逐页图片（179 张）还没上传，先不提供「阅读」入口；
   上传后把这行改成 false。 */
window.R2_READERS_BROKEN = true;
