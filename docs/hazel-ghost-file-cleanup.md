# Hazel Rule: Ghost File Cleanup for AI-Agents
**Version 2.0 — Revised with edge case hardening**

## Purpose
Automatically delete `.DS_Store` and macOS metadata files from your AI-Agents
project folders before they can accumulate, get accidentally committed, or
clutter your purge logic.

**Why Hazel and not just .gitignore?**
`.gitignore` stops files from being *committed*. But the files still exist
on your hard drive — silently piling up every time Finder opens a folder.
Hazel deletes them at the source, so they never reach the "should I commit
this?" decision point. Two layers of defense, each doing a different job.

---

## ⚠️ Step 0 — Verify .gitignore First (Do This Before Anything Else)

**Why this matters:** Evidence from your repo shows a `.DS_Store` was
previously committed (the one-time cleanup script uses `git rm --cached` to
evict it — that command only does something if the file was already tracked).
This means gitignore either wasn't present or wasn't catching it. Hazel is
your second line of defense, not your first. If gitignore isn't configured,
Hazel is carrying the whole load alone.

Open Terminal and check both locations:

```bash
# Check root-level .gitignore
cat ~/Documents/02_Projects/AI-Agents/.gitignore

# Check dev subfolder
cat ~/Documents/02_Projects/AI-Agents/dev-project/.gitignore

# Check prod subfolder
cat ~/Documents/02_Projects/AI-Agents/prod-project/.gitignore
```

Each `.gitignore` file should contain at minimum:

```
# macOS ghost files
.DS_Store
**/.DS_Store
._*
.Spotlight-V100
.Trashes
```

If any of these files are missing those lines, add them now before continuing.

**Why prod-project gets extra attention:** Your prod environment connects to
your EBR work account. A `.DS_Store` committed from that folder is minor but
visible to anyone with repo access, including IT administrators. Verify prod
specifically.

---

## Step 1 — One-Time Manual Cleanup (Run Before Hazel Setup)

Before Hazel takes over, evict any `.DS_Store` already sitting in your repo.
Open Terminal and run these commands one at a time:

```bash
cd ~/Documents/02_Projects/AI-Agents

# Tell Git to stop tracking any .DS_Store already committed at root
git rm --cached .DS_Store 2>/dev/null || echo "Not tracked at root, skipping"

# Use find (not glob) for nested files — safer across bash and zsh
git rm --cached $(find . -name ".DS_Store" -not -path "./.git/*") 2>/dev/null || echo "None tracked in subfolders"

# Delete the actual files from disk using find (reliable in all shells)
find . -name ".DS_Store" -not -path "./.git/*" -delete

# Also clean up AppleDouble files while we're here
find . -name "._*" -not -path "./.git/*" -delete

# Commit the eviction
git commit -m "chore: remove .DS_Store and macOS metadata files"

# Push
git push origin main
```

**Why `find` instead of `**/.DS_Store`:** Your Mac runs zsh, so the glob
probably works — but it silently fails in bash. Since clasp scripts and other
tools may run in bash contexts, `find` is the safer, consistent choice across
all environments.

---

## Step 2 — Hazel Rules Setup

### Rule 1 — AI-Agents Root: DS_Store Cleanup

**Hazel → System Settings → Hazel → Click "+" to add a folder**

**Folder to watch:**
```
/Users/caryhebert/Documents/02_Projects/AI-Agents
```

**Rule Name:** `Ghost File Cleanup — DS_Store`

**Conditions (set to "All of the following"):**

| Field | Operator | Value       |
|-------|----------|-------------|
| Name  | is       | `.DS_Store` |
| Kind  | is not   | Folder      |

**Actions:**
- **Move to Trash** *(not Delete — Trash lets you recover if something goes wrong)*

**Options:**
- ✅ **Run rules on folder contents** — makes Hazel look inside subfolders
  (dev-project/, prod-project/, scripts/, etc.)

---

### Rule 2 — AI-Agents Root: AppleDouble Cleanup

**Same folder as Rule 1.**

**Rule Name:** `Ghost File Cleanup — AppleDouble`

**Conditions (set to "Any of the following"):**

| Field | Operator    | Value |
|-------|-------------|-------|
| Name  | begins with | `._`  |

**Actions:**
- **Move to Trash**

**Options:**
- ✅ **Run rules on folder contents**

**Why Rule 2 is trimmed from the original:** `.Spotlight-V100` and `.Trashes`
are volume-level system folders that live at the root of external drives, not
inside project folders on your Mac. Including them in this rule added
confusion without real-world benefit in this context. They have been removed.

---

## Step 3 — Verification

After setting up the rules, open Finder, navigate into your AI-Agents folder,
then immediately close it. macOS will generate a `.DS_Store`. Within a few
seconds, Hazel should delete it. Confirm by checking Trash — the file should
appear there.

---

## ⚠️ Edge Case: clasp Pulls Regenerate Ghost Files

Every time you run `clasp pull`, it touches the project folder, which causes
Finder to regenerate `.DS_Store` almost immediately. Hazel catches it, but
during active dev sessions you may see repeated entries in your Trash. This
is normal and expected — not a problem. Just awareness.

---

## ⚠️ Edge Case: New Mac for Shanghai (Critical — Silent Failure Risk)

Hazel rules are stored in a local preference file on your current Mac. They
**do not migrate automatically** when you set up a new machine.

When you set up your Shanghai MacBook, add this to your setup checklist:

```
□ Export Hazel rules from current Mac:
    Hazel → right-click each rule group → Export Rules
    Save to: ~/Documents/00_Admin/Setup/hazel-rules-export.hazelrules

□ Import on new Mac:
    Hazel → File → Import Rules
```

If you forget this step, gitignore still protects your repo — but ghost files
will accumulate on disk silently until you notice and run the manual cleanup
again.

---

## ⚠️ Edge Case: Mac Off During Travel

When your Mac is shut down or closed for extended periods (travel to Shanghai,
holidays), `.DS_Store` files accumulate any time you open Finder. Hazel has
no chance to run.

Save this as a Terminal snippet — label it **"Run before any push after travel":**

```bash
cd ~/Documents/02_Projects/AI-Agents
find . -name ".DS_Store" -not -path "./.git/*" -delete
find . -name "._*" -not -path "./.git/*" -delete
git status
```

Run this before every `git push` if you've been away from the machine for
more than a few days.

---

## Logical Summary

| Layer      | Tool         | Job                                              | Status |
|------------|--------------|--------------------------------------------------|--------|
| Prevention | `.gitignore` | Stops ghost files from being committed           | ✅ Verify Step 0 |
| Cleanup    | Hazel        | Deletes ghost files from disk automatically      | ✅ Rules above |
| Recovery   | Trash        | Safety net if Hazel deletes something valid      | ✅ Built-in |
| Audit      | `git status` | Final check before any push                      | ✅ Always run |
| Migration  | Hazel export | Preserves rules when switching to Shanghai Mac   | ⚠️ Manual step |
| Travel gap | Terminal snippet | Catches accumulation when Mac was off        | ⚠️ Manual step |
