# Security Policy

## Supported versions
This project follows a rolling support model on the default branch. Security fixes are applied on the latest production-ready code.

## Reporting a vulnerability
Please report vulnerabilities privately and do **not** open a public issue with exploit details.

1. Send a report to the repository owner through GitHub private communication channels.
2. Include:
   - A clear description of the issue
   - Impact and affected components
   - Reproduction steps or proof-of-concept
   - Suggested remediation (if available)
3. You will receive an acknowledgement as soon as possible, followed by triage and remediation updates.

## Security process
- Every pull request should pass security checks in CI (CodeQL, dependency audit, secret scanning, IaC scan).
- High/Critical security findings must be fixed before merge.
- Secrets must be stored in secure secret managers or CI secret stores, never in source code.
