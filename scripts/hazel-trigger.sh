#!/bin/bash

# Hazel Trigger Script for V6 Filename Validation
# Usage: hazel-trigger.sh <filename> <filepath>

FILENAME="$1"
FILEPATH="$2"

# Validate arguments
if [ -z "$FILENAME" ] || [ -z "$FILEPATH" ]; then
    echo "ERROR: Missing required arguments"
    echo "Usage: $0 <filename> <filepath>"
    exit 1
fi

# Validate DEPLOYMENT_ID environment variable
if [ -z "$DEPLOYMENT_ID" ]; then
    echo "ERROR: DEPLOYMENT_ID environment variable not set"
    exit 1
fi

# V6 Pattern: ##-####-##-##_SubjectCode_FileType_Description.extension
# Pattern: ^\d{2}-\d{4}-\d{2}-\d{2}_[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$
V6_PATTERN='^[0-9]{2}-[0-9]{4}-[0-9]{2}-[0-9]{2}_[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$'

if [[ "$FILENAME" =~ $V6_PATTERN ]]; then
    # Valid filename - call LoggerAgent via Apps Script webhook
    PAYLOAD=$(cat <<EOF
{
  "event": "hazel_validation",
  "status": "valid",
  "filename": "$FILENAME",
  "filepath": "$FILEPATH",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

    # Call Apps Script webhook
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"

    exit 0
else
    # Invalid filename
    echo "NAMING ERROR: $FILENAME"
    exit 1
fi
