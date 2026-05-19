#!/usr/bin/env bash
# Run this from the Replit Shell to push Rukhsty to GitHub.
# The SSH key is already configured — just execute this script.
set -e

echo "==> Adding GitHub remote..."
git remote add github git@github.com:sinjo01/Rukhsty-gp.git 2>/dev/null || \
  git remote set-url github git@github.com:sinjo01/Rukhsty-gp.git

echo "==> Verifying SSH connection to GitHub..."
ssh -T git@github.com 2>&1 || true

echo "==> Pushing main branch to GitHub..."
git push github main

echo ""
echo "Done! Your code is live at: https://github.com/sinjo01/Rukhsty-gp"
