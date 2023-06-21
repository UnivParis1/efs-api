# Outil de recherche d'expertise (_expert finder system_)

**Université Paris 1 Panthéon-Sorbonne**

L'outil de recherche d'expertise (EFS) est un POC (_proof of concept_) de moteur de recherche d'expertises en
établissement ESR assisté par l'intelligence artificielle et basé sur les données Hal développé par l'Université Paris 1
Panthéon-Sorbonne.
Il permet d'identifier des experts sur la base de leurs publications à partir d'
une requête utilisateur en langage naturel.
L'EFS est alimenté quotidiennement par les données du portail HAL
institutionnel. Il utilise les modèles de langage S-BERT (paraphrase-multilingual-mpnet-base-v2) et GPT-3 (ADA) de
l'API OpenAI pour calculer les similarités entre les requêtes utilisateur et les métadonnées des publications.

L'interface utilisateur est intégrée comme un widget sur le site institutionnel de l'Université Paris 1
Panthéon-Sorbonne : https://recherche.pantheonsorbonne.fr/structures-recherche/rechercher-expertise

Pour plus d'informations,
voir [cet article de l'observatoire de l'intelligence artificielle de Paris 1](https://observatoire-ia.pantheonsorbonne.fr/actualite/outil-recherche-dexpertise-base-lintelligence-artificielle-luniversite-paris-1-pantheon).

#### Avertissement

Cette application est un POC ("proof of concept"). Ce n'est pas une application pérenne et elle n'a pas vocation à être
maintenue. L'université Paris 1 panthéon Sorbonne travaille désormais sur un nouvel outil de recherche d'expertise,
baptisé Idyia, dans le cadre de son projet de système d'information recherche mutualisé.

La présente application comporte d'importantes limitations :

- limitations fonctionnelles : la recherche d'experts s'effectue exclusivement à partir de métadonnées texte
  vectorisées (
- limitations fonctionnelles : la recherche d'experts s'effectue exclusivement à partir de métadonnées vectorisées (
  recherche sémantique), à l'exclusion de toute recherche par mots-clés, ce qui rend difficile pour les chercheurs et
  les chercheuses le contrôle de leurs modalités d'exposition.
- limitations techniques : le code n'est pas sous _linting_ ni sous tests unitaires et la documentation est limitée
- limitations du périmètre de données : seules les données HAL sont disponibles et les affiliations ne sont connues
  qu'approximativement.

Néanmoins, cet outil de recherche d'expertise est suffisamment robuste et sécurisé pour un déploiement en production.

#### Architecture

L'EFS est une application 3 tiers :

* **efs-computing**, le backend qui assure le chargement des données Hal, les calculs sous S-BERT et les échanges avec
  l'API OpenAI
    * Technologie : Python/PyTorch/Celery
    * Repository : https://github.com/UnivParis1/efs-computing
* **efs-api**, le back office node-express
    * Technologie : Node - Express
    * Repository : https://github.com/UnivParis1/efs-api
* **efs-gui**, l'interface utilisateurs
    * Technologie : React / Mui
    * Repository : https://github.com/UnivParis1/efs-gui

#### Licence

Le code source de l'EFS est publié sous licence CECILL v2.1. Voir le fichier [LICENSE](LICENCE.md) pour plus de détails.

#### Déploiement de l'API

Le présent repository efs-api héberge le code source de l'API de l'EFS (Node/Typescript/Express).

* L'environnement est géré sous dotenv (completer le fichier .env.example en retirant l'extension .example)
  Notez que le paramêtre d'environnement CLIENT_URL sert à gérer la problématique CORS dans le contexte d'un déploiement
  du service en tant que widget sur un site ou un portail web.
* L'API a été compilée et exécutée avec succès sous node v17.9.0 (npm v8.5.5)
* Le trafic vers l'API
  est régulé par un [rate limiter](src/middlewares/rateLimiter.ts) dont les paramètres sont codés en dur (20 requêtes
  maximum dans une fenêtre de 3 minutes). Ce dispostif a pour but de protéger l'API contre le risque de spam (
  débit du compte OpenAI ou déni de service). Pour les requêtes vers OpenAI, une Captcha vient compléter le dispositif.
* Un second mécanisme, appelé [flow limiter](src/middlewares/flowLimiter.ts) régule le trafic de façon dynamique en
  bloquant les requêtes lorsque les temps de traitement dépassent 5 secondes. La durée de vie du verrou est ensuite
  incrémentée/décrémentée en fonction de l'évolution des temps de réponse. L'état bloqué/débloqué est persisté par un
  flag Redis assorti d'une durée de vie. Ce second dispositif permet d'empêcher la formation de files d'attente
  en retournant une réponse élégante à l'utilisateur (code HTTP 503, 'Server under heavy load' au niveau API) plutôt
  qu'une requête qui ne revient jamais, lorsque la charge dépasse les capacités de la machine.
