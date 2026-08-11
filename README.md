# MapMaker

**Génère des cartes de randonnée prêtes à imprimer à partir d'une trace GPX — 100 % gratuit, 100 % dans le navigateur.**

🔗 **[deadman69.github.io/Map-Maker](https://deadman69.github.io/Map-Maker/)**

## En bref

MapMaker transforme une trace GPX de randonnée en un pack PDF prêt à imprimer : une vue d'ensemble de l'itinéraire et des cartes détaillées à l'échelle de votre choix, sur fond IGN (Plan, Orthophoto, SCAN 25) ou OpenStreetMap/OpenTopoMap.

Tout se passe dans votre navigateur : aucun compte, aucune limite d'utilisation, et votre trace n'est jamais envoyée à un serveur. Les seuls appels réseau servent à récupérer les fonds de carte.

## Fonctionnalités

- **Import GPX** — un seul fichier continu (découpage manuel à la carte) ou un fichier par jour/étape.
- **Renommage et réordonnancement** des jours/étapes, avec dénivelé (D+/D−) et profil altimétrique.
- **Points d'intérêt** — points d'eau, refuges, points de vue, campings, départs, dangers, points nommés : à placer, déplacer et renommer directement sur la carte.
- **Export configurable** — format papier (A4/A3), orientation, échelle graphique (niveau personnalisable), recto-verso, traits de pliage en accordéon façon carte IGN, orientation "nord en haut" ou "suit la trace".
- **Pack complet** — vue d'ensemble + profil altimétrique + cartes détaillées, en un seul PDF.
- **Bilingue** — français / anglais, détecté automatiquement depuis le navigateur (drapeau pour changer).
- **Aucune donnée envoyée** — tout le calcul, le rendu de carte et la génération de PDF se font côté client.

## Comment ça marche

1. **Trace GPX** — importez votre fichier (ou plusieurs, un par jour).
2. **Étapes & fond de carte** — ajustez les coupures, renommez les jours, choisissez le fond de carte, ajoutez des points d'intérêt.
3. **Format d'export** — papier, échelle, recto-verso, pliage...
4. **Génération** — téléchargez le pack PDF complet.

## Stack technique

React 19 + TypeScript + Vite, [OpenLayers](https://openlayers.org/) pour le rendu cartographique (WMTS IGN Géoplateforme, XYZ), [jsPDF](https://github.com/parallax/jsPDF) pour la génération du PDF. Aucun backend : le site est un simple bundle statique déployé sur GitHub Pages.

## Développement local

```bash
npm install
npm run dev      # serveur de dev (http://localhost:5194)
npm run build    # build de production
npm run test     # tests unitaires (Vitest)
```

## Déploiement

Le site est déployé automatiquement sur GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`.
