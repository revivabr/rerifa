# Architecture Decisions

- Public campaign availability and images must be served through validated server endpoints, never by direct anonymous table or storage access, so internal identifiers remain protected while the storefront stays public.