import type { Dictionary } from './types'

export const en: Dictionary = {
  'app.title': 'MapMaker',

  'nav.step1': '1. GPX track',
  'nav.step2': '2. Stages & basemap',
  'nav.step3': '3. Export format',
  'nav.step4': '4. Generation',
  'nav.newHike': 'New hike',

  'upload.title': 'Import a hiking track',
  'upload.hint': 'Choose how your hike is organized, then import your GPX.',
  'upload.mode.single.label': 'A single GPX file',
  'upload.mode.single.hint': "You'll split it into stages by hand on the map",
  'upload.mode.multi.label': 'One file per day/stage',
  'upload.mode.multi.hint': 'Each GPX becomes a stage, in the order you pick',
  'upload.dropzone.loading': 'Importing…',
  'upload.dropzone.idle': 'Click or drop one or more .gpx files here',
  'upload.error.generic': 'Could not read this GPX file.',

  'upload.intro.free': 'This tool is entirely free, with no account and no usage limit.',
  'upload.intro.what':
    'MapMaker turns a hiking GPX track into print-ready maps: an overview and detailed maps at the scale of your choice, with an IGN or other basemap.',
  'upload.intro.step1': 'GPX track',
  'upload.intro.step2': 'Stages & basemap',
  'upload.intro.step3': 'Export format',
  'upload.intro.step4': 'Generation',
  'upload.intro.privacyTitle': 'Privacy',
  'upload.intro.privacyBody':
    'Everything runs in your browser: your track, stage names and settings are never sent to a server. The only network calls fetch the map tiles (IGN, OpenStreetMap).',

  'editor.basemapTitle': 'Basemap',
  'editor.daysTitle': 'Days',
  'editor.singleModeHint': "Manual splits can't be reordered: this is a single continuous track.",
  'editor.etapesTitle': 'Stages',
  'editor.splitHint': 'Click the track to add a stage split, click an existing marker to remove it.',
  'editor.resetSplits': 'Reset splits',
  'editor.continueToExport': 'Continue to export',
  'editor.moveUp': 'Move up',
  'editor.moveDown': 'Move down',
  'editor.toggleProfileShow': 'Show elevation profile',
  'editor.toggleProfileHide': 'Hide elevation profile',

  'editor.poi.title': 'Points of interest',
  'editor.poi.waterPoint': 'Water point',
  'editor.poi.shelter': 'Shelter',
  'editor.poi.viewpoint': 'Viewpoint',
  'editor.poi.campsite': 'Campsite',
  'editor.poi.trailhead': 'Trailhead',
  'editor.poi.danger': 'Danger',
  'editor.poi.namedPoint': 'Named point',
  'editor.poi.placingHint':
    "Click the map to place the point (you'll be able to name it right after), or press Escape to cancel.",
  'editor.poi.labelPlaceholder': 'Name (optional)',
  'editor.poi.delete': 'Delete',
  'editor.poi.cancelPlacement': 'Cancel',
  'editor.poi.close': 'Close',
  'editor.poi.emptyHint': 'No points yet — pick a type above, then click the map.',

  'exportConfig.title': 'Export format',
  'exportConfig.paperTitle': 'Paper',
  'exportConfig.portrait': 'Portrait',
  'exportConfig.landscape': 'Landscape',
  'exportConfig.orientationHint':
    'Landscape suits a mostly horizontal track better; portrait suits a more vertical or tightly-looped track.',
  'exportConfig.niveauTitle': 'Detail level (scale bar)',
  'exportConfig.custom': 'Custom',
  'exportConfig.niveauHint': (v) =>
    `1 scale-bar segment = ${v.niveau} m, with about ${v.segments} segments spanning the width of each detail map (~${v.groundWidth} m per page).`,
  'exportConfig.segmentsLabel': (v) => `Segments per page (${v.n})`,
  'exportConfig.segmentsHint':
    'More segments cover more ground per page (fewer pages) but make the scale bar smaller and harder to read.',
  'exportConfig.overlapLabel': (v) => `Overlap between pages (${v.percent}%)`,
  'exportConfig.overlapHint':
    'A little overlap keeps you from losing track of the trail between two consecutive pages while following it on the ground.',
  'exportConfig.scopeTitle': 'Detail map grouping',
  'exportConfig.scopeWhole': 'Whole hike',
  'exportConfig.scopePerEtape': 'Per stage',
  'exportConfig.scopeHint':
    'Per stage groups and numbers detail pages separately for each day; whole hike chains them into one continuous sequence.',
  'exportConfig.printTitle': 'Printing',
  'exportConfig.rectoVerso': 'Double-sided (pads to an even page count)',
  'exportConfig.rectoVersoHint':
    'Adds a blank page if needed so every double-sided sheet lines up correctly, without a page offset.',
  'exportConfig.foldable': 'Add fold guides',
  'exportConfig.foldableHint':
    'Adds accordion fold guides (IGN-map style) to the overview page, so you can fold the pack pocket-sized.',
  'exportConfig.dpiPreview': 'Quick preview (150 dpi)',
  'exportConfig.dpiQuality': 'Print quality (300 dpi)',
  'exportConfig.dpiHint':
    '150 dpi generates faster to check the result; 300 dpi gives a crisp print, with a heavier file and a slower generation.',
  'exportConfig.orientationModeTitle': 'Detail map orientation',
  'exportConfig.orientationFollow': 'Follow the trail',
  'exportConfig.orientationNorthUp': 'North up',
  'exportConfig.orientationModeHint':
    'By default, each detail map rotates so the trail runs left to right (like classic folded trail maps), so the north arrow points a different way on each page. Choose "North up" to keep north always pointing up.',
  'exportConfig.pageCountPreview': (v) =>
    `≈${v.total} pages will be generated (${v.overview} overview, ${v.profile} profile, ${v.detail} detail).`,
  'exportConfig.back': 'Back',
  'exportConfig.continue': 'Continue',

  'preview.title': 'Generating the pack',
  'preview.description': 'Generates a single PDF with the overview and all detail maps, ready to print.',
  'preview.generate': 'Generate the full pack',
  'preview.generating': (v) => `Generating… (${v.current}/${v.total})`,
  'preview.preparing': 'Preparing…',
  'preview.success': 'Pack downloaded.',
  'preview.errorGeneric': 'PDF generation failed.',
  'preview.back': 'Back',
  'preview.blankPageLabel': 'Blank page (double-sided)',

  'resume.bannerText': (v) => `Resume the previous session (imported on ${v.date})?`,
  'resume.continue': 'Continue',
  'resume.newHike': 'New hike',

  'elevationChart.empty': 'No elevation data in this GPX file.',

  'common.elevationBadge': (v) => `+${v.gain} m / -${v.loss} m`,
  'common.elevationSummary': (v) => `Whole hike: +${v.gain} m / -${v.loss} m`,
  'common.advancedSettings': 'Advanced settings',

  'pdf.overviewLabel': 'Overview',
  'pdf.overviewLabelPaged': (v) => `Overview ${v.i}/${v.total}`,
  'pdf.detailLabel': (v) => `Detail — Page ${v.i}/${v.total}`,
  'pdf.detailLabelNamed': (v) => `${v.name} — Page ${v.i}/${v.total}`,
  'pdf.profileLabel': 'Elevation profile',
  'pdf.profileEmpty': 'No elevation data in this GPX file.',
  'pdf.foldInstruction': (v) =>
    `Accordion fold: alternate mountain fold (M) and valley fold (V), in panel order 1→${v.count}.`,
  'pdf.scaleSegmentLabel': (v) => `1 segment = ${v.n} m`,
  'pdf.northLabel': 'N',

  'map.basemapError': 'This basemap could not be loaded (network unavailable or IGN service unreachable). Try another basemap.',
}
