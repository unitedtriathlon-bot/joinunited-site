# Stonehenge form operations

The site uses GitHub Pages (main branch, repository root) and FormSubmit AJAX.
Recipients are configured in `form-config.js`: Ivan receives the request and
Julia receives a copy through FormSubmit's `_cc` field.

Submission is currently disabled because domain mail routing and recipient
activation have not been verified. The form explicitly reports that no request
was sent. Do not enable submission just because Workspace users exist.

## Enable delivery

1. Confirm both Workspace users have Gmail licences. Any additional licence
   confirmation or payment must be approved by the owner. Do not enter passwords
   automatically.
2. With the owner's approval, have the domain administrator configure Google
   Workspace MX records in e& Enterprise. As of 2026-10-12, authoritative
   `ns1.etisalatdomains.ae` and public DNS returned no MX records. DNS has not
   been changed by this update.
3. Once incoming mail works, submit a clearly labelled test to the Ivan endpoint
   and confirm the activation email in Ivan's mailbox. FormSubmit requires
   recipient activation. Do not use a real customer's details for activation.
4. Set `enabled: true` in `form-config.js`, deploy, and submit labelled tests
   using each of the three form choices. Confirm the submitted fields arrive in
   **both** inboxes, including Spam checks. Workspace administration access
   alone does not prove receipt in a user's mailbox.

The success screen confirms only that the service accepted the request. It
does not promise that a booking is confirmed or that email reached an inbox.
HTTP errors, service errors, malformed responses, activation responses,
network failures and timeouts keep the form visible and preserve entered data.
No failed request is stored as a silently accepted lead in localStorage.

Official references:
- https://formsubmit.co/ (activation and `_cc`)
- https://formsubmit.co/ajax-documentation
- https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace

## Local verification

Start a local server from the repository root on port 8766, then run
`python tests/stonehenge-form.py` in an environment with Playwright and Chrome.
The script mocks delivery and never sends real email. It covers both tablet
orientations, a phone viewport, every form choice, disabled submission and nine
service outcomes. Screenshots are written outside the repository to
`~/Desktop/united-stonehenge-evidence`.

The resident schedule and prices are unchanged.
