# OliveConnect

OliveConnect is a full-stack cooperative platform for managing olive harvests in Sfax, Tunisia. It covers orchard registration, harvest declarations, tour planning, field alerts, resource/logistics management, an interactive Leaflet map and an aggregation-based performance dashboard.

## Architecture

```
Angular 19 (standalone, SPA)
  └── Nginx (static dist/frontend/browser + /api reverse proxy)
        └── Spring Boot 3.3 REST API (JWT + RBAC)
              └── MongoDB 7 (documents, 2dsphere indexes, aggregations)
```

The canonical entity names are identical in the class diagram, Mongo documents, Java entities, TypeScript models, OpenAPI schemas and Angular services: `User`, `Orchard`, `MaturityReading`, `Harvest`, `Alert`, `Tour`, `Resource`, `Press`, `PressReceipt`, `Notification`, `ImportLog`.

## Repository layout

```
backend/    Spring Boot 3.3 / Java 17 / Maven
frontend/   Angular 19 standalone workspace
infra/      Dockerfiles, Nginx config, systemd unit, compose files
docs/       French report, class diagram, OpenAPI, Postman collection, screenshots
scripts/    backup.sh and seed helpers
```

## Running the app

There are two ways to run OliveConnect. **Option A (Docker)** is the quickest if Docker works on your machine. **Option B (local)** runs each part directly and is best for development.

Whichever you choose, the backend fills an empty database with demo data on first start (10 users, 500 orchards around Sfax, harvests, tours, press receipts), so the app is usable immediately.

### Option A — Docker Compose

Requirements: Docker Engine 24+ with the Compose v2 plugin (`docker compose version` must work), 4 GB RAM.

```bash
git clone git@github.com:MeBouha/OliveConnect.git
cd OliveConnect

# 1. Create your .env with a random JWT secret (one-time)
cp .env.example .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env

# 2. Build and start everything
docker compose up --build
```

Then open **http://localhost**.

| Service | URL |
| --- | --- |
| Web app | http://localhost |
| API / Swagger UI | http://localhost:8080/swagger-ui.html |
| Health check | http://localhost:8080/actuator/health |
| Prometheus | http://localhost:9090 |
| MongoDB | `mongodb://localhost:27017/oliveconnect` (localhost only) |

Stop with `Ctrl+C`, or `docker compose down` from another terminal. Add `-v` (`docker compose down -v`) to also delete the database and get fresh demo data on the next start.

Compose refuses to start without `JWT_SECRET`, and the backend refuses secrets shorter than 32 bytes. When using `infra/docker-compose.yml` instead of the root file, put the `.env` file in `infra/`.

### Option B — Local development (no Docker)

**Requirements**

| Tool | Version | Check with |
| --- | --- | --- |
| JDK (not just a JRE) | 17 or newer (21 recommended) | `javac -version` |
| Node.js | 20.19+ or 22.12+ | `node -v` |
| MongoDB | 7.x, listening on `localhost:27017` | see step 1 |

You need three terminals: one each for MongoDB, the backend and the frontend.

**1. Start MongoDB** — pick whichever suits your machine:

```bash
# a) Installed as a system service (Ubuntu/Debian/Fedora package)
sudo systemctl start mongod

# b) With Docker
docker run -d --name oliveconnect-mongo -p 127.0.0.1:27017:27017 -v oliveconnect-mongo:/data/db mongo:7.0

# c) Without root or Docker: official tarball in your home directory
mkdir -p ~/.local/mongodb ~/.local/share/oliveconnect-mongo
curl -fsSL https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel90-7.0.12.tgz | tar xz -C ~/.local/mongodb
~/.local/mongodb/mongodb-linux-x86_64-rhel90-7.0.12/bin/mongod \
  --dbpath ~/.local/share/oliveconnect-mongo --bind_ip 127.0.0.1 --fork \
  --logpath ~/.local/share/oliveconnect-mongo/mongod.log
```

(For option c on Ubuntu, use the `ubuntu2204` tarball from https://www.mongodb.com/try/download/community instead of `rhel90`.)

**2. Start the backend** (terminal 2):

```bash
cd backend
./mvnw spring-boot:run
```

Wait for `Started OliveConnectApplication` (and, on the first run, `Seed completed: ...`). The API is now on http://localhost:8080. `spring-boot:run` activates the `dev` profile, which supplies a local-only JWT secret, so no `.env` is needed here.

**3. Start the frontend** (terminal 3):

```bash
cd frontend
npm ci          # first time only, or after package.json changes
npx ng serve
```

**4. Open http://localhost:4200** and click one of the demo accounts on the login page.

**Stopping:** press `Ctrl+C` in the backend and frontend terminals. Stop MongoDB with `sudo systemctl stop mongod`, `docker stop oliveconnect-mongo`, or (tarball) `~/.local/mongodb/mongodb-linux-x86_64-rhel90-7.0.12/bin/mongod --dbpath ~/.local/share/oliveconnect-mongo --shutdown`.

### Demo accounts

The login page has one-click buttons for each role. The credentials are:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@oliveconnect.tn` | `Admin@123` |
| Farmer | `farmer@oliveconnect.tn` | `Farmer@123` |
| Collection manager | `manager@oliveconnect.tn` | `Manager@123` |
| Team leader | `leader@oliveconnect.tn` | `Leader@123` |
| Logistics manager | `logistics@oliveconnect.tn` | `Logistics@123` |
| Press manager | `press@oliveconnect.tn` | `Press@123` |

Visitors can open the public map at `/map` without signing in. New farmers can self-register at `/register`; other roles are assigned by an administrator.

A typical walkthrough: **farmer** requests a harvest → **collection manager** clicks *Planifier* on it to create a tour → **team leader** starts the tour → **press manager** records the receipt → **team leader** completes the tour → the farmer sees it as *Terminée* with the weighed quantity.

### Resetting the demo data

Seeding only happens when the database is empty. To start over, stop the backend, drop the database, and start the backend again:

```bash
mongosh oliveconnect --eval 'db.dropDatabase()'      # if mongosh is installed
docker compose down -v                               # Docker Compose setup
rm -rf ~/.local/share/oliveconnect-mongo/*           # tarball setup (stop mongod first)
```

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `release version 17 not supported` or `which: no javac` | Only a Java runtime (JRE) is installed, or it is too new for Lombok. Install a JDK 17–21, e.g. `sudo dnf install java-21-openjdk-devel` / `sudo apt install openjdk-21-jdk`, or unpack a [Temurin](https://adoptium.net) JDK and set `JAVA_HOME` to it. |
| `./mvnw: Permission denied` | Run `chmod +x backend/mvnw`. |
| `JWT_SECRET must be set to at least 32 bytes` | You ran the packaged jar without a secret. Use `./mvnw spring-boot:run` for development, or export `JWT_SECRET=$(openssl rand -base64 48)`. |
| `Set JWT_SECRET in .env` from Docker Compose | Create `.env` as shown in Option A, step 1. |
| `docker compose`: unknown command / permission denied on `docker.sock` | Install the Compose plugin (`docker-compose-plugin`) and add yourself to the `docker` group (`sudo usermod -aG docker $USER`, then log out and back in). |
| Backend fails with a MongoDB connection error | MongoDB is not running on `localhost:27017` — see step 1. |
| Login page says "Serveur injoignable" | The backend is not running or not on port 8080. |
| `Port 4200 is already in use` | Another `ng serve` is running; stop it or use `npx ng serve --port 4300`. |
| Frontend tests: `No binary for ChromeHeadless` | Set `CHROME_BIN` to a Chrome/Chromium binary, e.g. `export CHROME_BIN=$(which chromium-browser)`. Without a system Chrome: `npx @puppeteer/browsers install chrome-headless-shell@stable` and point `CHROME_BIN` at the downloaded binary. |
| Icons show as words (e.g. "map") or fonts look plain | Fonts and icons load from Google Fonts; the browser needs internet access. |

## Running the tests

```bash
cd backend && ./mvnw verify
cd frontend && npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox && npx ng build --configuration production
```

Backend unit tests use Mockito and need neither MongoDB nor Docker. Frontend unit tests need Chrome/Chromium (see `CHROME_BIN` above). Cypress end-to-end tests need the app running and the Cypress binary installed:

```bash
cd frontend && npx cypress install && npm run e2e
```

## Bare-metal deployment on Ubuntu 22.04 (target < 30 min)

1. Install dependencies:

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk nginx curl wget
curl -fsSL https://www.mongodb.com/static/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

2. Build the backend:

```bash
cd backend && ./mvnw clean package -DskipTests
sudo mkdir -p /opt/oliveconnect
sudo cp target/oliveconnect.jar /opt/oliveconnect/app.jar
```

3. Install the systemd service:

```bash
sudo cp infra/oliveconnect.service /etc/systemd/system/oliveconnect.service
sudo systemctl daemon-reload
sudo systemctl enable --now oliveconnect
sudo systemctl status oliveconnect
```

4. Build and publish the Angular SPA:

```bash
cd frontend && npm ci && npx ng build --configuration production
sudo rm -rf /var/www/oliveconnect
sudo mkdir -p /var/www/oliveconnect
sudo cp -r dist/frontend/browser/* /var/www/oliveconnect/
```

5. Configure Nginx:

```bash
sudo cp infra/nginx.conf /etc/nginx/sites-available/oliveconnect
sudo ln -sf /etc/nginx/sites-available/oliveconnect /etc/nginx/sites-enabled/oliveconnect
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

6. Open http://<server-ip>/. The SPA fallback in Nginx supports direct refresh of any Angular route.

`JWT_SECRET` is required: set it in `/etc/default/oliveconnect` (e.g. `JWT_SECRET=$(openssl rand -base64 48)`), otherwise the service fails to start.

## Backup

`scripts/backup.sh` performs `mongodump` with gzip and keeps 14 daily archives.

```cron
0 2 * * * /opt/oliveconnect/scripts/backup.sh >> /var/log/oliveconnect-backup.log 2>&1
```

Restore:

```bash
mongorestore --gzip --db oliveconnect --drop /var/backups/oliveconnect/<archive>/oliveconnect
```

## Monitoring

- `GET /actuator/health` — liveness/readiness.
- `GET /actuator/metrics` — JVM and HTTP metrics.
- `GET /actuator/prometheus` — Prometheus exposition format.
- Compose service `prometheus` at http://localhost:9090 — scrapes the backend every 15 seconds using `infra/prometheus.yml`.
- Admin page at `/admin` — MongoDB status, uptime, heap and request count, served by the authenticated `GET /api/admin/status` endpoint.

## Documentation

- French report: `docs/rapport.md`
- Class diagram: `docs/class-diagram.puml`, `docs/class-diagram.png`
- OpenAPI: `docs/api/openapi.yaml` (served live at `/swagger-ui.html`)
- Postman collection: `docs/api/postman_collection.json`
