# OliveConnect — Rapport de conception et de déploiement

## 1. Étude préalable

La coopérative de Sfax doit piloter cinq chantiers fortement imbriqués : (F1) la gestion numérique des vergers et des récoltes, (F2) les alertes de terrain géolocalisées, (F3) la gestion des ressources et de leur disponibilité, (F4) la cartographie interactive des vergers et (F5) un tableau de bord de performance. L'application est utilisée sur desktop et sur téléphone 360 px par sept rôles : `VISITOR`, `FARMER`, `COLLECTION_MANAGER`, `TEAM_LEADER`, `LOGISTICS_MANAGER`, `PRESS_MANAGER`, `ADMIN`.

Le choix retenu est une architecture SPA Angular 19 derrière Nginx, une API Spring Boot 3.3 et MongoDB 7. Ce choix garantit une chaîne de noms continue : `docs/class-diagram.puml` → entités Java `backend/src/main/java/.../entity` → collections MongoDB → DTO OpenAPI → interfaces TypeScript `frontend/src/app/core/models` → composants Angular. Aucun nom de champ n'est traduit d'une couche à l'autre.

## 2. Besoins fonctionnels et contraintes

| ID | Besoin | Exigence technique |
| --- | --- | --- |
| F1 | Déclarer un verger, une récolte, planifier une tournée, modifier avant départ | `Orchard`, `Harvest`, `Tour`, ownership `farmerId`, `POST /api/harvests/{id}/assign-tour` |
| F2 | Signaler et suivre une alerte géolocalisée | `Alert.location` 2dsphere, `OPEN → ACKNOWLEDGED → RESOLVED`, notifications |
| F3 | CRUD ressources, calendrier, anti-double-réservation, stocks | `Resource`, validation de chevauchement dans `TourService` |
| F4 | Carte publique/privée, 500 vergers en moins de 2 s | index `geometry_2dsphere`, `GET /api/orchards/map?bbox=...`, MarkerCluster |
| F5 | KPI par agrégation, filtres date/verger | `GET /api/dashboard/kpis`, pipelines MongoDB uniquement |

Contraintes transverses : pagination sur toutes les listes, erreurs JSON `{timestamp,status,error,message,path}`, JWT + `@PreAuthorize` + contrôles d'appartenance dans les services, OpenAPI/Swagger, tests automatisés, déploiement Docker et Ubuntu 22.04.

## 3. Conception

### 3.1 Diagramme de classes

Le diagramme source est `docs/class-diagram.puml`, l'image générée est `docs/class-diagram.png`. Les onze classes principales sont `User`, `Orchard`, `MaturityReading`, `Harvest`, `Alert`, `Tour`, `Resource`, `Press`, `PressReceipt`, `Notification` et `ImportLog`. `Plot` et `GeoJsonPoint` sont des types valeur. Les énumérations `Role`, `HarvestType`, `HarvestStatus`, `AlertType`, `AlertStatus`, `TourStatus`, `ResourceType`, `ResourceStatus`, `MaturitySource`, `QualityGrade` et `ImportStatus` sont déclarées une seule fois et réutilisées telles quelles dans Java et TypeScript.

### 3.2 Architecture en couches

`Controller` (validation `@Valid`, `@PreAuthorize`) → `Service` (règles métier, ownership, transactions logiques) → `DAO` (`MongoRepository`, `MongoTemplate` pour agrégations) → `Entity` (`@Document`). Le constructeur est le seul mode d'injection. La sécurité est appliquée dans le filtre JWT, puis à nouveau dans les services : le client n'est jamais une source de vérité.

## 4. Schéma NoSQL + règles de transformation

### 4.1 Correspondance classe → collection

| Classe Java | Collection MongoDB | Transformation |
| --- | --- | --- |
| `User` | `users` | Document complet. `email` unique. `passwordHash` BCrypt. |
| `Orchard` | `orchards` | `plots` **embedded** (tableau borné, toujours lu avec le verger). `geometry` est un `GeoJSON Point`. `farmerId` est une référence vers `users`. |
| `MaturityReading` | `maturity_readings` | **Référencé** : volume d'écritures élevé (capteurs + imports), interrogé indépendamment, index `(orchardId, recordedAt desc)`. |
| `Harvest` | `harvests` | **Référence** `orchardId`, `farmerId` et `tourId` (nullable). Les changements de statut sont des mises à jour ciblées. |
| `Alert` | `alerts` | **Référence** `orchardId`, `farmerId`, `resolvedBy`. `location` géolocalisée, statut indexé. |
| `Tour` | `tours` | `harvestIds` (≤ 30) et `resourceIds` sont des **tableaux de références embarqués**, pas des sous-documents : une tournée ne duplique ni verger ni ressource. |
| `Resource` | `resources` | Document autonome ; le calendrier est déduit des tournées qui contiennent son `id`. |
| `Press` | `presses` | Document autonome avec `location` GeoJSON et capacité courante. |
| `PressReceipt` | `press_receipts` | Document propre référençant `harvestId` et `pressId` : un reçu a son propre cycle de vie et son propre audit. |
| `Notification` | `notifications` | Un document par notification utilisateur, TTL 90 jours, index `(userId, read, createdAt desc)`. |
| `ImportLog` | `import_logs` | Collection séparée, TTL 180 jours, un document par exécution planifiée. |

### 4.2 Justification embedding vs référencement

- **Embedding de `plots` dans `Orchard`** : un verger possède un nombre faible et borné de parcelles ; elles sont toujours affichées avec le verger (fiche, formulaire, carte). L'embedding supprime un `join` applicatif et garantit une lecture en un seul accès disque.
- **Référencement de `MaturityReading`** : les capteurs écrivent toutes les dix minutes. Intégrer ces lectures dans `Orchard` provoquerait des documents qui grossissent sans limite et des conflits d'écriture. Le couple `(orchardId, recordedAt)` sert de clé de requête naturelle.
- **Référencement de `Harvest` vers `Orchard` et `Tour`** : une récolte est consultée, filtrée et modifiée indépendamment ; son statut change souvent. `Tour.harvestIds` reste un tableau de références borné (≤ 30) pour respecter la limite de 16 Mo et éviter la duplication.
- **Référencement de `Alert`** : les alertes sont créées de façon très fréquente, filtrées par statut et par zone géographique ; elles ne doivent pas gonfler le verger.
- **Référencement de `PressReceipt`** : le reçu est une pièce comptable distincte d'une récolte et d'un pressoir, avec ses propres indexes et rétentions.
- **Notifications et imports** : données temporelles à forte croissance, isolées et purgées par TTL.

### 4.3 Indexes créés et raisons

| Collection | Index | Raison |
| --- | --- | --- |
| `users` | `email_1` (unique) | Login et unicité garantie. |
| `orchards` | `geometry_2dsphere` | Requêtes `bbox` de la carte, 500 points en moins de 2 s. |
| `orchards` | `farmerId_1` | Liste des vergers d'un cultivateur, contrôle d'ownership. |
| `maturity_readings` | `orchardId_1_recordedAt_-1` | Dernière lecture d'un verger et séries temporelles. |
| `harvests` | `farmerId_1_status_1` | Écran cultivateur filtré par statut. |
| `harvests` | `orchardId_1` | Historique d'un verger. |
| `harvests` | `plannedDate_1` | Filtrage par plage de dates et recherche en moins de 1 s sur 10 000 documents. |
| `harvests` | `status_1` | File des demandes du Collection Manager. |
| `alerts` | `location_2dsphere` | Alertes géolocalisées. |
| `alerts` | `status_1_createdAt_-1` | File `OPEN`, tri chronologique. |
| `tours` | `code_1` (unique) | Code tournée unique. |
| `tours` | `plannedDate_1`, `status_1`, `teamLeaderId_1` | Planification, suivi et affectation. |
| `resources` | `type_1_status_1` | Disponibilité par type. |
| `notifications` | `userId_1_read_1_createdAt_-1` | Badge non lus et polling toutes les 60 s. |
| `notifications` | `createdAt_1` TTL 90 j (`expireAfterSeconds: 7776000`) | Purge automatique. |
| `press_receipts` | `pressId_1_receivedAt_1`, `harvestId_1` | Reçus par pressoir et rattachement à une récolte. |
| `import_logs` | `startedAt_1` TTL 180 j (`expireAfterSeconds: 15552000`) | Purge automatique des journaux. |

Ces index sont déclarés deux fois pour garantir la cohérence : annotations `@Indexed` sur les entités et création/idempotence explicite dans `MongoIndexConfig` via `IndexOperations`. Les noms effectifs sont journalisés au démarrage.

### 4.4 Partition-like design (candidats de sharding)

Le déploiement cible un replica set mono-nœud ; les clés suivantes sont documentées pour une évolution vers un cluster sans changer le modèle :

- `orchards` : `{farmerId: 1, _id: 1}` — isole les données par coopérateur ; l'index 2dsphere reste local à chaque shard et la carte interroge un bbox borné.
- `maturity_readings` : `{orchardId: 1, recordedAt: 1}` — les écritures d'un même verger restent sur le même shard et les lectures temporelles sont des plages contiguës.
- `harvests` : `{farmerId: 1, plannedDate: 1}` — correspond aux deux filtres les plus fréquents.
- `alerts` : `{status: 1, createdAt: 1}` — les alertes ouvertes sont sur un shard chaud ; l'index 2dsphere complète la recherche géographique.
- `notifications` : `{userId: 1}` — lecture strictement par utilisateur.
- `press_receipts` : `{pressId: 1, receivedAt: 1}` — les écritures du pressoir restent locales.

### 4.5 Règle de performance

La carte demande un bbox et projette uniquement `id`, `name`, `geometry`, `areaHa`, `variety`, le dernier niveau de maturité et le statut de récolte. L'index `geometry_2dsphere` limite la lecture aux points intersects, le clustering côté client réduit le nombre de nœuds DOM et la projection évite le chargement des tableaux `plots`. Objectif mesuré : moins de 2 s pour 500 vergers. La recherche de récoltes utilise `farmerId_1_status_1` et `plannedDate_1` avec `skip/limit` paginé, objectif moins de 1 s pour 10 000 documents.

## 5. API et persistance

Spring Data MongoDB fournit les repositories ; `MongoTemplate` est utilisé uniquement pour les pipelines d'aggregation du dashboard afin que les KPI soient calculés dans MongoDB et jamais dans des boucles Java. Les DTO portent `jakarta.validation` et toutes les réponses de liste utilisent `PageResponse<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`). Swagger UI est exposé à `/swagger-ui.html` et le descripteur statique est `docs/api/openapi.yaml`.

Le contrat complet est également fourni dans `docs/api/postman_collection.json` avec les six comptes de démonstration.

## 6. Décisions de cohérence

- `id` est une `String` issue d'`ObjectId.toHexString()` dans toutes les couches.
- Les dates sont des `Instant` sérialisés ISO-8601 (`2026-11-23T10:15:30Z`) côté API et `string` côté TypeScript.
- Les GeoJSON utilisent `{type: "Point", coordinates: [longitude, latitude]}` (ordre conforme à GeoJSON).
- `Harvest.status` utilise `REQUESTED, VALIDATED, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED` ; `Tour.status` utilise uniquement `PLANNED, IN_PROGRESS, COMPLETED, CANCELLED`.
- Une récolte ne peut être modifiée ou annulée par le cultivateur que tant que le statut est `REQUESTED`, `VALIDATED` ou `PLANNED` et que la tournée associée n'a pas démarré.

## 7. Implémentation des chantiers

### 7.1 F1 — Vergers, récoltes et tournées

Les endpoints `/api/orchards`, `/api/harvests` et `/api/tours` exposent les opérations CRUD et les transitions métier. Les services appliquent l'appartenance `farmerId`, la validation des dates, l'unicité du code tournée et l'interdiction de modifier une récolte dont la tournée a démarré. `POST /api/harvests/{id}/assign-tour` crée la tournée et réserve les ressources cochées ; `TourService` refuse deux tournées qui utilisent la même ressource sur des plages qui se chevauchent.

### 7.2 F2 — Alertes et notifications

Les alertes sont géolocalisées avec un `Point` GeoJSON et suivent le cycle `OPEN → IN_PROGRESS → RESOLVED`. `AlertService` restreint la lecture au cultivateur propriétaire pour `FARMER`, tandis que les rôles de coordination voient la file globale. Chaque changement de statut crée une `Notification` indexée par utilisateur, avec purge TTL à 90 jours.

### 7.3 F3 — Ressources, disponibilité et stocks

`ResourceService` gère le CRUD des ressources et `GET /api/resources/availability` filtre par type et plage temporelle. `GET /api/resources/supplies` calcule les niveaux de stock et les seuils de réapprovisionnement. Les pressoirs exposent leur capacité journalière et leur charge courante ; les réceptions alimentent `press_receipts` et mettent à jour la charge.

### 7.4 F4 — Cartographie

La carte Angular utilise Leaflet. La couche publique appelle `GET /api/orchards/map?bbox=...` sans JWT et affiche uniquement les champs projetés. Les marqueurs sont regroupés côté client pour rester lisibles à 500 vergers. La vue privée ajoute le détail des parcelles embarquées et le dernier niveau de maturité.

### 7.5 F5 — Tableau de bord

`GET /api/dashboard/kpis` s'appuie sur quatre pipelines `MongoTemplate` : rendement par verger avec `$lookup`, délai moyen de collecte calculé par `$subtract`, taux de remplissage des bacs par somme des capacités, et alertes résolues par semaine ISO via `$dateToString`. Les filtres `from`, `to`, `orchardId` et le périmètre utilisateur sont appliqués dans le premier `$match`. Le composant Chart.js consomme directement le contrat TypeScript `DashboardKpis`.

### 7.6 Imports simulés et administration

`ImportScheduler` exécute toutes les dix minutes un scénario `weather-json` et un scénario `maturity-sensor-csv`, également déclenchables par `POST /api/admin/imports/trigger`. Les lignes invalides sont rejetées sans interrompre le lot ; chaque exécution produit un `ImportLog` `SUCCESS` ou `PARTIAL`. `GET /api/admin/status` expose l'uptime, la mémoire JVM, le compteur de requêtes et l'état MongoDB.

## 8. Sécurité

L'authentification JWT est appliquée par `JwtAuthenticationFilter` ; les mots de passe sont hashés BCrypt. Les contrôleurs portent `@PreAuthorize` par rôle et les services vérifient l'appartenance des ressources : un token volé ou un identifiant modifié ne suffit pas à accéder aux données d'un autre cultivateur. Les erreurs sont normalisées par `GlobalExceptionHandler` en `{timestamp, status, error, message, path}`. La validation Jakarta est appliquée sur tous les DTO entrants. Actuator n'expose que `health`, `info`, `metrics` et `prometheus`.

## 9. Tests

### 9.1 Backend

Les tests unitaires Mockito couvrent `OrchardService`, `TourService`, `HarvestService`, `AlertService`, `ResourceService` et `ImportScheduler`. `SecurityContextHelper` est mocké statiquement pour tester les chemins avec et sans périmètre utilisateur. Le scénario d'import invalide vérifie qu'une ligne erronée produit un statut `PARTIAL` et que les lignes valides sont tout de même persistées.

### 9.2 Frontend

Les specs Karma couvrent le shell `AppComponent`, le décodage JWT et le stockage du token dans `ApiService`, ainsi que le chargement des KPI et la gestion d'erreur du dashboard. `ChromeHeadlessNoSandbox` est configuré dans `frontend/karma.conf.js` avec les drapeaux `--no-sandbox --disable-gpu --disable-dev-shm-usage`. Les specs Cypress couvrent le login et la page d'aide ; le binaire Cypress n'étant pas installé dans l'environnement de préparation, la commande locale est `npx cypress install && npm run e2e`.

### 9.3 Commandes et résultats

```bash
cd backend && ./mvnw.cmd -q verify
cd frontend && npm run build
cd frontend && npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox --no-progress
cd frontend && npx cypress install && npm run e2e
docker compose up --build
```

`mvnw verify`, `npm run build` et les tests unitaires Angular passent dans l'environnement de préparation. Les tests Cypress et la stack Docker n'ont pas pu être exécutés localement : le binaire Cypress a été ignoré lors de l'installation et Docker n'est pas installé.

## 10. Déploiement et supervision

`backend/Dockerfile` construit l'application avec Maven 3.9.9 puis l'exécute dans un JRE Eclipse Temurin 21 Alpine sous l'utilisateur `oliveconnect`, avec un healthcheck HTTP. `infra/frontend.Dockerfile` compile Angular avec Node 22 puis sert `dist/frontend/browser` via Nginx 1.27 Alpine. `infra/nginx-docker.conf` reverse-proxie `/api/` vers `http://backend:8080` ; `infra/nginx.conf` fournit l'équivalent pour une installation Ubuntu 22.04 nue avec `infra/oliveconnect.service`. `scripts/backup.sh` archive MongoDB avec rétention. `infra/prometheus.yml` scrape `backend:8080/actuator/prometheus` dans Docker et `127.0.0.1:8080` en installation nue.

## 11. Contrat d'API

Le descripteur statique `docs/api/openapi.yaml` documente les chemins, paramètres, schémas, rôles et réponses d'erreur. La collection `docs/api/postman_collection.json` fournit un dossier par domaine, la variable `baseUrl`, l'authentification bearer et un script qui enregistre automatiquement le JWT renvoyé par `POST /api/auth/login`. Swagger UI reste disponible à `http://localhost:8080/swagger-ui.html` et le JSON généré à `http://localhost:8080/v3/api-docs` lorsque l'API est démarrée.

## 12. Captures d'écran

Les captures d'écran sont conservées dans `docs/screenshots/` : `login-desktop.png`, `login-mobile.png`, `map-desktop.png` et `help-desktop.png`. Elles illustrent la mise en page desktop 1360 × 900, le rendu responsive 360 px et la carte publique Leaflet. Le tableau de bord et les écrans authentifiés doivent être capturés après `docker compose up --build` et l'import du jeu de démonstration.

## 13. Validation finale

Le 23 novembre 2026, la chaîne de validation locale a été relancée intégralement. `backend/mvnw.cmd -q verify` réussit ; les journaux d'import simulé confirment les statuts `PARTIAL` attendus avec lignes valides importées et lignes invalides rejetées. `frontend/npm run build` réussit avec un bundle initial de 737,51 kB raw et 195,21 kB estimé transféré. `frontend/npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox --no-progress` termine avec `TOTAL: 4 SUCCESS`. `docs/api/postman_collection.json` est un JSON valide et `docs/api/openapi.yaml` est un YAML valide. Quatre captures PNG sont présentes dans `docs/screenshots/`. Les seules vérifications non exécutées restent `npm run e2e` et `docker compose up --build`, respectivement à cause du binaire Cypress non installé et de l'absence de Docker dans l'environnement de préparation.
