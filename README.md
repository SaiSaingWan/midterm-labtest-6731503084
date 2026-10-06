# midterm-labtest-6731503084
LabTest 6 Oct 2026
ID:6731503084
Name:Sai Saing Wan

# Campus Equipment Booking API

A backend API for reserving shared campus resources (projectors, cameras, meeting rooms) with double-booking prevention, parameterized queries, and Cloudflare Workers + D1 deployment.

- **Source Code Repository:** [GitHub Repository](https://github.com/SaiSaingWan/midterm-labtest-6731503084)
- **Deployed Base API URL:** `https://campus-booking-api.studenttickets.workers.dev`

---

## Technical Stack

- **Framework:** [Hono](https://hono.dev/)
- **Runtime & Deployment:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript

---

## Setup & Local Development Instructions

### Prerequisites

- Node.js (v18+)
- npm / npx
- Cloudflare Wrangler CLI

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone [https://github.com/SaiSaingWan/midterm-labtest-6731503084.git](https://github.com/SaiSaingWan/midterm-labtest-6731503084.git)
cd midterm-labtest-6731503084
npm install

2. Run Locally (Development Server)
To run the local server using Wrangler:

Bash
npx wrangler dev
The local API will be accessible at: http://localhost:8787/api

Database Migration & Deployment
1. Deploying to Cloudflare Workers
To authenticate with Cloudflare and deploy the worker:

Bash
npx wrangler login
npx wrangler deploy
2. Setting Up Cloudflare D1 Database
Create a new D1 Database:

Bash
npx wrangler d1 create booking-db
Link the generated database_id inside wrangler.toml:

Ini, TOML
name = "campus-booking-api"
main = "src/index.ts"
compatibility_date = "2024-03-20"

[[d1_databases]]
binding = "DB"
database_name = "booking-db"
database_id = "af880bdb-a33b-42b2-99e8-286a3283ca18"
Execute database schema migration:

Bash
npx wrangler d1 execute booking-db --remote --file=./schema.sql