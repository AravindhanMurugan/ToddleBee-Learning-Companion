---
name: ToddleBee Expo build port
description: Replit workspace constraint for the mobile static build helper.
---

The Replit mockup-sandbox service uses `localhost:8081`; the mobile build helper must use a separate Metro port consistently for health checks, startup, bundle downloads, manifests, and assets.

**Why:** The workspace build initially hit the mockup proxy on port 8081 instead of Metro, causing Expo to prompt for a different port and fail non-interactively. Moving Metro to 8082 let the full workspace build complete.

**How to apply:** Keep the mobile build port configurable with a default of 8082. Do not reconfigure or stop the mockup workflow just to build ToddleBee.
