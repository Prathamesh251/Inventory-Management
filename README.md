# Inventory Management Application

This is a complete Inventory Management application built with **Lit** for the frontend, a **Node.js Express** API proxy, and **ERPNext (Frappe)** as the backend, fully orchestrated using Docker Compose.

---

## Architecture Overview

- **Frontend (`/frontend`)**: Built with Lit web components and Vite, served in production via Nginx on port `8081`.
- **API Proxy (`/api-proxy`)**: A Node.js Express server running on port `3000` that securely attaches ERPNext API keys and proxies requests between the frontend and ERPNext REST APIs.
- **Backend (`/frappe_docker`)**: Standard ERPNext v16 container stack including ERPNext web frontend (port `8080`), backend gunicorn server (port `8000`), MariaDB (`db`), Redis (`redis-cache`, `redis-queue`), worker queues, and scheduler.

---

## Prerequisites

Before starting, make sure you have installed:
- [Docker Desktop](https://docs.docker.com/get-docker/) (with Docker Compose v2.20+ support)

---

## Setup & Running the Application

All services (ERPNext, MariaDB, Redis, API Proxy, and Lit Frontend) are unified into the root [docker-compose.yml](file:///d:/inventory-management/docker-compose.yml).

### 1. Environment Variables Configuration

In the root folder (`inventory-management/`), ensure your `.env` file exists with your ERPNext API credentials:

```env
PORT=3000
ERPNEXT_URL=http://localhost:8080
ERPNEXT_API_KEY=your_actual_api_key_here
ERPNEXT_API_SECRET=your_actual_api_secret_here
```

*(Note: API keys are generated from your ERPNext Administrator user once ERPNext is running).*

### 2. Start the Application

From the root project folder, run:

```bash
docker compose up -d
```

> **Note on initial startup:** When running for the first time, ERPNext's `create-site` container automatically provisions the site and installs ERPNext into MariaDB. This process takes 2–5 minutes. You can monitor the progress with:
> ```bash
> docker compose logs -f create-site
> ```

### 3. Access the Services

Once the containers are up and healthy:

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Lit Frontend UI** | [http://localhost:8081](http://localhost:8081) | Main user-facing Inventory application |
| **ERPNext Desk** | [http://localhost:8080](http://localhost:8080) | Username: `Administrator`, Password: `admin` |
| **API Proxy** | [http://localhost:3000](http://localhost:3000) | REST API endpoints (`/api/items`, `/api/upload`) |

### 4. ERPNext API Key Setup

1. Open **ERPNext Desk** at [http://localhost:8080](http://localhost:8080).
2. Log in using `Administrator` / `admin`.
3. In the search bar, search for **User List** and click on `Administrator`.
4. Scroll down to the **API Access** section and click **Generate Keys**.
5. Copy the generated **API Key** and **API Secret**.
6. Place them in your root `.env` file (`ERPNEXT_API_KEY` and `ERPNEXT_API_SECRET`).
7. Restart the API proxy to pick up the keys:
   ```bash
   docker compose restart api-proxy
   ```

*(Note: The application integrates directly with ERPNext's standard **Item** DocType under Stock > Item).*

### 5. Stopping the Application

To shut down all containers:

```bash
docker compose down
```

---

## Verifying Data in MariaDB

To inspect the underlying database items created in ERPNext:

1. Connect to the MariaDB container:
   ```powershell
   docker exec -it inventory-management-db-1 mariadb -u root -padmin
   ```

2. List databases to find your site database:
   ```sql
   SHOW DATABASES;
   ```

3. Select your database (typically starts with `_` followed by a hash):
   ```sql
   USE `<your_database_name>`;
   ```

4. Query the stored items:
   ```sql
   SELECT name, item_name, item_group, description FROM tabItem LIMIT 10;
   ```