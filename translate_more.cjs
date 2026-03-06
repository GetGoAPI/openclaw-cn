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

// 1. onboard-custom.ts - Model ID placeholder
replaceInFile(path.join(__dirname, 'src/commands/onboard-custom.ts'), [
  ['placeholder: "e.g. llama3, claude-3-7-sonnet",', 'placeholder: "e.g. llama3, claude-3-7-sonnet (例如 llama3, claude-3-7-sonnet)",'],
]);

// 2. onboard-channels.ts - "How channels work" text block
// This is a large multi-line string, so we'll replace the title and the lines individually
replaceInFile(path.join(__dirname, 'src/commands/onboard-channels.ts'), [
  ['"How channels work",', '"How channels work (频道如何工作)",'],
  ['"DM security: default is pairing; unknown DMs get a pairing code.",', '"DM security: default is pairing; unknown DMs get a pairing code. (私信安全：默认为配对模式；未知的私信会收到一个配对码。)",'],
  ['"Approve with: openclaw pairing approve <channel> <code>",', '"Approve with: openclaw pairing approve <channel> <code> (使用命令批准：openclaw pairing approve <频道> <配对码>)",'],
  ['"Public DMs require dmPolicy=\\"open\\" + allowFrom=[\\"*\\"].",', '"Public DMs require dmPolicy=\\"open\\" + allowFrom=[\\"*\\"]. (公共私信需要 dmPolicy=\\"open\\"+ allowFrom=[\\"*\\"])",'],
  ['"Multi-user DMs: run: openclaw config set session.dmScope \\"per-channel-peer\\" (or",', '"Multi-user DMs: run: openclaw config set session.dmScope \\"per-channel-peer\\" (or (多用户私信：运行 openclaw config set session.dmScope \\"per-channel-peer\\" (或者)",'],
  ['\\"per-account-channel-peer\\" for multi-account channels) to isolate sessions.",', '\\"per-account-channel-peer\\" for multi-account channels) to isolate sessions. (对于多账号频道使用 \\"per-account-channel-peer\\") 来隔离会话。)",'],
  ['"Telegram: simplest way to get started — register a bot with @BotFather and get going.",', '"Telegram: simplest way to get started — register a bot with @BotFather and get going. (Telegram：最简单的开始方式 —— 在 @BotFather 注册一个机器人并开始使用。)",'],
  ['"WhatsApp: works with your own number; recommend a separate phone + eSIM.",', '"WhatsApp: works with your own number; recommend a separate phone + eSIM. (WhatsApp：使用您自己的号码；推荐使用单独的手机 + eSIM。)",'],
  ['"Discord: very well supported right now.",', '"Discord: very well supported right now. (Discord：目前支持得非常好。)",'],
  ['"IRC: classic IRC networks with DM/channel routing and pairing controls.",', '"IRC: classic IRC networks with DM/channel routing and pairing controls. (IRC：带有私信/频道路由和配对控制的经典 IRC 网络。)",'],
  ['"Google Chat: Google Workspace Chat app with HTTP webhook.",', '"Google Chat: Google Workspace Chat app with HTTP webhook. (Google Chat：带有 HTTP Webhook 的 Google Workspace Chat 应用。)",'],
  ['"Slack: supported (Socket Mode).",', '"Slack: supported (Socket Mode). (Slack：支持 (Socket 模式)。)",'],
  ['"Signal: signal-cli linked device; more setup (David Reagans: \\"Hop on Discord.\\").",', '"Signal: signal-cli linked device; more setup (David Reagans: \\"Hop on Discord.\\"). (Signal：signal-cli 关联设备；需要更多设置。)",'],
  ['"iMessage: this is still a work in progress.",', '"iMessage: this is still a work in progress. (iMessage：此功能仍在开发中。)",'],
  ['"Feishu: 飞书/Lark enterprise messaging with doc/wiki/drive tools.",', '"Feishu: 飞书/Lark enterprise messaging with doc/wiki/drive tools. (Feishu：带有文档/维基/云盘工具的飞书/Lark 企业消息。)",'],
  ['"Nostr: Decentralized protocol; encrypted DMs via NIP-04.",', '"Nostr: Decentralized protocol; encrypted DMs via NIP-04. (Nostr：去中心化协议；通过 NIP-04 加密私信。)",'],
  ['"Microsoft Teams: Bot Framework; enterprise support.",', '"Microsoft Teams: Bot Framework; enterprise support. (Microsoft Teams：Bot 框架；企业支持。)",'],
  ['"Mattermost: self-hosted Slack-style chat; install the plugin to enable.",', '"Mattermost: self-hosted Slack-style chat; install the plugin to enable. (Mattermost：自托管的类 Slack 聊天；安装插件以启用。)",'],
  ['"Nextcloud Talk: Self-hosted chat via Nextcloud Talk webhook bots.",', '"Nextcloud Talk: Self-hosted chat via Nextcloud Talk webhook bots. (Nextcloud Talk：通过 Nextcloud Talk webhook 机器人实现自托管聊天。)",'],
  ['"Matrix: open protocol; install the plugin to enable.",', '"Matrix: open protocol; install the plugin to enable. (Matrix：开放协议；安装插件以启用。)",'],
  ['"BlueBubbles: iMessage via the BlueBubbles mac app + REST API.",', '"BlueBubbles: iMessage via the BlueBubbles mac app + REST API. (BlueBubbles：通过 BlueBubbles mac 应用 + REST API 的 iMessage。)",'],
  ['"LINE: LINE Messaging API bot for Japan/Taiwan/Thailand markets.",', '"LINE: LINE Messaging API bot for Japan/Taiwan/Thailand markets. (LINE：面向日本/台湾/泰国市场的 LINE Messaging API 机器人。)",'],
  ['"Zalo: Vietnam-focused messaging platform with Bot API.",', '"Zalo: Vietnam-focused messaging platform with Bot API. (Zalo：带有 Bot API 的以越南为中心的消息平台。)",'],
  ['"Zalo Personal: Zalo personal account via QR code login.",', '"Zalo Personal: Zalo personal account via QR code login. (Zalo Personal：通过二维码登录的 Zalo 个人账户。)",'],
  ['"Synology Chat: Connect your Synology NAS Chat to OpenClaw with full agent capabilities.",', '"Synology Chat: Connect your Synology NAS Chat to OpenClaw with full agent capabilities. (Synology Chat：将您的 Synology NAS 聊天连接到具有完整代理功能的 OpenClaw。)",'],
  ['"Tlon: decentralized messaging on Urbit; install the plugin to enable.",', '"Tlon: decentralized messaging on Urbit; install the plugin to enable. (Tlon：Urbit 上的去中心化消息传递；安装插件以启用。)",']
]);

// 3. channels/plugins/onboarding/telegram.ts
replaceInFile(path.join(__dirname, 'src/channels/plugins/onboarding/telegram.ts'), [
  ['inputPrompt: "Enter Telegram bot token",', 'inputPrompt: "Enter Telegram bot token (输入 Telegram 机器人 Token)",'],
  ['"1) Open Telegram and chat with @BotFather",', '"1) Open Telegram and chat with @BotFather (在 Telegram 中打开并与 @BotFather 聊天)",'],
  ['"2) Run /newbot (or /mybots)",', '"2) Run /newbot (or /mybots) (运行 /newbot 或 /mybots)",'],
  ['"3) Copy the token (looks like 123456:ABC...)",', '"3) Copy the token (looks like 123456:ABC...) (复制 Token (格式如 123456:ABC...))",'],
  ['"Tip: you can also set TELEGRAM_BOT_TOKEN in your env.",', '"Tip: you can also set TELEGRAM_BOT_TOKEN in your env. (提示：您也可以在环境变量中设置 TELEGRAM_BOT_TOKEN。)",'],
]);

// 4. channels/plugins/onboarding/helpers.ts
// Add missing translations for the "Use external secret provider" and "Stores the credential directly" options.
replaceInFile(path.join(__dirname, 'src/channels/plugins/onboarding/helpers.ts'), [
  ['label: `Enter ${params.credentialLabel}`', 'label: `Enter ${params.credentialLabel} (输入此凭证)`'],
  ['hint: `Stores the credential directly in OpenClaw config`', 'hint: `Stores the credential directly in OpenClaw config (将凭证直接存储在 OpenClaw 配置中)`'],
  ['label: "Use external secret provider"', 'label: "Use external secret provider (使用外部 Secret 提供商)"'],
  ['hint: "1Password, AWS Secrets Manager, Env vars, Azure Key Vault, Google Secret Manager"', 'hint: "1Password, AWS Secrets Manager, Env vars, Azure Key Vault, Google Secret Manager (如 1Password, Env 等)"'],
]);
