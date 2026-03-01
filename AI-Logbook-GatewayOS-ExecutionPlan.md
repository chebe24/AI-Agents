# AI Logbook — Gateway-OS Execution Plan
**Project:** AI-Logbook (Migration Spoke)
**Repo:** Proj_AI-Agents -> chebe24/AI-Agents
**Account:** Work - chebert4@ebrschools.org
**Date:** 2026-03-01
**Goal:** Establish the Command Hub connection, deploy LoggerAgent, and enforce V6 naming standards.

---

## PRE-FLIGHT CHECK
Confirm local environment is aligned before touching anything:

    cd ~/Documents/02_Projects/Proj_AI-Agents && ls -a

You must see:
- .git folder - confirms this is a live GitHub repo
- .gitignore - confirms sensitive data is masked
- pattern-registry.yaml - confirms V6 naming source of truth is present

Stop if any of these are missing. Do not proceed until resolved.

---

## NAMING CONVENTION REFERENCE
All files, commits, and log entries must follow V6:
##-####-##-##_SubjectCode_FileType_Description.extension

Source of truth: pattern-registry.yaml in Proj_AI-Agents.
Do NOT redefine patterns inline - always reference the registry.

---

## PHASE 1 - Infrastructure and YAML Logic
Goal: Create the Spoke manifest as the source of truth for Gateway-OS.
Why: The YAML bridges local Hazel/Transnomio rules with cloud scripts.

Step 1.1 - Verify pattern-registry.yaml is current
    cat ~/Documents/02_Projects/Proj_AI-Agents/pattern-registry.yaml
Confirm it contains all subject patterns: MATH, Sci, SS, Fren, Comm.

Step 1.2 - Create gateway-spoke.yaml
Open Claude Code: claude
Paste this prompt:
Task: Create gateway-spoke.yaml in ~/Documents/02_Projects/Proj_AI-Agents/
Content must include:
- agent_role: Lifecycle and Migration Spoke
- parent_hub: AI_Agents_Command_Hub (chebert4@ebrschools.org)
- repository: AI-Agents
- naming_convention: ##-####-##-##_SubjectCode_FileType_Description.extension
- pattern_registry: pattern-registry.yaml
- subject_codes: [MATH, Sci, SS, Fren, Comm]
- automation_hooks:
    hazel_trigger: Detect V6 pattern mismatch in data/raw
    transnomio_preset: V6-Standard-Rename
- storage_policy:
    work: chebert4@ebrschools.org Google Drive
    code: GitHub chebe24/AI-Agents
Do not use personal Gmail. Save and confirm.

---

## PHASE 2 - Command Hub Sheet Setup
Goal: Add ChatLogs tab to existing AI_Agents_Command_Hub sheet.
Why: Sheet already exists with live data. Do not create a duplicate.
Account: chebert4@ebrschools.org only.

Step 2.1 - Locate Command Hub sheet ID from URL:
https://docs.google.com/spreadsheets/d/YOUR_ID/edit
Save this ID for Phase 3.

Step 2.2 - Add ChatLogs tab via Claude Code
Prompt: Task: Add a new tab called ChatLogs to the existing Command Hub sheet
in chebert4@ebrschools.org.
Headers (bold, frozen): Timestamp | Date | AI Platform | Project/Context |
Conversation Title | Summary | Chat URL | Tags | Status
Data validation on column I: Complete, Follow-up, Archived, In Progress
One sample test row to verify.
Do NOT create a new sheet. Do NOT touch existing tabs.

Step 2.3 - Add ProdLog tab to Agents-Production-Log
Prompt: Task: Add a tab called ProdLog to Agents-Production-Log sheet.
Headers (bold, frozen): Timestamp | Script | Event Type | Status | Details

---

## PHASE 3 - Secure Property Mapping
Goal: Store all sensitive IDs as Script Properties. Never hardcode.

Step 3.1 - Set Script Properties via Claude Code
Prompt: Task: Set Script Properties in dev Apps Script project.
Dev Script ID: 1o_3FUWvq...W7IBOBW
- SPREADSHEET_ID = [your Command Hub sheet ID]
- PROD_LOG_ID = [your Agents-Production-Log sheet ID]
Read them back and confirm both match. Dev only.

---

## PHASE 4 - LoggerAgent Deployment
Goal: Connect LoggerAgent.gs to both sheets with V6 validation.

Step 4.1 - Update LoggerAgent.gs
Prompt: Task: Update LoggerAgent.gs in dev Apps Script project.
Add two functions:
1. logEntry(payload)
   - Accepts JSON: timestamp, date, platform, project, title, summary, url, tags, status
   - Validates filename against V6 pattern
   - If valid: append to ChatLogs tab
   - If invalid: status = Naming Error, log to ProdLog
   - Always write execution result to ProdLog
2. getRecentLogs(n)
   - Returns n most recent rows from ChatLogs as plain text
   - Format: [Date] [Platform] | [Project]: [Title] - Tags: [Tags]
   - Default n=5
Constraints: read IDs from Script Properties only, never hardcode,
never delete existing functions, max 50 lines each, friendly errors.

Step 4.2 - Verify test entries appear in both sheets.

---

## PHASE 5 - Local Automation Link (Hazel + Transnomio)
Goal: Sync Mac filesystem with Command Hub automatically.

Step 5.1 - Create hazel-trigger.sh
    mkdir -p ~/Documents/02_Projects/Proj_AI-Agents/scripts
Prompt: Task: Create scripts/hazel-trigger.sh
- Accept =filename, =filepath
- Validate against V6 pattern
- If valid: call LoggerAgent API with JSON payload
- If invalid: print NAMING ERROR and exit code 1
- Read DEPLOYMENT_ID from environment variable only
- chmod +x scripts/hazel-trigger.sh

Step 5.2 - Hazel rule (manual):
Watch folder: data/raw
Condition: filename does not match V6 pattern
Action: run hazel-trigger.sh with filename and filepath

Step 5.3 - Transnomio uses pattern-registry.yaml. No new regex needed.

---

## PHASE 6 - GitHub Sync and Verification
Goal: Commit all changes and verify end-to-end pipeline.

Step 6.1 - Verify .gitignore includes:
data/
03_History/
*.env
.clasprc.json

Step 6.2 - Commit:
    cd ~/Documents/02_Projects/Proj_AI-Agents
    git add .
    git commit -m 01-2026-03-01_AILog_GAS_GatewayOSIntegration
    git push origin main

Step 6.3 - End-to-end test prompt:
Task: Run end-to-end test of AI Logbook pipeline in prod.
1. Send valid V6 filename payload to logEntry()
2. Send invalid filename payload to test error handling
3. Confirm valid entry in ChatLogs tab
4. Confirm invalid entry shows Naming Error
5. Confirm both in ProdLog tab
6. Confirm getRecentLogs(5) returns correct output
Report pass or fail for each step.

---

## PHASE COMPLETION CHECKLIST
[ ] Pre-flight: .git, .gitignore, pattern-registry.yaml present
[ ] Phase 1: gateway-spoke.yaml created
[ ] Phase 2: ChatLogs tab added to Command Hub
[ ] Phase 2: ProdLog tab added to Agents-Production-Log
[ ] Phase 3: Script Properties set in dev
[ ] Phase 4: logEntry() deployed and tested
[ ] Phase 4: getRecentLogs() deployed and tested
[ ] Phase 5: hazel-trigger.sh created and executable
[ ] Phase 5: Hazel rule configured
[ ] Phase 6: .gitignore verified
[ ] Phase 6: All changes committed and pushed
[ ] Phase 6: End-to-end test passed

---

## ACCOUNT AND STORAGE REFERENCE
Command Hub Sheet      | Google Drive | chebert4@ebrschools.org
Agents-Production-Log  | Google Drive | chebert4@ebrschools.org
Scripts and YAML       | GitHub       | chebe24/AI-Agents
Local Repo             | iMac         | ~/Documents/02_Projects/Proj_AI-Agents
Personal curriculum    | Google Drive | cary.hebert@gmail.com
