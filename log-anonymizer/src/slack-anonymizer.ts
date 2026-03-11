/**
 * Slack-specific anonymization — redact user names and channel IDs
 * before sending to AI or storing. Preserves structure for analysis.
 */

const REDACT_USER = "[USER_REDACTED]"
const REDACT_CHANNEL = "[CHANNEL_REDACTED]"

/** @user, @U12345 (Slack user IDs) */
const SLACK_USER_MENTION_REGEX = /@([A-Za-z0-9_.-]+)/g

/** #channel-name, #C12345 (channel IDs in format) */
const SLACK_CHANNEL_REGEX = /#([A-Za-z0-9_-]+)/g

/** Slack user IDs: U01234ABCDE */
const SLACK_USER_ID_REGEX = /\bU[A-Z0-9]{8,}(?:\.[A-Z0-9]+)?\b/g

/** Slack channel IDs: C01234ABCDE */
const SLACK_CHANNEL_ID_REGEX = /\bC[A-Z0-9]{8,}(?:\.[A-Z0-9]+)?\b/g

/**
 * Anonymize Slack usernames and channel names in text.
 * Preserves structure for analysis (e.g. "[USER_REDACTED]: message").
 */
export function anonymizeSlack(raw: string): string {
  if (!raw || typeof raw !== "string") return raw

  let out = raw

  out = out.replace(SLACK_USER_ID_REGEX, REDACT_USER)
  out = out.replace(SLACK_CHANNEL_ID_REGEX, REDACT_CHANNEL)
  out = out.replace(SLACK_USER_MENTION_REGEX, `@${REDACT_USER}`)
  out = out.replace(SLACK_CHANNEL_REGEX, `#${REDACT_CHANNEL}`)

  return out
}
