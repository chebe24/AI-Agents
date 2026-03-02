# Hazel Rules Reference Guide - V6

## Base Path
```
~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/
```

## Folder Structure & SubjectCodes

| Folder Path | SubjectCode | Purpose |
|------------|-------------|---------|
| `00_Inbox` | N/A | Landing zone for all incoming files |
| `32_Communications` | `Comm` | Communications files |
| `33_Math` | `MATH` | Mathematics files |
| `34_Sciences` | `Sci` | Science files |
| `35_SocialStudies` | `SS` | Social Studies files |
| `36_French` | `Fren` | French language files |
| `99_Archive` | N/A | Deprecated/legacy files |

## V6 Filename Pattern

```
##-####-##-##_SubjectCode_FileType_Description.extension
```

**Pattern Components:**
- `##-####-##-##` - Date format (DD-YYYY-MM-DD)
- `SubjectCode` - Subject identifier (Comm, MATH, Sci, SS, Fren)
- `FileType` - Type of file/document
- `Description` - Brief descriptor
- `extension` - File extension (2-4 characters)

**Regex Pattern:**
```regex
^\d{2}-\d{4}-\d{2}-\d{2}_[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$
```

**Example:**
```
15-2026-03-01_MATH_Assignment_Quadratics.pdf
```

## Hazel Rules

### Rule 1: Inbox Router (V6 Pattern Recognition)
**Folder:** `~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox`

**Conditions:**
- Name matches V6 pattern
- Extension is pdf, doc, docx, txt, jpg, png, etc.

**Actions:**
- Parse `SubjectCode` from filename
- Route to corresponding subject folder:
  - `Comm` → `32_Communications`
  - `MATH` → `33_Math`
  - `Sci` → `34_Sciences`
  - `SS` → `35_SocialStudies`
  - `Fren` → `36_French`

### Rule 2: Downloads to Inbox
**Folder:** `~/Downloads`

**Conditions:**
- File added to Downloads folder
- Not a system file (exclude .DS_Store, .tmp, etc.)

**Actions:**
- Move file to `~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox`
- Triggers Rule 1 for processing

### Rule 3: Legacy/Invalid Pattern Handler
**Folder:** `~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox`

**Conditions:**
- Name does NOT match V6 pattern
- File has been in folder > 24 hours
- OR: File matches legacy pattern

**Actions:**
- Move to `~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/99_Archive`
- Add Finder tag: "deprecated"
- Set Finder comment: "Legacy filename format - archived [DATE]"

### Rule 4: Naming Error Logger
**Folder:** `~/Library/CloudStorage/GoogleDrive-chebert4@ebrschools.org/My Drive/00_Inbox`

**Conditions:**
- Name does NOT match V6 pattern
- File has been processed by Rule 3

**Actions:**
- Run embedded script:
  ```bash
  /Users/caryhebert/scripts/hazel-trigger.sh "$1" "$2"
  ```
- Script logs naming error to ChatLogs via LoggerAgent
- Receives filename as `$1` and filepath as `$2`
- Exit code 1 triggers Hazel notification

## Configuration Notes

### Environment Setup
The `hazel-trigger.sh` script requires the `DEPLOYMENT_ID` environment variable to be set for Apps Script webhook authentication.

Add to `~/.zshrc` or `~/.bash_profile`:
```bash
export DEPLOYMENT_ID="your_apps_script_deployment_id_here"
```

### Rule Execution Order
1. Rule 2: Downloads → Inbox (first capture)
2. Rule 1: V6 Pattern Router (immediate routing)
3. Rule 3: Legacy/Invalid Handler (delayed cleanup)
4. Rule 4: Error Logger (post-archival logging)

### SubjectCode Validation
Only recognized SubjectCodes will be routed:
- `Comm`, `MATH`, `Sci`, `SS`, `Fren`

Files with invalid SubjectCodes (e.g., `ENG`, `HIST`) will:
- Remain in `00_Inbox`
- Trigger Rule 3 after 24 hours
- Be archived to `99_Archive`
- Be logged as naming errors

## Maintenance

### Adding New Subjects
1. Create folder: `##_SubjectName`
2. Define SubjectCode in folder structure table
3. Update Rule 1 routing logic
4. Update SubjectCode validation list

### Testing Validation
Use terminal to test V6 pattern matching:
```bash
export DEPLOYMENT_ID="test_id"
/Users/caryhebert/scripts/hazel-trigger.sh "15-2026-03-01_MATH_Quiz_Algebra.pdf" "/path/to/file"
```

Expected output for valid: HTTP 200 (silent)
Expected output for invalid: `NAMING ERROR: [filename]`
