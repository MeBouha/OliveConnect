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

## Quick start with Docker Compose

Requirements: Docker Engine 24+ with Compose v2, 4 GB RAM.

```bash
git clone <repository-url> OliveConnect
cd OliveConnect
docker compose up --build
```

- Frontend: http://localhost
- Swagger UI: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health
- MongoDB: `mongodb://localhost:27017/oliveconnect`

The API container seeds demo users, 500 geolocated orchards, maturity readings, tours and historical receipts on an empty database.

### Demo accounts

All demo passwords use the suffix `@123` (BCrypt-hashed at seed time):

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@oliveconnect.tn` | `Admin@123` |
| FARMER | `farmer@oliveconnect.tn` | `Farmer@123` |
| COLLECTION_MANAGER | `manager@oliveconnect.tn` | `Manager@123` |
| TEAM_LEADER | `leader@oliveconnect.tn` | `Leader@123` |
| LOGISTICS_MANAGER | `logistics@oliveconnect.tn` | `Logistics@123` |
| PRESS_MANAGER | `press@oliveconnect.tn` | `Press@123` |

VISITOR uses the public map at `/map` without authentication.

## Local development without Docker

Requirements: JDK 17+, Node 20.19+/22.12+, MongoDB 7 running on `localhost:27017`.

```bash
# backend
cd backend
./mvnw spring-boot:run

# frontend (new terminal)
cd frontend
npm ci
npx ng serve
```

Angular dev URL: http://localhost:4200. `environment.ts` points to `http://localhost:8080/api`.

## Verification

```bash
cd backend && ./mvnw verify
cd frontend && npm ci && npx ng test --watch=false --code-coverage && npx ng build --configuration production
```

Repository tests and the full E2E test use Testcontainers and are automatically skipped when Docker is unavailable. Cypress e2e requires the app to be running:

```bash
cd frontend && npx cypress run
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
sudo cp target/oliveconnect-*.jar /opt/oliveconnect/app.jar
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

Set a strong `JWT_SECRET` in `/etc/default/oliveconnect` or in the systemd environment before exposing the service publicly.

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
- Admin UI at `/admin/status` — uptime, heap and request count, sourced from Spring Actuator through the authenticated backend.

## Documentation

- French report: `docs/rapport.md`
- Class diagram: `docs/class-diagram.puml`, `docs/class-diagram.png`
- OpenAPI: `docs/api/openapi.yaml` (served live at `/swagger-ui.html`)
- Postman collection: `docs/api/postman_collection.json`
