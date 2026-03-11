#!/bin/bash
# ============================================================
# hazel_ocr_bridge.sh
# Version: 4.0 — Dual Destination Edition
# Updated: 2026-03-01
# Trigger: Hazel drops a PDF into 00_Inbox/ScannedInbox
# Math files: copied to BOTH My Drive + FLAIM Shared Drive
# All other folders: single destination
# ============================================================

# --- CONFIGURATION ---
WEBAPP_URL="https://script.google.com/macros/s/AKfycbw1OZlm4p-aXVd5eOrgwhVcL4WDtXwMGwVgOhWTeBXyoB4iRyf3SZ-SrdDN6-DCZ46VPA/exec"
OCR_LANGS="eng+chi_sim"

# --- GOOGLE DRIVE MOUNT ROOTS ---
DRIVE_WORK="$HOME/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive"
DRIVE_SHARED="$HOME/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/Shared drives/2025-26 FLAIM First Grade"
DRIVE_PERSONAL="$HOME/Library/CloudStorage/GoogleDrive-cary.hebert@gmail.com/My Drive"

# --- FOLDER ROUTING MAP ---
FOLDER_MATH_PRIVATE="$DRIVE_WORK/33_Math"
FOLDER_MATH_SHARED="$DRIVE_SHARED/3-Maths"
FOLDER_ADMIN="$DRIVE_WORK/30_Administrative"
FOLDER_MANDARIN="$DRIVE_PERSONAL/41_Mandarin"
FOLDER_QUARANTINE="/Users/caryhebert/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox/Quarantine"

# --- INPUT ---
FILE_PATH="$1"
FILENAME=$(basename "$FILE_PATH")
FILE_DIR=$(dirname "$FILE_PATH")
OCR_FILENAME="OCR_$FILENAME"
OCR_FILE_PATH="$FILE_DIR/$OCR_FILENAME"

echo "▶ Starting OCR for: $FILENAME"

# --- STEP 1: RUN OCR VIA DOCKER ---
docker run --rm \
  -v "$FILE_DIR:/home/docker" \
  jbarlow83/ocrmypdf \
  -l "$OCR_LANGS" \
  --rotate-pages \
  --deskew --skip-text \
  "/home/docker/$FILENAME" "/home/docker/$OCR_FILENAME"

OCR_EXIT=$?

# --- STEP 2: SMART ROUTING ---
# V6 pattern: ##-####-##-##_SubjectCode_FileType_Description.ext
SUBJECT_CODE=$(echo "$FILENAME" | cut -d'_' -f2)

if [ $OCR_EXIT -eq 0 ]; then
  echo "✅ OCR succeeded. SubjectCode: $SUBJECT_CODE"

  case "$SUBJECT_CODE" in

    Math|math|MATH)
      # Extract module number e.g. _M1_ _M2_ _M5_
      MODULE=$(echo "$FILENAME" | grep -oE '_M[0-9]+_' | tr -d '_')

      if [ -n "$MODULE" ]; then
        # Build module number digit only (e.g. M5 → 5)
        MOD_NUM="${MODULE#M}"

        # Private My Drive destination
        DEST_PRIVATE="$FOLDER_MATH_PRIVATE/$MODULE/CurriculumGuides"

        # Shared Drive destination (uses "Module #" and "M#CurriculumGuides")
        DEST_SHARED="$FOLDER_MATH_SHARED/Module $MOD_NUM/${MODULE}CurriculumGuides"

        PROJECT_TAG="Math-$MODULE-CurriculumGuides"

        echo "📐 Math module detected: $MODULE"

        # Copy to private My Drive
        mkdir -p "$DEST_PRIVATE"
        cp "$OCR_FILE_PATH" "$DEST_PRIVATE/$OCR_FILENAME"
        echo "📁 Private copy → $DEST_PRIVATE/"

        # Move original to Shared Drive
        mkdir -p "$DEST_SHARED"
        mv "$OCR_FILE_PATH" "$DEST_SHARED/$OCR_FILENAME"
        echo "👥 Shared copy → $DEST_SHARED/"

      else
        # Math file but no module number — quarantine
        DEST_FOLDER="$FOLDER_QUARANTINE"
        PROJECT_TAG="Math-NoModule-Quarantine"
        mkdir -p "$DEST_FOLDER"
        mv "$OCR_FILE_PATH" "$DEST_FOLDER/$OCR_FILENAME"
        echo "⚠️  Math file has no module number — sent to Quarantine."
      fi
      ;;

    Mand|mand|MAND|Mandarin|mandarin)
      DEST_FOLDER="$FOLDER_MANDARIN"
      PROJECT_TAG="Mandarin-Study"
      mkdir -p "$DEST_FOLDER"
      mv "$OCR_FILE_PATH" "$DEST_FOLDER/$OCR_FILENAME"
      echo "📁 Moved to: $DEST_FOLDER/"
      ;;

    Admin|admin|ADMIN)
      DEST_FOLDER="$FOLDER_ADMIN"
      PROJECT_TAG="Administration"
      mkdir -p "$DEST_FOLDER"
      mv "$OCR_FILE_PATH" "$DEST_FOLDER/$OCR_FILENAME"
      echo "📁 Moved to: $DEST_FOLDER/"
      ;;

    *)
      DEST_FOLDER="$FOLDER_QUARANTINE"
      PROJECT_TAG="Unmatched-Quarantine"
      mkdir -p "$DEST_FOLDER"
      mv "$OCR_FILE_PATH" "$DEST_FOLDER/$OCR_FILENAME"
      echo "⚠️  No match for '$SUBJECT_CODE' — sent to Quarantine."
      ;;

  esac

  # Log success to Google Sheet
  curl -s -L "$WEBAPP_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"filename\": \"$OCR_FILENAME\",
      \"project\": \"$PROJECT_TAG\",
      \"summary\": \"OCR complete. Routed to $PROJECT_TAG.\",
      \"platform\": \"Docker-OCR\"
    }"

else
  # OCR failed — quarantine original file
  echo "❌ OCR failed for: $FILENAME — sending to Quarantine."

  mkdir -p "$FOLDER_QUARANTINE"
  mv "$FILE_PATH" "$FOLDER_QUARANTINE/$FILENAME"

  curl -s -L "$WEBAPP_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"filename\": \"$FILENAME\",
      \"project\": \"OCR-Failed\",
      \"summary\": \"OCR failed. Original moved to Quarantine.\",
      \"platform\": \"Docker-OCR\"
    }"

fi

echo "✔ hazel_ocr_bridge.sh complete."
