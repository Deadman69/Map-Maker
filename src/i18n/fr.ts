import type { Dictionary } from './types'

export const fr: Dictionary = {
  'app.title': 'MapMaker',

  'nav.step1': '1. Trace GPX',
  'nav.step2': '2. Étapes & fond de carte',
  'nav.step3': "3. Format d'export",
  'nav.step4': '4. Génération',
  'nav.newHike': 'Nouvelle rando',

  'upload.title': 'Importer une trace de randonnée',
  'upload.hint': 'Choisissez comment votre rando est organisée, puis importez votre GPX.',
  'upload.mode.single.label': 'Un seul fichier GPX',
  'upload.mode.single.hint': 'Vous découperez les étapes à la main sur la carte',
  'upload.mode.multi.label': 'Un fichier par jour/étape',
  'upload.mode.multi.hint': 'Chaque GPX devient une étape, dans l’ordre choisi',
  'upload.dropzone.loading': 'Import en cours…',
  'upload.dropzone.idle': 'Cliquez ou déposez un ou plusieurs fichiers .gpx ici',
  'upload.error.generic': 'Impossible de lire ce fichier GPX.',

  'upload.intro.free': 'Cet outil est entièrement gratuit, sans compte ni limite d’utilisation.',
  'upload.intro.what':
    'MapMaker transforme une trace GPX de randonnée en cartes prêtes à imprimer : une vue d’ensemble et des cartes détaillées à l’échelle de votre choix, avec fond IGN ou autre.',
  'upload.intro.step1': 'Trace GPX',
  'upload.intro.step2': 'Étapes & fond de carte',
  'upload.intro.step3': "Format d'export",
  'upload.intro.step4': 'Génération',
  'upload.intro.privacyTitle': 'Confidentialité',
  'upload.intro.privacyBody':
    'Tout se passe dans votre navigateur : votre trace, vos noms d’étapes et vos réglages ne sont jamais envoyés à un serveur. Les seuls appels réseau servent à récupérer les fonds de carte (IGN, OpenStreetMap).',

  'editor.basemapTitle': 'Fond de carte',
  'editor.daysTitle': 'Jours',
  'editor.singleModeHint': 'Le découpage manuel ne peut pas être réordonné : c’est un seul tracé continu.',
  'editor.etapesTitle': 'Étapes',
  'editor.splitHint':
    'Cliquez sur la trace pour ajouter une coupure d’étape, cliquez sur un repère existant pour la retirer.',
  'editor.resetSplits': 'Réinitialiser les coupures',
  'editor.continueToExport': "Continuer vers l'export",
  'editor.moveUp': 'Monter',
  'editor.moveDown': 'Descendre',
  'editor.toggleProfileShow': 'Afficher le profil altimétrique',
  'editor.toggleProfileHide': 'Masquer le profil altimétrique',

  'editor.poi.title': "Points d'intérêt",
  'editor.poi.waterPoint': "Point d'eau",
  'editor.poi.shelter': 'Refuge',
  'editor.poi.viewpoint': 'Point de vue',
  'editor.poi.campsite': 'Camping',
  'editor.poi.trailhead': 'Départ',
  'editor.poi.danger': 'Danger',
  'editor.poi.namedPoint': 'Point nommé',
  'editor.poi.placingHint': 'Cliquez sur la carte pour placer le point, ou Échap pour annuler.',
  'editor.poi.labelPlaceholder': 'Nom (optionnel)',
  'editor.poi.delete': 'Supprimer',
  'editor.poi.cancelPlacement': 'Annuler',
  'editor.poi.close': 'Fermer',

  'exportConfig.title': "Format d'export",
  'exportConfig.paperTitle': 'Papier',
  'exportConfig.portrait': 'Portrait',
  'exportConfig.landscape': 'Paysage',
  'exportConfig.orientationHint':
    'Paysage convient mieux à une trace globalement horizontale ; portrait à une trace plus verticale ou en boucle serrée.',
  'exportConfig.niveauTitle': 'Niveau de détail (échelle graphique)',
  'exportConfig.custom': 'Personnalisé',
  'exportConfig.niveauHint': (v) =>
    `1 segment de l’échelle = ${v.niveau} m, avec environ ${v.segments} segments sur la largeur de chaque carte détaillée (~${v.groundWidth} m par page).`,
  'exportConfig.segmentsLabel': (v) => `Segments par page (${v.n})`,
  'exportConfig.segmentsHint':
    'Plus de segments couvrent plus de terrain par page (moins de pages) mais rendent l’échelle graphique plus petite et moins lisible.',
  'exportConfig.overlapLabel': (v) => `Chevauchement entre pages (${v.percent}%)`,
  'exportConfig.overlapHint':
    'Un peu de recouvrement évite de perdre le fil du sentier entre deux pages consécutives en suivant la trace sur le terrain.',
  'exportConfig.scopeTitle': 'Découpage des cartes détaillées',
  'exportConfig.scopeWhole': 'Toute la rando',
  'exportConfig.scopePerEtape': 'Par étape',
  'exportConfig.scopeHint':
    'Par étape regroupe et numérote les pages détaillées séparément pour chaque jour ; toute la rando les enchaîne en une seule séquence continue.',
  'exportConfig.printTitle': 'Impression',
  'exportConfig.rectoVerso': 'Recto-verso (complète à un nombre pair de pages)',
  'exportConfig.rectoVersoHint':
    'Ajoute une page blanche si besoin pour que chaque feuille imprimée en recto-verso tombe correctement, sans décalage.',
  'exportConfig.foldable': 'Ajouter des traits de pliage',
  'exportConfig.foldableHint':
    'Ajoute des repères de pliage en accordéon (façon carte IGN) sur la vue d’ensemble, pour replier le pack en format de poche.',
  'exportConfig.dpiPreview': 'Aperçu rapide (150 dpi)',
  'exportConfig.dpiQuality': 'Qualité impression (300 dpi)',
  'exportConfig.dpiHint':
    '150 dpi génère plus vite pour vérifier le résultat ; 300 dpi produit un rendu net à l’impression, avec un fichier plus lourd et une génération plus longue.',
  'exportConfig.orientationModeTitle': 'Orientation des cartes détaillées',
  'exportConfig.orientationFollow': 'Suivre la trace',
  'exportConfig.orientationNorthUp': 'Nord en haut',
  'exportConfig.orientationModeHint':
    'Par défaut, chaque carte détaillée tourne pour que le sentier aille de gauche à droite (comme les cartes-guides pliées classiques), donc la flèche nord change de sens d’une page à l’autre. Choisissez « Nord en haut » pour garder le nord toujours vers le haut.',
  'exportConfig.pageCountPreview': (v) =>
    `≈${v.total} pages seront générées (${v.overview} vue d’ensemble, ${v.profile} profil, ${v.detail} détails).`,
  'exportConfig.back': 'Retour',
  'exportConfig.continue': 'Continuer',

  'preview.title': 'Génération du pack',
  'preview.description':
    'Génère un unique PDF contenant la vue d’ensemble et toutes les cartes détaillées, prêt à imprimer.',
  'preview.generate': 'Générer le pack complet',
  'preview.generating': (v) => `Génération… (${v.current}/${v.total})`,
  'preview.preparing': 'Préparation…',
  'preview.success': 'Pack téléchargé.',
  'preview.errorGeneric': 'La génération du PDF a échoué.',
  'preview.back': 'Retour',
  'preview.blankPageLabel': 'Page blanche (recto-verso)',

  'resume.bannerText': (v) => `Reprendre la session précédente (importée le ${v.date}) ?`,
  'resume.continue': 'Continuer',
  'resume.newHike': 'Nouvelle rando',

  'elevationChart.empty': 'Pas de données d’altitude dans ce fichier GPX.',

  'common.elevationBadge': (v) => `+${v.gain} m / -${v.loss} m`,
  'common.elevationSummary': (v) => `Rando entière : +${v.gain} m / -${v.loss} m`,

  'pdf.overviewLabel': "Vue d'ensemble",
  'pdf.overviewLabelPaged': (v) => `Vue d'ensemble ${v.i}/${v.total}`,
  'pdf.detailLabel': (v) => `Détail — Page ${v.i}/${v.total}`,
  'pdf.detailLabelNamed': (v) => `${v.name} — Page ${v.i}/${v.total}`,
  'pdf.profileLabel': 'Profil altimétrique',
  'pdf.profileEmpty': 'Pas de données d’altitude dans ce fichier GPX.',
  'pdf.foldInstruction': (v) =>
    `Plier en accordéon : alterner pli montagne (M) et pli vallée (V), dans l’ordre des panneaux 1→${v.count}.`,
  'pdf.scaleSegmentLabel': (v) => `1 segment = ${v.n} m`,
  'pdf.northLabel': 'N',

  'map.basemapError':
    "Ce fond de carte n'a pas pu être chargé (réseau indisponible ou service IGN inaccessible). Essayez un autre fond.",
}
