# Projet Echo

![Logo](front/src/img/logo.png)

## Introduction

Echo est une application "mini Twitter" construite à l'aide de services AWS. Elle permet aux utilisateurs de s'envoyer des messages, de récupérer automatiquement des informations météorologiques toutes les heures et de profiter de blagues grâce à des commandes prédéfinies.

Vous pouvez accéder au projet en suivant ce lien : [https://d3g96be41122l7.cloudfront.net](https://d3g96be41122l7.cloudfront.net).

## Membres du Groupe

- Walid Rahioui
- Teo Vandroemme

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Déploiement](#déploiement)
- [Technologies Utilisées](#technologies-utilisées)
- [Avertissement](#avertissement)

## Fonctionnalités

- **Connexion :** Les utilisateurs doivent s'inscrire et se connecter pour profiter du service.
- **Messagerie :** Les utilisateurs peuvent s'envoyer des messages les uns aux autres au sein de la plateforme.
- **Récupération de la météo :** Récupération automatique des informations météorologiques toutes les heures.
- **Blagues :** Les utilisateurs peuvent consulter des blagues en utilisant des commandes prédéfinies ("/joke" ou "/blague").

## Déploiement

Nous avons choisi de simplifier le processus de déploiement en utilisant Terraform, que nous avons trouvé être un moyen efficace de gérer les ressources AWS. La documentation de Terraform nous a permis de nous concentrer sur l'essentiel, et il est compatible avec les pipelines d'intégration continue (CI) pour valider nos configurations.

Cependant, nous avons configuré manuellement certains déclencheurs sur les fonctions AWS Lambda, tels qu'API Gateway et EventBridge, car leur configuration s'est avérée difficile à réaliser avec Terraform. Les ressources en ligne pour la configuration manuelle étaient plus nombreuses et plus faciles à suivre.

Pour déployer le projet, suivez ces étapes :

1. Clonez le dépôt.
2. Configurez vos identifiants AWS.
3. Accédez au répertoire Terraform.
4. Exécutez `terraform init` pour initialiser le projet.
5. Exécutez `terraform apply` pour créer les ressources AWS.
6. Configurez manuellement les déclencheurs API Gateway et EventBridge pour les fonctions Lambda.

## Technologies Utilisées

- AWS Lambda
- Amazon Cognito
- API Gateway
- Terraform
- EventBridge
- Cloudfront
- Bucket S3

## Disclaimer

Ce README.md est fourni à titre indicatif pour documenter et expliquer nos choix pour le projet Echo.

## Disclaimer 2

Les consignes du sujet ont été correctement appliquées dans ce projet. Cependant, il existe un problème impossible à corriger. Lors de nos premiers tests sur la base de données, nous avons fait une petite erreur, ce qui fait que le message suivant se retrouve toujours au-dessus des autres messages :

```plaintext
1
12/17/2023, 12:42:35 PM
Test numérique
```
Les autres messages sont cependant bien triés chronologiquement, seul ce message pose problème.


