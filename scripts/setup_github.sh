#!/usr/bin/env bash
# Run once by the repo owner after: gh auth login  and  creating an EMPTY GitHub repo.
# Usage: ./scripts/setup_github.sh <owner/repo>
set -euo pipefail
REPO=${1:?usage: setup_github.sh owner/repo}
git remote add origin "https://github.com/$REPO.git" 2>/dev/null || true
for b in main develop feature/frontend feature/backend feature/ml feature/database feature/devops; do
  git push -u origin "$b"
done
gh repo edit "$REPO" --default-branch develop
for b in main develop; do   # branch protection: PR + 1 review + CI checks
  gh api -X PUT "repos/$REPO/branches/$b/protection" --input - <<JSON
{"required_status_checks":{"strict":true,"contexts":["frontend","backend","prediction-service"]},
 "enforce_admins":false,
 "required_pull_request_reviews":{"required_approving_review_count":1},
 "restrictions":null}
JSON
done
# starter issues from .github/ISSUES.md (one per "## " heading)
python3 - "$REPO" <<'PY'
import re, subprocess, sys
repo = sys.argv[1]
text = open(".github/ISSUES.md", encoding="utf-8").read()
for block in re.split(r"(?m)^## ", text)[1:]:
    title, _, body = block.partition("\n")
    subprocess.run(["gh", "issue", "create", "-R", repo, "-t", title.strip(), "-b", body.strip()], check=True)
PY
echo "Done. Add Actions secrets (see docs/devops.md)."
