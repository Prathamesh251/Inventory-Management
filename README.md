<<<<<<< HEAD
# Inventory Management Application

This is a simple Inventory Management application built with Lit elements for the frontend, Node.js for the API proxy, and ERPNext as the backend. It has been fully containerized using Docker.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Setup Instructions

1. **Environment Variables Configuration**
   In the root folder of this project (`inventory-management/`), create a file named `.env` and add your ERPNext API credentials:
   ```env
   ERPNEXT_API_KEY=your_actual_api_key_here
   ERPNEXT_API_SECRET=your_actual_api_secret_here
   ```
   *(Note: This file is ignored by Git to keep your secrets safe).*

2. **ERPNext Configuration (Backend Setup)**
   Since we are using ERPNext, before the UI can fetch items, you need to ensure the custom DocType exists on your ERPNext instance.
   - Log in to your ERPNext Admin panel (once it is running).
   - Go to **DocType List** and create a new DocType named `Inventory Item`.
   - Add the following exact fields:
     - `item_name` (Data)
     - `description` (Text)
     - `image` (Attach Image)
     - `tags` (Data)
     - `date_added` (Date)

## How to Run the Project

The entire application (Frontend UI, API Proxy, and ERPNext Backend infrastructure) is bundled into a single Docker Compose file.

1. **Start the containers**
   Open your terminal in the root of the project (where `docker-compose.yml` is located) and run:
   ```bash
   docker compose up -d
   ```
   This will build the Lit frontend and the Node API proxy, download the necessary ERPNext/Database images, and start everything in the background.

2. **Access the Application**
   - **Frontend UI**: Open your browser and go to [http://localhost:8080](http://localhost:8080)
   - **ERPNext Backend**: Open your browser and go to [http://localhost:8000](http://localhost:8000)

3. **Stop the containers**
   When you are done, you can stop the application by running:
   ```bash
   docker compose down
   ```

## Architecture Notes
- The **Frontend** (`/frontend`) is built as static files using Vite and served via an ultra-fast NGINX container.
- The **API Proxy** (`/api-proxy`) is a Node.js Express server that securely holds your ERPNext credentials and forwards your UI's REST API requests to the ERPNext backend.
- The **Backend** utilizes standard Frappe/ERPNext Docker images alongside MariaDB and Redis.
=======
# Inventory-Management
>>>>>>> 02d18b1d0aa7628162e45ee7a8de9ea67619cc7e
