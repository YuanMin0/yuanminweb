/* ==========================================================================
   云端存储配置
   --------------------------------------------------------------------------
   全站只有这一个文件需要改。修改后刷新页面即可生效。

   CDN_BASE   ：资料文件的访问地址，末尾带 /
   CDN_PREFIX ：文件路径的统一前缀（本站为 materials/）
   CDN_AUTOPROBE：是否在页面加载时自动探测路径前缀，默认关闭
   CDN_MISSING ：尚未上传的文件（列出后会显示「待上传」）
   CDN_READERS_BROKEN：阅读页图片缺失时设为 true，暂时隐藏「阅读」入口
   ========================================================================== */
window.CDN_BASE = 'https://pdf.yuanminstudy.uk/';
window.CDN_PREFIX = 'materials/';
window.CDN_AUTOPROBE = false;

/* 全部文件已上传完毕 */
window.CDN_MISSING = [];

/* 阅读页逐页图片齐全，正常提供入口 */
window.CDN_READERS_BROKEN = false;
