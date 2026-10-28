# Connect Trackr to a test MongoDB Atlas cluster

1. Sign in at https://cloud.mongodb.com/ and create a project called **Job Application Tracker**.
2. Create a **Free / M0** cluster called `trackr-test`. Choose an available nearby region.
3. Create a database user called `trackr_exam`, with a password used only for this test project and read/write access to the `job_application_tracker` database. This user is separate from your Atlas account.
4. In **Network Access**, add **your current IP address**. Update it if your IP changes.
5. Open **Connect → Drivers → Node.js** and copy the connection string.
6. Create `backend/.env.local` beside `backend/.env`. Use your test cluster's credentials and hostname:

```env
MONGODB_URI=mongodb+srv://trackr_exam:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/job_application_tracker?retryWrites=true&w=majority
```

Remove all placeholders and angle brackets. URL-encode special characters in the password. The database name belongs after `.net/`, before the query string. Preserve additional connection options from Atlas.

Alternatively, remove the password from the URI and add `MONGODB_PASSWORD="your test password"` on a separate line. The backend encodes this value automatically. For the cluster configured in this chat, `.env.local` already contains the hostname; replace its `PASTE_TEST_PASSWORD_HERE` placeholder and save.

7. Stop the QA preview before starting the Atlas app; both use port 5010. From the project root:

```sh
npm install
npm run dev
```

8. Open http://127.0.0.1:5178 and add an application. Inspect `job_application_tracker.applications` in Atlas **Browse Collections** to verify it was stored. http://127.0.0.1:5010/health should return `databaseConnected: true`.

## Troubleshooting

- Authentication: use the database user's password, not the Atlas account password. Check URL encoding.
- Timeout: check Network Access, changed IP addresses and local network restrictions on MongoDB traffic.
- SRV/DNS: use the exact hostname from Atlas, with no placeholder text.
- If Node reports `querySrv ECONNREFUSED` while the hostname is correct, use Atlas **Connect → Client Library → Legacy URI String** to obtain its standard multi-host `mongodb://` URI. Preserve the `ssl=true`, `replicaSet` and `authSource=admin` options and set the application database in its path. This was required on the development machine; TLS stays enabled.
- Address in use: stop QA or the previous backend before running `npm run dev`.
- Separately hosted frontend cannot save: add its exact origin to `CLIENT_ORIGIN` and configure its `VITE_API_BASE_URL` with the reachable Express URL ending in `/api`.

## Submission configuration

The tracked `.env` contains placeholders. This assessment explicitly requires a runnable committed environment file: use **only a disposable exam-specific Atlas user/database** when configuring it. Never put personal or production credentials in the repository. Evaluators also need an Atlas IP access-list entry for the machine running their server. Verify Atlas before marking that README checklist item complete.

Official references: [Create a free cluster](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/), [Connect with a driver](https://www.mongodb.com/docs/atlas/driver-connection/).
