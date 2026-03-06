import type { AuthProfileStore } from "../agents/auth-profiles.js";
import { AUTH_CHOICE_LEGACY_ALIASES_FOR_CLI } from "./auth-choice-legacy.js";
import { ONBOARD_PROVIDER_AUTH_FLAGS } from "./onboard-provider-auth-flags.js";
import type { AuthChoice, AuthChoiceGroupId } from "./onboard-types.js";

export type { AuthChoiceGroupId };

export type AuthChoiceOption = {
  value: AuthChoice;
  label: string;
  hint?: string;
};
export type AuthChoiceGroup = {
  value: AuthChoiceGroupId;
  label: string;
  hint?: string;
  options: AuthChoiceOption[];
};

const AUTH_CHOICE_GROUP_DEFS: {
  value: AuthChoiceGroupId;
  label: string;
  hint?: string;
  choices: AuthChoice[];
}[] = [
  {
    value: "openai",
    label: "OpenAI",
    hint: "Codex OAuth + API key (Codex OAuth + API 密钥)",
    choices: ["openai-codex", "openai-api-key"],
  },
  {
    value: "anthropic",
    label: "Anthropic",
    hint: "setup-token + API key (setup-token + API 密钥)",
    choices: ["token", "apiKey"],
  },
  {
    value: "chutes",
    label: "Chutes",
    hint: "OAuth (网页授权)",
    choices: ["chutes"],
  },
  {
    value: "vllm",
    label: "vLLM",
    hint: "Local/self-hosted OpenAI-compatible (本地/自托管的 OpenAI 兼容服务)",
    choices: ["vllm"],
  },
  {
    value: "minimax",
    label: "MiniMax",
    hint: "M2.5 (recommended) (推荐使用 M2.5 模型)",
    choices: ["minimax-portal", "minimax-api", "minimax-api-key-cn", "minimax-api-lightning"],
  },
  {
    value: "moonshot",
    label: "Moonshot AI (Kimi K2.5)",
    hint: "Kimi K2.5 + Kimi Coding (月之暗面 Kimi K2.5 及 Coding 模型)",
    choices: ["moonshot-api-key", "moonshot-api-key-cn", "kimi-code-api-key"],
  },
  {
    value: "google",
    label: "Google",
    hint: "Gemini API key + OAuth (Gemini API 密钥 + 网页授权)",
    choices: ["gemini-api-key", "google-gemini-cli"],
  },
  {
    value: "xai",
    label: "xAI (Grok)",
    hint: "API key (API 密钥)",
    choices: ["xai-api-key"],
  },
  {
    value: "mistral",
    label: "Mistral AI",
    hint: "API key (API 密钥)",
    choices: ["mistral-api-key"],
  },
  {
    value: "volcengine",
    label: "Volcano Engine (火山引擎)",
    hint: "API key (API 密钥)",
    choices: ["volcengine-api-key"],
  },
  {
    value: "byteplus",
    label: "BytePlus (字节跳动国际)",
    hint: "API key (API 密钥)",
    choices: ["byteplus-api-key"],
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    hint: "API key (API 密钥)",
    choices: ["openrouter-api-key"],
  },
  {
    value: "kilocode",
    label: "Kilo Gateway (千量网关)",
    hint: "API key (OpenRouter-compatible) (兼容 OpenRouter 的 API 密钥)",
    choices: ["kilocode-api-key"],
  },
  {
    value: "qwen",
    label: "Qwen (通义千问)",
    hint: "OAuth (网页授权)",
    choices: ["qwen-portal"],
  },
  {
    value: "zai",
    label: "Z.AI (智谱清言)",
    hint: "GLM Coding Plan / Global / CN (GLM 代码计划 / 国际版 / 国内版)",
    choices: ["zai-coding-global", "zai-coding-cn", "zai-global", "zai-cn"],
  },
  {
    value: "qianfan",
    label: "Qianfan (百度千帆)",
    hint: "API key (API 密钥)",
    choices: ["qianfan-api-key"],
  },
  {
    value: "copilot",
    label: "Copilot",
    hint: "GitHub + local proxy (GitHub + 本地代理)",
    choices: ["github-copilot", "copilot-proxy"],
  },
  {
    value: "ai-gateway",
    label: "Vercel AI Gateway",
    hint: "API key (API 密钥)",
    choices: ["ai-gateway-api-key"],
  },
  {
    value: "opencode-zen",
    label: "OpenCode Zen",
    hint: "API key (API 密钥)",
    choices: ["opencode-zen"],
  },
  {
    value: "xiaomi",
    label: "Xiaomi (小米)",
    hint: "API key (API 密钥)",
    choices: ["xiaomi-api-key"],
  },
  {
    value: "synthetic",
    label: "Synthetic",
    hint: "Anthropic-compatible (multi-model) (兼容 Anthropic 的多模型服务)",
    choices: ["synthetic-api-key"],
  },
  {
    value: "together",
    label: "Together AI",
    hint: "API key (API 密钥)",
    choices: ["together-api-key"],
  },
  {
    value: "huggingface",
    label: "Hugging Face",
    hint: "Inference API (HF token) (推理 API)",
    choices: ["huggingface-api-key"],
  },
  {
    value: "venice",
    label: "Venice AI",
    hint: "Privacy-focused (uncensored models) (主打隐私保护的无审查模型)",
    choices: ["venice-api-key"],
  },
  {
    value: "litellm",
    label: "LiteLLM",
    hint: "Unified LLM gateway (100+ providers) (统一 LLM 网关，支持 100+ 提供商)",
    choices: ["litellm-api-key"],
  },
  {
    value: "cloudflare-ai-gateway",
    label: "Cloudflare AI Gateway (Cloudflare AI 网关)",
    hint: "Account ID + Gateway ID + API key (账户 ID + 网关 ID + API 密钥)",
    choices: ["cloudflare-ai-gateway-api-key"],
  },
  {
    value: "custom",
    label: "Custom Provider (自定义提供商)",
    hint: "Any OpenAI or Anthropic compatible endpoint (任何兼容 OpenAI 或 Anthropic 的端点)",
    choices: ["custom-api-key"],
  },
];

const PROVIDER_AUTH_CHOICE_OPTION_HINTS: Partial<Record<AuthChoice, string>> = {
  "litellm-api-key": "Unified gateway for 100+ LLM providers (包含 100+ LLM 提供商的统一网关)",
  "cloudflare-ai-gateway-api-key": "Account ID + Gateway ID + API key (账户 ID + 网关 ID + API 密钥)",
  "venice-api-key": "Privacy-focused inference (uncensored models) (基于隐私的推理服务 - 无审查模型)",
  "together-api-key": "Access to Llama, DeepSeek, Qwen, and more open models (访问 Llama、DeepSeek、Qwen 等开源模型)",
  "huggingface-api-key": "Inference Providers — OpenAI-compatible chat (提供方推理 - 兼容 OpenAI 的聊天系统)",
};

const PROVIDER_AUTH_CHOICE_OPTION_LABELS: Partial<Record<AuthChoice, string>> = {
  "moonshot-api-key": "Kimi API key (.ai) (Kimi API 密钥 - .ai)",
  "moonshot-api-key-cn": "Kimi API key (.cn) (Kimi API 密钥 - .cn)",
  "kimi-code-api-key": "Kimi Code API key (subscription) (Kimi Code API 密钥 - 需订阅)",
  "cloudflare-ai-gateway-api-key": "Cloudflare AI Gateway (Cloudflare AI 网关)",
};

function buildProviderAuthChoiceOptions(): AuthChoiceOption[] {
  return ONBOARD_PROVIDER_AUTH_FLAGS.map((flag) => ({
    value: flag.authChoice,
    label: PROVIDER_AUTH_CHOICE_OPTION_LABELS[flag.authChoice] ?? flag.description,
    ...(PROVIDER_AUTH_CHOICE_OPTION_HINTS[flag.authChoice]
      ? { hint: PROVIDER_AUTH_CHOICE_OPTION_HINTS[flag.authChoice] }
      : {}),
  }));
}

const BASE_AUTH_CHOICE_OPTIONS: ReadonlyArray<AuthChoiceOption> = [
  {
    value: "token",
    label: "Anthropic token (paste setup-token) (Anthropic Token，粘贴 setup-token)",
    hint: "run `claude setup-token` elsewhere, then paste the token here (在其他地方运行 claude setup-token 后粘贴至此)",
  },
  {
    value: "openai-codex",
    label: "OpenAI Codex (ChatGPT OAuth) (OpenAI Codex - ChatGPT 网页授权)",
  },
  { value: "chutes", label: "Chutes (OAuth) (Chutes 网页授权)" },
  {
    value: "vllm",
    label: "vLLM (custom URL + model) (vLLM - 自定义 URL + 模型)",
    hint: "Local/self-hosted OpenAI-compatible server (本地/自托管的 OpenAI 兼容服务器)",
  },
  ...buildProviderAuthChoiceOptions(),
  {
    value: "moonshot-api-key-cn",
    label: "Kimi API key (.cn) (Kimi API 密钥 - .cn)",
  },
  {
    value: "github-copilot",
    label: "GitHub Copilot (GitHub device login) (GitHub Copilot - 设备登录)",
    hint: "Uses GitHub device flow (使用 GitHub 设备级 OAuth 授权)",
  },
  { value: "gemini-api-key", label: "Google Gemini API key (Google Gemini API 密钥)" },
  {
    value: "google-gemini-cli",
    label: "Google Gemini CLI OAuth (Google Gemini CLI 网页授权)",
    hint: "Unofficial flow; review account-risk warning before use (非官方流程；使用前请查看账户风险警告)",
  },
  { value: "zai-api-key", label: "Z.AI API key (Z.AI API 密钥)" },
  {
    value: "zai-coding-global",
    label: "Coding-Plan-Global (代码计划 - 国际版)",
    hint: "GLM Coding Plan Global (api.z.ai) (GLM 代码计划国际版：api.z.ai)",
  },
  {
    value: "zai-coding-cn",
    label: "Coding-Plan-CN (代码计划 - 国内版)",
    hint: "GLM Coding Plan CN (open.bigmodel.cn) (GLM 代码计划国内版：open.bigmodel.cn)",
  },
  {
    value: "zai-global",
    label: "Global (国际版)",
    hint: "Z.AI Global (api.z.ai) (Z.AI 国际版：api.z.ai)",
  },
  {
    value: "zai-cn",
    label: "CN (国内版)",
    hint: "Z.AI CN (open.bigmodel.cn) (Z.AI 国内版：open.bigmodel.cn)",
  },
  {
    value: "xiaomi-api-key",
    label: "Xiaomi API key (小米 API 密钥)",
  },
  {
    value: "minimax-portal",
    label: "MiniMax OAuth (MiniMax 网页授权)",
    hint: "Oauth plugin for MiniMax (MiniMax 的 OAuth 插件)",
  },
  { value: "qwen-portal", label: "Qwen OAuth (通义千问网页授权)" },
  {
    value: "copilot-proxy",
    label: "Copilot Proxy (local) (Copilot 代理 - 本地)",
    hint: "Local proxy for VS Code Copilot models (VS Code Copilot 模型的本地代理)",
  },
  { value: "apiKey", label: "Anthropic API key (Anthropic API 密钥)" },
  {
    value: "opencode-zen",
    label: "OpenCode Zen (multi-model proxy) (多模型代理)",
    hint: "Claude, GPT, Gemini via opencode.ai/zen (通过 opencode.ai/zen 访问 Claude、GPT、Gemini)",
  },
  { value: "minimax-api", label: "MiniMax M2.5" },
  {
    value: "minimax-api-key-cn",
    label: "MiniMax M2.5 (CN) (国内版)",
    hint: "China endpoint (api.minimaxi.com) (国内端点：api.minimaxi.com)",
  },
  {
    value: "minimax-api-lightning",
    label: "MiniMax M2.5 Highspeed (极速版)",
    hint: "Official fast tier (legacy: Lightning) (官方快速层 - 旧称 Lightning)",
  },
  { value: "custom-api-key", label: "Custom Provider" },
];

export function formatAuthChoiceChoicesForCli(params?: {
  includeSkip?: boolean;
  includeLegacyAliases?: boolean;
}): string {
  const includeSkip = params?.includeSkip ?? true;
  const includeLegacyAliases = params?.includeLegacyAliases ?? false;
  const values = BASE_AUTH_CHOICE_OPTIONS.map((opt) => opt.value);

  if (includeSkip) {
    values.push("skip");
  }
  if (includeLegacyAliases) {
    values.push(...AUTH_CHOICE_LEGACY_ALIASES_FOR_CLI);
  }

  return values.join("|");
}

export function buildAuthChoiceOptions(params: {
  store: AuthProfileStore;
  includeSkip: boolean;
}): AuthChoiceOption[] {
  void params.store;
  const options: AuthChoiceOption[] = [...BASE_AUTH_CHOICE_OPTIONS];

  if (params.includeSkip) {
    options.push({ value: "skip", label: "Skip for now (暂不设置)" });
  }

  return options;
}

export function buildAuthChoiceGroups(params: { store: AuthProfileStore; includeSkip: boolean }): {
  groups: AuthChoiceGroup[];
  skipOption?: AuthChoiceOption;
} {
  const options = buildAuthChoiceOptions({
    ...params,
    includeSkip: false,
  });
  const optionByValue = new Map<AuthChoice, AuthChoiceOption>(
    options.map((opt) => [opt.value, opt]),
  );

  const groups = AUTH_CHOICE_GROUP_DEFS.map((group) => ({
    ...group,
    options: group.choices
      .map((choice) => optionByValue.get(choice))
      .filter((opt): opt is AuthChoiceOption => Boolean(opt)),
  }));

  const skipOption = params.includeSkip
    ? ({ value: "skip", label: "Skip for now (暂不设置)" } satisfies AuthChoiceOption)
    : undefined;

  return { groups, skipOption };
}
