# External Integration API

This backend exposes lightweight endpoints for third-party or mobile apps to:
- Export jobs by company (company-wise)
- Submit applications into this system

If you set `EXTERNAL_API_KEY` in `.env`, clients must include `x-api-key` with that value in every request.

## Endpoints

1) GET /api/external/jobs
- Query params:
  - `companyEmail` or `email` (recommended)
  - or `company`/`companyName` (fallback)
- Response: `{ companyEmail?, companyName?, count, jobs: [...] }`
- Example:
```
GET /api/external/jobs?companyEmail=acme@company.com
x-api-key: YOUR_KEY
```

2) POST /api/external/applications
- Body: JSON
```
{
  "jobId": "<job mongo id>",
  "applicantName": "Jane Doe",
  "companyEmail": "acme@company.com",   // optional; resolved from job if omitted
  "companyName": "Acme Inc",            // optional; resolved from job/company if omitted
  "resumeUrl": "https://...",           // optional
  "testScore": "92",                    // optional
  "skills": ["React", "Node.js"]       // optional (array or string)
}
```
- Example:
```
POST /api/external/applications
Content-Type: application/json
x-api-key: YOUR_KEY

{"jobId":"64f...","applicantName":"Jane"}
```
- Response: `201 { message, application: { id, jobId, applicantName, companyEmail, ... } }`

## CORS
CORS already permits typical headers. We added `x-api-key` to allowed headers.

## Notes
- Jobs are filtered by `companyEmail` when provided; otherwise by `companyName` case-insensitively.
- Applications link to the job and are appended to `job.applicants`.

Body (application/json):
jobId (required)
applicantName (required)
companyEmail (optional; resolved from job if omitted)
companyName (optional; resolved from job/company if omitted)
resumeUrl (optional)
testScore (optional)
skills (optional array or string)

GET /api/external/applications
Query: jobId (required), companyEmail/email (optional), page, limit
Returns a paginated list of applications.