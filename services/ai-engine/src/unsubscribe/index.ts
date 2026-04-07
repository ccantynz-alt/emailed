/**
 * AI Unsubscribe Agent — public surface.
 */

export {
  extractUnsubscribeOptions,
  pickBestUnsubscribeOption,
  type ExtractEmailInput,
  type UnsubscribeOption,
  type UnsubscribeMethod,
} from "./extractor.js";

export {
  runUnsubscribeFlow,
  type UnsubscribeResult,
  type RunUnsubscribeOptions,
} from "./browser-runner.js";

export {
  parseMailto,
  sendUnsubscribeMailto,
  type ParsedMailto,
  type MailtoRunResult,
  type OutboundUnsubscribeMessage,
  type SendFn,
} from "./mailto-runner.js";

export {
  sendOneClickUnsubscribe,
  type OneClickResult,
} from "./one-click-runner.js";
