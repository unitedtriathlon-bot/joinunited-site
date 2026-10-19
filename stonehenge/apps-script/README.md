# Google Apps Script delivery (Stonehenge 1)

1. Open https://script.google.com/ with the UNITED Workspace administrator.
2. Create project "UNITED Stonehenge Leads"; paste contents of `Code.gs`.
3. Deploy > New deployment > Web app > Execute as **Me** > Who has access: **Anyone**. Approve MailApp authorization. Copy the URL ending in `/exec`.
4. Set the URL in `stonehenge/form-config.js` as `endpoint`. Do not turn on the form until a live test confirms delivery to both mailboxes.
5. IMPORTANT: Google Apps Script does not provide normal CORS headers. Cross-origin fetch POST can be sent with `mode:'no-cors'`, but the browser cannot read success. For reliable confirmation, use the separate JSONP status endpoint: POST with unique `request_id`, then poll GET `?id=...&callback=...` using script injection until `ok:true`. Do not put personal details in GET URLs. If status cannot be confirmed, show an error and retain form fields.
6. Confirm both recipients received the test email, and test with a second lead before deploying the kiosk.

Security: publicly accessible endpoint should be protected from abuse (rate limiting or CAPTCHA on public deployments); no client-side secret protects it. Do not include passwords or API keys in GitHub. Apps Script MailApp sending quotas apply.
