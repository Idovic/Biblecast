

# BibleCast — Améliorations visuelles et fonctionnelles

Ton cahier des charges est riche et pertinent. Voici le plan que je recommande, filtré pour garder ce qui est réaliste et utile dans le contexte React+Vite sans backend. Je l'organise en phases d'implémentation.

---

## Phase 1 : Refonte visuelle complète

**Palette et effets** — Modifier `src/index.css` et `tailwind.config.ts` :
- Fond principal : dégradé violet profond `#1e1b2e → #2d1b4e`
- Panneaux latéraux : glassmorphism (`rgba(37,36,64,0.85)` + `backdrop-filter: blur(12px)`)
- Bordures subtiles `rgba(255,255,255,0.08)`
- Bouton "Projeter" : fond doré `#e8c547`, texte sombre `#1a1820`
- Texte principal `#f0eeff`, secondaire `#9b98c4`
- Hover : box-shadow dorée + légère élévation, transitions 200ms partout

**Fichiers impactés** : `index.css`, `tailwind.config.ts`, `PreviewPanel.tsx`, `Index.tsx`, composants UI utilisés

---

## Phase 2 : Sélection multiple de versets + mode séquence

**Concept** : Permettre de sélectionner plusieurs versets et les projeter en séquence.

- Ajouter un type `show-sequence` dans `DisplayMessage` avec un tableau de `VerseReference[]`
- **Côté présentateur** : boutons Précédent/Suivant + indicateur "Verset X / Y" + barre de progression
- **Côté Display** : indicateur en haut à droite "1 / 3 ◀ ▶", dots de progression en bas, transitions fondu 500ms
- Navigation clavier (← →) gérée dans Index.tsx
- Le panneau de recherche permet de cocher plusieurs versets avant envoi

**Fichiers** : `types/bible.ts`, `BibleSearch.tsx`, `PreviewPanel.tsx`, `Display.tsx`, `Index.tsx`, `useBroadcastChannel.ts`

---

## Phase 3 : Recherche intelligente + raccourcis clavier

**Barre de recherche améliorée** :
- Parser les formats abrégés : "Jn 3:16" → Jean 3:16, "Ps 23" → tout le chapitre, "amour" → recherche texte
- Table d'abréviations françaises dans `lib/bible.ts`
- Suggestions autocomplete au fil de la frappe

**Raccourcis clavier** (aide affichée avec "?") :
- ← / → ou PageUp/PageDown : naviguer dans la séquence projetée
- Espace : effacer l'écran
- Hook `useKeyboardShortcuts` dédié

**Double-clic** sur un verset = projection immédiate

**Fichiers** : `lib/bible.ts`, `BibleSearch.tsx`, `Index.tsx`, nouveau hook `useKeyboardShortcuts.ts`

---

## Phase 4 : Écran d'affichage TV amélioré

**5 fonds d'écran** sélectionnables depuis le ThemePanel :
1. Classique (noir uni `#0f0e1a`)
2. Nuit étoilée (dégradé radial + particules subtiles via canvas)
3. Croix dorée (filigrane centré, opacity 0.06)
4. Naturel (dégradé vert forêt)
5. Image personnalisée (upload, floutée blur 20px + overlay 70% noir)

**Animations améliorées** : entrée fade-in + translateY(20px→0) 600ms, sortie 300ms

**Écran vide** : affiche le nom de l'église + logo (configurable dans Paramètres)

**Fichiers** : `Display.tsx`, `ThemePanel.tsx`, `types/bible.ts` (étendre DisplayTheme)

---

## Phase 5 : Slides améliorées

**Types de slides** : Texte+Titre, Titre seul, Verset+Titre, Blank, Liste à puces

**Par slide** : fond (5 options TV), taille de police, alignement (gauche/centre/droite), couleur du texte (palette 8 couleurs)

**Gestion** : dupliquer, groupes/sections ("Louange", "Prédication"), drag & drop amélioré

**Présentation complète** : mélanger slides + versets dans une timeline unique (la file d'attente devient la timeline), avance manuelle

**Fichiers** : `types/bible.ts` (CustomSlide étendu), `SlidesEditor.tsx` (refonte), `QueuePanel.tsx`, `Index.tsx`

---

## Phase 6 : Page Paramètres de l'église

Nouvelle page/modale accessible via icône engrenage dans le header :

- **Nom de l'église** + upload logo (affiché sur écran vide)
- **Préférences TV** : police par défaut (Merriweather/Lato/Georgia/Arial), taille par défaut, vitesse de transition (300/600/1000ms)
- **Préférences présentateur** : label version biblique ("LSG 1910", etc.)
- Toutes les données sauvegardées dans `localStorage`

**Fichiers** : nouveau `src/components/SettingsPanel.tsx`, `Index.tsx` (bouton engrenage), `Display.tsx` (lecture localStorage)

---

## Phase 7 : PWA & performances

- Mettre à jour `manifest.json` avec la nouvelle couleur thème `#1e1b2e`
- Enregistrer un Service Worker basique (cache des fichiers statiques + bible-fr.json)
- Splash screen au chargement : logo + "Chargement de la Bible..."

**Fichiers** : `manifest.json`, `public/sw.js`, `index.html`, `main.tsx`

---

## Ce que je ne recommande pas d'inclure maintenant

- **Ajout d'autres Bibles** (anglais, etc.) : nécessite un fichier JSON supplémentaire volumineux et un sélecteur — à faire dans une itération future
- **Chromecast / Cast SDK** : le Cast SDK de Google nécessite un receiver app enregistré et ne fonctionne pas en mode preview — à documenter plutôt qu'implémenter
- **Chargement partiel de la Bible** (livre par livre) : optimisation prématurée sauf si le JSON est très volumineux

---

## Ordre d'implémentation recommandé

Vu l'ampleur, je recommande de procéder en **3 itérations** :

1. **Itération 1** : Phase 1 (refonte visuelle) + Phase 6 (paramètres église) + Phase 7 (PWA)
2. **Itération 2** : Phase 2 (sélection multiple/séquence) + Phase 3 (recherche intelligente + raccourcis)
3. **Itération 3** : Phase 4 (écran TV amélioré) + Phase 5 (slides améliorées)

Chaque itération représente un lot cohérent et testable. On commence par l'itération 1 ?

