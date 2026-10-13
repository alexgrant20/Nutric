# GitHub Actions → GitHub Release → cPanel (pull)

Workflow `.github/workflows/cpanel.yml` checks types, runs unit tests and builds
the Node.js production app. Every pull request produces a downloadable
`nutric-production` artifact. Pushes to `main` also publish the package as a
GitHub Release (`build-<run number>`, the five newest are kept). The server
pulls it: a cPanel cron job runs `scripts/cpanel-pull.sh`, which downloads the
newest release, replaces `build/` and `drizzle/`, runs `npm ci --omit=dev` and
restarts the app. The server only makes outbound HTTPS requests, so no SSH
access, secrets or IP whitelist are needed. A manual build: Actions → Production
build and release → Run workflow, select `main` and enable `deploy`.

## GitHub configuration

Under repository Settings → Secrets and variables → Actions → Variables, add:

- `SITE_ORIGIN`: production origin, such as `https://www.example.com`, without a trailing slash. It is baked in at build time.

The repository must be public, because the server downloads releases without a
token. For a private repository, add a read-only token to the `curl` calls in
`scripts/cpanel-pull.sh` and use the releases API.

If your default branch has another name, update both `branches: [main]` and
the release condition in the workflow. Protect `main` with the build check.

## cPanel setup (once)

1. Enable Node.js **24** in cPanel. Create a production Node.js application with
   an application root such as `/home/USER/nutric/app` outside `public_html`, the
   desired domain and startup file `app.cjs`. Hosting providers expose this as
   Setup Node.js App or Application Manager. Confirm your host permits the custom
   startup file and has the required SQLite native dependencies/build tools.
2. Create `/home/USER/nutric/shared/uploads`, writable by the application user.
   Set application environment variables:

   ```dotenv
   NODE_ENV=production
   DATABASE_PATH=/home/USER/nutric/shared/nutric.db
   UPLOAD_DIR=/home/USER/nutric/shared/uploads
   BODY_SIZE_LIMIT=20M
   NEWSLETTER_ENABLED=false
   ```

   cPanel supplies the port. `SITE_ORIGIN` is set at build time in GitHub; changing
   the domain requires rebuilding. Alternatively `.env` in the application root
   is loaded by `app.cjs`; it is never uploaded or removed by this workflow.
3. Initialize content once: seed locally, stop the local app, then transfer
   `data/nutric.db` and the complete contents of `data/uploads/` into the matching
   shared paths. Stopping the app allows SQLite to close/checkpoint its WAL;
   otherwise use SQLite's backup API instead of copying an active database.
   This also transfers the admin account. Without this step a new database has
   no content or admin account. Do not reseed on deployment.
4. For automatic translation, supply `LIBRETRANSLATE_URL` pointing to a reachable
   private LibreTranslate service, and `LIBRETRANSLATE_API_KEY` if needed.
   This workflow does not deploy Docker or language models. cPanel localhost
   cannot reach the translator running on your own computer.

## Cron job (once)

1. Copy `scripts/cpanel-pull.sh` to `/home/USER/nutric-pull.sh` (File Manager or
   Terminal). Edit `DEPLOY_DIR` to the application root. `NODE_ACTIVATE` may stay
   empty; the script then finds `~/nodevenv/<app root>/<version>/bin/activate`.
2. In cPanel → Cron Jobs add (every 5 minutes):

   ```sh
   */5 * * * * /bin/bash /home/USER/nutric-pull.sh >> /home/USER/nutric-deploy.log 2>&1
   ```
3. Run the script once by hand to deploy the first release and read the log.

## What each deployment does

The release is unpacked into `.incoming/`, then `build/` and `drizzle/` are
replaced (stale files disappear) and `package.json`, `package-lock.json` and
`app.cjs` are copied. Then `npm ci --omit=dev` runs and `tmp/restart.txt` is
touched, which makes Passenger restart the app. The deployed release tag is
stored in `.release-tag`; a failed run leaves it unchanged and is retried by the
next cron run. Database, uploads, `.env`, `node_modules` and `tmp/` are never
overwritten or removed. Keep installation scripts enabled: native dependencies
must match the server's Linux platform. Do not copy Windows `node_modules`.

A deployment appears on the server 0–5 minutes after the release is published.
Files are updated in place and cannot switch atomically, so expect a brief
interruption. Before deployments that change migrations, make a consistent
database backup. Migrations run automatically when the app starts from its
application root.

Verify `/en`, `/admin/login`, admin saves and image uploads after restarting.
If login/save reports an origin mismatch, check that `SITE_ORIGIN` matches the
public HTTPS domain exactly and rebuild. If the site returns 503, read `/home/USER/nutric-deploy.log` and cPanel's
application log.

## Package contents and persistent files

The package contains only `build/`, `drizzle/`, `package.json`,
`package-lock.json` and `app.cjs`. The packager refuses to overwrite an existing
`.deploy` directory; use a clean checkout when preparing another release.
Database, uploads, `.env`, `node_modules` and Passenger's `tmp/` are not part
of the package and are never touched by the deployment.

Keep an older GitHub release for code rollback (download it and unpack it by hand). A rollback does not undo a
database migration; restore a compatible database backup when necessary.

References: [adapter-node](https://svelte.dev/docs/kit/adapter-node),
[cPanel Node.js](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/),
[cPanel cron jobs](https://docs.cpanel.net/cpanel/advanced/cron-jobs/).
