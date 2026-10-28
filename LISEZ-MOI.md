# Sécurité : ce que fait le site (et ses limites)

- **Tout le contenu est chiffré** (AES-256) dans votre navigateur avant d'aller sur GitHub. Le dépôt ne contient que du texte illisible, titres et catégories compris.
- **Le site demande un mot de passe** (10 caractères minimum) avant d'afficher quoi que ce soit. La rubrique « Privé » demande en plus un second mot de passe.
- **Page admin** : mot de passe obligatoire. Le jeton GitHub est stocké chiffré sur votre appareil, jamais en clair.
- **Moteurs de recherche** : le site demande à ne pas être indexé (balises noindex, robots.txt). C'est respecté par Google, Bing, etc., mais ce n'est pas un blocage technique : seul le mot de passe protège vraiment.
- **Copie** : clic droit, sélection, copier-coller, impression sont bloqués et la page se floute quand elle perd le focus. Ce sont des freins, pas une barrière : aucun site ne peut empêcher une capture d'écran ou une photo de l'écran.
- **Mots de passe perdus = textes perdus.** Il n'existe aucun moyen de les récupérer. Notez-les dans un gestionnaire de mots de passe.
- Pour rendre aussi le dépôt invisible, passez-le en « Private » (GitHub > Settings > General > Danger Zone). Publier un site depuis un dépôt privé demande GitHub Pro (environ 4 $/mois).

# Mise en ligne
1. Dépôt GitHub `mes-ecrits`, y déposer tous les fichiers (dossier `content` compris), « Commit changes ».
2. Settings > Pages > « Deploy from a branch » > `main` / `(root)` > Save.
3. Settings du compte > Developer settings > Fine-grained tokens : jeton limité à ce dépôt, « Contents : Read and write ».
4. Ouvrez `.../admin.html` : choisissez le mot de passe du site (2 fois), collez le jeton, « Entrer ».

# Au quotidien
`admin.html` > mot de passe > catégorie, texte (tapé ou importé en .docx / PDF) > « Publier ». Visible 1 à 2 minutes plus tard.

# Nouveautés
- Le site s'appelle « Mots après maux » (à changer dans `index.html`, deux endroits : le titre et le nom en haut).
- Page admin : caractères, mots et temps de lecture de chaque texte, camembert de remplissage de la mémoire (limite de 1 Mo pour ce fonctionnement) et boutons de sauvegarde par dossier.
- Site : barre de recherche sur l'accueil (les textes Privé n'y sont cherchables qu'une fois déverrouillés), temps de lecture ⏳ et haricot magique qui pousse sur le côté quand on fait défiler la page.
