#!/bin/bash

# Claude Code on the web でのみ npm install を実行
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
  echo "Running in Claude Code on the web - installing packages..."
  npm install
else
  echo "Running in local environment - skipping npm install"
fi

exit 0