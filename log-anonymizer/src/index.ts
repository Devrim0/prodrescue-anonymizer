/**
 * @prodrescue/log-anonymizer
 * Redact PII and secrets from logs before sending to AI or external services.
 * Used in production by ProdRescue AI — https://prodrescueai.com
 */

export { anonymizeLogs, anonymizeSlack, type AnonymizeOptions } from "./anonymizer"
