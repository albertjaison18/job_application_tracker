# Verification record

Verified on 28 October 2026 using Node.js 25.8.1 and npm 11.11.0.

## Automated checks

- `npm test`: all 14 API/database integration tests passed.
- All 36 combinations of existing/next statuses were checked.
- Concurrent duplicate submissions and company sequence allocation were checked against a real isolated MongoDB process.
- `npm run build`: production frontend bundle built successfully.
- `npm ci` and `npm run build` passed from a clean source copy without existing dependencies or local credentials.
- The committed `.env` contains placeholders. The actual local password file is excluded by `.gitignore`.

## Browser checks

The frontend was exercised through its actual Express API, first with an isolated local MongoDB database and then with a dedicated Atlas Free cluster.

Atlas-backed checks:

- Created four clearly marked demo applications through the frontend.
- Changed an application from Applied to Interview to Offer, with persisted timeline entries.
- Edited expected salary through the pre-filled form and confirmed the saved result.
- Verified that applied dates cannot be edited.
- Verified the overdue badge on an Applied application with a past follow-up date.
- Verified disabled deletion in Interview and Offer.
- Verified 409 for a duplicate active company/role pair, 400 for an invalid transition, and 400 for attempted Offer deletion. These checks left the existing records intact.
- Read the four records independently through Mongoose connected to Atlas.
- Checked mobile width 390px and tablet width 768px; neither had horizontal overflow. Desktop layout was checked at 1440px.
- Browser console reported no frontend errors during the final editing check.

Earlier isolated QA also verified combined backend company/status filtering, future-date validation, final-status behavior and the delete confirmation dialog. Automated tests cover allowed deletion in Applied and all final statuses.

## Remaining assessment conditions

The project has real implementation commits with their actual creation timestamps; commit times have not been backdated. Review the assessment's requirement for commits spread across its exam duration.

Evaluators need a working exam-only Atlas credential in the committed `.env` if they must run a fresh clone without configuration, plus network access for the machine running their server. The current Atlas access list permits only the developer's current IP address, as authorized. Expanding it is a separate access decision.
