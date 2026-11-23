#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/oliveconnect}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%F-%H%M%S)"
TARGET="$BACKUP_ROOT/$STAMP"

mkdir -p "$TARGET"
mongodump --db oliveconnect --gzip --out "$TARGET"
find "$BACKUP_ROOT" -maxdepth 1 -type d -name '????-??-??-*' -mtime "+$RETENTION_DAYS" -exec rm -rf {} +
