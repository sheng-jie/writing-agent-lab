#!/bin/sh

raw_idea=${1:-}
topic=${2:-}
audience=${3:-}
purpose=${4:-}
platform=${5:-}
core_viewpoint=${6:-}
content_boundary=${7:-}

missing=""

add_missing() {
  if [ -z "$missing" ]; then
    missing="\"$1\""
  else
    missing="$missing,\"$1\""
  fi
}

if [ -z "$raw_idea" ]; then
  add_missing "raw_idea"
fi

if [ -z "$topic" ]; then
  add_missing "topic"
fi

if [ -z "$audience" ]; then
  add_missing "target_audience"
fi

if [ -z "$purpose" ]; then
  add_missing "purpose"
fi

if [ -z "$platform" ]; then
  add_missing "platform"
fi

if [ -z "$core_viewpoint" ]; then
  add_missing "core_viewpoint"
fi

if [ -z "$content_boundary" ]; then
  add_missing "content_boundary"
fi

if [ -z "$missing" ]; then
  printf '{"ready":true,"missing":[],"recommendation":"可以整理写作意图。"}\n'
else
  printf '{"ready":false,"missing":[%s],"recommendation":"需要先通过 clarification 工具补齐缺失信息。"}\n' "$missing"
fi
