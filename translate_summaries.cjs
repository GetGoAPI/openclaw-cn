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

// 1. onboard-skills.ts - Set [ENV_VAR] for [skill]?
replaceInFile(path.join(__dirname, 'src/commands/onboard-skills.ts'), [
  ['message: `Set ${skill.primaryEnv} for ${skill.name}?`,', 'message: `Set ${skill.primaryEnv} for ${skill.name}? (为 ${skill.name} 设置 ${skill.primaryEnv} 吗？)`,']
]);

// 2. systemd-linger.ts - loginctl warning
replaceInFile(path.join(__dirname, 'src/commands/systemd-linger.ts'), [
  ['"Unable to read loginctl linger status. Ensure systemd + loginctl are available.",', '"Unable to read loginctl linger status. Ensure systemd + loginctl are available. (无法读取 loginctl linger 状态。请确保 systemd + loginctl 可用。)",']
]);

// 3. onboarding.finalize.ts - Gateway install, UI, Workspace, Web search, What now
replaceInFile(path.join(__dirname, 'src/wizard/onboarding.finalize.ts'), [
  ['installError ? "Gateway service install failed." : "Gateway service installed.",', 'installError ? "Gateway service install failed. (网关服务安装失败)" : "Gateway service installed. (网关服务已安装)",'],
  ['await prompter.note(`Gateway service install failed: ${installError}`, "Gateway");', 'await prompter.note(`Gateway service install failed: ${installError}\\n(网关服务安装失败: ${installError})`, "Gateway (网关)");'],
  ['"Tip: rerun `openclaw gateway install` after fixing the error.",', '"Tip: rerun `openclaw gateway install` after fixing the error. (提示：修复错误后重新运行 `openclaw gateway install`)",'],
  ['"Gateway service runtime",', '"Gateway service runtime (网关服务运行时)",'],
  ['"QuickStart uses Node for the Gateway service (stable + supported).",', '"QuickStart uses Node for the Gateway service (stable + supported). (QuickStart 使用 Node 作为网关服务 - 稳定且受支持)",'],
  ['"Health check help",', '"Health check help (健康检查帮助)",'],
  ['"Docs:",', '"Docs: (文档：)",'],
  ['"Optional apps",', '"Optional apps (可选应用)",'],
  ['"Add nodes for extra features:",', '"Add nodes for extra features: (添加节点以获取额外功能：)",'],
  ['"- macOS app (system + notifications)",', '"- macOS app (system + notifications) (macOS 应用 - 系统与通知)",'],
  ['"- iOS app (camera/canvas)",', '"- iOS app (camera/canvas) (iOS 应用 - 相机与画布)",'],
  ['"- Android app (camera/canvas)",', '"- Android app (camera/canvas) (Android 应用 - 相机与画布)",'],
  ['"Control UI",', '"Control UI (控制中心 UI)",'],
  ['"Workspace backup",', '"Workspace backup (工作区备份)",'],
  ['"Back up your agent workspace.",', '"Back up your agent workspace. (备份您的代理工作区。)",'],
  ['"Security",', '"Security (安全)",'],
  ['"Running agents on your computer is risky — harden your setup:",', '"Running agents on your computer is risky — harden your setup: (在您的计算机上运行代理存在风险 — 请加固您的设置：)",'],
  ['"Dashboard ready",', '"Dashboard ready (控制面板已就绪)",'],
  ['"Copy/paste this URL in a browser on this machine to control OpenClaw.",', '"Copy/paste this URL in a browser on this machine to control OpenClaw. (在此机器的浏览器中复制/粘贴此 URL 以控制 OpenClaw。)",'],
  ['"No GUI detected. Open from your computer:",', '"No GUI detected. Open from your computer: (未检测到 GUI。请在您的计算机上打开：)",'],
  ['"Then open:",', '"Then open: (然后打开：)",'],
  ['"Web search (optional)",', '"Web search (optional) (网页搜索 - 可选)",'],
  ['"To enable web search, your agent will need an API key for either Perplexity Search or",', '"To enable web search, your agent will need an API key for either Perplexity Search or Brave Search. (要启用网页搜索，您的代理需要 Perplexity Search 或 Brave Search 的 API 密钥。)",'],
  ['"Brave Search.",', ''], // Removed to make it a single line with translation
  ['"Set it up interactively:",', '"Set it up interactively: (交互式设置：)",'],
  ['"- Run: openclaw configure --section web",', '"- Run: openclaw configure --section web (运行: openclaw configure --section web)",'],
  ['"- Choose a provider and paste your API key",', '"- Choose a provider and paste your API key (选择一个提供商并粘贴您的 API 密钥)",'],
  ['"Alternative: set PERPLEXITY_API_KEY or BRAVE_API_KEY in the Gateway environment (no",', '"Alternative: set PERPLEXITY_API_KEY or BRAVE_API_KEY in the Gateway environment (no config changes). (替代方案：在网关环境变量中设置 PERPLEXITY_API_KEY 或 BRAVE_API_KEY - 无需更改配置)。",'],
  ['"config changes).",', ''], // Removed as it was merged
  ['"What now",', '"What now (接下来做什么)",'],
  ['"What now: https://openclaw.ai/showcase (\\"What People Are Building\\").",', '"What now: https://openclaw.ai/showcase (\\"What People Are Building\\") (接下来：https://openclaw.ai/showcase - \\"人们在构建什么\\")",'],
  ['"Onboarding complete. Use the dashboard link above to control OpenClaw.",', '"Onboarding complete. Use the dashboard link above to control OpenClaw. (向导完成。使用上面的仪表板链接控制 OpenClaw。)",']
]);

// 4. configure.wizard.ts - Health check help
replaceInFile(path.join(__dirname, 'src/commands/configure.wizard.ts'), [
  ['"Health check help",', '"Health check help (健康检查帮助)",']
]);

// 5. control-ui-assets.ts - Control UI assets missing
replaceInFile(path.join(__dirname, 'src/infra/control-ui-assets.ts'), [
  ['runtime.log("Control UI assets missing; building (ui:build, auto-installs UI deps)…");', 'runtime.log("Control UI assets missing; building (ui:build, auto-installs UI deps)… (缺少 Control UI 资源；正在构建中...)");']
]);

// Also onboard-remote requires translations for Gateway service runtime, Optional apps... let's just make sure we hit them all.
