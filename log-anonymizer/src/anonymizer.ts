/**
 * Log anonymizer — redact PII and secrets before sending to any AI or external API.
 * Includes: IP, email, tokens, local file paths, JSON-like sensitive fields, and optional Slack redaction.
 * Use options.sensitiveKeys for custom fields (e.g. musteri_no, internal_id).
 */

import { anonymizeSlack } from "./slack-anonymizer"

const REDACT_IP = "[IP_REDACTED]"
const REDACT_EMAIL = "[EMAIL_REDACTED]"
const REDACT_PASSWORD = "[REDACTED]"
const REDACT_SECRET = "[SECRET_REDACTED]"
const REDACT_TOKEN = "[TOKEN_REDACTED]"
const REDACT_PATH = "[PATH_REDACTED]"
const REDACT_VALUE = "[REDACTED]"

const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\b/g
const IPV6_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b|::1\b/g
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
const PASSWORD_VALUE_REGEX = /(?:password|passwd|pwd|secret|api[_-]?key|apikey)\s*[:=]\s*["']?([^\s"',}\]]+)["']?/gi
const TOKEN_REGEX = /(?:bearer|api[_-]?key|authorization)\s*[:=]\s*["']?([a-zA-Z0-9._-]{20,})["']?/gi
const SECRET_KEY_REGEX = /(?:aws_secret|secret_key|private_key)\s*[:=]\s*["']?([a-zA-Z0-9/+=]{20,})["']?/gi

/** Local paths: /Users/name/..., /home/name/..., C:\Users\name\... — stack traces, file paths */
const PATH_USER_UNIX = /(^|[\s(])(\/Users\/[^\s)\]'"]+)/g
const PATH_HOME_UNIX = /(^|[\s(])(\/home\/[^\s)\]'"]+)/g
const PATH_USER_WIN = /(^|[\s(])([A-Za-z]:\\Users\\[^\s)\]'"]+)/g

/** JSON-like sensitive keys (key: value or key=value). Keys are case-insensitive. */
const BUILTIN_SENSITIVE_KEYS = [
  "credit_card",
  "card_number",
  "cvv",
  "cvc",
  "ssn",
  "social_security",
  "musteri_no",
  "müşteri_no",
  "customer_id",
  "internal_id",
  "tc_kimlik",
  "tax_id",
]

export interface AnonymizeOptions {
  /** When true, also redact Slack @user and #channel (use when text contains Slack messages) */
  slackContext?: boolean
  /**
   * Extra key names to redact (e.g. "musteri_no", "internal_id").
   * Works with JSON-like "key": "value" and key=value patterns.
   */
  sensitiveKeys?: string[]
  /**
   * Custom regex + replacement. Applied after built-in rules.
   * Example: [{ pattern: /musteri_no["']?\s*:\s*["']?(\d+)/gi, replacement: "musteri_no=[REDACTED]" }]
   */
  customPatterns?: Array<{ pattern: RegExp; replacement: string }>
}

function redactPath(_: string, prefix: string, path: string): string {
  return `${prefix}${REDACT_PATH}`
}

/**
 * Build regex to redact JSON-like "key": "value" for given keys.
 */
function redactJsonKeys(text: string, keys: string[]): string {
  let out = text
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // "key": "value" or 'key': 'value'
    out = out.replace(
      new RegExp(`(["'])(${escaped})\\1\\s*:\\s*\\1([^"']*)\\1`, "gi"),
      (_, q, k, val) => `${q}${k}${q}: ${q}${REDACT_VALUE}${q}`
    )
    // key=value or key: value (unquoted value)
    out = out.replace(
      new RegExp(`\\b(${escaped})\\s*[:=]\\s*([^\\s,}\\]"']+)`, "gi"),
      (_, k, val) => `${k}=${REDACT_VALUE}`
    )
  }
  return out
}

/**
 * Redact PII and secrets from log-like text. Run before sending to AI or storing.
 */
export function anonymizeLogs(raw: string, options?: AnonymizeOptions): string {
  if (!raw || typeof raw !== "string") return raw

  let out = raw

  // IPs and email
  out = out.replace(IPV4_REGEX, REDACT_IP)
  out = out.replace(IPV6_REGEX, REDACT_IP)
  out = out.replace(EMAIL_REGEX, REDACT_EMAIL)

  // Passwords, tokens, secrets
  out = out.replace(PASSWORD_VALUE_REGEX, (match, val) => match.replace(val, REDACT_PASSWORD))
  out = out.replace(TOKEN_REGEX, () => `authorization=${REDACT_TOKEN}`)
  out = out.replace(SECRET_KEY_REGEX, () => `secret_key=${REDACT_SECRET}`)

  // Local file paths (stack traces, logs with paths)
  out = out.replace(PATH_USER_UNIX, redactPath)
  out = out.replace(PATH_HOME_UNIX, redactPath)
  out = out.replace(PATH_USER_WIN, redactPath)

  // JSON-like sensitive fields (built-in + custom keys)
  const allKeys = [...BUILTIN_SENSITIVE_KEYS, ...(options?.sensitiveKeys ?? [])]
  out = redactJsonKeys(out, allKeys)

  // Custom patterns (e.g. musteri_no: 998877)
  if (options?.customPatterns?.length) {
    for (const { pattern, replacement } of options.customPatterns) {
      out = out.replace(pattern, replacement)
    }
  }

  if (options?.slackContext) {
    out = anonymizeSlack(out)
  }

  return out
}

export { anonymizeSlack } from "./slack-anonymizer"
