# Tianchi Purchase Redemption Ops Surface

Operator-facing surface for the Tianchi purchase redemption forecasting project.

## Routing Evidence

- Project name: `tianchi-purchase-redemption`
- Aliases: `tianchi-purchase-redemption`, `tianchi-231573`,
  `purchase-redemption`, `资金流入流出预测`
- Registry routing keywords: `tianchi-purchase-redemption`, `tianchi-231573`,
  `purchase-redemption`, `资金流入流出预测`
- Code root: `projects/research/tianchi-purchase-redemption`
- Ops surface: `ops/projects/tianchi-purchase-redemption`
- Kind: `research`
- Registry risk profile: `research_local`
- GitNexus status: not indexed
- Route evidence: user registered for Tianchi competition 231573 and requested a
  repository for completing the project

Route into this project only when the user names this Tianchi competition,
provides the competition URL `https://tianchi.aliyun.com/competition/entrance/231573`,
or asks for a file under the code root or this ops surface.

## Stable Docs

- [Project README](../../../projects/research/tianchi-purchase-redemption/README.md)
- `reports/`
- `runbooks/`
- `manifests/`

## Data Policy

Competition data is local-only. Keep raw data, extracted CSV files, generated
submissions, and bulky experiment outputs out of git unless a sanitized artifact
is intentionally promoted.

## Key Commands

```bash
cd projects/research/tianchi-purchase-redemption
python3 src/main.py prepare-data --zip "/Users/zhangjincheng/Downloads/Purchase Redemption Data.zip"
python3 src/main.py check-data
python3 src/main.py describe-data
python3 -m unittest discover -s tests
```
