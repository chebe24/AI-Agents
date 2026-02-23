# Google Cloud Credentials Security Framework

Updated: 2026-02-16

## Secure Credential Lifecycle
- [ ] **Zero-Code Storage**: Use Secret Manager runtime injection. [Docs](https://cloud.google.com/secret-manager/docs)
- [ ] **Disable Dormant Keys**: Audit/delete inactive >30 days via gcloud: `gcloud iam service-accounts keys list --filter="disabled:false" --format="value(name)" | xargs -I {} gcloud iam service-accounts keys delete {}`
- [ ] **Enforce API Restrictions**: Limit APIs/IPs in key config.
- [ ] **Least Privilege**: Run IAM Recommender: Enable API, `gcloud recommender recommendations list --recommender=google.iam.policy.Recommender`
- [ ] **Mandatory Rotation**: Set `iam.serviceAccountKeyExpiryHours` (e.g., 720h/30d) at org/folder/project: IAM & Admin > Org Policy > Edit constraint.
- [ ] **Disable Key Creation**: Enforce `iam.managed.disableServiceAccountKeyCreation` if keys unnecessary.

## Operational Safeguards
1. [ ] Update Essential Contacts in Security Command Center.
2. [ ] Set billing alerts: Budgets & Alerts > Create > Anomaly detection.

**Source**: Google Cloud Security Email (2026-02-16)