
# ⚙️ ServeTogether Backend REST API

This is the backend REST API engine for **ServeTogether**, built with Express.js and MongoDB. It handles authentication, JWT token verification, event data management, and user participation records.

🔗 **Live Client App:** [https://serve-together-client.vercel.app](https://serve-together-client.vercel.app)

---

## 🛠️ Key API Capabilities & Features

- 🔐 **JWT Protected Routes:** Custom middleware verifying JWT bearer tokens for secure event management endpoints.
- 📊 **Dynamic Event Querying:** Optimized MongoDB aggregation and queries using `.sort()` and `.limit(6)` for real-time upcoming event retrieval.
- 🛡️ **Ownership Authorization:** Restrictive update and delete operations allowing only event creators to modify or remove their hosted drives.
- 📝 **Joined Event Aggregations:** Stores user participation data dynamically and outputs chronologically sorted user-joined events.

---

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Native MongoDB Driver
- **Security & Tokens:** JSON Web Tokens (JWT) & Cors
- **Deployment:** Vercel

---
