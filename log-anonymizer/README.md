# @prodrescue/log-anonymizer

Redact PII and secrets from log-like text **before** sending to AI or any external service.  
This is the same anonymizer used in production by [ProdRescue AI](https://prodrescueai.com) — we open-sourced it so you can verify exactly what gets redacted and where.

## Why open-source the anonymizer?

- **Trust:** You can read the code and see that IPs, emails, tokens, paths, and Slack identities are redacted.
- **No magic:** All redaction is pattern-based; no data is sent to us. Run it in your own pipeline if you want.
- **Reuse:** Use it in your own apps before sending logs to any LLM or analytics.

## What gets redacted (built-in)

| Pattern | Replacement |
|--------|-------------|
| IPv4, IPv6 | `[IP_REDACTED]` |
| Email addresses | `[EMAIL_REDACTED]` |
| `password=`, `api_key=`, `secret=` values | `[REDACTED]` |
| Bearer tokens, JWT-like strings | `authorization=[TOKEN_REDACTED]` |
| AWS secret, private_key | `secret_key=[SECRET_REDACTED]` |
| Local file paths: `/Users/...`, `/home/...`, `C:\Users\...` | `[PATH_REDACTED]` |
| JSON-like fields: `credit_card`, `card_number`, `cvv`, `ssn`, `musteri_no`, `tc_kimlik`, etc. | `[REDACTED]` |
| Slack `@user`, `#channel` (when `slackContext: true`) | `@[USER_REDACTED]`, `#[CHANNEL_REDACTED]` |

Path redaction helps with stack traces and logs that contain developer paths (e.g. `/Users/ahmet/projem/gizli-dosya.txt`).  
JSON-style redaction covers common keys in log payloads; add your own with `sensitiveKeys` or `customPatterns`.

## Custom / special formats

- **Your own IDs or keys** (e.g. `musteri_no: 998877`): pass `sensitiveKeys: ["musteri_no"]` or use `customPatterns` for full control.
- **Stack traces / file paths**: built-in rules redact `/Users/...`, `/home/...`, and `C:\Users\...`; other path formats can be added via `customPatterns`.
- **JSON payloads**: built-in keys cover many common fields; extend with `sensitiveKeys` for app-specific fields. Regex is applied to the whole text (not a JSON parser), so edge cases in deeply nested JSON may need custom patterns.

## Install

```bash
npm install @prodrescue/log-anonymizer
```

Or use the source from this repo (see [License](#license)).

## Usage

```ts
import { anonymizeLogs, anonymizeSlack } from "@prodrescue/log-anonymizer"

// Plain logs — PII, paths, built-in JSON keys
const safe = anonymizeLogs(rawLogs)

// With Slack thread (redact @user, #channel)
const safeWithSlack = anonymizeLogs(rawLogs, { slackContext: true })

// Add your own sensitive keys (e.g. musteri_no, internal_id)
const safeCustom = anonymizeLogs(rawLogs, {
  sensitiveKeys: ["musteri_no", "internal_id"],
})

// Full control: custom regex
const safeFull = anonymizeLogs(rawLogs, {
  customPatterns: [
    { pattern: /musteri_no\s*[:=]\s*(\d+)/gi, replacement: "musteri_no=[REDACTED]" },
  ],
})

// Only Slack @user / #channel
const slackOnly = anonymizeSlack(slackText)
```

## API

- **`anonymizeLogs(raw: string, options?: AnonymizeOptions): string`**  
  Redacts IPs, emails, passwords, tokens, secrets, local paths, and JSON-like sensitive keys.  
  Options:
  - `slackContext?: boolean` — also redact Slack users and channels.
  - `sensitiveKeys?: string[]` — extra key names to redact (e.g. `["musteri_no"]`).
  - `customPatterns?: Array<{ pattern: RegExp; replacement: string }>` — custom regex replacements (applied after built-in rules).

- **`anonymizeSlack(raw: string): string`**  
  Redacts Slack user IDs, channel IDs, `@mention` and `#channel` names. Keeps structure (e.g. `[USER_REDACTED]: message`).

## License

MIT. See [LICENSE](./LICENSE).

---

Part of [ProdRescue AI](https://prodrescueai.com) — turn production chaos into structured incident reports.
