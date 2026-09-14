(()=>{
  'use strict';
  const entries=Array.isArray(window.ORTHODOX_ENTRIES)?window.ORTHODOX_ENTRIES:[];
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  // Runtime Greek normalizer for reference labels and legacy records. Keep the
  // replacements domain-specific; never machine-translate whole biographies.
  const refMap=[
    [/Orthodox Church in America/gi,'Ορθόδοξη Εκκλησία στην Αμερική'],
    [/Church tradition \/ Lives of the Saints/gi,'Εκκλησιαστική παράδοση / Βίοι Αγίων'],
    [/Lives of the Saints/gi,'Βίοι Αγίων'],[/Church tradition/gi,'Εκκλησιαστική παράδοση'],[/Liturgical tradition/gi,'Λειτουργική παράδοση'],
    [/Biblical \/ historical context/gi,'Βιβλικό / ιστορικό πλαίσιο'],[/Biblical \/ visionary context/gi,'Βιβλικό / οραματικό πλαίσιο'],
    [/New Testament/gi,'Καινή Διαθήκη'],[/Old Testament/gi,'Παλαιά Διαθήκη'],[/Synoptic Gospels/gi,'Συνοπτικά Ευαγγέλια'],[/Gospels/gi,'Ευαγγέλια'],[/Gospel/gi,'Ευαγγέλιο'],
    [/Early Church tradition/gi,'Αρχαία εκκλησιαστική παράδοση'],[/Early Antiochian tradition/gi,'Αρχαία αντιοχειανή παράδοση'],[/Orthodox angelic tradition/gi,'Ορθόδοξη αγγελική παράδοση'],[/Orthodox tradition/gi,'Ορθόδοξη παράδοση'],[/apostolic tradition/gi,'αποστολική παράδοση'],[/by tradition/gi,'κατά την παράδοση'],[/later Jewish history/gi,'μεταγενέστερη ιουδαϊκή ιστορία'],[/later tradition/gi,'μεταγενέστερη παράδοση'],
    [/Pauline Epistles/gi,'Επιστολές του Παύλου'],[/General Epistles/gi,'Καθολικές Επιστολές'],[/Wisdom tradition/gi,'Σοφιολογική παράδοση'],
    [/Wisdom of Solomon/gi,'Σοφία Σολομώντος'],[/Song of the Three Holy Youths/gi,'Ωδή των Τριών Αγίων Παίδων'],[/Prayer of Manasseh/gi,'Προσευχή Μανασσή'],[/Song of Songs/gi,'Άσμα Ασμάτων'],
    [/Lamentations/gi,'Θρήνοι'],[/1 Esdras/gi,'Α΄ Έσδρας'],[/2 Esdras/gi,'Β΄ Έσδρας'],[/Esdras/gi,'Έσδρας'],[/Sirach/gi,'Σειράχ'],[/Baruch/gi,'Βαρούχ'],
    [/Genesis/gi,'Γένεση'],[/Exodus/gi,'Έξοδος'],[/Leviticus/gi,'Λευιτικό'],[/Numbers/gi,'Αριθμοί'],[/Deuteronomy/gi,'Δευτερονόμιο'],[/Joshua/gi,'Ιησούς του Ναυή'],[/Judges/gi,'Κριτές'],[/Ruth/gi,'Ρουθ'],[/Samuel/gi,'Σαμουήλ'],[/Kings/gi,'Βασιλειών'],[/Chronicles/gi,'Παραλειπομένων'],[/Ezra/gi,'Έσδρας'],[/Nehemiah/gi,'Νεεμίας'],[/Esther/gi,'Εσθήρ'],[/Job/gi,'Ιώβ'],[/Psalms?/gi,'Ψαλμοί'],[/Proverbs/gi,'Παροιμίες'],[/Ecclesiastes/gi,'Εκκλησιαστής'],[/Isaiah/gi,'Ησαΐας'],[/Jeremiah/gi,'Ιερεμίας'],[/Ezekiel/gi,'Ιεζεκιήλ'],[/Daniel/gi,'Δανιήλ'],[/Tobit/gi,'Τωβίτ'],[/Judith/gi,'Ιουδίθ'],[/Maccabees/gi,'Μακκαβαίων'],
    [/Hosea/gi,'Ωσηέ'],[/Joel/gi,'Ιωήλ'],[/Amos/gi,'Αμώς'],[/Obadiah/gi,'Αβδιού'],[/Jonah/gi,'Ιωνάς'],[/Micah/gi,'Μιχαίας'],[/Nahum/gi,'Ναούμ'],[/Habakkuk/gi,'Αββακούμ'],[/Zephaniah/gi,'Σοφονίας'],[/Haggai/gi,'Αγγαίος'],[/Zechariah/gi,'Ζαχαρίας'],[/Malachi/gi,'Μαλαχίας'],
    [/Matthew/gi,'Ματθαίος'],[/Mark/gi,'Μάρκος'],[/Luke/gi,'Λουκάς'],[/John/gi,'Ιωάννης'],[/Acts/gi,'Πράξεις'],[/Romans/gi,'Ρωμαίους'],[/Corinthians/gi,'Κορινθίους'],[/Galatians/gi,'Γαλάτας'],[/Ephesians/gi,'Εφεσίους'],[/Philippians/gi,'Φιλιππησίους'],[/Colossians/gi,'Κολοσσαείς'],[/Thessalonians/gi,'Θεσσαλονικείς'],[/Timothy/gi,'Τιμόθεον'],[/Titus/gi,'Τίτον'],[/Philemon/gi,'Φιλήμονα'],[/Hebrews/gi,'Εβραίους'],[/James/gi,'Ιακώβου'],[/Peter/gi,'Πέτρου'],[/Jude/gi,'Ιούδα'],[/Revelation/gi,'Αποκάλυψη'],
    [/Pentecost/gi,'Πεντηκοστή'],[/Exaltation of the Cross/gi,'Ύψωση του Τιμίου Σταυρού'],[/Clean Monday/gi,'Καθαρά Δευτέρα'],[/Seventh Ecumenical Council/gi,'Ζ΄ Οικουμενική Σύνοδος'],[/Ecumenical Council/gi,'Οικουμενική Σύνοδος'],
    [/Early Christian letters/gi,'Πρωτοχριστιανικές επιστολές'],[/Early Christian apologetic writings/gi,'Πρωτοχριστιανικά απολογητικά συγγράμματα'],[/Early Christian/gi,'Πρωτοχριστιανική'],[/traditional identification/gi,'παραδοσιακή ταύτιση'],[/angelic tradition/gi,'αγγελική παράδοση'],[/Jewish history/gi,'ιουδαϊκή ιστορία'],
    [/patristic and conciliar history/gi,'πατερική και συνοδική ιστορία'],[/hagiographic comparison with/gi,'αγιολογική σύγκριση με'],[/modern biographical testimony/gi,'σύγχρονη βιογραφική μαρτυρία'],[/Lenten liturgical tradition/gi,'λειτουργική παράδοση της Μεγάλης Τεσσαρακοστής'],[/Paschal liturgical tradition/gi,'πασχάλια λειτουργική παράδοση'],[/Second Sunday after Pentecost in OCA usage/gi,'Δεύτερη Κυριακή μετά την Πεντηκοστή κατά τη χρήση της OCA'],[/Seventh Ecumenical Council memory/gi,'μνήμη της Ζ΄ Οικουμενικής Συνόδου'],[/Romans 16 circle/gi,'κύκλος της Ρωμαίους 16'],
    [/Early Εκκλησιαστική παράδοση/gi,'Αρχαία εκκλησιαστική παράδοση'],[/Πρωτοχριστιανική tradition/gi,'Πρωτοχριστιανική παράδοση'],[/Ρωμαίους 16 circle/gi,'κύκλος προσώπων της Ρωμαίους 16'],[/\btradition\b/gi,'παράδοση'],[/Ζ΄ Οικουμενική Σύνοδος memory/gi,'μνήμη της Ζ΄ Οικουμενικής Συνόδου'],[/Lenten Λειτουργική παράδοση/gi,'λειτουργική παράδοση της Μεγάλης Τεσσαρακοστής'],[/Paschal Λειτουργική παράδοση/gi,'πασχάλια λειτουργική παράδοση'],[/Second Κυριακή μετά από Πεντηκοστή in OCA usage/gi,'Δεύτερη Κυριακή μετά την Πεντηκοστή κατά τη χρήση της OCA'],[/Greek Orthodox/gi,'Ελληνική Ορθόδοξη'],[/Greek Daniel/gi,'ελληνικό κείμενο του Δανιήλ'],[/Susanna/gi,'Σουσάννα'],
    [/Public domain artwork/gi,'έργο κοινό κτήμα'],[/Public domain/gi,'κοινό κτήμα'],[/Orthodox icon/gi,'Ορθόδοξη εικόνα'],[/Russian icon/gi,'Ρωσική εικόνα'],[/Byzantine icon/gi,'Βυζαντινή εικόνα'],[/Wikimedia Commons/gi,'Wikimedia Commons'],[/cf\./gi,'πρβλ.']
  ];
  function translateEl(s){let out=clean(s);for(const [a,b] of refMap)out=out.replace(a,b);return out||'—'}
  function refEl(s){return translateEl(s)}
  window.ORTHODOX_LOCALIZE_EL=translateEl;
  const kind={
    christ:{en:'This is a theological and biblical entry about the divine mystery confessed by the Orthodox Church. The profile therefore distinguishes revealed doctrine from chronological biography.',el:'Πρόκειται για θεολογική και βιβλική καταχώριση σχετικά με το θείο μυστήριο που ομολογεί η Ορθόδοξη Εκκλησία. Γι’ αυτό διακρίνεται η αποκαλυμμένη διδασκαλία από τη χρονολογική βιογραφία.'},
    theotokos:{en:'Orthodox teaching about the Theotokos is Christ-centered: her title safeguards the confession that the one born from her is truly God incarnate. Scripture is the foundation; early Christian and liturgical tradition explains how the Church received and celebrated that witness.',el:'Η ορθόδοξη διδασκαλία για τη Θεοτόκο είναι χριστοκεντρική: ο τίτλος της διαφυλάσσει την ομολογία ότι Εκείνος που γεννήθηκε από αυτήν είναι αληθινά ο Θεός που ενανθρώπησε. Θεμέλιο είναι η Γραφή, ενώ η αρχαία χριστιανική και λειτουργική παράδοση δείχνει πώς η Εκκλησία παρέλαβε και εόρτασε αυτή τη μαρτυρία.'},
    angel:{en:'Holy angels are understood as created, bodiless servants of God. Scriptural statements, deuterocanonical material, later liturgical tradition, and iconographic symbolism do not all have the same historical status; this profile keeps those layers distinct.',el:'Οι άγιοι άγγελοι νοούνται ως κτιστοί, ασώματοι λειτουργοί του Θεού. Οι βιβλικές μαρτυρίες, τα δευτεροκανονικά κείμενα, η μεταγενέστερη λειτουργική παράδοση και ο εικονογραφικός συμβολισμός δεν έχουν όλα το ίδιο ιστορικό βάρος· το προφίλ διακρίνει αυτά τα επίπεδα.'},
    forefather:{en:'The Forefathers belong to the biblical history through which Orthodox worship traces the preparation for the Incarnation. Their stories are read both as events in Israel’s sacred history and typologically in relation to Christ.',el:'Οι Προπάτορες ανήκουν στη βιβλική ιστορία μέσα από την οποία η ορθόδοξη λατρεία βλέπει την προετοιμασία για την Ενανθρώπηση. Οι διηγήσεις τους διαβάζονται τόσο ως γεγονότα της ιερής ιστορίας του Ισραήλ όσο και τυπολογικά σε σχέση με τον Χριστό.'},
    righteous:{en:'This biblical righteous figure is remembered for a concrete place in the history of God’s people. The amount of preserved biography varies greatly: some receive long narratives, while others are known from only a genealogy, title, or short episode.',el:'Το βιβλικό αυτό δίκαιο πρόσωπο μνημονεύεται για συγκεκριμένη θέση στην ιστορία του λαού του Θεού. Η διασωζόμενη βιογραφία ποικίλλει πολύ: για ορισμένους υπάρχουν εκτενείς διηγήσεις, ενώ άλλοι είναι γνωστοί μόνο από γενεαλογία, τίτλο ή σύντομο επεισόδιο.'},
    prophet:{en:'Orthodox tradition receives the prophets as witnesses to God’s covenant, repentance, justice, hope, and the coming of the Messiah. Their biblical books or narratives remain the primary evidence; later traditions are identified as such.',el:'Η Ορθόδοξη παράδοση δέχεται τους προφήτες ως μάρτυρες της διαθήκης του Θεού, της μετάνοιας, της δικαιοσύνης, της ελπίδας και της έλευσης του Μεσσία. Τα βιβλικά βιβλία ή οι διηγήσεις τους αποτελούν την κύρια μαρτυρία· οι μεταγενέστερες παραδόσεις δηλώνονται ως τέτοιες.'},
    apostle:{en:'The apostolic record combines New Testament evidence with early Church memory about preaching, episcopal ministry, journeys, martyrdom, and relics. Where later traditions differ, the profile avoids presenting one uncertain version as undisputed history.',el:'Η αποστολική παράδοση συνδυάζει τη μαρτυρία της Καινής Διαθήκης με την αρχαία εκκλησιαστική μνήμη για κήρυγμα, επισκοπική διακονία, ταξίδια, μαρτύριο και λείψανα. Όπου οι μεταγενέστερες παραδόσεις διαφέρουν, το προφίλ δεν παρουσιάζει μία αβέβαιη εκδοχή ως αδιαμφισβήτητη ιστορία.'},
    'nt-saint':{en:'The New Testament gives the primary record for this person, sometimes supplemented by early Christian tradition. The profile separates what the canonical text says from later identifications and local memories.',el:'Η Καινή Διαθήκη δίνει την κύρια μαρτυρία για το πρόσωπο, μερικές φορές συμπληρωμένη από αρχαία χριστιανική παράδοση. Το προφίλ διακρίνει όσα λέει το κανονικό κείμενο από μεταγενέστερες ταυτίσεις και τοπικές μνήμες.'},
    'church-saint':{en:'The saint’s memory is preserved through historical testimony, synaxaria, liturgical texts, letters or writings, relic traditions, and local Church memory. Hagiography may include theological or miracle narratives in addition to datable historical facts; both are presented without pretending they are identical kinds of evidence.',el:'Η μνήμη του αγίου διασώζεται μέσα από ιστορικές μαρτυρίες, συναξάρια, λειτουργικά κείμενα, επιστολές ή συγγράμματα, παραδόσεις λειψάνων και τοπική εκκλησιαστική μνήμη. Η αγιογραφία μπορεί να περιλαμβάνει θεολογικές ή θαυματουργικές διηγήσεις μαζί με χρονολογήσιμα ιστορικά δεδομένα· παρουσιάζονται χωρίς να θεωρούνται το ίδιο είδος μαρτυρίας.'},
    feast:{en:'This record is a liturgical event rather than one person’s biography. The complete meaning belongs to Scripture, hymnography, iconography, fasting or festal practice, and the way the feast fits into the Church year.',el:'Η καταχώριση αφορά λειτουργικό γεγονός και όχι βιογραφία ενός προσώπου. Το πλήρες νόημα ανήκει στη Γραφή, την υμνογραφία, την εικονογραφία, τη νηστευτική ή εορταστική πράξη και τη θέση της εορτής μέσα στο εκκλησιαστικό έτος.'},
    'biblical-context':{en:'This person or being is included because it matters to the biblical narrative, but the catalog does not thereby present it as holy or venerated. The prayer tab is directed to God rather than to a non-venerated figure.',el:'Το πρόσωπο ή ον περιλαμβάνεται επειδή έχει σημασία στη βιβλική διήγηση, χωρίς αυτό να σημαίνει ότι παρουσιάζεται ως άγιο ή τιμώμενο. Η καρτέλα προσευχής απευθύνεται στον Θεό και όχι σε μη τιμώμενο πρόσωπο.'}
  };
  function sourceArray(e){
    const out=Array.isArray(e.sources)?e.sources.filter(s=>s&&(s.url||s.label)).slice():[];
    const ref=clean(e.scripture);
    if(ref&&!out.some(s=>s.kind==='local-reference'))out.unshift({kind:'local-reference',label:{en:`Scripture / tradition reference: ${ref}`,el:`Γραφή / παράδοση: ${refEl(ref)}`}});
    if(e.sourceUrl&&!out.some(s=>s.url===e.sourceUrl))out.push({label:{en:'Primary Orthodox reference',el:'Κύρια ορθόδοξη αναφορά'},url:e.sourceUrl});
    if((e.category==='church-saint'||e.category==='apostle'||e.category==='nt-saint')&&!out.some(s=>s.url)){
      const q=encodeURIComponent(e.name?.en||e.id);out.push({label:{en:'OCA Lives of the Saints search',el:'Αναζήτηση στους Βίους Αγίων της OCA'},url:`https://www.oca.org/saints/lives?q=${q}`});
    }
    return out;
  }
  function aliases(e,lang){const all=(e.aliases||[]).filter(Boolean);const a=lang==='el'?all.filter(x=>/[\u0370-\u03ff\u1f00-\u1fff]/.test(String(x))):all;return a.length?a.join(', '):(lang==='el'?'Δεν υπάρχουν πρόσθετες ελληνικές ονομασίες αποθηκευμένες σε αυτή την έκδοση.':'No additional aliases are stored in this edition.');}
  function completeness(e,lang){
    const sparse=clean(e.story?.[lang]).length<150;
    if(lang==='el')return sparse?'Η σωζόμενη τοπική καταγραφή είναι σύντομη. Αυτό δεν συμπληρώνεται με εικασία: όταν η Γραφή ή οι πηγές διασώζουν μόνο όνομα, γενεαλογία, αξίωμα ή σύντομο επεισόδιο, το όριο δηλώνεται καθαρά. Οι σύνδεσμοι πηγών επιτρέπουν περαιτέρω έλεγχο όπου υπάρχουν.':'Η καταχώριση συγκεντρώνει τα στοιχεία που είναι αποθηκευμένα τοπικά και δηλώνει χωριστά βιβλική μαρτυρία, εκκλησιαστική παράδοση και τυχόν αβεβαιότητες. Δεν επινοούνται γεγονότα για να φανεί η βιογραφία μεγαλύτερη.';
    return sparse?'The surviving local record is brief. It is not padded with invented biography: when Scripture or the sources preserve only a name, genealogy, office, or short episode, that boundary is stated clearly. Source links are provided for further verification where available.':'This entry gathers the material stored locally while keeping biblical evidence, Church tradition, and uncertainty distinct. Missing events are not invented merely to make the biography appear longer.';
  }
  for(const e of entries){
    const enName=clean(e.name?.en||e.id), elName=clean(e.name?.el||e.name?.en||e.id), ctx=kind[e.category]||kind['biblical-context'];
    const enStory=clean(e.story?.en)||`${enName} is present in the catalog because of a recorded role in Scripture or Orthodox tradition.`;
    const elStory=clean(e.story?.el)||`Ο/Η ${elName} περιλαμβάνεται στον κατάλογο λόγω καταγεγραμμένου ρόλου στη Γραφή ή στην Ορθόδοξη παράδοση.`;
    const refs=clean(e.scripture||'—'), refsEl=refEl(refs), feastEn=clean(e.feast?.en||'—'), feastEl=clean(e.feast?.el||e.feast?.en||'—');
    e.scriptureText={en:refs,el:refsEl};
    const src=sourceArray(e);if(src.length)e.sources=src;
    // A deep, hand-curated profile loaded earlier always wins. Otherwise build a complete local dossier from every field we actually possess.
    if(!e.knowledge){
      e.knowledge={
        en:{sections:[
          {title:'Life / known narrative',text:enStory},
          {title:'Identity and setting',text:`${enName} is recorded here as ${clean(e.role?.en)||'a figure in Scripture or Orthodox tradition'}. ${ctx.en}`},
          {title:'Biblical and documentary evidence',text:`Recorded biblical, historical, or traditional references: ${refs}. The wording here distinguishes the source record from later interpretation instead of merging every layer into one biography.`},
          {title:'Orthodox reception and meaning',text:e.venerated===false?`This is a context record, not a declaration of sainthood. Its value is to understand the biblical narrative, moral setting, genealogy, historical background, or symbolic vision in which ${enName} appears.`:`Orthodox memory receives ${enName} within prayer, Scripture, hymnography, synaxarial reading, theology, or local devotion according to the kind of figure represented. Veneration is directed to God’s work in the saint and is distinct from the worship due to God alone.`},
          {title:'Commemoration / calendar',text:`${feastEn}. Calendar dates can differ where Orthodox jurisdictions use different civil or liturgical calendars; local parish calendars remain the practical authority for a given community.`},
          {title:'Names and aliases',text:`Primary stored name: ${enName}. ${aliases(e,'en')}`},
          {title:'Stored notes and cautions',text:clean(e.notes?.en)||'No additional local note is stored for this record.'},
          {title:'Extent of what is known',text:completeness(e,'en')}
        ],sources:src},
        el:{sections:[
          {title:'Βίος / γνωστή διήγηση',text:elStory},
          {title:'Ταυτότητα και πλαίσιο',text:`Ο/Η ${elName} καταγράφεται εδώ ως ${clean(e.role?.el||e.role?.en)||'πρόσωπο της Γραφής ή της Ορθόδοξης παράδοσης'}. ${ctx.el}`},
          {title:'Βιβλική και τεκμηριακή μαρτυρία',text:`Καταγεγραμμένες βιβλικές, ιστορικές ή παραδοσιακές αναφορές: ${refsEl}. Η διατύπωση διακρίνει τη μαρτυρία της πηγής από τη μεταγενέστερη ερμηνεία αντί να συγχωνεύει όλα τα επίπεδα σε μία ενιαία βιογραφία.`},
          {title:'Ορθόδοξη πρόσληψη και νόημα',text:e.venerated===false?`Πρόκειται για καταχώριση πλαισίου και όχι για δήλωση αγιότητας. Η αξία της είναι να κατανοηθεί η βιβλική διήγηση, το ηθικό ή ιστορικό πλαίσιο, η γενεαλογία ή η συμβολική όραση στην οποία εμφανίζεται ο/η ${elName}.`:`Η Ορθόδοξη μνήμη προσλαμβάνει τον/την ${elName} μέσα στην προσευχή, τη Γραφή, την υμνογραφία, το συναξάρι, τη θεολογία ή την τοπική ευσέβεια ανάλογα με το είδος της καταχώρισης. Η τιμητική προσκύνηση διακρίνεται από τη λατρεία που ανήκει μόνο στον Θεό.`},
          {title:'Μνήμη / ημερολόγιο',text:`${feastEl}. Οι ημερομηνίες μπορεί να διαφέρουν όταν οι ορθόδοξες δικαιοδοσίες χρησιμοποιούν διαφορετικό πολιτικό ή λειτουργικό ημερολόγιο· για την πράξη μιας κοινότητας υπερισχύει το τοπικό εκκλησιαστικό ημερολόγιο.`},
          {title:'Ονόματα και εναλλακτικές',text:`Κύρια αποθηκευμένη ονομασία: ${elName}. ${aliases(e,'el')}`},
          {title:'Αποθηκευμένες σημειώσεις και επιφυλάξεις',text:clean(e.notes?.el||e.notes?.en)||'Δεν υπάρχει πρόσθετη τοπική σημείωση για αυτή την καταχώριση.'},
          {title:'Έκταση των διαθέσιμων γνώσεων',text:completeness(e,'el')}
        ],sources:src}
      };
    }
    // Preserve the old profile shape for backward compatibility with older app versions.
    e.profile={en:{overview:enStory,identity:ctx.en,sources:`References: ${refs}`,commemoration:feastEn,names:`${enName}; ${aliases(e,'en')}`},el:{overview:elStory,identity:ctx.el,sources:`Αναφορές: ${refsEl}`,commemoration:feastEl,names:`${elName}; ${aliases(e,'el')}`}};

    // Clean legacy English reference terms that survived inside Greek-mode fields.
    for(const key of ['role','story','feast','prayer','notes'])if(e[key]?.el)e[key].el=translateEl(e[key].el);
    if(e.scriptureText?.el)e.scriptureText.el=translateEl(e.scriptureText.el);
    if(e.profile?.el)for(const key of Object.keys(e.profile.el))if(typeof e.profile.el[key]==='string')e.profile.el[key]=translateEl(e.profile.el[key]);
    if(e.knowledge?.el?.sections)for(const sec of e.knowledge.el.sections){
      if(typeof sec.title==='string')sec.title=translateEl(sec.title);
      else if(sec.title?.el)sec.title.el=translateEl(sec.title.el);
      if(typeof sec.text==='string')sec.text=translateEl(sec.text);
      else if(sec.text?.el)sec.text.el=translateEl(sec.text.el);
    }
    const allSources=[...(Array.isArray(e.sources)?e.sources:[]),...(Array.isArray(e.knowledge?.el?.sources)?e.knowledge.el.sources:[])];
    for(const source of allSources)if(source?.label?.el)source.label.el=translateEl(source.label.el);
    if(e.imageMeta?.credit?.el)e.imageMeta.credit.el=translateEl(e.imageMeta.credit.el);
  }
})();
