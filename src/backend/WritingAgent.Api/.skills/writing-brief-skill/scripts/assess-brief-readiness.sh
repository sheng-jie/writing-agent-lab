#!/bin/sh

audience=${1:-}
topic=${2:-}
core_argument=${3:-}
usage_scenario=${4:-}

missing=""

add_missing() {
  if [ -z "$missing" ]; then
    missing="\"$1\""
  else
    missing="$missing,\"$1\""
  fi
}

if [ -z "$audience" ]; then
  add_missing "target_audience"
fi

if [ -z "$topic" ]; then
  add_missing "topic"
fi

if [ -z "$core_argument" ]; then
  add_missing "core_argument"
fi

if [ -z "$usage_scenario" ]; then
  add_missing "usage_scenario"
fi

if [ -z "$missing" ]; then
  printf '{"ready":true,"missing":[],"recommendation":"可以整理 Writing Brief。"}\n'
else
  printf '{"ready":false,"missing":[%s],"recommendation":"需要先通过 clarification 工具补齐缺失信息。"}\n' "$missing"
fi