#!/bin/sh
# 安装仓库钩子（在仓库根目录执行：sh _tools/install_hooks.sh）
set -e
HOOK_DIR="$(git rev-parse --git-dir)/hooks"
mkdir -p "$HOOK_DIR"
cp _tools/hooks/pre-commit "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"
echo "已安装 pre-commit 钩子 → $HOOK_DIR/pre-commit"
