# Architecture Decisions

- Public campaign availability and images must be served through validated server endpoints, never by direct anonymous table or storage access, so internal identifiers remain protected while the storefront stays public.
- PIX timing, terminal payment states, purchase limits, and refresh intervals must come from `src/lib/pix-policy.ts`; the production build must run the critical regression suite first.
- Administrative campaign order reports must read all API pages without silently dropping older purchases; otherwise valid winners and their contact details can disappear from the report.
- Winner PDFs must resolve a unique paid order matching the campaign, drawn number and winner before rendering; personal purchase details stay admin-only, while draw videos are served through campaign-validated endpoints with range support.
- Global server-function bearer middleware must use the same project client as admin sign-in; do not replace it with the generated attacher, whose separate session storage leaves admin requests unauthenticated.