# Git 常用命令完整指南
本文档基于 Git 的基本工作流程，整理了一份常用命令指南，包含命令、作用解释以及典型使用顺序。适合初学者日常使用和参考。

---

## 初次配置（只需一次）
在开始使用 Git 前，需要配置用户名和邮箱，这些信息会记录在每次提交中。

```bash
# 1. 设置全局用户名
git config --global user.name "你的名字"

# 2. 设置全局邮箱
git config --global user.email "你的邮箱@example.com"

# 3. 查看当前配置
git config --list
```

---

## 初始化与克隆仓库
### 在本地创建新仓库
```bash
# 进入项目文件夹
cd 项目路径

# 初始化 Git 仓库
git init

# 添加远程仓库地址（如果已有远程仓库）
git remote add origin 远程仓库地址
```

### 克隆远程仓库到本地
```bash
# 克隆仓库（默认使用仓库名作为文件夹名）
git clone 远程仓库地址

# 克隆到指定文件夹
git clone 远程仓库地址 文件夹名
```

---

## 日常基本操作（修改 → 提交 → 推送）
这是最常用的循环流程。

### 查看当前状态
```bash
git status
```

显示哪些文件被修改、哪些已暂存、哪些未被跟踪。

### 添加修改到暂存区
```bash
# 添加单个文件
git add 文件名

# 添加多个文件
git add 文件1 文件2

# 添加所有更改（包括新文件、修改、删除）
git add .

# 添加当前目录所有更改（同上）
git add -A
```

### 提交到本地仓库
```bash
# 提交并添加说明
git commit -m "提交说明"

# 如果只修改了已跟踪文件，可以跳过 git add 直接提交（-a 表示 add 所有更改）
git commit -a -m "提交说明"
```

### 拉取远程更新（多人协作时必备）
```bash
# 从远程仓库拉取最新代码并合并到当前分支
git pull

# 完整写法：git pull origin main
```

### 推送到远程仓库
```bash
# 推送到默认远程分支（需提前设置 upstream）
git push

# 首次推送并设置 upstream
git push -u origin main

# 完整写法：git push origin main
```

---

## 分支操作
分支是 Git 的核心功能，用于并行开发和版本管理。

### 查看分支
```bash
# 查看本地分支（当前分支前有 * 号）
git branch

# 查看所有分支（包括远程）
git branch -a

# 查看远程分支
git branch -r
```

### 创建分支
```bash
# 创建新分支（停留在当前分支）
git branch 分支名

# 创建并切换到新分支
git checkout -b 分支名

# 新版 Git 推荐 switch 命令
git switch -c 分支名
```

### 切换分支
```bash
# 切换到已有分支
git checkout 分支名

# 新版 switch
git switch 分支名
```

### 合并分支
```bash
# 将指定分支合并到当前分支（如合并 feature 到 main）
git merge 分支名
```

### 删除分支
```bash
# 删除本地分支（需切换到其他分支）
git branch -d 分支名

# 强制删除未合并的分支
git branch -D 分支名

# 删除远程分支
git push origin --delete 分支名
```

---

## 查看历史与差异
### 查看提交历史
```bash
# 完整日志
git log

# 一行简洁显示
git log --oneline

# 图形化显示分支
git log --graph --oneline --all

# 显示最近 n 条
git log -n 5
```

### 查看文件修改内容
```bash
# 查看未暂存的修改
git diff

# 查看已暂存的修改（与上次提交对比）
git diff --staged

# 查看两个提交之间的差异
git diff 提交ID1 提交ID2
```

---

## 撤销与回退
### 撤销工作区的修改（未暂存）
```bash
# 丢弃单个文件的修改
git checkout -- 文件名

# 丢弃所有修改（谨慎！）
git checkout .
```

### 撤销暂存区的文件（已 git add）
```bash
# 将文件从暂存区移除，但保留工作区修改
git reset HEAD 文件名

# 撤销所有暂存
git reset HEAD
```

### 修改最近一次提交
```bash
# 修改提交说明（或补充遗漏文件）
git commit --amend -m "新的说明"
```

### 回退到历史版本
```bash
# 回退到上一个版本（保留工作区修改）
git reset --soft HEAD~1

# 回退到上一个版本（不保留工作区修改）
git reset --hard HEAD~1

# 回退到指定提交（保留修改在工作区）
git reset --mixed 提交ID
```

### 恢复被删除的提交（如果还没推送到远程）
```bash
# 查看所有操作记录（包括 reset 前的提交）
git reflog

# 找到目标提交后，用 reset 或 checkout 恢复
git reset --hard 提交ID
```

---

## 远程仓库管理
### 查看远程仓库
```bash
# 列出所有远程仓库
git remote -v
```

### 添加/修改远程仓库
```bash
# 添加远程仓库
git remote add 远程名称 地址

# 修改远程仓库地址
git remote set-url 远程名称 新地址

# 删除远程仓库
git remote remove 远程名称
```

### 拉取远程更新但不合并
```bash
# 获取远程更新，但不合并到当前分支
git fetch

# 获取远程指定分支
git fetch origin main
```

### 推送本地分支到远程
```bash
# 推送当前分支到远程同名分支
git push

# 推送本地分支到远程指定分支
git push origin 本地分支名:远程分支名
```

### 删除远程分支
```bash
git push origin --delete 分支名
```

---

## 标签管理
用于标记重要版本（如 v1.0）。

```bash
# 创建轻量标签
git tag 标签名

# 创建附注标签（推荐）
git tag -a 标签名 -m "标签说明"

# 查看所有标签
git tag

# 推送标签到远程
git push origin 标签名

# 推送所有标签
git push origin --tags

# 删除本地标签
git tag -d 标签名

# 删除远程标签
git push origin :refs/tags/标签名
```

---

## 忽略文件（.gitignore）
创建 `.gitignore` 文件，写入不想被 Git 跟踪的文件或目录（如临时文件、依赖包）。

```bash
# 示例 .gitignore 内容
node_modules/
.DS_Store
*.log
```

---

## 常用命令速查表
| 命令 | 作用 |
| --- | --- |
| `git init` | 初始化仓库 |
| `git clone <url>` | 克隆远程仓库 |
| `git status` | 查看工作区状态 |
| `git add <file>` | 添加文件到暂存区 |
| `git commit -m "msg"` | 提交暂存区到本地仓库 |
| `git pull` | 拉取并合并远程分支 |
| `git push` | 推送本地提交到远程 |
| `git branch` | 查看分支 |
| `git checkout <branch>` | 切换分支 |
| `git merge <branch>` | 合并分支 |
| `git log` | 查看提交历史 |
| `git diff` | 查看工作区与暂存区差异 |
| `git reset --hard <commit>` | 回退到指定提交 |
| `git remote -v` | 查看远程仓库地址 |


---

## 日常开发流程示例
### 场景一：单人开发
```bash
# 1. 初始化仓库（如果还没有）
git init
git remote add origin 仓库地址

# 2. 第一次推送
git add .
git commit -m "初始提交"
git branch -M main
git push -u origin main

# 3. 日常修改
git add .
git commit -m "添加了新功能"
git push
```

### 场景二：多人协作（以 main 分支为例）
```bash
# 1. 拉取最新代码
git pull

# 2. 修改文件
git add .
git commit -m "完成某个功能"

# 3. 再次拉取（以防别人推送了新代码）
git pull

# 4. 解决冲突（如果有）
# 手动编辑冲突文件，然后 git add，再 git commit

# 5. 推送
git push
```

### 场景三：功能分支开发
```bash
# 1. 创建并切换到新分支
git checkout -b feature-xxx

# 2. 开发，多次 commit
git add .
git commit -m "step1"
git add .
git commit -m "step2"

# 3. 切换回 main，拉取最新
git checkout main
git pull

# 4. 合并功能分支
git merge feature-xxx

# 5. 推送 main
git push

# 6. 删除本地功能分支（可选）
git branch -d feature-xxx
```

---

这份指南覆盖了 Git 日常使用的绝大部分命令。建议将本文档保存为参考，遇到具体问题时再查阅详细用法。熟练掌握这些命令后，你就能高效地管理代码版本并与他人协作了。

