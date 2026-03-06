const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  for (const [search, replace] of replacements) {
    if (search instanceof RegExp) {
        content = content.replace(search, replace);
    } else {
        content = content.split(search).join(replace);
    }
  }
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

// 1. onboard-custom.ts
replaceInFile(path.join(__dirname, 'src/commands/onboard-custom.ts'), [
  ['message: "API Base URL",', 'message: "API Base URL (API 基础 URL)",'],
  ['message: "What would you like to change?",', 'message: "What would you like to change? (你想修改什么？)",'],
  ['message: "Model ID",', 'message: "Model ID (模型 ID)",'],
  ['message: "Endpoint compatibility",', 'message: "Endpoint compatibility (端点兼容性)",'],
  ['message: "Endpoint ID",', 'message: "Endpoint ID (端点 ID)",'],
  ['message: "Model alias (optional)",', 'message: "Model alias (optional) (模型别名（可选）)",']
]);

// 2. vllm-setup.ts
replaceInFile(path.join(__dirname, 'src/commands/vllm-setup.ts'), [
  ['message: "vLLM base URL",', 'message: "vLLM base URL (vLLM 基础 URL)",'],
  ['message: "vLLM API key",', 'message: "vLLM API key (vLLM API 密钥)",'],
  ['message: "vLLM model",', 'message: "vLLM model (vLLM 模型)",']
]);

// 3. onboarding.ts (remaining)
replaceInFile(path.join(__dirname, 'src/wizard/onboarding.ts'), [
  ['message: "Config handling",', 'message: "Config handling (配置处理)",'],
  ['label: "Use existing values"', 'label: "Use existing values (使用现有值)"'],
  ['label: "Update values"', 'label: "Update values (更新值)"'],
  ['label: "Reset"', 'label: "Reset (重置)"'],
  ['message: "Reset scope",', 'message: "Reset scope (重置范围)",'],
  ['label: "Config only"', 'label: "Config only (仅配置)"'],
  ['label: "Config + creds + sessions",', 'label: "Config + creds + sessions (配置 + 凭证 + 会话)",'],
  ['label: "Full reset (config + creds + sessions + workspace)",', 'label: "Full reset (config + creds + sessions + workspace) (完全重置：配置 + 凭证 + 会话 + 工作区)",'],
  ['message: "What do you want to set up?",', 'message: "What do you want to set up? (你想设置什么？)",'],
  ['label: "Local gateway (this machine)",', 'label: "Local gateway (this machine) (本地网关 - 本机)",'],
  ['label: "Remote gateway (info-only)",', 'label: "Remote gateway (info-only) (远程网关 - 仅信息)",'],
  ['message: "Workspace directory",', 'message: "Workspace directory (工作区目录)",']
]);

// 4. onboarding.gateway-config.ts
replaceInFile(path.join(__dirname, 'src/wizard/onboarding.gateway-config.ts'), [
  ['message: "Gateway port",', 'message: "Gateway port (网关端口)",'],
  ['message: "Gateway bind",', 'message: "Gateway bind (网关绑定)",'],
  ['label: "Loopback (127.0.0.1 - standard)",', 'label: "Loopback (127.0.0.1 - standard) (环回地址 127.0.0.1 - 标准)",'],
  ['label: "Tailnet (Tailscale network)",', 'label: "Tailnet (Tailscale network) (Tailscale 网络)",'],
  ['label: "Auto (bind to Tailscale + localhost automatically)",', 'label: "Auto (bind to Tailscale + localhost automatically) (自动 - 自动绑定到 Tailscale + 本地主机)",'],
  ['label: "LAN (0.0.0.0)",', 'label: "LAN (0.0.0.0) (局域网 0.0.0.0)",'],
  ['label: "Custom IP",', 'label: "Custom IP (自定义 IP)",'],
  ['message: "Custom IP address",', 'message: "Custom IP address (自定义 IP 地址)",'],
  ['message: "Gateway auth",', 'message: "Gateway auth (网关身份验证)",'],
  ['label: "Token (standard)",', 'label: "Token (standard) (Token - 标准)",'],
  ['label: "Password",', 'label: "Password (密码)",'],
  ['label: "Tailscale Whois (trusted-proxy)",', 'label: "Tailscale Whois (trusted-proxy) (Tailscale Whois - 受信代理)",'],
  ['label: "None (danger)",', 'label: "None (danger) (无 - 危险)",'],
  ['message: "Tailscale exposure",', 'message: "Tailscale exposure (Tailscale 暴露方式)",'],
  ['label: "Off",', 'label: "Off (关闭)",'],
  ['label: "Serve (Available only on your Tailnet)",', 'label: "Serve (Available only on your Tailnet) (Serve - 仅在你的 Tailnet 上可用)",'],
  ['label: "Funnel (Available on the public internet - requires Gateway Auth)",', 'label: "Funnel (Available on the public internet - requires Gateway Auth) (Funnel - 可在公网上访问 - 需要开启网关鉴权)",'],
  ['message: "Reset Tailscale serve/funnel on exit?",', 'message: "Reset Tailscale serve/funnel on exit? (退出时重置 Tailscale serve/funnel 状态？)",'],
  ['message: "Gateway token (blank to generate)",', 'message: "Gateway token (blank to generate) (网关 Token - 留空则系统生成)",'],
  ['message: "Gateway password",', 'message: "Gateway password (网关密码)",']
]);

// 5. onboarding.finalize.ts
replaceInFile(path.join(__dirname, 'src/wizard/onboarding.finalize.ts'), [
  ['message: "Install Gateway service (recommended)",', 'message: "Install Gateway service (recommended) (安装网关服务 - 推荐)",'],
  ['message: "Gateway service runtime",', 'message: "Gateway service runtime (网关服务运行时)",'],
  ['message: "Gateway service already installed",', 'message: "Gateway service already installed (网关服务已安装)",'],
  ['label: "Ignore (keep old service untouched)",', 'label: "Ignore (keep old service untouched) (忽略 - 保持旧服务不变)",'],
  ['label: "Restart (applies changes if config moved)",', 'label: "Restart (applies changes if config moved) (重启 - 如果配置移动则应用更改)",'],
  ['label: "Reinstall (updates systemd file/paths)",', 'label: "Reinstall (updates systemd file/paths) (重新安装 - 更新 systemd 文件/路径)",'],
  ['message: "How do you want to hatch your bot?",', 'message: "How do you want to hatch your bot? (你想如何启动机器人？)",'],
  ['label: "TUI Dashboard (Terminal)",', 'label: "TUI Dashboard (Terminal) (TUI 仪表盘 - 终端)",'],
  ['label: "Gateway Server (Backgroundable)",', 'label: "Gateway Server (Backgroundable) (网关服务器 - 可后台运行)",'],
  ['label: "Exit (do not start)",', 'label: "Exit (do not start) (退出 - 暂不启动)",']
]);

// 6. onboard-remote.ts
replaceInFile(path.join(__dirname, 'src/commands/onboard-remote.ts'), [
  ['message: "Discover gateway on LAN (Bonjour)?",', 'message: "Discover gateway on LAN (Bonjour)? (搜索局域网中的网关 - Bonjour？)",'],
  ['message: "Select gateway",', 'message: "Select gateway (选择网关)",'],
  ['label: "Manual entry",', 'label: "Manual entry (手动输入)",'],
  ['message: "Connection method",', 'message: "Connection method (连接方式)",'],
  ['label: "Direct URL",', 'label: "Direct URL (直接 URL 连接)",'],
  ['label: "GitHub SSH (Tailnet + remote install shortcut)",', 'label: "GitHub SSH (Tailnet + remote install shortcut) (GitHub SSH - Tailnet + 远程安装快捷方式)",'],
  ['message: "Gateway WebSocket URL",', 'message: "Gateway WebSocket URL (网关 WebSocket URL)",'],
  ['message: "Gateway auth",', 'message: "Gateway auth (网关身份验证)",'],
  ['message: "Gateway token",', 'message: "Gateway token (网关 Token)",'],
  ['message: "Gateway password",', 'message: "Gateway password (网关密码)",']
]);

// 7. onboard-channels.ts
replaceInFile(path.join(__dirname, 'src/commands/onboard-channels.ts'), [
  ['message: "Configure DM access policies now? (default: pairing)",', 'message: "Configure DM access policies now? (default: pairing) (现在配置 DM 访问策略吗？默认：配对后可聊)",'],
  ['message: "Configure chat channels now?",', 'message: "Configure chat channels now? (现在配置聊天频道吗？)",'],
  ['message: "Select channel (QuickStart)",', 'message: "Select channel (QuickStart) (选择频道 - 快速开始)",'],
  ['message: "Select a channel",', 'message: "Select a channel (选择一个频道)",']
]);

// 8. onboard-skills.ts
replaceInFile(path.join(__dirname, 'src/commands/onboard-skills.ts'), [
  ['message: "Configure skills now? (recommended)",', 'message: "Configure skills now? (recommended) (现在配置技能吗？- 推荐)",'],
  ['message: "Install missing skill dependencies",', 'message: "Install missing skill dependencies (安装缺失的技能依赖项)",'],
  ['message: "Show Homebrew install command?",', 'message: "Show Homebrew install command? (显示 Homebrew 安装命令吗？)",'],
  ['message: "Preferred node manager for skill installs",', 'message: "Preferred node manager for skill installs (选择安装技能节点包的首选包管理器)",']
]);

// 9. onboard-hooks.ts
replaceInFile(path.join(__dirname, 'src/commands/onboard-hooks.ts'), [
  ['message: "Enable hooks?",', 'message: "Enable hooks? (启用钩子机制？)",']
]);

// 10. model-picker.ts
replaceInFile(path.join(__dirname, 'src/commands/model-picker.ts'), [
  ['message: "Filter models by provider",', 'message: "Filter models by provider (按提供商筛选模型)",'],
  ['message: "Clear the model allowlist? (shows all models)",', 'message: "Clear the model allowlist? (shows all models) (清空模型允许列表吗？这将显示所有模型)",']
]);
