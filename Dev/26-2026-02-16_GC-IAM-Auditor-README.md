# GC-IAM-Auditor README

## Overview
Fork Gatehouse Apps Script for IAM audits. Deploy to Cary.Hebert@gmail.com dev account. Monthly triggers, log to AI Hub Sheet. Test in gc-iam-staging-202602.

## Prereqs
- GCP staging project: gc-iam-staging-202602 (IAM/Recommender APIs enabled).
- SA: gc-iam-auditor@... (roles: iam.serviceAccountKeyAdmin, recommender.viewer).
- AI Hub Sheet ID.

## Workflow
1. Include OAuth2.gs.
2. Script template: getIAMService(), auditIAMKeys() (UrlFetchApp REST), createMonthlyTrigger().
3. TestSetup(), run audit, deploy trigger.
4. Log to Sheet.

## Code Template
```javascript
function auditIAMKeys() {
  // UrlFetchApp to https://iam.googleapis.com/v1/... 
  // Filter inactive >30d, log to Sheet
}
```

Validation: Auth OK, logs OK.