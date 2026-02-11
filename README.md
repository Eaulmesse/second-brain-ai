# Fastify TypeScript API

API Fastify avec TypeScript, Docker et Docker Compose.

## Fonctionnalités

- Fastify avec TypeScript
- TypeBox pour la validation de schéma
- Multi-stage Docker build
- Docker Compose pour développement et production
- Health check automatique
- Hot reload en développement

## Prérequis

- Node.js 22+
- Docker et Docker Compose
- npm ou yarn

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Docker

### Développement avec Docker

```bash
docker-compose up app-dev
```

### Production avec Docker

```bash
docker-compose up app
```

### Build l'image Docker

```bash
docker build -t votre-nom/second-brain-fastify .
```

### Push vers Docker Hub

```bash
docker tag votre-nom/second-brain-fastify votre-nom/second-brain-fastify:latest
docker push votre-nom/second-brain-fastify:latest
```

## Endpoints

- `GET /` - Message de bienvenue
- `GET /health` - Health check

## Structure du projet

```
src/
  server.ts          # Serveur principal
Dockerfile           # Build production
Dockerfile.dev       # Build développement
docker-compose.yml   # Configuration Docker Compose
tsconfig.json        # Configuration TypeScript
package.json         # Dépendances et scripts
```

## Variables d'environnement

- `NODE_ENV` - Environnement (development/production)
- `PORT` - Port d'écoute (défaut: 3000)

## License

ISC