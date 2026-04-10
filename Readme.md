Notes Manager
=============

Full-stack notes app with a React (Vite) client, an Express + Mongoose API, and MongoDB.

Project Structure
-----------------
- client/: React UI (Vite)
	- src/: React components and styles
	- Dockerfile: builds the static client and serves it on port 80
- server/: Express API + Mongoose
	- routes/: API routes
	- models/: Mongoose models
	- server.js: app entrypoint
	- Dockerfile: Node server image
- k8s/: Kubernetes manifests
	- server-deployment.yaml: API deployment
	- server-service.yaml: API service (NodePort)
	- mongo.yaml: MongoDB deployment
- docker-compose.yml: Local multi-container setup
- Readme.md: This document

Prerequisites
-------------
- Node.js 18+ (for local dev)
- Docker Desktop (for Docker workflow)
- Kubernetes + kubectl (for K8s workflow)
- Optional: Minikube for local Kubernetes

Environment Variables
---------------------
The API expects:
- PORT (default: 5000)
- MONGO_URI (required)

Local Development (No Docker)
-----------------------------
1) Start MongoDB locally (default port 27017), then:
2) Start the API:
	 - From server/:
		 - MONGO_URI=mongodb://localhost:27017/notes
		 - npm install
		 - node server.js
3) Start the client:
	 - From client/:
		 - npm install
		 - npm run dev

The client runs on http://localhost:5173 and talks to the API on http://localhost:5000.

Docker Compose (Recommended Local)
---------------------------------
This spins up client, server, and MongoDB together.

1) Build and start:
	 - From project root:
		 - docker compose up --build

2) Open the client:
	 - http://localhost:5173

Compose Details
---------------
- client: built from client/Dockerfile, served on port 5173 -> container 80
- server: built from server/Dockerfile, served on port 5000
- mongo: mongo:7 with a named volume for persistence
- MONGO_URI inside compose: mongodb://mongo:27017/notes

Kubernetes Deployment
---------------------
These manifests deploy the API and MongoDB. The client is not yet containerized for K8s in this repo.

Prereqs (Minikube example)
--------------------------
1) Start Minikube:
	 - minikube start
2) Build the server image inside Minikube:
	 - minikube image build -t unixproject-server ./server

Apply Manifests
---------------
1) Deploy MongoDB:
	 - kubectl apply -f k8s/mongo.yaml
2) Deploy API:
	 - kubectl apply -f k8s/server-deployment.yaml
	 - kubectl apply -f k8s/server-service.yaml

Access the API
--------------
- With Minikube NodePort:
	- minikube service server-service
- Or via kubectl:
	- kubectl get svc server-service

API Health Check
----------------
- GET http://<api-host>:5000/

Notes API
---------
The API is mounted at /api/notes (see server/routes/notes.js for endpoints).

Common Issues
-------------
- MONGO_URI missing: server exits with an error. Ensure the env var is set.
- K8s image pull: server deployment uses imagePullPolicy: Never, so build the image inside your cluster (Minikube) or update the image to a registry.

Roadmap Ideas
-------------
- Add Kubernetes manifests for the client
- Add database persistence using PersistentVolumeClaims
- Add environment config via ConfigMap and Secret
