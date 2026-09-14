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

Every one of the 1,083 records has a bundled local illustration, and the validation suite verifies that all 1,083 files exist and contain SVG markup before release. The runtime builder will not publish a local verified-image cache path unless that binary is physically present. These local SVGs are **illustrative navigation artwork**, not assertions of historical likeness and not substitutes for canonical liturgical icons.

The local artwork also respects veneration status: context-only/non-venerated people and beings are deliberately drawn without a saint's halo. Christ, the Holy Spirit, the Theotokos, angels, feasts, venerated people, and context-only records use visibly different symbolic treatments.

Where a reusable historical/iconographic image has been individually verified, the runtime can upgrade the local illustration using the mapping in `image-sources.json`. The source page and license are displayed in the record. The project does not automatically take the first image-search result for an obscure name, because that would create false identifications.


## Precision corrections in v15

The v15 audit separates ordinary Greek prose normalization from prayer-invocation grammar, preventing vocative forms from leaking into roles and descriptions. Common Gospel/reference labels are normalized to established Greek forms rather than mixed-language constructions.

Saint Olga of Kwethluk's OCA commemoration is stored as **27 October**, following the Orthodox Church in America's official saint page and its announcement fixing the annual feast on that date. The catalog also distinguishes the Holy Synod's 2023 decision to number her among the saints from the public glorification services held in June 2025.
