# Praying Project

<details>
<summary><strong>English</strong></summary>

<br>

<details>
<summary><strong>What This Project Is</strong></summary>

Praying Project is a bilingual Greek/English prayer repository built around fixed counts of **33**.

The supplied Orthodox prayers are divided across exactly **33 Befunge files for Greek** and exactly **33 Befunge files for English**. Each stored prayer payload is protected by **33 nested Base85 encoding layers**.

The project does not keep the reconstructed prayers permanently visible in the repository root. On the configured prayer days, GitHub Actions reconstructs them temporarily and later removes the generated files.

</details>

<details>
<summary><strong>The 33 × 33 Structure</strong></summary>

- 2 language folders: `Greek/` and `English/`.
- Exactly **33 `.befunge` files per language**.
- Exactly **33 Base85 encoding layers per payload**.
- Exactly **33 decoding rounds are required before construction can begin**.
- Exactly **33 reconstruction passes per prayer cycle**.
- Exactly **33 generated root files: `README_1.md` through `README_33.md`**.
- The generated files remain published for a target interval of exactly **33 minutes** before the prepared deletion is pushed.
- The permanent `README.md` you are reading is never part of the temporary cleanup.

</details>

<details>
<summary><strong>Worldwide 03:00 Scheduling</strong></summary>

The project has **no single fixed country timezone**.

Every global selection day, it chooses one country from an embedded list of exactly **195 countries**. Selection uses a randomized deck: every country is selected once before the full deck is shuffled again. This keeps every country eligible, including the smallest states.

For the selected country, the project uses the **IANA timezone of its capital**. The prayer cycle targets **03:00 local capital time** on:

- Sunday
- Wednesday
- Friday

The lightweight scheduler checks every 15 minutes in UTC so it can support capitals whose civil offsets include `:00`, `:30`, or `:45` minutes. The actual prayer reconstruction only proceeds when the selected capital reaches its target local time and weekday.

The selection-day boundary is 12:00 UTC. This is intentional: it gives every civil timezone from UTC−12 through UTC+14 a chance to reach its next local 03:00 within the same 24-hour selection period.

</details>

<details>
<summary><strong>Country Coverage</strong></summary>

Country data is stored locally in `data/countries.json` so the workflow does not need to call an external country API during normal operation.

The list contains exactly **195 countries**, and every entry stores:

- ISO alpha-2 code
- Country name
- Capital
- Capital IANA timezone

Examples of very small states that are explicitly included are Vatican City, Nauru, Tuvalu, Monaco, San Marino, and Liechtenstein.

</details>

<details>
<summary><strong>Workflow Sequence</strong></summary>

1. Check the current worldwide selection period.
2. Select a country if a new daily period has started.
3. Use the selected capital's IANA timezone to calculate its real local 03:00.
4. Continue only when the local day is Sunday, Wednesday, or Friday and that 03:00 target is due.
5. Read the 33 Greek and 33 English Befunge source files.
6. Decode every source payload through exactly 33 sequential Base85 layers.
7. Repeat the reconstruction process exactly 33 times.
8. Create `README_1.md` through `README_33.md` in the repository root.
9. Publish the 33 generated files.
10. Prepare their deletion locally.
11. Keep the published set for the 33-minute target interval.
12. Push the prepared deletion while preserving this permanent `README.md`.

</details>

<details>
<summary><strong>Manual Validation</strong></summary>

Validate the worldwide country data:

```bash
python scripts/select_country.py validate
```

Inspect the current selection and scheduling decision:

```bash
python scripts/select_country.py check
```

Verify the encoded prayer source integrity:

```bash
python scripts/reconstruct.py verify
```

Generate all 33 temporary prayer READMEs locally:

```bash
python scripts/reconstruct.py generate
```

Remove only the temporary `README_1.md` through `README_33.md` files:

```bash
python scripts/reconstruct.py cleanup
```

</details>

</details>

<details>
<summary><strong>Ελληνικά</strong></summary>

<br>

<details>
<summary><strong>Τι Είναι Αυτό Το Project</strong></summary>

Το Praying Project είναι ένα δίγλωσσο Ελληνικό/Αγγλικό repository προσευχών, δομημένο γύρω από σταθερούς αριθμούς **33**.

Οι Ορθόδοξες προσευχές που δόθηκαν στο project χωρίζονται σε ακριβώς **33 αρχεία Befunge για τα Ελληνικά** και ακριβώς **33 αρχεία Befunge για τα Αγγλικά**. Κάθε αποθηκευμένο τμήμα προσευχής προστατεύεται από **33 διαδοχικά επίπεδα κωδικοποίησης Base85**.

Οι ανακατασκευασμένες προσευχές δεν παραμένουν μόνιμα ορατές στη ρίζα του repository. Τις καθορισμένες ημέρες προσευχής, το GitHub Actions τις ανακατασκευάζει προσωρινά και αργότερα διαγράφει τα παραγόμενα αρχεία.

</details>

<details>
<summary><strong>Η Δομή 33 × 33</strong></summary>

- 2 φάκελοι γλωσσών: `Greek/` και `English/`.
- Ακριβώς **33 αρχεία `.befunge` ανά γλώσσα**.
- Ακριβώς **33 επίπεδα Base85 ανά payload**.
- Απαιτούνται ακριβώς **33 γύροι αποκωδικοποίησης πριν ξεκινήσει η ανακατασκευή**.
- Ακριβώς **33 ανακατασκευές σε κάθε κύκλο προσευχής**.
- Ακριβώς **33 προσωρινά αρχεία στη ρίζα: `README_1.md` έως `README_33.md`**.
- Τα παραγόμενα αρχεία παραμένουν δημοσιευμένα για στόχο ακριβώς **33 λεπτών** πριν γίνει push η ήδη προετοιμασμένη διαγραφή τους.
- Το μόνιμο `README.md` που διαβάζεις δεν συμμετέχει ποτέ στην προσωρινή διαγραφή.

</details>

<details>
<summary><strong>Παγκόσμιο Πρόγραμμα Στις 03:00</strong></summary>

Το project **δεν χρησιμοποιεί μία σταθερή ζώνη ώρας ή μία συγκεκριμένη χώρα**.

Κάθε παγκόσμια ημέρα επιλογής επιλέγει μία χώρα από ενσωματωμένη λίστα ακριβώς **195 χωρών**. Η επιλογή γίνεται με τυχαία ανακατεμένη «τράπουλα»: κάθε χώρα επιλέγεται μία φορά πριν ανακατευτούν ξανά και οι 195. Έτσι συμπεριλαμβάνονται όλες οι χώρες, ακόμα και οι μικρότερες.

Για την επιλεγμένη χώρα χρησιμοποιείται η **IANA ζώνη ώρας της πρωτεύουσάς της**. Ο κύκλος προσευχής στοχεύει στις **03:00 τοπική ώρα της πρωτεύουσας** τις ημέρες:

- Κυριακή
- Τετάρτη
- Παρασκευή

Ο ελαφρύς scheduler ελέγχει ανά 15 λεπτά σε UTC ώστε να καλύπτει και ζώνες ώρας με απόκλιση `:00`, `:30` ή `:45`. Η πραγματική ανακατασκευή εκτελείται μόνο όταν η επιλεγμένη πρωτεύουσα φτάσει στη σωστή τοπική ώρα και ημέρα.

Το όριο κάθε ημέρας επιλογής είναι στις 12:00 UTC. Αυτό επιτρέπει σε κάθε πολιτική ζώνη ώρας από UTC−12 έως UTC+14 να φτάσει στο επόμενο τοπικό 03:00 μέσα στο ίδιο 24ωρο παράθυρο επιλογής.

</details>

<details>
<summary><strong>Κάλυψη Χωρών</strong></summary>

Τα δεδομένα χωρών βρίσκονται τοπικά στο `data/countries.json`, ώστε το workflow να μη χρειάζεται εξωτερικό API χωρών κατά την κανονική λειτουργία.

Η λίστα περιέχει ακριβώς **195 χώρες** και κάθε εγγραφή περιλαμβάνει:

- ISO alpha-2 κωδικό
- Όνομα χώρας
- Πρωτεύουσα
- IANA ζώνη ώρας της πρωτεύουσας

Στις πολύ μικρές χώρες που περιλαμβάνονται ρητά είναι το Βατικανό, το Ναουρού, το Τουβαλού, το Μονακό, ο Άγιος Μαρίνος και το Λιχτενστάιν.

</details>

<details>
<summary><strong>Σειρά Εκτέλεσης Του Workflow</strong></summary>

1. Ελέγχει την τρέχουσα παγκόσμια περίοδο επιλογής.
2. Επιλέγει χώρα όταν ξεκινήσει νέα ημερήσια περίοδος.
3. Χρησιμοποιεί την IANA ζώνη ώρας της πρωτεύουσας για να υπολογίσει το πραγματικό τοπικό 03:00.
4. Συνεχίζει μόνο αν η τοπική ημέρα είναι Κυριακή, Τετάρτη ή Παρασκευή και έχει φτάσει το 03:00.
5. Διαβάζει τα 33 Ελληνικά και τα 33 Αγγλικά αρχεία Befunge.
6. Αποκωδικοποιεί κάθε payload μέσα από ακριβώς 33 διαδοχικά επίπεδα Base85.
7. Επαναλαμβάνει την ανακατασκευή ακριβώς 33 φορές.
8. Δημιουργεί τα `README_1.md` έως `README_33.md` στη ρίζα του repository.
9. Δημοσιεύει και τα 33 παραγόμενα αρχεία.
10. Προετοιμάζει τοπικά τη διαγραφή τους.
11. Διατηρεί το δημοσιευμένο σύνολο για το χρονικό στόχο των 33 λεπτών.
12. Κάνει push την προετοιμασμένη διαγραφή χωρίς να επηρεάζει το μόνιμο `README.md`.

</details>

<details>
<summary><strong>Χειροκίνητος Έλεγχος</strong></summary>

Έλεγχος των παγκόσμιων δεδομένων χωρών:

```bash
python scripts/select_country.py validate
```

Προβολή της τρέχουσας επιλογής χώρας και της απόφασης προγραμματισμού:

```bash
python scripts/select_country.py check
```

Έλεγχος ακεραιότητας των κωδικοποιημένων προσευχών:

```bash
python scripts/reconstruct.py verify
```

Δημιουργία και των 33 προσωρινών README τοπικά:

```bash
python scripts/reconstruct.py generate
```

Διαγραφή μόνο των προσωρινών `README_1.md` έως `README_33.md`:

```bash
python scripts/reconstruct.py cleanup
```

</details>

</details>
