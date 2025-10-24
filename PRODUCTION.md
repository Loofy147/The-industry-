# Production Operations and Deployment

This document provides instructions for building and running the application in a production-like environment using Docker and Docker Compose.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## Building the Application

The application is containerized using a multi-stage `Dockerfile`. This process compiles the application into a minimal, secure, and efficient Node.js image that can be deployed to any container runtime.

To build the Docker image, run the following command from the root of the repository:

```bash
docker build -t industry-blueprint .
```

This will create a new Docker image with the tag `industry-blueprint`.

## Running the Full Application Stack

The entire application stack, including the main `app` service and a Redis message broker, is defined in the `docker-compose.yml` file. This allows you to spin up a complete, production-like environment with a single command.

### 1. Create a Local Environment File

First, you need to create a `.env` file for your local environment. You can do this by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and customize the variables as needed. For local development with Docker Compose, the default values should work correctly, as the `MESSAGE_BROKER_URL` is configured to point to the Redis service defined in `docker-compose.yml`.

### 2. Start the Services

To start all the services in the background, run:

```bash
docker-compose up --build -d
```

-   `--build`: This flag tells Docker Compose to rebuild the `app` image if the source code has changed.
-   `-d`: This flag runs the services in detached mode (in the background).

### 3. Verifying the Services

You can check the status of the running containers with:

```bash
docker-compose ps
```

You can view the logs from all services with:

```bash
docker-compose logs -f
```

### 4. Accessing the Application

-   The **frontend** is available at `http://localhost:3000`.
-   The **WebSocket gateway** is running on `ws://localhost:8080`.
-   The **health check endpoint** is available at `http://localhost:3000/healthz`.

### 5. Stopping the Services

To stop all the services, run:

```bash
docker-compose down
```
