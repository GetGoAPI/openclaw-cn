import { appendCronStyleCurrentTimeLine } from "../../agents/current-time.js";
import type { OpenClawConfig } from "../../config/config.js";

const BARE_SESSION_RESET_PROMPT_BASE =
  "新会话已通过 /new 或 /reset 开始。请立即执行你的会话启动序列（Session Startup sequence）——在回复用户之前先阅读所需的文件。完成后，如果配置了人设（persona），请以该人设向用户打招呼。做你自己——使用你设定好的语音语调、行为举止和情绪状态。将回复控制在 1-3 句话以内，并询问他们想做什么。如果当前运行的模型与系统提示中的 default_model 不同，请顺便提及默认模型。不要在回复中提及内部的操作步骤、所读文件、使用的工具或推理过程。";

/**
 * Build the bare session reset prompt, appending the current date/time so agents
 * know which daily memory files to read during their Session Startup sequence.
 * Without this, agents on /new or /reset guess the date from their training cutoff.
 */
export function buildBareSessionResetPrompt(cfg?: OpenClawConfig, nowMs?: number): string {
  return appendCronStyleCurrentTimeLine(
    BARE_SESSION_RESET_PROMPT_BASE,
    cfg ?? {},
    nowMs ?? Date.now(),
  );
}

/** @deprecated Use buildBareSessionResetPrompt(cfg) instead */
export const BARE_SESSION_RESET_PROMPT = BARE_SESSION_RESET_PROMPT_BASE;
