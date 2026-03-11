# 🛡️ ProdRescue Log Anonymizer

**Secure your logs before they reach the AI.** This is the core anonymization engine used by **ProdRescue AI** to ensure PII (Personally Identifiable Information), secrets, and system metadata are redacted locally before any external API calls (OpenAI, Anthropic, Google Gemini) are made.



## 🚀 Overview
When sending logs or Slack war-room threads to LLMs for Root Cause Analysis (RCA), there is a high risk of leaking sensitive data. `prodrescue-anonymizer` provides a robust, regex-based pipeline to sanitize your data in-memory.

### Key Features:
* **Network Privacy:** Redacts IPv4 and IPv6 addresses.
* **Identity Protection:** Masks Emails and Slack `@user` / `#channel` mentions.
* **Credential Security:** Automatically detects and hides Passwords, API Keys, Bearer Tokens, and AWS Secrets.
* **System Hardening:** Redacts local file paths (Unix/Windows) commonly found in stack traces.
* **Deep JSON Inspection:** Sanitizes specific keys like `credit_card`, `ssn`, `musteri_no`, `tc_kimlik`, and more.
* **Extensible:** Supports custom regex patterns and additional sensitive keys.

---

## 📦 Installation

```bash
npm install @prodrescue/anonymizer
# or simply copy the source files into your project
🛠️ Usage
TypeScript
import { anonymizeLogs } from "./anonymizer";

const rawLog = `
  Error: Connection failed for user admin@company.com
  at /Users/internal-dev/project/server.js:42
  API_KEY="sk-1234567890abcdef"
  IP: 192.168.1.1
`;

const cleanLog = anonymizeLogs(rawLog, {
  slackContext: true, // Redact Slack mentions (@user, #channel)
  sensitiveKeys: ["internal_id", "musteri_no"] // Add your custom business keys
});

console.log(cleanLog);
Output:
Plaintext
  Error: Connection failed for user [EMAIL_REDACTED]
  at [PATH_REDACTED]:42
  API_KEY="[REDACTED]"
  IP: [IP_REDACTED]
🔒 Security Architecture
In-Memory Processing: Data is processed in volatile memory and is never written to disk during the anonymization phase.

Zero-Retention: This library is a pure function; it does not store, log, or transmit any data it processes.

Local Redaction: Redaction happens locally within your infrastructure. Only sanitized text leaves your environment.

📄 License
Distributed under the MIT License. See LICENSE for more information.

🤝 Contributing
As part of the ProdRescue AI ecosystem, we welcome contributions to improve our regex patterns and security coverage. Feel free to open an issue or submit a Pull Request.

Built with 3 AM incidents in mind.
