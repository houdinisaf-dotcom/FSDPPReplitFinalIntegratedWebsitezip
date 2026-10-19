#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../fsd-replit-site"
npm ci --no-fund --no-audit
npm run build
