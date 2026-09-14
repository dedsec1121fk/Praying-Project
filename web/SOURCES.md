# Orthodox Web sources and content policy

The website is an educational Orthodox-oriented explorer, not a replacement for a parish calendar, priest, synaxarion, liturgical book, or a jurisdiction's official calendar.

## Primary expansion references

- Orthodox Church in America — **Feasts & Saints**: https://www.oca.org/fs
- Orthodox Church in America — **Synaxis of the Seventy Apostles**: https://www.oca.org/saints/lives/1981/01/04/100017-synaxis-of-the-seventy-apostles
- Orthodox Church in America — **Angels and Evil Spirits** (traditional ranks of bodiless powers): https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/angels-and-evil-spirits
- Orthodox Church in America — **North American Saints**: https://www.oca.org/fs/north-american-saints
- Greek Orthodox Archdiocese of America — **Ecclesiastical Digital Calendar / Planner**: https://www.goarch.org/chapel/planner
- Greek Orthodox Archdiocese of America — **Synaxis of the 70 Apostles**: https://www.goarch.org/chapel/saints?contentid=369&type=saints

Biblical records cite their primary Scripture passages in the detail view. Church-saint summaries are intentionally concise. Where an exact feast date was not treated as sufficiently stable across calendars/jurisdictions, the entry says to consult the local Orthodox calendar rather than inventing a date.

## Scope of the 1,083-entry catalog

The catalog is broader than a list of saints. It includes:

- venerated biblical and Church saints;
- people named in Scripture who are useful for study but are not presented as saints;
- peoples or ancestral names in biblical genealogies/Table of Nations;
- parable figures clearly labeled as parable figures;
- hostile spiritual beings and apocalyptic symbols clearly placed under `biblical-context`;
- feasts, synaxes, and liturgical Sundays.

This distinction matters: a searchable reference to a figure such as Herod, Judas Iscariot, a symbolic beast in Revelation, or an ancestral people-name is **not** a claim that the figure is venerated.

## Important distinctions

`biblical-context` entries are not presented as saints. They exist so searches for important or obscure biblical names, hostile spiritual beings, symbolic figures, and narrative characters still return useful context. Their prayer panel contains a prayer to God for discernment; it does not invoke the figure.

Some biblical or traditional identities have interpretive complexity (for example, the “Angel of the Lord,” the “two witnesses,” or symbolic figures in Revelation). Those records are deliberately descriptive rather than dogmatically identifying them beyond what the text or common Orthodox tradition safely supports.

The local SVG files under `web/images/people/` are original lightweight illustrative medallions generated for this interface. They are **not canonical liturgical icons** and should not be represented as such. They can be replaced one-by-one with properly licensed Orthodox icon photography or artwork later without changing the catalog schema.

## Calendar note

Fixed feast dates can appear on different civil dates depending on whether a local church uses the revised/new calendar or the old Julian calendar. Moveable feasts depend on Pascha, and some local synaxes differ by jurisdiction.


## Detailed local profiles and translations

Every record carries English and Greek display data. The local `profile-enricher.js` adds structured information panels in both languages without downloading anything at runtime. The generated profile combines the stored narrative, role, Scripture/tradition reference, feast or context information, veneration status, aliases, and an explicit evidence-limit note.

This is intentionally not a claim that a long historical biography exists for every biblical name. Where the biblical or ecclesiastical evidence preserves only a name or short episode, the profile states that limit instead of inventing details.

The runtime also localizes common Scripture book names and generic source labels for the Greek interface.

## Evidence-status audit

The generated detail records carry an explicit evidence status rather than implying the same certainty for every entry. See `CONTENT_ACCURACY.md`. Scripture-grounded entries are limited to cited passages plus clearly identified Orthodox reception; source-linked/source-expanded entries expose their source links; catalog-summary entries explicitly warn that minor details need verification.

Every local illustration is bundled and validated. Non-venerated/context-only entries are intentionally halo-free so the navigation artwork does not accidentally imply sainthood. Historical/iconographic images are used only when a specific reusable source has been individually mapped.
