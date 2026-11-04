---
name: Private enquiry delivery
description: Email destination and submission gate for the FSD Private Enquiries form
---

Private Enquiries should deliver to an email inbox. Do not transmit or persist enquiry details until an email provider, recipient inbox, and approved privacy and retention wording are configured.

**Why:** The user selected email as the destination and chose to continue without connecting an email integration. The form must not imply a successful submission when no delivery path exists.

**How to apply:** Keep the send action disabled and details in page memory only. Before enabling it, add server-side validation and spam controls, configure the approved recipient through the proper environment flow, and verify delivery and failure responses.
