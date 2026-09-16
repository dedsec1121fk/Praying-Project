# Content accuracy and evidence policy

This project tries to be useful without pretending that every hagiographic or biblical question has one modern, exhaustively documented answer.

## Evidence layers

Each detail record is assigned one of four evidence statuses:

1. **Source-expanded dossier** — individually curated material with explicit source distinctions.
2. **Source-linked dossier** — the local summary is tied to one or more specific source links.
3. **Scripture-grounded record** — factual claims are limited to cited biblical passages plus clearly identified Orthodox reception.
4. **Catalog summary — verify minor details** — the surviving local material is limited, so the record avoids false precision and tells the reader to verify jurisdiction-specific or disputed details.

The detail viewer displays this status. Scripture, historical evidence, liturgical/hagiographic tradition, and later or disputed identifications are not intentionally merged into a single certainty level.

## What “complete” can and cannot mean

For a figure whose life is richly documented, the dossier can contain a substantial life account, feast information, writings, ministry, martyrdom or repose, relic/icon traditions, and Orthodox reception. For an obscure biblical name, genealogy, symbolic being, or person known from one short passage, the surviving evidence may simply not contain a full biography. The site must say that explicitly rather than invent events.

The validators reject missing English/Greek core fields—including the required **Description**, **Story**, and **Prayer** triad—missing knowledge sections, unresolved slash-gender placeholders, untranslated common religious reference words in Greek-mode fields, missing or malformed local image files, duplicate IDs, local verified-image paths whose binary does not exist, and intercessory prayers attached to records marked as non-venerated.

## Source hierarchy used by the catalog

- Canonical and deuterocanonical Scripture references stored on the individual record.
- Official Orthodox Church resources and jurisdictional calendars where a specific page is known.
- Synaxarial, liturgical, patristic, historical, or local-tradition references clearly labeled as such.
- Wikimedia Commons only for image files whose source/license has been individually mapped in `image-sources.json`.

Useful Orthodox reference hubs include:

- Orthodox Church in America, Feasts & Saints: https://www.oca.org/fs
- OCA, Lives of the Saints: https://www.oca.org/saints/lives
- OCA, North American Saints: https://www.oca.org/fs/north-american-saints
- Greek Orthodox Archdiocese of America, Chapel / calendar: https://www.goarch.org/chapel
- Orthodox Calendar API documentation (supplemental reference/catalog source): https://api.ispovednik.org/docs/en/

The project paraphrases source material rather than bulk-copying copyrighted hagiographies. OCA states that its site resources require permission for reproduction: https://www.oca.org/contact

## Images

Every one of the 1,186 current records has a bundled local illustration, and the validation suite verifies that all 1,186 files exist and contain valid SVG markup before release. The runtime builder will not publish a local verified-image cache path unless that binary is physically present. These local SVGs are **illustrative navigation artwork**, not assertions of historical likeness and not substitutes for canonical liturgical icons.

The local artwork also respects veneration status: context-only/non-venerated people and beings are deliberately drawn without a saint's halo. Christ, the Holy Spirit, the Theotokos, angels, feasts, venerated people, and context-only records use visibly different symbolic treatments.

Where a reusable historical/iconographic image has been individually verified, the runtime can upgrade the local illustration using the mapping in `image-sources.json`. The source page and license are displayed in the record. The project does not automatically take the first image-search result for an obscure name, because that would create false identifications.


## Current expansion and search policy

The catalog now includes lesser-known saints and ascetics alongside Psalms, parables, Scripture stories, and symbolic or visionary beings. New saint dossiers use direct Orthodox source pages where available and explicitly say when the surviving biographical record is sparse. Scripture-study entries are paraphrases and guides; they do not reproduce modern copyrighted Bible translations.

Search metadata may include historically or devotionally relevant associations such as animals, occupations, places, ascetic disciplines, patronage traditions, feast dates, biblical themes, and alternative names. Such associations are attached only when supported by the stored source or clearly identified tradition. For example, animal-related search terms distinguish a hagiographic story or prayer tradition from a claim of formal universal patronage.

## Offline and image provenance

The offline installer caches the deployed repository files only. Verified image mappings retain their source/license provenance in `image-sources.json`; accepted binaries are downloaded into the repository before deployment. If no trustworthy reusable match is found, the record keeps its dedicated illustrative SVG rather than using a guessed image. Browser storage is requested persistently when supported, but the browser may still enforce quota or eviction rules.
