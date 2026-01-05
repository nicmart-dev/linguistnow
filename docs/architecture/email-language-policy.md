# Email Language Policy

## Overview

All booking confirmation and reminder emails sent from LinguistNow are **always in English**, regardless of:

- The Project Manager's UI language preference
- The linguist's native language or translation capabilities
- The project's source/target languages

## Rationale

Since emails are sent **from the PM's email account** (via `mailto:` links), the email language implicitly signals what language the PM speaks. Using English ensures:

### 1. Prevents Communication Breakdown

If a linguist receives an email in Arabic, they will naturally reply in Arabic - creating a problem if the PM doesn't speak Arabic. By standardizing on English:

- Linguists know to reply in English
- PMs can read and respond to all emails
- No language mismatches occur in email threads

### 2. Industry Standard

In the **LSP (Language Service Provider)** world, English is the lingua franca for business operations:

- Booking requests
- Reminders and notifications
- Invoices and payment communications
- Project instructions and briefs
- Professional correspondence between PMs and linguists

Even linguists working on non-English language pairs (e.g., Japanese→Korean) typically communicate with their PM in English.

### 3. Universal Understanding

All professional linguists working on international projects understand English as the business communication language. This is an industry-wide expectation.

## Current Implementation

The codebase correctly enforces this policy in two locations:

### Booking Emails (`BookingModal.tsx`)

```38:40:client/src/components/BookingModal.tsx
    const { t } = useTranslation()
    // Use English for email content regardless of PM's UI language
    const tEmail = i18next.getFixedT('en')
```

Booking confirmation emails use `i18next.getFixedT('en')` to force English, even when the PM's UI is in another language.

### Setup Reminder Emails (`Dashboard.tsx`)

```18:20:client/src/pages/Dashboard.tsx
    const { t } = useTranslation()
    // Use English for email content regardless of PM's UI language
    const tEmail = i18next.getFixedT('en')
```

Setup reminder emails (both individual and bulk) also use `i18next.getFixedT('en')` to ensure English-only content.

## Why Translations Exist

You may notice that email content translations exist in all locale files (`client/src/i18n/locales/*.json`):

- `dashboard.booking.emailSubject`
- `dashboard.booking.emailBody`
- `dashboard.booking.setupReminderSubjectBulk`
- `dashboard.booking.setupReminderBodyBulk`

These translations exist for **completeness** and **future flexibility**, but they are **not currently used** for actual email content. The code explicitly uses `getFixedT('en')` to bypass the PM's UI language preference.

## Email Types Covered

This policy applies to all emails sent from the system:

1. **Booking Confirmation Emails** - Sent when a PM books a linguist for a project
2. **Setup Reminder Emails** - Sent to linguists who haven't completed their profile setup
   - Individual reminders
   - Bulk reminders (sent to multiple linguists)

## Future Considerations

If the system evolves to support:

- Server-side email sending (instead of `mailto:` links)
- PM language preferences stored in the database
- Explicit PM-linguist language pair matching

The policy may be reviewed, but **English should remain the default** unless both parties explicitly share another language preference.

## Related Documentation

- [Dashboard Design](./dashboard-design.md) - Booking workflow and email generation
- [Internationalization](../development/internationalization-using-i18next.md) - i18n implementation details
