# WhatsApp Notification Setup

This project can send WhatsApp messages alongside email notifications using the centralized notifier in `backend/utils/emailService.js`.

## What is supported

- Application status updates (shortlisted/rejected)
- Job posted / job application notifications
- OTP and password reset notifications
- Any custom notification template (best-effort text fallback)

## Provider

Current provider: CallMeBot (`WHATSAPP_PROVIDER=callmebot`)

## Environment Variables

Add these in your backend environment:

- `WHATSAPP_ENABLED=true`
- `WHATSAPP_PROVIDER=callmebot`
- `CALLMEBOT_API_KEY=your_callmebot_api_key`
- `WHATSAPP_DEFAULT_TO=9198XXXXXXXX,9188XXXXXXXX` (optional fallback list)

Notes:

- Set `WHATSAPP_ENABLED=false` (or omit it) to disable WhatsApp globally.
- `WHATSAPP_DEFAULT_TO` is only used when no recipient phone is passed with the template data.

## Recipient Phone Sources

The notifier resolves phone numbers in this order:

1. `whatsappTo` in send payload (single value or array)
2. `applicantPhone`
3. `phone`
4. `companyPhone`
5. `WHATSAPP_DEFAULT_TO` env fallback

Numbers are normalized before sending. Invalid values are skipped.

## Application Flow Notes

- Applicant phone is persisted in `Application.applicantPhone` when `phone` is provided in application submit payload.
- Shortlist/reject actions include `applicantPhone` in the notification payload so WhatsApp can be sent together with email.

## Example (service-level)

```js
await sendEmail('candidate@example.com', 'applicationStatusUpdate', {
  jobTitle: 'Frontend Developer',
  companyName: 'Acme',
  status: 'shortlisted',
  message: 'You have been shortlisted.',
  applicantPhone: '9198XXXXXXXX'
});
```

This still sends email first; WhatsApp is attempted as a non-blocking secondary channel.
