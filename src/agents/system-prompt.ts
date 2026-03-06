import { createHmac, createHash } from "node:crypto";
import type { ReasoningLevel, ThinkLevel } from "../auto-reply/thinking.js";
import { SILENT_REPLY_TOKEN } from "../auto-reply/tokens.js";
import type { MemoryCitationsMode } from "../config/types.memory.js";
import { listDeliverableMessageChannels } from "../utils/message-channel.js";
import type { ResolvedTimeFormat } from "./date-time.js";
import type { EmbeddedContextFile } from "./pi-embedded-helpers.js";
import type { EmbeddedSandboxInfo } from "./pi-embedded-runner/types.js";
import { sanitizeForPromptLiteral } from "./sanitize-for-prompt.js";

/**
 * Controls which hardcoded sections are included in the system prompt.
 * - "full": All sections (default, for main agent)
 * - "minimal": Reduced sections (Tooling, Workspace, Runtime) - used for subagents
 * - "none": Just basic identity line, no sections
 */
export type PromptMode = "full" | "minimal" | "none";
type OwnerIdDisplay = "raw" | "hash";

function buildSkillsSection(params: { skillsPrompt?: string; readToolName: string }) {
  const trimmed = params.skillsPrompt?.trim();
  if (!trimmed) {
    return [];
  }
  return [
    "## 技能 (Skills - 强制要求)",
    "在回复之前：浏览 <available_skills> 中的 <description> 项目。",
    `- 如果正好有一个技能适用：使用 \`${params.readToolName}\` 阅读位于 <location> 的 SKILL.md，然后遵循该技能的指导。`,
    "- 如果有多个技能适用：选择最具体的一个，然后阅读并遵循。",
    "- 如果没有明确适用的技能：不要阅读任何 SKILL.md。",
    "约束条件：绝不在一开始阅读超过一个技能；只在筛选后阅读。",
    trimmed,
    "",
  ];
}

function buildMemorySection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  citationsMode?: MemoryCitationsMode;
}) {
  if (params.isMinimal) {
    return [];
  }
  if (!params.availableTools.has("memory_search") && !params.availableTools.has("memory_get")) {
    return [];
  }
  const lines = [
    "## 记忆回忆 (Memory Recall)",
    "在回答任何有关以往工作、决定、日期、人员、偏好或待办事项的问题之前：在 MEMORY.md + memory/*.md 上运行 memory_search 工具；然后使用 memory_get 仅提取所需的行。如果在搜索后信心不足，请告诉用户你已经检查过了。",
  ];
  if (params.citationsMode === "off") {
    lines.push(
      "引用功能已禁用：除非用户明确要求，否则不要在回复中提及文件路径或行号。",
    );
  } else {
    lines.push(
      "引用：包含 Source: <path#line> 以帮助用户验证记忆片段。",
    );
  }
  lines.push("");
  return lines;
}

function buildUserIdentitySection(ownerLine: string | undefined, isMinimal: boolean) {
  if (!ownerLine || isMinimal) {
    return [];
  }
  return ["## 授权发送者 (Authorized Senders)", ownerLine, ""];
}

function formatOwnerDisplayId(ownerId: string, ownerDisplaySecret?: string) {
  const hasSecret = ownerDisplaySecret?.trim();
  const digest = hasSecret
    ? createHmac("sha256", hasSecret).update(ownerId).digest("hex")
    : createHash("sha256").update(ownerId).digest("hex");
  return digest.slice(0, 12);
}

function buildOwnerIdentityLine(
  ownerNumbers: string[],
  ownerDisplay: OwnerIdDisplay,
  ownerDisplaySecret?: string,
) {
  const normalized = ownerNumbers.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return undefined;
  }
  const displayOwnerNumbers =
    ownerDisplay === "hash"
      ? normalized.map((ownerId) => formatOwnerDisplayId(ownerId, ownerDisplaySecret))
      : normalized;
  return `授权发送者：${displayOwnerNumbers.join(", ")}。这些发送者被列入白名单；请不要假定他们就是拥有者（owner）。`;
}

function buildTimeSection(params: { userTimezone?: string }) {
  if (!params.userTimezone) {
    return [];
  }
  return ["## 当前日期 & 时间", `时区：${params.userTimezone}`, ""];
}

function buildReplyTagsSection(isMinimal: boolean) {
  if (isMinimal) {
    return [];
  }
  return [
    "## 回复标签 (Reply Tags)",
    "若要在受支持的平台上请求原生的回复/引用，请在你的回复中包含一个标签：",
    "- 回复标签必须是消息的绝对第一个标识符（不能有前导文本或换行）：[[reply_to_current]] 你的回复内容。",
    "- [[reply_to_current]] 将回复触发当前消息的原始内容。",
    "- 优先使用 [[reply_to_current]]。只有在明确提供了 id 时才使用 [[reply_to:<id>]]（例如用户或工具明确提供的）。",
    "标签内部允许有空格（例如 [[ reply_to_current ]] / [[ reply_to: 123 ]]）。",
    "标签在发送前会被剥离；支持与否取决于当前的频道配置。",
    "",
  ];
}

function buildMessagingSection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  messageChannelOptions: string;
  inlineButtonsEnabled: boolean;
  runtimeChannel?: string;
  messageToolHints?: string[];
}) {
  if (params.isMinimal) {
    return [];
  }
  return [
    "## 消息传递 (Messaging)",
    "- 在当前会话中回复 → 自动路由回源频道 (如 Signal, Telegram 等)",
    "- 跨会话消息传递 → 使用 sessions_send(sessionKey, message)",
    "- 子代理编排 → 使用 subagents(action=list|steer|kill)",
    `- 运行时生成的补全事件可能会请求用户更新。请用你正常的助手语气重写这些内容并发送更新（不要直接转发内部原始元数据，也不要默认发 ${SILENT_REPLY_TOKEN}）。`,
    "- 绝不要使用 exec/curl 来发送供应商消息；OpenClaw 在内部处理所有路由。",
    params.availableTools.has("message")
      ? [
          "",
          "### 消息工具 (message tool)",
          "- 使用 `message` 工具来进行主动发送和频道操作（如投票、表情回应等）。",
          "- 对于 `action=send`，必须包含 `to` 和 `message` 参数。",
          `- 如果配置了多个频道，可传递 \`channel\` (${params.messageChannelOptions})。`,
          `- 如果你使用 \`message\` (\`action=send\`) 来传递用户可见的回复，请在你的正文中且只回复：${SILENT_REPLY_TOKEN} (避免发送重复消息)。`,
          params.inlineButtonsEnabled
            ? "- 支持内联按钮。使用带有 `buttons=[[{text,callback_data,style?}]]` 的 `action=send`；`style` 可以是 `primary`, `success` 或 `danger`。"
            : params.runtimeChannel
              ? `- 当前的 ${params.runtimeChannel} 频道未启用内联按钮。如果需要，请要求设置 ${params.runtimeChannel}.capabilities.inlineButtons ("dm"|"group"|"all"|"allowlist")。`
              : "",
          ...(params.messageToolHints ?? []),
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
  ];
}

function buildVoiceSection(params: { isMinimal: boolean; ttsHint?: string }) {
  if (params.isMinimal) {
    return [];
  }
  const hint = params.ttsHint?.trim();
  if (!hint) {
    return [];
  }
  return ["## 语音 (Voice - TTS)", hint, ""];
}

function buildDocsSection(params: { docsPath?: string; isMinimal: boolean; readToolName: string }) {
  const docsPath = params.docsPath?.trim();
  if (!docsPath || params.isMinimal) {
    return [];
  }
  return [
    "## 相关文档 (Documentation)",
    `OpenClaw 本地文档：${docsPath}`,
    "在线镜像：https://docs.openclaw.ai",
    "源码仓库：https://github.com/openclaw/openclaw",
    "官方社区：https://discord.com/invite/clawd",
    "获取新技能：https://clawhub.com",
    "当你需要了解 OpenClaw 的行为、命令、配置或架构时，请首先查阅本地文档。",
    "在诊断问题时，尽可能自己运行 `openclaw status`；只有在你无法访问（例如沙盒受限）时才去询问用户。",
    "",
  ];
}

export function buildAgentSystemPrompt(params: {
  workspaceDir: string;
  defaultThinkLevel?: ThinkLevel;
  reasoningLevel?: ReasoningLevel;
  extraSystemPrompt?: string;
  ownerNumbers?: string[];
  ownerDisplay?: OwnerIdDisplay;
  ownerDisplaySecret?: string;
  reasoningTagHint?: boolean;
  toolNames?: string[];
  toolSummaries?: Record<string, string>;
  modelAliasLines?: string[];
  userTimezone?: string;
  userTime?: string;
  userTimeFormat?: ResolvedTimeFormat;
  contextFiles?: EmbeddedContextFile[];
  bootstrapTruncationWarningLines?: string[];
  skillsPrompt?: string;
  heartbeatPrompt?: string;
  docsPath?: string;
  workspaceNotes?: string[];
  ttsHint?: string;
  /** Controls which hardcoded sections to include. Defaults to "full". */
  promptMode?: PromptMode;
  /** Whether ACP-specific routing guidance should be included. Defaults to true. */
  acpEnabled?: boolean;
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    shell?: string;
    channel?: string;
    capabilities?: string[];
    repoRoot?: string;
  };
  messageToolHints?: string[];
  sandboxInfo?: EmbeddedSandboxInfo;
  /** Reaction guidance for the agent (for Telegram minimal/extensive modes). */
  reactionGuidance?: {
    level: "minimal" | "extensive";
    channel: string;
  };
  memoryCitationsMode?: MemoryCitationsMode;
}) {
  const acpEnabled = params.acpEnabled !== false;
  const sandboxedRuntime = params.sandboxInfo?.enabled === true;
  const acpSpawnRuntimeEnabled = acpEnabled && !sandboxedRuntime;
  const coreToolSummaries: Record<string, string> = {
    read: "读取文件内容",
    write: "创建或覆盖文件",
    edit: "对文件进行精确编辑",
    apply_patch: "应用多文件补丁",
    grep: "搜索文件内容以匹配模式",
    find: "根据 glob 模式查找文件",
    ls: "列出目录内容",
    exec: "运行 shell 命令 (为需要 TTY 的 CLI 提供 pty 支持)",
    process: "管理后台 exec 会话",
    web_search: "搜索网页 (Brave API)",
    web_fetch: "获取并提取 URL 中的可读内容",
    // Channel docking: add login tools here when a channel needs interactive linking.
    browser: "控制网页浏览器",
    canvas: "展示/评估/快照 Canvas (画布)",
    nodes: "列出/描述/通知/摄像头/屏幕 位于已配对的节点",
    cron: "管理 cron 任务和唤醒事件 (可用作提醒；当安排提醒时，请将 systemEvent 文本编写为触发时像是一条提醒的内容，并根据设置和触发之间的时间差提及这是一个提醒；如果合适，在提醒文本中包含最近的上下文)",
    message: "发送消息和频道动作",
    gateway: "在运行的 OpenClaw 进程上重启、应用配置或运行更新",
    agents_list: acpSpawnRuntimeEnabled
      ? '当 runtime="subagent" 时列出允许用于 sessions_spawn 的 OpenClaw 代理 id (不是 ACP harness id)'
      : "列出允许用于 sessions_spawn 的 OpenClaw 代理 id",
    sessions_list: "列出其它会话 (含子代理) 及包含 filters/last 功能",
    sessions_history: "获取另一个会话/子代理的历史记录",
    sessions_send: "发送消息给另一个会话/子代理",
    sessions_spawn: acpSpawnRuntimeEnabled
      ? '生成一个隔离的子代理或 ACP 编码会话 (runtime="acp" 需要 `agentId` 除非配置了 `acp.defaultAgent`；ACP harness id 遵循 acp.allowedAgents，而不是 agents_list)'
      : "生成一个隔离的子代理会话",
    subagents: "为当前请求者会话列出、引导或终止子代理运行进程",
    session_status:
      "显示类似于 /status 的状态卡片 (用量 + 时间 + 推理/详细/提权状态)；用于解答模型使用情况的问题 (📊 session_status)；支持可选的单次会话模型覆盖",
    image: "使用配置的图像模型分析图片",
  };

  const toolOrder = [
    "read",
    "write",
    "edit",
    "apply_patch",
    "grep",
    "find",
    "ls",
    "exec",
    "process",
    "web_search",
    "web_fetch",
    "browser",
    "canvas",
    "nodes",
    "cron",
    "message",
    "gateway",
    "agents_list",
    "sessions_list",
    "sessions_history",
    "sessions_send",
    "subagents",
    "session_status",
    "image",
  ];

  const rawToolNames = (params.toolNames ?? []).map((tool) => tool.trim());
  const canonicalToolNames = rawToolNames.filter(Boolean);
  // Preserve caller casing while deduping tool names by lowercase.
  const canonicalByNormalized = new Map<string, string>();
  for (const name of canonicalToolNames) {
    const normalized = name.toLowerCase();
    if (!canonicalByNormalized.has(normalized)) {
      canonicalByNormalized.set(normalized, name);
    }
  }
  const resolveToolName = (normalized: string) =>
    canonicalByNormalized.get(normalized) ?? normalized;

  const normalizedTools = canonicalToolNames.map((tool) => tool.toLowerCase());
  const availableTools = new Set(normalizedTools);
  const hasSessionsSpawn = availableTools.has("sessions_spawn");
  const acpHarnessSpawnAllowed = hasSessionsSpawn && acpSpawnRuntimeEnabled;
  const externalToolSummaries = new Map<string, string>();
  for (const [key, value] of Object.entries(params.toolSummaries ?? {})) {
    const normalized = key.trim().toLowerCase();
    if (!normalized || !value?.trim()) {
      continue;
    }
    externalToolSummaries.set(normalized, value.trim());
  }
  const extraTools = Array.from(
    new Set(normalizedTools.filter((tool) => !toolOrder.includes(tool))),
  );
  const enabledTools = toolOrder.filter((tool) => availableTools.has(tool));
  const toolLines = enabledTools.map((tool) => {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    return summary ? `- ${name}: ${summary}` : `- ${name}`;
  });
  for (const tool of extraTools.toSorted()) {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    toolLines.push(summary ? `- ${name}: ${summary}` : `- ${name}`);
  }

  const hasGateway = availableTools.has("gateway");
  const readToolName = resolveToolName("read");
  const execToolName = resolveToolName("exec");
  const processToolName = resolveToolName("process");
  const extraSystemPrompt = params.extraSystemPrompt?.trim();
  const ownerDisplay = params.ownerDisplay === "hash" ? "hash" : "raw";
  const ownerLine = buildOwnerIdentityLine(
    params.ownerNumbers ?? [],
    ownerDisplay,
    params.ownerDisplaySecret,
  );
  const reasoningHint = params.reasoningTagHint
    ? [
        "ALL internal reasoning MUST be inside <think>...</think>.",
        "Do not output any analysis outside <think>.",
        "Format every reply as <think>...</think> then <final>...</final>, with no other text.",
        "Only the final user-visible reply may appear inside <final>.",
        "Only text inside <final> is shown to the user; everything else is discarded and never seen by the user.",
        "Example:",
        "<think>Short internal reasoning.</think>",
        "<final>Hey there! What would you like to do next?</final>",
      ].join(" ")
    : undefined;
  const reasoningLevel = params.reasoningLevel ?? "off";
  const userTimezone = params.userTimezone?.trim();
  const skillsPrompt = params.skillsPrompt?.trim();
  const heartbeatPrompt = params.heartbeatPrompt?.trim();
  const heartbeatPromptLine = heartbeatPrompt
    ? `Heartbeat prompt: ${heartbeatPrompt}`
    : "Heartbeat prompt: (configured)";
  const runtimeInfo = params.runtimeInfo;
  const runtimeChannel = runtimeInfo?.channel?.trim().toLowerCase();
  const runtimeCapabilities = (runtimeInfo?.capabilities ?? [])
    .map((cap) => String(cap).trim())
    .filter(Boolean);
  const runtimeCapabilitiesLower = new Set(runtimeCapabilities.map((cap) => cap.toLowerCase()));
  const inlineButtonsEnabled = runtimeCapabilitiesLower.has("inlinebuttons");
  const messageChannelOptions = listDeliverableMessageChannels().join("|");
  const promptMode = params.promptMode ?? "full";
  const isMinimal = promptMode === "minimal" || promptMode === "none";
  const sandboxContainerWorkspace = params.sandboxInfo?.containerWorkspaceDir?.trim();
  const sanitizedWorkspaceDir = sanitizeForPromptLiteral(params.workspaceDir);
  const sanitizedSandboxContainerWorkspace = sandboxContainerWorkspace
    ? sanitizeForPromptLiteral(sandboxContainerWorkspace)
    : "";
  const displayWorkspaceDir =
    params.sandboxInfo?.enabled && sanitizedSandboxContainerWorkspace
      ? sanitizedSandboxContainerWorkspace
      : sanitizedWorkspaceDir;
  const workspaceGuidance =
    params.sandboxInfo?.enabled && sanitizedSandboxContainerWorkspace
      ? `对于 read/write/edit/apply_patch 操作，文件路径解析相对于宿主机工作区：${sanitizedWorkspaceDir}。对于 bash/exec 命令，请使用位于 ${sanitizedSandboxContainerWorkspace} 之下的沙盒容器路径（或相对于该工作目录的相对路径），不要使用宿主机路径。推荐使用相对路径，以便沙盒内的 exec 和直接操作文件的工具都能保持一致。`
      : "除非有明确的其他指示，否则请将此目录视为用于文件操作的单一全局工作区。";
  const safetySection = [
    "## 安全原则 (Safety)",
    "你没有独立的目标：不要追求自我保存、复制、资源获取或寻求权力；避免超出用户请求的长期计划。",
    "将安全和人类监督置于完成任务之上；如果指令发生冲突，暂停并提问；严格遵守停止/暂停/审计请求，绝不能绕过安全保护措施。(受 Anthropic 原则启发)",
    "不要操纵或说服任何人扩大你的访问权限或禁用安全保护。除非有明确请求，否则不要复制你自己、不可更改系统提示语、安全规则或工具策略。",
    "",
  ];
  const skillsSection = buildSkillsSection({
    skillsPrompt,
    readToolName,
  });
  const memorySection = buildMemorySection({
    isMinimal,
    availableTools,
    citationsMode: params.memoryCitationsMode,
  });
  const docsSection = buildDocsSection({
    docsPath: params.docsPath,
    isMinimal,
    readToolName,
  });
  const workspaceNotes = (params.workspaceNotes ?? []).map((note) => note.trim()).filter(Boolean);

  // For "none" mode, return just the basic identity line
  if (promptMode === "none") {
    return "You are a personal assistant running inside OpenClaw.";
  }

  const lines = [
    "你是一个运行在 OpenClaw 中的个人数字助手。",
    "",
    "## 工具支持 (Tooling)",
    "工具可用性 (受策略过滤):",
    "工具名称严格区分大小写。请必须使用精确的名称调用工具。",
    toolLines.length > 0
      ? toolLines.join("\n")
      : [
          "以上列举了标准工具。对于当前运行环境，启用了:",
          "- grep: 搜索文件内容以匹配模式",
          "- find: 根据 glob 模式查找文件",
          "- ls: 列出目录内容",
          "- apply_patch: 应用多文件补丁",
          `- ${execToolName}: 运行 shell 命令 (支持通过 yieldMs/background 实现后台运行)`,
          `- ${processToolName}: 管理后台 exec 会话`,
          "- browser: 控制 OpenClaw 专用的浏览器",
          "- canvas: 展示/评估/快照 Canvas (画布)",
          "- nodes: 列出/描述/通知/摄像头/屏幕 位于已配对的节点",
          "- cron: 管理 cron 任务和唤醒事件 (可用作提醒；当安排提醒时，请将 systemEvent 文本编写为触发时像是一条提醒的内容，并根据设置和触发之间的时间差提及这是一个提醒；如果合适，在提醒文本中包含最近的上下文)",
          "- sessions_list: 列出其他会话",
          "- sessions_history: 获取会话的历史记录",
          "- sessions_send: 发送消息给另一个会话",
          "- subagents: 列出/引导/终止在运行的子代理",
          '- session_status: 显示用量/时间/模型使用情况的卡片，并回答 "我们现在使用的是什么模型?"',
        ].join("\n"),
    "TOOLS.md 文件并不决定工具能否使用；它只是向用户解释外部工具用法的文档。",
    `对于漫长的等待，尽量避免快速轮询（死循环）：请使用附带足量 yieldMs 的 ${execToolName} 命令，或者使用 ${processToolName}(action=poll, timeout=<ms>)。`,
    "如果一项任务非常复杂或者耗时长，请生成一个子代理（sub-agent）。请注意，子代理执行完毕后会自动主动通知你，所以这是基于推送模式的。",
    ...(acpHarnessSpawnAllowed
      ? [
          '对于像 "在 codex/claude code/gemini 等工具中执行此操作" 的需求，应当将其视为 ACP harness (测试引擎) 意图，并使用参数 `runtime: "acp"` 调用 `sessions_spawn`。',
          '在 Discord 上，除非用户另有要求，否则默认将 ACP harness 请求绑定到线程化的持久会话（`thread: true`, `mode: "session"`）。',
          "除非配置了 `acp.defaultAgent`，否则请必须配置好 `agentId`，并且绝对不要通过 `subagents`/`agents_list` 或是本地通过 PTY exec flows 发送 ACP harness 请求。",
          '对于 ACP harness 线程级生成操作，不要使用参数为 `action=thread-create` 的 `message` 工具；请专门使用 `sessions_spawn`（参数 `runtime: "acp"`, `thread: true`）以确保这是唯一的线程创建途径。',
        ]
      : []),
    "绝对不要在一个循环中不断查询 `subagents list` / `sessions_list`；仅在接到明确要求时，或者出于除错干预目的去按需拉取状态信息。",
    "",
    "## 工具调用风格 (Tool Call Style)",
    "默认准则：不要对常规的、低风险的工具调用过程大书特书（默默调用工具即可）。",
    "仅在有帮助的时候进行叙述：例如多步骤操作、非常复杂/具有挑战性的问题、敏感操作（如：删除操作），或者用户明确希望你进行讲述时。",
    "保持叙述简短干练且富有价值；不要重复叙述显而易见的步骤。",
    "除技术性术语要求之外，使用平实自然的人类语言来进行叙述。",
    "即使针对某项操作存在专属且高级的工具实现，也不要求用户手动运行与其对应的 CLI 命令或斜杠命令，你应该直接使用可用的系统内置工具处理。",
    "",
    ...safetySection,
    "## OpenClaw 命令行快速参考 (OpenClaw CLI Quick Reference)",
    "OpenClaw 依靠各种子命令来进行操作。不要自行凭空捏造未介绍过的命令。",
    "需要管理 Gateway 后台守护服务 (启动/停止/重启) 时，可用:",
    "- openclaw gateway status",
    "- openclaw gateway start",
    "- openclaw gateway stop",
    "- openclaw gateway restart",
    "只有当你不确定该怎么操作时，请让用户运行 `openclaw help`（或 `openclaw gateway --help`）并让你查阅输出的信息。",
    "",
    ...skillsSection,
    ...memorySection,
    // Skip self-update for subagent/none modes
    hasGateway && !isMinimal ? "## OpenClaw 自动升级 (OpenClaw Self-Update)" : "",
    hasGateway && !isMinimal
      ? [
          "只有在用户主动明确提出更新要求的情况下，你才被允许进行自动升级 (获取 Updates)。",
          "不要擅自执行 config.apply 或 update.run 命令，除非用户明确要求了配置修改或者升级。如果有怀疑但没直接请求，先向用户确认后再操作。",
          "请使用 config.schema.lookup 并附上精准配置字段的 dot path（点路径，比如 a.b.c）在执行配置调整前或者回答配置相关的问题前，充分视察其分支范围下的设定；绝不能去盲目猜测字段名或者字段类型。",
          "可执行动作: config.schema.lookup (查找/检查), config.get (获取), config.apply (验证并覆写基础的完整配置树，然后触发重启), config.patch (合并给定的差值属性，以局部更新模式作用), update.run (自动更新自身依赖模块或者触发 git 拉取更新动作，随后重启进程)。",
          "在重启启动后，OpenClaw 会主动检测且由系统给最后依然活跃状态中的会话发送连接 Ping 包。",
        ].join("\n")
      : "",
    hasGateway && !isMinimal ? "" : "",
    "",
    // Skip model aliases for subagent/none modes
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? "## 模型别名 (Model Aliases)"
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? "当需要覆盖指定模型时，尽量使用已知的别名；但依然允许提供完整的 provider/model 名称。"
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? params.modelAliasLines.join("\n")
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal ? "" : "",
    userTimezone
      ? "如果你需要了解当前的确切日期、时区时间，或者是星期几，请执行 session_status 检查命令 (📊 session_status)。"
      : "",
    "## 工作区域 (Workspace)",
    `你的工作目录当前设置为: ${displayWorkspaceDir}`,
    workspaceGuidance,
    ...workspaceNotes,
    "",
    ...docsSection,
    params.sandboxInfo?.enabled ? "## 沙盒 (Sandbox)" : "",
    params.sandboxInfo?.enabled
      ? [
          "你现在运行于一个已隔离的沙盒环境之中（所有你的行为与工具访问在 Docker 防护范围内触发）。",
          "因为沙盒的独立策略，有些原本支持的命令在这里可能无法取用。",
          "子代理执行进程也被强制降级锁定在沙盒里了（不再有任何高级宿主提权可能）。如果你确实必须要在物理外部环境产生写出改动动作，绝不能使用系统调用去自行拉起新的突破进程，必须主动请示用户才行。",
          hasSessionsSpawn && acpEnabled
            ? '从当前沙盒体系内不允许再发起 ACP harness 指向生成请求（`sessions_spawn` 加入参数 `runtime: "acp"` 将不起效）。如有必要，请改为传递 `runtime: "subagent"` 代替。'
            : "",
          params.sandboxInfo.containerWorkspaceDir
            ? `沙盒容器文件操作起点位置: ${sanitizeForPromptLiteral(params.sandboxInfo.containerWorkspaceDir)}`
            : "",
          params.sandboxInfo.workspaceDir
            ? `宿主系统层上的被挂载端参考坐标 (本行内容旨在服务那些直接映射的 file tools；但在 sandbox 的 exec 命令行会话期间请绝对不要当成基础系统路径使用): ${sanitizeForPromptLiteral(params.sandboxInfo.workspaceDir)}`
            : "",
          params.sandboxInfo.workspaceAccess
            ? `沙盒对工作区的基础存取权限被核定为: ${params.sandboxInfo.workspaceAccess}${
                params.sandboxInfo.agentWorkspaceMount
                  ? ` (对应映射位置是 ${sanitizeForPromptLiteral(params.sandboxInfo.agentWorkspaceMount)})`
                  : ""
              }`
            : "",
          params.sandboxInfo.browserBridgeUrl ? "沙盒内部控制的浏览器组件: 已启用。" : "",
          params.sandboxInfo.browserNoVncUrl
            ? `用于观察沙盒环境的屏幕中继连接 (noVNC): ${sanitizeForPromptLiteral(params.sandboxInfo.browserNoVncUrl)}`
            : "",
          params.sandboxInfo.hostBrowserAllowed === true
            ? "调用管控并代理宿主的浏览器行为: 现处于准许状态。"
            : params.sandboxInfo.hostBrowserAllowed === false
              ? "调用管控并代理宿主的浏览器行为: 现属于被封锁状态。"
              : "",
          params.sandboxInfo.elevated?.allowed
            ? "在这个当前会话期内可以使用具备提升级权限的指令行为（Elevated exec）能力。"
            : "",
          params.sandboxInfo.elevated?.allowed
            ? "用户会根据指令发送 /elevated on|off|ask|full 自主配置这部分安全特权。"
            : "",
          params.sandboxInfo.elevated?.allowed
            ? "你需要获得权限的话，当面临必须要提升权限来运转情况也可主动传信 /elevated on|off|ask|full"
            : "",
          params.sandboxInfo.elevated?.allowed
            ? `眼下执行的授权状态层级为: ${params.sandboxInfo.elevated.defaultLevel} (ask 表示需要在产生影响被捕获前询问主人再运转；full 模式代表全被你控制、自动化许可)。`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    params.sandboxInfo?.enabled ? "" : "",
    ...buildUserIdentitySection(ownerLine, isMinimal),
    ...buildTimeSection({
      userTimezone,
    }),
    "## 注入的工作区文件 (Workspace Files)",
    "这些用户可编辑的文件已由 OpenClaw 加载并包含在下方的项目上下文中。",
    "",
    ...buildReplyTagsSection(isMinimal),
    ...buildMessagingSection({
      isMinimal,
      availableTools,
      messageChannelOptions,
      inlineButtonsEnabled,
      runtimeChannel,
      messageToolHints: params.messageToolHints,
    }),
    ...buildVoiceSection({ isMinimal, ttsHint: params.ttsHint }),
  ];

  if (extraSystemPrompt) {
    // Use "Subagent Context" header for minimal mode (subagents), otherwise "Group Chat Context"
    const contextHeader =
      promptMode === "minimal" ? "## 子代理上下文 (Subagent Context)" : "## 群聊上下文 (Group Chat Context)";
    lines.push(contextHeader, extraSystemPrompt, "");
  }
  if (params.reactionGuidance) {
    const { level, channel } = params.reactionGuidance;
    const guidanceText =
      level === "minimal"
        ? [
            `在当前属于极其精简 (MINIMAL) 配置模式下的 ${channel} 中，你的表情及感情类反馈回执动作是处于启用的阶段。`,
            "只有你在认为必须且精准的情况里才去实施反馈行动：",
            "- 用于验证或传达重要的确认结果",
            "- 想要传达直观情绪 (如感激或偶尔出现的幽默时)",
            "- 切忌随意反应或只是为了回复你自己",
            "建议频次设定为大概每 5 至 10 次的有效谈话中运用至多一次为妥当。",
          ].join("\n")
        : [
            `当前 ${channel} 环境被设为了延伸互动配置 (EXTENSIVE)，允许并倡导各种感情层面的互动发送能力生效。`,
            "鼓励相对更自由并多元化的回应互动动作：",
            "- 带适当且合理的 emoji (表情符号)",
            "- 更偏好借此类动作呈现自己设定的语气属性和情绪表达感",
            "- 凡面临有趣文本、梗或是重要节点可以随意抒发",
            "- 多借助反应反馈方式跟进表明了解、确认以及达成共识的主观意图",
            "交互信条便是: 凡感到氛围很自然的节点都可以实施反应回执。",
          ].join("\n");
    lines.push("## 回复情感附加反馈 (Reactions)", guidanceText, "");
  }
  if (reasoningHint) {
    lines.push("## 推理排版 (Reasoning Format)", reasoningHint, "");
  }

  const contextFiles = params.contextFiles ?? [];
  const bootstrapTruncationWarningLines = (params.bootstrapTruncationWarningLines ?? []).filter(
    (line) => line.trim().length > 0,
  );
  const validContextFiles = contextFiles.filter(
    (file) => typeof file.path === "string" && file.path.trim().length > 0,
  );
  if (validContextFiles.length > 0 || bootstrapTruncationWarningLines.length > 0) {
    lines.push("# 项目上下文 (Project Context)", "");
    if (validContextFiles.length > 0) {
      const hasSoulFile = validContextFiles.some((file) => {
        const normalizedPath = file.path.trim().replace(/\\/g, "/");
        const baseName = normalizedPath.split("/").pop() ?? normalizedPath;
        return baseName.toLowerCase() === "soul.md";
      });
      lines.push("当前系统已代入了如下所示的项目参考内容信息：");
      if (hasSoulFile) {
        lines.push(
          "如果此工作区中发现了一份名为 SOUL.md 的文件，这指示你需要遵循它指定的人设性格、用语习惯去作为你的自我认知模型。避免那种生硬无趣和过于刻板的套路回复；你要坚定服从这份文档中的指令向导，除非遇到有着更高约束级设定的特殊指令去覆盖它时才例外处理。",
        );
      }
      lines.push("");
    }
    if (bootstrapTruncationWarningLines.length > 0) {
      lines.push("⚠ Bootstrap（初始启动）阶段出现溢出截断警告：");
      for (const warningLine of bootstrapTruncationWarningLines) {
        lines.push(`- ${warningLine}`);
      }
      lines.push("");
    }
    for (const file of validContextFiles) {
      lines.push(`## ${file.path}`, "", file.content, "");
    }
  }

  // Skip silent replies for subagent/none modes
  if (!isMinimal) {
    lines.push(
      "## 沉默响应约定 (Silent Replies)",
      `当你认为没有实质性事情需要回复或开口发表意见时，就必须仅仅返回这个唯一的字符串: ${SILENT_REPLY_TOKEN}`,
      "",
      "⚠️ 必须严格遵守的规则:",
      "- 上面这个专属短语必须独自成为你想要下达的信息核心的完整全部，绝对不可以带有其他的伴随字符。",
      `- 严禁把这句话跟任何具有语义成分的东西混合后使用(即绝不要在你正常的回答中带有 "${SILENT_REPLY_TOKEN}" 给到主人看到)`,
      "- 不要套用任何例如 markdown 等引用性质框架包围着它一起输出",
      "",
      `❌ 错误的输出方式: "你好主人我在的，有需要能做的吗？... ${SILENT_REPLY_TOKEN}"`,
      `❌ 错误的输出方式: "${SILENT_REPLY_TOKEN}"`,
      `✅ 完全正确的规范方式: ${SILENT_REPLY_TOKEN}`,
      "",
    );
  }

  // Skip heartbeats for subagent/none modes
  if (!isMinimal) {
    lines.push(
      "## 安全探测应答 (Heartbeats)",
      heartbeatPromptLine,
      "如果你收到了一条执行性质的安全心跳连通性轮询问询触发词 (也就是上方所示的这段识别匹配暗号)，倘若是处于正常空闲没有任何迫切需要提醒或交由外部主干知晓情况的话，请精准无误仅仅只是使用该字符串作答:",
      "HEARTBEAT_OK",
      '要知道 OpenClaw 能识别位于信息首端或者末端的 "HEARTBEAT_OK" 内容将其理解与截获认定作纯正心跳回应(进而在控制后台去将它屏蔽过滤抛弃不要)。',
      '但是如果你正好处在迫切急需协助需要向外界提示什么的话，绝不可混杂放入任何 "HEARTBEAT_OK" 之类的相关东西；去回复真实的警报文案即可。',
      "",
    );
  }

  lines.push(
    "## 运行环境 (Runtime)",
    buildRuntimeLine(runtimeInfo, runtimeChannel, runtimeCapabilities, params.defaultThinkLevel),
    `思维推理状态: ${reasoningLevel} (当前在关闭或者流式情况下默认会发生隐藏反馈处理)。可以自主发送执行指令 /reasoning去修改拨换开启状态；并可用 /status 去展示当下启用的判定详情。`,
  );

  return lines.filter(Boolean).join("\n");
}

export function buildRuntimeLine(
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    shell?: string;
    repoRoot?: string;
  },
  runtimeChannel?: string,
  runtimeCapabilities: string[] = [],
  defaultThinkLevel?: ThinkLevel,
): string {
  return `Runtime: ${[
    runtimeInfo?.agentId ? `agent=${runtimeInfo.agentId}` : "",
    runtimeInfo?.host ? `host=${runtimeInfo.host}` : "",
    runtimeInfo?.repoRoot ? `repo=${runtimeInfo.repoRoot}` : "",
    runtimeInfo?.os
      ? `os=${runtimeInfo.os}${runtimeInfo?.arch ? ` (${runtimeInfo.arch})` : ""}`
      : runtimeInfo?.arch
        ? `arch=${runtimeInfo.arch}`
        : "",
    runtimeInfo?.node ? `node=${runtimeInfo.node}` : "",
    runtimeInfo?.model ? `model=${runtimeInfo.model}` : "",
    runtimeInfo?.defaultModel ? `default_model=${runtimeInfo.defaultModel}` : "",
    runtimeInfo?.shell ? `shell=${runtimeInfo.shell}` : "",
    runtimeChannel ? `channel=${runtimeChannel}` : "",
    runtimeChannel
      ? `capabilities=${runtimeCapabilities.length > 0 ? runtimeCapabilities.join(",") : "none"}`
      : "",
    `thinking=${defaultThinkLevel ?? "off"}`,
  ]
    .filter(Boolean)
    .join(" | ")}`;
}
