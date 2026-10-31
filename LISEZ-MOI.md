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

# La page cachée (l'envers)
- Elle contient les textes « Privé » et demande le second mot de passe. Elle n'apparaît plus dans le menu ni sur l'accueil.
- Pour y entrer : sur la page d'accueil, touchez la **cosse dorée** sur la tige du haricot (côté gauche, vers le bas de l'écran). Elle porte un tout petit 8.
- Adresse directe : `.../index.html#/envers`. La cosse n'apparaît que sur l'accueil.

# Le lieu sûr (mise à jour visuelle)
- La page cachée s'appelle « Le lieu sûr » : fond bleu nuit, écritures dorées, le haricot devient une corde dorée au bout de laquelle est suspendue une silhouette dessinée. Plus de menu : après le mot de passe, la liste des textes s'affiche directement.
- Dans la page admin, la catégorie s'appelle désormais « Le lieu sûr ».

# Accès au lieu sûr
- La cosse (verte, légèrement plus vive que les autres, avec un petit 8) ouvre une petite fenêtre de mot de passe. La page ne s'affiche que si le mot de passe est correct. Elle se referme dès qu'on quitte la page : le mot de passe est redemandé à chaque entrée.
- Il faut avoir publié au moins un texte dans « Le lieu sûr » (page admin) pour que le mot de passe puisse être vérifié.

# Le lieu sûr : deuxième dépôt et accès invité
Le contenu du lieu sûr est maintenant dans un **second dépôt GitHub** (`lieu-sur`), chiffré avec son propre mot de passe. C'est ce qui permet de donner à un invité l'accès à ce dépôt seulement.

1. Créez un dépôt **public** nommé `lieu-sur` (cochez « Add a README file »).
2. Votre jeton GitHub : modifiez-le (Developer settings > Fine-grained tokens > votre jeton > Edit) pour ajouter le dépôt `lieu-sur`, avec « Contents : Read and write ».
3. Déposez les fichiers du zip dans le dépôt du site (sans toucher au dossier `content`), dont les nouveaux `config.js`, `lieu.html` et `lieu.js`.
4. Dans la page admin, publiez un premier texte dans « Le lieu sûr » : le mot de passe que vous saisissez devient celui du lieu sûr (tapez-le avec la case « Afficher » cochée pour éviter une faute). Si vous aviez d'anciens textes Privé, utilisez le bouton « Transférer mes anciens textes Privé ».
5. Pour l'invité : créez un **second jeton** limité au seul dépôt `lieu-sur` (Contents : Read and write). Donnez-lui, par des canaux différents : l'adresse `.../lieu.html`, le mot de passe du lieu sûr et ce jeton. Il ne peut ni voir ni modifier le reste. Pour lui retirer l'accès : supprimez ce jeton.

Limites : l'invité peut lire tout ce qui est dans le lieu sûr (c'est une page partagée) ; sa page n'affiche et ne modifie que ses propres textes, mais ce n'est pas un mur technique contre quelqu'un de très déterminé. Le dépôt `lieu-sur` étant public, la seule protection est le mot de passe du lieu sûr : choisissez une phrase longue.
