# Gazebo 卡退排查方案
## 删除模块对后续运行的影响

### 结论先说：**完全没有影响，删得很正确**

#### 删除 `rl_quadruped_controller`（强化学习控制器）

这个包是独立的 ros2_control 插件，**与 ocs2_quadruped_controller 和 unitree_guide_controller 没有任何代码依赖**。

| 检查项 | 结论 |
|--------|------|
| `ocs2_quadruped_controller` 的 CMakeLists.txt 是否依赖它 | 否 |
| `unitree_guide_controller` 是否引用它 | 否 |
| 任何 launch 文件是否加载它 | 否（launch 里写死了 `ocs2_quadruped_controller` 或 `unitree_guide_controller`） |
| `gz_quadruped_playground` 是否引用它 | 否 |

删除后，剩余的两个控制器：
- `unitree_guide_controller` — 适合第一阶段快速上手
- `ocs2_quadruped_controller` — MPC 感知控制，主力

#### 删除 `ocs2_ros2` 的 `advance examples`（RaiSim 高级示例）

`advance examples` 依赖 RaiSim 商业仿真器，需要单独授权，对 Gazebo 仿真完全无关。

| 检查项 | 结论 |
|--------|------|
| `basic examples` 是否依赖它 | 否 |
| `core` / `mpc` / `robotics` 模块是否依赖它 | 否 |
| 后续 quadruped_ros2_control 编译是否需要它 | 否 |

**总结：你当前的编译配置是最精简、最适合 Gazebo 仿真的标准组合，不会有任何运行影响。**

---

## Gazebo (gz sim) 卡退排查方案

### 卡退常见原因分类

```
A. 显卡驱动 / OpenGL 渲染问题  ← 最常见，占80%
B. 世界场景文件加载失败（.sdf 资源缺失）
C. 内存/显存不足
D. ROS2 与 gz-sim 版本不匹配
E. WSL2/虚拟机 GPU 穿透问题（如果你是虚拟机运行 Ubuntu）
```

---

### 确认崩溃类型（关键）

打开终端，用以下命令启动，**不要直接双击图标**，要看报错：

```bash
# 方法1：最简单，直接启动 gz sim 不加载任何世界
gz sim --verbose

# 方法2：加载空白世界
gz sim -r empty.sdf --verbose
```

**根据输出判断：**

| 输出关键词 | 原因 | 跳转到 |
|------------|------|--------|
| `Segmentation fault` / `signal 11` | 显卡渲染崩溃 | → 步骤A |
| `libGL error` / `MESA` / `OpenGL` | OpenGL 驱动问题 | → 步骤A |
| `failed to load plugin` / `libignition` | 插件找不到 | → 步骤B |
| `killed` / 系统 OOM | 内存耗尽 | → 步骤C |
| 启动时直接黑屏无任何输出就退出 | 环境变量/版本冲突 | → 步骤D |

---

### 显卡/OpenGL 渲染问题排查

这是最常见的原因，尤其是 **VMware、VirtualBox、WSL2** 等虚拟化环境。

#### 检查是否是虚拟机

```bash
# 查看 GPU 信息
glxinfo | grep "OpenGL renderer"
glxinfo | grep "OpenGL version"

# 如果输出是 llvmpipe 或 softpipe，说明在用软件渲染，无法运行 gz sim GUI
```

**如果是虚拟机，强烈建议：**
1. 安装 VMware Tools / VirtualBox Guest Additions 并启用 3D 加速
2. 或者使用无 GUI 模式（见步骤A3）

#### 强制使用软件渲染（临时测试用）

```bash
export LIBGL_ALWAYS_SOFTWARE=1
gz sim -r empty.sdf
```

如果这样能跑起来，说明问题确实在 GPU 驱动。

#### 使用服务器模式（无 GUI，最稳定）

```bash
# 启动 gz sim 服务端（无界面）
gz sim -r -s default.sdf

# 另开终端启动 GUI 客户端
gz sim -g
```

这样可以把渲染问题隔离开，先验证物理仿真是否正常。

#### 禁用阴影和反射（减少 GPU 压力）

修改世界文件，在 `<world>` 标签内添加：

```xml
<scene>
  <shadows>false</shadows>
  <grid>false</grid>
</scene>
```

---

### 世界文件/插件加载问题

#### 检查世界文件路径是否正确

```bash
# 先确认包已正确安装
ros2 pkg list | grep gz_quadruped_playground

# 查看世界文件实际位置
ros2 pkg prefix gz_quadruped_playground
# 然后在 share/gz_quadruped_playground/worlds/ 下确认 default.sdf 存在
```

#### 检查 SDF 模型资源

```bash
# 查看 default.sdf 依赖哪些模型
cat $(ros2 pkg prefix gz_quadruped_playground)/share/gz_quadruped_playground/worlds/default.sdf | grep "include\|model"
```

如果 sdf 里引用了在线模型（`https://...` 或 `model://`），首次加载需要下载，**断网或网络慢会卡住假死**。

#### 预下载模型（推荐）

```bash
# 设置本地模型缓存目录
export GZ_SIM_RESOURCE_PATH=$HOME/.gz/models

# 手动触发模型下载（先用 empty 世界）
gz sim -r empty.sdf
# 等待下载完成后再用 default.sdf
```

---

### 内存/资源不足

```bash
# 启动时监控内存
watch -n 1 free -h

# 查看 gz sim 进程资源占用
top -p $(pgrep -d',' gz)
```

**最低配置建议：**
- RAM：8GB（推荐16GB）
- 显存：2GB+（warehouse 场景需要更多）
- 磁盘剩余：5GB+（模型下载缓存）

如果内存不足：

```bash
# 用最简单的空世界测试
gz sim -r empty.sdf

# 或者禁用 RViz2（先不可视化）
# 注释掉 gazebo.launch.py 里的 rviz 节点
```

---

### ROS2 与 gz-sim 版本匹配检查

```bash
# 查看 ROS2 版本
echo $ROS_DISTRO

# 查看 gz-sim 版本
gz sim --version

# 查看 ros_gz 桥接版本
ros2 pkg list | grep ros_gz
```

**正确对应关系：**

| ROS2 版本 | gz-sim 版本 |
|-----------|-------------|
| Humble (推荐) | Fortress (6.x) 或 Garden (7.x) |
| Iron | Garden (7.x) |
| Jazzy | Harmonic (8.x) |

如果版本不匹配，需要重新安装对应版本的 `ros-{distro}-ros-gz`。

---

### 实际运行时的完整排查命令序列

**按顺序执行，在哪步出错就在哪步深入排查：**

```bash
# === 环境准备 ===
source /opt/ros/$ROS_DISTRO/setup.bash
source ~/ros2_ws/install/setup.bash   # 你的工作空间路径

# === 第1关：gz sim 能否独立启动 ===
gz sim --verbose
# 预期：出现图形界面，无报错
# 失败：看报错，按A/B/C/D处理

# === 第2关：加载空世界 ===
gz sim -r empty.sdf --verbose
# 预期：空场景正常渲染

# === 第3关：加载项目世界（不带机器人）===
gz sim -r $(ros2 pkg prefix gz_quadruped_playground)/share/gz_quadruped_playground/worlds/default.sdf --verbose
# 预期：world 正常加载

# === 第4关：完整 launch（最后一步）===
ros2 launch gz_quadruped_playground gazebo.launch.py \
  world:=default \
  controller:=unitree_guide \
  pkg_description:=go2_description
```

---

### 最快验证路线（5分钟定位问题）

```bash
# Step 1：裸启动
gz sim --verbose 2>&1 | head -50

# Step 2：看关键词
gz sim --verbose 2>&1 | grep -E "error|Error|failed|crash|signal|OpenGL|libGL"

# Step 3：查系统日志（崩溃后立即执行）
journalctl -xe --since "2 minutes ago" | grep -E "gz|gazebo|segfault"

# Step 4：查显卡状态
nvidia-smi   # NVIDIA 用户
或
glxinfo | grep renderer  # 通用
```

---

### 常见报错速查表

| 报错 | 含义 | 解决方案 |
|------|------|----------|
| `Segmentation fault (core dumped)` | 内存访问越界，多为 GPU 驱动 | 更新显卡驱动，或 `LIBGL_ALWAYS_SOFTWARE=1` |
| `[Err] [Server.cc] Duplicate plugin found` | 同一插件被加载两次 | 检查 .sdf 文件，删除重复的 `<plugin>` |
| `Error in REST request` | gz-fuel 在线资源请求失败 | 断网情况下设置离线模式，或预先下载模型 |
| `process has died... respawn_delay` | ROS 节点崩溃后重启 | 看具体节点的 stderr，不是 gz 本身的问题 |
| `[ruby ERROR] No such file` | gz 的 GUI 插件路径错误 | `export GZ_GUI_PLUGIN_PATH=...` |
| `Invalid argument` on spawn | xacro 生成的 URDF 有语法错误 | `xacro robot.xacro GAZEBO:=true > /tmp/test.urdf && check_urdf /tmp/test.urdf` |

---

### 如果是 WSL2 / 虚拟机运行

这是最麻烦的情况，需要额外配置：

#### WSL2 用户

```bash
# 检查 WSLg 是否启用（Windows 11 才有）
echo $DISPLAY
echo $WAYLAND_DISPLAY

# 如果无输出，需要升级 WSL2 并启用 WSLg
wsl --update  # 在 Windows PowerShell 里执行

# 临时方案：安装 VcXsrv 并设置
export DISPLAY=:0
export LIBGL_ALWAYS_INDIRECT=1
```

#### VMware 用户

```bash
# 安装 open-vm-tools 并启用 3D 加速
sudo apt install open-vm-tools open-vm-tools-desktop
# 然后在 VMware 设置里勾选 "加速3D图形"
```

---

## 总结：给我报错信息，立刻定位

执行以下命令，把输出发给我：

```bash
gz sim -r empty.sdf --verbose 2>&1 | tee /tmp/gz_log.txt; echo "=== TAIL ===" ; tail -30 /tmp/gz_log.txt
```

有了这段日志，可以立刻告诉你是哪个环节的问题。
