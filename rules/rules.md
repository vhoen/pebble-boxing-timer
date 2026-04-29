# 01
-créer une application pebble alloy js qui affiche dans la moitié haute de l'écran :
- le texte "Round" en police de petite taille alignée à droite
- le placeholder "--:--" en police plus grande centrée
et dans la moitié basse de l'écran :
- le texte "Repos"  en police de petite taille alignée à droite
- le placeholder "--:--" en police plus grande centrée

# 02
- créer l'écran de configuration de l'application qui permet de définir en seconde la durée de deux chronomètres : 
- le premier intitulé "round", par défaut d'une valeur de 120, cette valeur sera utilisée à la place du premier placeholder, le nombre de seconde sera affiché sous la forme min:sec
- le second intitulé "repos", par défaut d'une valeur de 60, cette valeur sera utilisée à la place du second placeholder, le nombre de seconde sera affiché sous la forme min:sec

# 03 
- mettre en place le lancement et la mise en pause des chronomètres lors de l'appui court sur le bouton du milieu. Le cycle est le suivant, le premier chronomètre se lance, une fois celui ci terminé, il reprend sa valeur initiale et le second se lance et ainsi de suite.
- les chronomètres se réinitialisent lors d'un appui long sur le bouton du milieu

# 04
- mettre en place 2 vibrations à la fin du premier chronomètre et une seule à la fin du second en fonction d'un paramètre de configuration 