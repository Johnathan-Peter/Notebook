#!/usr/bin/env python3
"""
批量修复Markdown文件中LaTeX公式的空格问题
将 $ formula $ 格式化为 $formula$，删除公式前后的空格
"""

import os
import re
import glob

def fix_latex_spaces_in_file(file_path):
    """修复单个文件中的LaTeX公式空格问题"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 正则表达式匹配LaTeX公式：$ ... $（包括行内公式）
    # 处理以下几种情况：
    # 1. $ formula $ -> $formula$
    # 2. $  formula  $ -> $formula$
    # 3. 匹配多行公式（支持$$ ... $$和\begin{equation}等环境）
    
    original_content = content
    
    # 修复行内公式 $ ... $ 的空格问题
    # 使用非贪婪匹配，避免跨多个公式
    def fix_inline_latex(match):
        formula = match.group(1)
        # 删除公式内部前后的空格
        formula = formula.strip()
        return f'${formula}$'
    
    # 匹配 $ ... $ 格式的公式
    # 注意：需要处理转义字符 \$ 的情况
    pattern = r'(?<!\\)\$\s*([^\$\n]+?)\s*\$(?!\$)'
    content = re.sub(pattern, fix_inline_latex, content)
    
    # 修复 $$ ... $$ 格式的多行公式（显示公式）
    def fix_display_latex(match):
        formula = match.group(1)
        # 只删除公式块前后的空格，保留内部的换行和缩进
        # 但需要确保第一个$$后和最后一个$$前没有空格
        return f'$$\n{formula.strip()}\n$$'
    
    # 匹配 $$ ... $$ 格式的多行公式
    pattern = r'\$\$\s*\n?(.*?)\n?\s*\$\$'
    content = re.sub(pattern, fix_display_latex, content, flags=re.DOTALL)
    
    # 修复 \begin{equation} ... \end{equation} 等环境
    # 保留环境内部的格式，只删除环境标签和内容之间的多余空格
    latex_environments = ['equation', 'align', 'gather', 'multiline', 'array', 'matrix']
    
    for env in latex_environments:
        begin_pattern = rf'\\begin{{{env}}}\s*\n?'
        end_pattern = rf'\n?\s*\\end{{{env}}}'
        
        # 修复 \begin{env} 后的空格
        content = re.sub(begin_pattern, f'\\\\begin{{{env}}}\n', content)
        # 修复 \end{env} 前的空格
        content = re.sub(end_pattern, f'\n\\\\end{{{env}}}', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"已修复: {file_path}")
        return True
    else:
        print(f"无需修复: {file_path}")
        return False

def find_markdown_files(directory):
    """查找目录中的所有Markdown文件"""
    md_files = []
    
    # 递归查找所有.md文件
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                md_files.append(os.path.join(root, file))
    
    return md_files

def main():
    # 主目录路径
    base_dir = r"F:\Notebook\mkdocs-site\docs\Courses\智能控制技术"
    
    print("开始修复LaTeX公式空格问题...")
    print(f"工作目录: {base_dir}")
    
    # 查找所有Markdown文件
    md_files = find_markdown_files(base_dir)
    
    print(f"找到 {len(md_files)} 个Markdown文件")
    
    # 统计修复结果
    fixed_count = 0
    total_count = len(md_files)
    
    # 逐个修复文件
    for md_file in md_files:
        try:
            if fix_latex_spaces_in_file(md_file):
                fixed_count += 1
        except Exception as e:
            print(f"处理文件时出错 {md_file}: {e}")
    
    print(f"\n修复完成!")
    print(f"处理文件总数: {total_count}")
    print(f"修复文件数: {fixed_count}")
    print(f"无需修复文件数: {total_count - fixed_count}")

if __name__ == "__main__":
    main()