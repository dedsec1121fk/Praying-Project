#!/usr/bin/env python3
from __future__ import annotations
import json, re, html
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'web'/'data'; IMG=ROOT/'web'/'images'/'people'
IMG.mkdir(parents=True, exist_ok=True)
DATA.mkdir(parents=True, exist_ok=True)

SOURCE_OCA='https://www.oca.org/fs'
SOURCE_NA='https://www.oca.org/fs/north-american-saints'
SOURCE_GOARCH='https://www.goarch.org/chapel/planner'

base_files=['entries.js','expanded-biblical.js','church-saints.js','feasts.js','biblical-context.js']
existing=[]
for fn in base_files:
    p=DATA/fn
    arr=json.loads(p.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    existing.extend(arr)
ids={e['id'] for e in existing}


def slug(s):
    s=s.lower().replace('’','').replace("'",'').replace('—','-')
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')

def entry(id,en,el,cat,role_en,role_el,scripture='Church tradition / Lives of the Saints',feast_en='See local Orthodox calendar',feast_el='Βλ. τοπικό ορθόδοξο ημερολόγιο',story_en=None,story_el=None,venerated=True,source=SOURCE_OCA,aliases=None):
    if story_en is None:
        if cat=='biblical-context':
            story_en=f'{en} appears in the biblical narrative as {role_en.lower()}. This concise entry is included so the searchable biblical network covers more of Scripture.'
            story_el=f'Ο/Η {el} εμφανίζεται στη βιβλική διήγηση ως {role_el.lower()}. Η σύντομη καταχώριση προστέθηκε ώστε ο αναζητήσιμος βιβλικός ιστός να καλύπτει περισσότερα πρόσωπα της Γραφής.'
        elif cat=='feast':
            story_en=f'{en} is kept in Orthodox liturgical memory. The entry provides a compact point of reference for the feast within the wider network.'
            story_el=f'Η εορτή «{el}» ανήκει στη λειτουργική μνήμη της Ορθόδοξης Εκκλησίας. Η καταχώριση δίνει ένα σύντομο σημείο αναφοράς μέσα στον ευρύτερο ιστό.'
        else:
            story_en=f'{en} is honored in Orthodox tradition as {role_en.lower()}. This compact entry is intended for discovery; consult an Orthodox synaxarion for the full life and hymns.'
            story_el=f'Ο/Η {el} τιμάται στην Ορθόδοξη παράδοση ως {role_el.lower()}. Η σύντομη καταχώριση προορίζεται για ανακάλυψη· για πλήρη βίο και ύμνους συμβουλευτείτε ορθόδοξο συναξάρι.'
    if cat=='biblical-context' or not venerated:
        prayer_en='Lord, grant me discernment to understand this biblical account, reject what is evil, imitate what is good, and remain faithful to You.'
        prayer_el='Κύριε, δώσε μου διάκριση να κατανοώ αυτή τη βιβλική διήγηση, να απορρίπτω το κακό, να μιμούμαι το αγαθό και να μένω πιστός σε Σένα.'
        notes_en='Biblical-context entry: this figure is not presented here as a saint or as an object of veneration.'
        notes_el='Καταχώριση βιβλικού πλαισίου: το πρόσωπο δεν παρουσιάζεται εδώ ως άγιος ή ως αντικείμενο τιμής.'
    elif cat=='angel':
        prayer_en=f'Holy {en}, servant of God, help us remain faithful to God and resist evil.'
        prayer_el=f'Άγιε {el}, λειτουργέ του Θεού, βοήθησέ μας να μένουμε πιστοί στον Θεό και να αντιστεκόμαστε στο κακό.'
        notes_en='Orthodox angelology should be read together with Scripture and the Church’s liturgical tradition.'
        notes_el='Η ορθόδοξη αγγελολογία πρέπει να μελετάται μαζί με τη Γραφή και τη λειτουργική παράδοση της Εκκλησίας.'
    elif cat=='feast':
        prayer_en='Lord Jesus Christ, grant us to enter the mystery commemorated by this feast with faith, repentance, thanksgiving, and love.'
        prayer_el='Κύριε Ιησού Χριστέ, αξίωσέ μας να ζήσουμε το μυστήριο που τιμά αυτή η εορτή με πίστη, μετάνοια, ευχαριστία και αγάπη.'
        notes_en='Dates and local observance can differ between Orthodox calendars and jurisdictions.'
        notes_el='Οι ημερομηνίες και η τοπική τήρηση μπορεί να διαφέρουν μεταξύ ορθόδοξων ημερολογίων και δικαιοδοσιών.'
    else:
        prayer_en=f'Holy {en}, pray to God for us, that we may grow in faith, repentance, courage, humility, and love.'
        prayer_el=f'Άγιε/Αγία {el}, πρέσβευε στον Θεό για μας, ώστε να αυξανόμαστε σε πίστη, μετάνοια, θάρρος, ταπείνωση και αγάπη.'
        notes_en='Concise educational entry; consult an Orthodox synaxarion or local calendar for the full life, hymns, and jurisdiction-specific commemoration.'
        notes_el='Σύντομη εκπαιδευτική καταχώριση· για πλήρη βίο, ύμνους και τοπική μνήμη συμβουλευτείτε ορθόδοξο συναξάρι ή τοπικό ημερολόγιο.'
    e={'id':id,'name':{'en':en,'el':el},'category':cat,'role':{'en':role_en,'el':role_el},'story':{'en':story_en,'el':story_el},'feast':{'en':feast_en,'el':feast_el},'scripture':scripture,'prayer':{'en':prayer_en,'el':prayer_el},'notes':{'en':notes_en,'el':notes_el},'aliases':aliases or [],'venerated':bool(venerated),'image':f'web/images/people/{id}.svg'}
    if source:
        e['sourceUrl']=source; e['sourceLabel']='Orthodox calendar / reference'
    e['search']=' '.join([en,el,role_en,role_el,scripture,*(aliases or [])])
    return e

new=[]
def add(*args,**kw):
    e=entry(*args,**kw)
    if e['id'] in ids or any(x['id']==e['id'] for x in new): return False
    new.append(e); return True

# ---- Additional saints, martyrs, confessors, monastics, hierarchs, rulers, missionaries ----
saints=[
('clement-rome','Saint Clement of Rome','Άγιος Κλήμης Ρώμης','Apostolic Father and Bishop of Rome','Αποστολικός Πατέρας και Επίσκοπος Ρώμης','25 November'),
('hippolytus-rome','Saint Hippolytus of Rome','Άγιος Ιππόλυτος Ρώμης','Hieromartyr and early Christian writer','Ιερομάρτυρας και αρχαίος χριστιανός συγγραφέας','30 January'),
('gregory-thaumaturgus','Saint Gregory the Wonderworker','Άγιος Γρηγόριος ο Θαυματουργός','Bishop of Neocaesarea and wonderworker','Επίσκοπος Νεοκαισαρείας και θαυματουργός','17 November'),
('peter-alexandria','Saint Peter of Alexandria','Άγιος Πέτρος Αλεξανδρείας','Archbishop and hieromartyr','Αρχιεπίσκοπος και ιερομάρτυρας','25 November'),
('alexander-alexandria','Saint Alexander of Alexandria','Άγιος Αλέξανδρος Αλεξανδρείας','Archbishop and defender of Nicene faith','Αρχιεπίσκοπος και υπερασπιστής της Νικαίας','29 May'),
('cyril-jerusalem','Saint Cyril of Jerusalem','Άγιος Κύριλλος Ιεροσολύμων','Bishop and catechetical teacher','Επίσκοπος και κατηχητής','18 March'),
('martin-tours','Saint Martin of Tours','Άγιος Μαρτίνος Τουρώνης','Bishop, ascetic, and pastor','Επίσκοπος, ασκητής και ποιμένας','11 November'),
('jerome','Saint Jerome of Stridon','Άγιος Ιερώνυμος','Biblical scholar and monastic writer','Ερμηνευτής της Γραφής και μοναχικός συγγραφέας','15 June'),
('leo-great','Saint Leo the Great','Άγιος Λέων ο Μέγας','Bishop of Rome and Church Father','Επίσκοπος Ρώμης και Πατέρας της Εκκλησίας','18 February'),
('john-cassian','Saint John Cassian','Άγιος Ιωάννης Κασσιανός','Monastic writer and bridge between East and West','Μοναχικός συγγραφέας και γέφυρα Ανατολής και Δύσης','29 February'),
('scholastica','Saint Scholastica','Αγία Σχολαστική','Western monastic saint','Μοναχή αγία της Δύσεως','10 February'),
('gregory-dialogist','Saint Gregory the Dialogist','Άγιος Γρηγόριος ο Διάλογος','Bishop of Rome and liturgical father','Επίσκοπος Ρώμης και λειτουργικός πατέρας','12 March'),
('bede-venerable','Saint Bede the Venerable','Άγιος Βέδας ο Οσιολογιώτατος','Monk, historian, and biblical scholar','Μοναχός, ιστορικός και ερμηνευτής της Γραφής','25 May'),
('boniface-germany','Saint Boniface of Germany','Άγιος Βονιφάτιος Γερμανίας','Missionary bishop and martyr','Ιεραπόστολος επίσκοπος και μάρτυρας','5 June'),
('ansgar','Saint Ansgar','Άγιος Άνσγαρος','Missionary bishop of Scandinavia','Ιεραπόστολος επίσκοπος της Σκανδιναβίας','3 February'),
('david-wales','Saint David of Wales','Άγιος Δαβίδ Ουαλίας','Bishop and monastic founder','Επίσκοπος και ιδρυτής μονών','1 March'),
('edward-confessor','Saint Edward the Confessor','Άγιος Εδουάρδος ο Ομολογητής','Righteous king of England','Δίκαιος βασιλιάς της Αγγλίας','13 October'),
('olaf-norway','Saint Olaf of Norway','Άγιος Όλαφ Νορβηγίας','Martyr king and evangelizer','Μάρτυρας βασιλιάς και εκχριστιανιστής','29 July'),
('macarius-alexandria','Saint Macarius of Alexandria','Άγιος Μακάριος Αλεξανδρείας','Desert Father and ascetic','Πατέρας της Ερήμου και ασκητής','19 January'),
('arsenius-great','Saint Arsenius the Great','Άγιος Αρσένιος ο Μέγας','Desert Father and hermit','Πατέρας της Ερήμου και ερημίτης','8 May'),
('poemen-great','Saint Poemen the Great','Άγιος Ποιμήν ο Μέγας','Desert Father and spiritual teacher','Πατέρας της Ερήμου και πνευματικός διδάσκαλος','27 August'),
('sisoes-great','Saint Sisoes the Great','Άγιος Σισώης ο Μέγας','Desert Father','Πατέρας της Ερήμου','6 July'),
('onuphrius-great','Saint Onuphrius the Great','Άγιος Ονούφριος ο Μέγας','Hermit of the Egyptian desert','Ερημίτης της αιγυπτιακής ερήμου','12 June'),
('syncletica','Saint Syncletica of Alexandria','Αγία Συγκλητική','Desert Mother and ascetic teacher','Μητέρα της Ερήμου και ασκήτρια διδασκάλισσα','5 January'),
('sarah-desert','Saint Sarah of the Desert','Αγία Σάρρα της Ερήμου','Desert Mother and ascetic','Μητέρα της Ερήμου και ασκήτρια','13 July'),
('hilarion-great','Saint Hilarion the Great','Άγιος Ιλαρίων ο Μέγας','Monastic founder in Palestine','Μοναστικός ιδρυτής στην Παλαιστίνη','21 October'),
('theodosius-cenobiarch','Saint Theodosius the Cenobiarch','Άγιος Θεοδόσιος ο Κοινοβιάρχης','Founder and organizer of cenobitic monasticism','Ιδρυτής και οργανωτής κοινοβιακού μοναχισμού','11 January'),
('dorotheus-gaza','Saint Dorotheus of Gaza','Άγιος Δωρόθεος Γάζης','Monastic spiritual teacher','Μοναχικός πνευματικός διδάσκαλος','13 August'),
('barsanuphius-gaza','Saint Barsanuphius the Great','Άγιος Βαρσανούφιος ο Μέγας','Monastic elder of Gaza','Μοναχικός γέροντας της Γάζας','6 February'),
('john-prophet-gaza','Saint John the Prophet of Gaza','Άγιος Ιωάννης ο Προφήτης της Γάζας','Monastic elder and spiritual guide','Μοναχικός γέροντας και πνευματικός οδηγός','6 February'),
('andrew-crete','Saint Andrew of Crete','Άγιος Ανδρέας Κρήτης','Archbishop and hymnographer','Αρχιεπίσκοπος και υμνογράφος','4 July'),
('theodore-studite','Saint Theodore the Studite','Άγιος Θεόδωρος ο Στουδίτης','Abbot, confessor, and defender of icons','Ηγούμενος, ομολογητής και υπερασπιστής των εικόνων','11 November'),
('theophanes-confessor','Saint Theophanes the Confessor','Άγιος Θεοφάνης ο Ομολογητής','Monk, chronicler, and confessor','Μοναχός, χρονογράφος και ομολογητής','12 March'),
('nicephorus-constantinople','Saint Nikephoros of Constantinople','Άγιος Νικηφόρος Κωνσταντινουπόλεως','Patriarch and confessor for holy icons','Πατριάρχης και ομολογητής των ιερών εικόνων','2 June'),
('tarasius','Saint Tarasius of Constantinople','Άγιος Ταράσιος Κωνσταντινουπόλεως','Patriarch and defender of icons','Πατριάρχης και υπερασπιστής των εικόνων','25 February'),
('methodius-constantinople','Saint Methodius of Constantinople','Άγιος Μεθόδιος Κωνσταντινουπόλεως','Patriarch and confessor','Πατριάρχης και ομολογητής','14 June'),
('mark-ephesus','Saint Mark of Ephesus','Άγιος Μάρκος Ευγενικός','Metropolitan and defender of Orthodox doctrine','Μητροπολίτης και υπερασπιστής της Ορθόδοξης διδασκαλίας','19 January'),
('nicholas-cabasilas','Saint Nicholas Cabasilas','Άγιος Νικόλαος Καβάσιλας','Theologian of sacramental and spiritual life','Θεολόγος της μυστηριακής και πνευματικής ζωής','20 June'),
('theophylact-ohrid','Saint Theophylact of Ohrid','Άγιος Θεοφύλακτος Αχρίδος','Archbishop and biblical commentator','Αρχιεπίσκοπος και ερμηνευτής της Γραφής','31 December'),
('clement-ohrid','Saint Clement of Ohrid','Άγιος Κλήμης Αχρίδος','Bishop, missionary, and teacher','Επίσκοπος, ιεραπόστολος και διδάσκαλος','27 July'),
('naum-ohrid','Saint Naum of Ohrid','Άγιος Ναούμ Αχρίδος','Missionary and monastic founder','Ιεραπόστολος και ιδρυτής μονών','23 December'),
('sava-serbia','Saint Sava of Serbia','Άγιος Σάββας Σερβίας','First Archbishop of Serbia','Πρώτος Αρχιεπίσκοπος Σερβίας','14 January'),
('simeon-serbia','Saint Simeon the Myrrh-streaming','Άγιος Συμεών ο Μυροβλύτης','Ruler turned monk and Serbian saint','Ηγεμόνας που έγινε μοναχός και Σέρβος άγιος','13 February'),
('lazar-serbia','Holy Prince Lazar of Serbia','Άγιος Πρίγκιπας Λάζαρος Σερβίας','Martyr prince','Μάρτυρας ηγεμόνας','15 June'),
('nikolai-zicha','Saint Nikolai of Žiča','Άγιος Νικόλαος Βελιμίροβιτς','Bishop, theologian, and confessor','Επίσκοπος, θεολόγος και ομολογητής','18 March'),
('justin-popovic','Saint Justin Popović','Άγιος Ιουστίνος Πόποβιτς','Theologian and monastic elder','Θεολόγος και μοναχικός γέροντας','1 June'),
('basil-ostrog','Saint Basil of Ostrog','Άγιος Βασίλειος Οστρόγκ','Bishop and wonderworker','Επίσκοπος και θαυματουργός','29 April'),
('vladimir-kiev','Saint Vladimir of Kyiv','Άγιος Βλαδίμηρος Κιέβου','Equal-to-the-Apostles ruler and baptizer of Rus','Ισαπόστολος ηγεμόνας και βαπτιστής των Ρως','15 July'),
('olga-kiev','Saint Olga of Kyiv','Αγία Όλγα Κιέβου','Equal-to-the-Apostles ruler','Ισαπόστολος ηγεμονίδα','11 July'),
('boris-gleb','Saints Boris and Gleb','Άγιοι Μπόρις και Γκλεμπ','Passion-bearer princes','Πάθοςφόροι πρίγκιπες','24 July'),
('sergius-radonezh','Saint Sergius of Radonezh','Άγιος Σέργιος του Ραντονέζ','Monastic reformer and spiritual father','Μοναστικός αναμορφωτής και πνευματικός πατέρας','25 September'),
('xenia-petersburg','Saint Xenia of Petersburg','Αγία Ξένια Πετρουπόλεως','Fool-for-Christ and wonderworker','Διά Χριστόν σαλή και θαυματουργός','24 January'),
('tikhon-zadonsk','Saint Tikhon of Zadonsk','Άγιος Τύχων Ζαντόνσκ','Bishop and spiritual writer','Επίσκοπος και πνευματικός συγγραφέας','13 August'),
('theophan-recluse','Saint Theophan the Recluse','Άγιος Θεοφάνης ο Έγκλειστος','Bishop and spiritual writer','Επίσκοπος και πνευματικός συγγραφέας','10 January'),
('ignatius-brianchaninov','Saint Ignatius Brianchaninov','Άγιος Ιγνάτιος Μπριαντσανίνωφ','Bishop and writer on spiritual life','Επίσκοπος και συγγραφέας πνευματικής ζωής','30 April'),
('john-kronstadt','Saint John of Kronstadt','Άγιος Ιωάννης της Κρονστάνδης','Priest, pastor, and wonderworker','Ιερέας, ποιμένας και θαυματουργός','20 December'),
('matrona-moscow','Saint Matrona of Moscow','Αγία Ματρώνα Μόσχας','Righteous woman and spiritual guide','Δίκαιη γυναίκα και πνευματική οδηγός','2 May'),
('gabriel-georgia','Saint Gabriel of Georgia','Άγιος Γαβριήλ της Γεωργίας','Monk and confessor','Μοναχός και ομολογητής','2 November'),
('nino-georgia','Saint Nino of Georgia','Αγία Νίνα της Γεωργίας','Equal-to-the-Apostles evangelizer of Georgia','Ισαπόστολος φωτίστρια της Γεωργίας','14 January'),
('gregory-illuminator','Saint Gregory the Illuminator','Άγιος Γρηγόριος ο Φωτιστής','Bishop and evangelizer of Armenia','Επίσκοπος και φωτιστής της Αρμενίας','30 September'),
('romanos-melodist','Saint Romanos the Melodist','Άγιος Ρωμανός ο Μελωδός','Hymnographer and deacon','Υμνογράφος και διάκονος','1 October'),
('joseph-hesychast','Saint Joseph the Hesychast','Άγιος Ιωσήφ ο Ησυχαστής','Athonite elder and teacher of the Jesus Prayer','Αγιορείτης γέροντας και διδάσκαλος της ευχής','16 August'),
('ephraim-katounakia','Saint Ephraim of Katounakia','Άγιος Εφραίμ Κατουνακιώτης','Athonite elder and hesychast','Αγιορείτης γέροντας και ησυχαστής','27 February'),
('arsenios-cappadocia','Saint Arsenios of Cappadocia','Άγιος Αρσένιος ο Καππαδόκης','Priest and wonderworker','Ιερέας και θαυματουργός','10 November'),
('amphilochios-patmos','Saint Amphilochios of Patmos','Άγιος Αμφιλόχιος Μακρής','Monastic elder and missionary','Μοναχικός γέροντας και ιεραπόστολος','16 April'),
('dimitrios-gagastathis','Saint Dimitrios Gagastathis','Άγιος Δημήτριος Γκαγκαστάθης','Priest and spiritual father','Ιερέας και πνευματικός πατέρας','29 January'),
('george-karslidis','Saint George Karslidis','Άγιος Γεώργιος Καρσλίδης','Monk, priest, and confessor','Μοναχός, ιερέας και ομολογητής','4 November'),
('anthimos-chios','Saint Anthimos of Chios','Άγιος Άνθιμος Χίου','Priest, monastic founder, and wonderworker','Ιερέας, ιδρυτής μονής και θαυματουργός','15 February'),
('savvas-kalymnos','Saint Savvas of Kalymnos','Άγιος Σάββας Καλύμνου','Monk and spiritual father','Μοναχός και πνευματικός πατέρας','7 April'),
('dionysios-zakynthos','Saint Dionysios of Zakynthos','Άγιος Διονύσιος Ζακύνθου','Bishop and patron of forgiveness','Επίσκοπος και πρότυπο συγχωρητικότητας','17 December'),
('gerasimos-kefalonia','Saint Gerasimos of Kefalonia','Άγιος Γεράσιμος Κεφαλληνίας','Monastic founder and wonderworker','Ιδρυτής μονής και θαυματουργός','20 October'),
('fanourios','Saint Phanourios','Άγιος Φανούριος','Martyr known through Orthodox tradition','Μάρτυρας γνωστός από την Ορθόδοξη παράδοση','27 August'),
('mamas','Saint Mamas the Martyr','Άγιος Μάμας','Young martyr of Caesarea','Νεαρός μάρτυρας της Καισαρείας','2 September'),
('eleftherios','Saint Eleftherios the Hieromartyr','Άγιος Ελευθέριος ο Ιερομάρτυρας','Bishop and martyr','Επίσκοπος και μάρτυρας','15 December'),
('agatha','Saint Agatha of Sicily','Αγία Αγάθη','Virgin martyr','Παρθενομάρτυς','5 February'),
('agnes-rome','Saint Agnes of Rome','Αγία Αγνή Ρώμης','Virgin martyr','Παρθενομάρτυς','21 January'),
('lucy-syracuse','Saint Lucy of Syracuse','Αγία Λουκία Συρακουσών','Virgin martyr','Παρθενομάρτυς','13 December'),
('cecilia-rome','Saint Cecilia of Rome','Αγία Καικιλία Ρώμης','Martyr of the early Church','Μάρτυς της αρχαίας Εκκλησίας','22 November'),
('lawrence-rome','Saint Lawrence of Rome','Άγιος Λαυρέντιος Ρώμης','Deacon and martyr','Διάκονος και μάρτυρας','10 August'),
('sebastian-rome','Saint Sebastian the Martyr','Άγιος Σεβαστιανός','Martyr at Rome','Μάρτυρας στη Ρώμη','18 December'),
('perpetua-felicity','Saints Perpetua and Felicity','Αγίες Περπέτουα και Φηλικιτάτη','Martyrs of Carthage','Μάρτυρες της Καρχηδόνας','1 February'),
('tatiana-rome','Saint Tatiana of Rome','Αγία Τατιανή Ρώμης','Deaconess and martyr','Διακόνισσα και μάρτυς','12 January'),
('christina-tyre','Saint Christina of Tyre','Αγία Χριστίνα','Great Martyr','Μεγαλομάρτυς','24 July'),
('sophia-daughters','Saint Sophia with Faith, Hope, and Love','Αγία Σοφία με Πίστη, Ελπίδα και Αγάπη','Martyr mother and daughters','Μάρτυς μητέρα και θυγατέρες','17 September'),
('juliana-nicomedia','Saint Juliana of Nicomedia','Αγία Ιουλιανή Νικομηδείας','Virgin martyr','Παρθενομάρτυς','21 December'),
('eugenia-rome','Saint Eugenia of Rome','Αγία Ευγενία Ρώμης','Monastic and martyr','Μοναχή και μάρτυς','24 December'),
('cosmas-damian-asia','Saints Cosmas and Damian of Asia','Άγιοι Κοσμάς και Δαμιανός των Ασωμάτων','Unmercenary physicians','Ανάργυροι ιατροί','1 November'),
('cyrus-john','Saints Cyrus and John','Άγιοι Κύρος και Ιωάννης','Unmercenary healers and martyrs','Ανάργυροι θεραπευτές και μάρτυρες','31 January'),
('hermolaus','Saint Hermolaus','Άγιος Ερμόλαος','Priest-martyr and teacher of Panteleimon','Ιερομάρτυρας και διδάσκαλος του Παντελεήμονα','26 July'),
('forty-sebaste','Forty Martyrs of Sebaste','Άγιοι Τεσσαράκοντα Μάρτυρες Σεβαστείας','Company of soldier-martyrs','Χορός στρατιωτών-μαρτύρων','9 March'),
('forty-two-amorium','Forty-Two Martyrs of Amorium','Άγιοι Σαράντα Δύο Μάρτυρες Αμορίου','Martyrs under captivity','Μάρτυρες σε αιχμαλωσία','6 March'),
('twenty-thousand-nicomedia','Twenty Thousand Martyrs of Nicomedia','Άγιοι Είκοσι Χιλιάδες Μάρτυρες Νικομηδείας','Large company of martyrs','Μεγάλος χορός μαρτύρων','28 December'),
('new-martyrs-constantinople','New Martyrs of Constantinople','Νεομάρτυρες Κωνσταντινουπόλεως','Group of Orthodox new martyrs','Χορός Ορθοδόξων νεομαρτύρων','See local Orthodox calendar'),
('gregory-v-patriarch','Saint Gregory V of Constantinople','Άγιος Γρηγόριος Εʹ Κωνσταντινουπόλεως','Patriarch and new hieromartyr','Πατριάρχης και νεοϊερομάρτυρας','10 April'),
('chrysostomos-smyrna','Saint Chrysostomos of Smyrna','Άγιος Χρυσόστομος Σμύρνης','Metropolitan and hieromartyr','Μητροπολίτης και ιερομάρτυρας','Sunday before Exaltation of the Cross'),
('raphail-nicholas-irene','Saints Raphael, Nicholas, and Irene of Lesbos','Άγιοι Ραφαήλ, Νικόλαος και Ειρήνη Λέσβου','New martyrs of Lesbos','Νεομάρτυρες της Λέσβου','Tuesday of Bright Week'),
('ephraim-nea-makri','Saint Ephraim of Nea Makri','Άγιος Εφραίμ Νέας Μάκρης','New martyr and wonderworker','Νεομάρτυρας και θαυματουργός','5 May'),
('akakios-asvestochori','Saint Akakios the New Martyr','Άγιος Ακάκιος ο Νεομάρτυρας','Athonite new martyr','Αγιορείτης νεομάρτυρας','1 May'),
('george-ioannina','Saint George of Ioannina','Άγιος Γεώργιος Ιωαννίνων','New martyr','Νεομάρτυρας','17 January'),
('john-monemvasia','Saint John of Monemvasia','Άγιος Ιωάννης Μονεμβασίας','Young new martyr','Νεαρός νεομάρτυρας','21 October'),
('aquilina-zaglivere','Saint Aquilina of Zagliveri','Αγία Ακυλίνα Ζαγκλιβερίου','New martyr','Νεομάρτυς','27 September'),
('argyris-eipanomis','Saint Argyrios of Epanomi','Άγιος Αργύριος Επανομής','New martyr','Νεομάρτυρας','11 May'),
('tikhon-moscow','Saint Tikhon of Moscow','Άγιος Τύχων Μόσχας','Patriarch and confessor','Πατριάρχης και ομολογητής','7 April'),
('new-martyrs-russia','New Martyrs and Confessors of Russia','Νεομάρτυρες και Ομολογητές της Ρωσίας','Synaxis of martyrs and confessors','Σύναξη μαρτύρων και ομολογητών','Sunday nearest 25 January'),
('royal-passion-bearers','Royal Passion-Bearers of Russia','Άγιοι Βασιλομάρτυρες της Ρωσίας','Passion-bearer imperial family','Πάθοςφόρος βασιλική οικογένεια','17 July'),
('alexander-nevsky','Saint Alexander Nevsky','Άγιος Αλέξανδρος Νέφσκι','Righteous prince','Δίκαιος πρίγκιπας','23 November'),
('dmitry-donskoy','Saint Dmitry Donskoy','Άγιος Δημήτριος του Ντον','Righteous prince','Δίκαιος πρίγκιπας','19 May'),
('euphrosyne-polotsk','Saint Euphrosyne of Polotsk','Αγία Ευφροσύνη Πολότσκ','Princess, monastic, and educator','Πριγκίπισσα, μοναχή και παιδαγωγός','23 May'),
('parascheva-balkans','Saint Paraskeva of the Balkans','Οσία Παρασκευή η Επιβατινή','Ascetic and wonderworker','Ασκήτρια και θαυματουργός','14 October'),
('dimitrie-basarabov','Saint Dimitrie Basarabov','Άγιος Δημήτριος ο Νέος','Hermit and patron of Bucharest','Ερημίτης και προστάτης Βουκουρεστίου','27 October'),
('calinic-cernica','Saint Calinic of Cernica','Άγιος Καλλίνικος της Τσερνίκα','Bishop and monastic reformer','Επίσκοπος και μοναστικός αναμορφωτής','11 April'),
('theodora-sihla','Saint Theodora of Sihla','Αγία Θεοδώρα της Σίχλα','Romanian hermitess','Ρουμάνα ερημίτισσα','7 August'),
('paisius-velichkovsky','Saint Paisius Velichkovsky','Άγιος Παΐσιος Βελιτσκόφσκυ','Monastic elder and translator of Philokalic texts','Μοναχικός γέροντας και μεταφραστής φιλοκαλικών κειμένων','15 November'),
('john-rila','Saint John of Rila','Άγιος Ιωάννης της Ρίλα','Bulgarian hermit and monastic father','Βούλγαρος ερημίτης και μοναστικός πατέρας','18 August'),
('euthymius-tarnovo','Saint Euthymius of Tarnovo','Άγιος Ευθύμιος Τυρνόβου','Patriarch and literary reformer','Πατριάρχης και γραμματικός αναμορφωτής','20 January'),
('paisius-hilendar','Saint Paisius of Hilendar','Άγιος Παΐσιος Χιλανδαρινός','Athonite monk and Bulgarian awakener','Αγιορείτης μοναχός και Βούλγαρος αφυπνιστής','19 June'),
('raphael-brooklyn','Saint Raphael of Brooklyn','Άγιος Ραφαήλ Μπρούκλιν','Bishop and shepherd in North America','Επίσκοπος και ποιμένας στη Βόρεια Αμερική','27 February'),
('alexis-toth','Saint Alexis Toth','Άγιος Αλέξιος Τοθ','Priest and missionary in North America','Ιερέας και ιεραπόστολος στη Βόρεια Αμερική','7 May'),
('jacob-netsvetov','Saint Jacob Netsvetov','Άγιος Ιάκωβος Νετσβέτωφ','Missionary priest of Alaska','Ιεραπόστολος ιερέας της Αλάσκας','26 July'),
('juvenaly-alaska','Saint Juvenaly of Alaska','Άγιος Ιουβενάλιος Αλάσκας','Hieromartyr and missionary','Ιερομάρτυρας και ιεραπόστολος','24 September'),
('peter-aleut','Saint Peter the Aleut','Άγιος Πέτρος ο Αλεούτος','Martyr of North America','Μάρτυρας της Βόρειας Αμερικής','24 September'),
('john-kochurov','Saint John Kochurov','Άγιος Ιωάννης Κοτσούρωφ','Missionary priest and hieromartyr','Ιεραπόστολος ιερέας και ιερομάρτυρας','31 October'),
('alexander-hotovitzky','Saint Alexander Hotovitzky','Άγιος Αλέξανδρος Χοτοβίτσκι','Missionary priest and hieromartyr','Ιεραπόστολος ιερέας και ιερομάρτυρας','4 December'),
('sebastian-dabovich','Saint Sebastian Dabovich','Άγιος Σεβαστιανός Ντάμποβιτς','Missionary priest in North America','Ιεραπόστολος ιερέας στη Βόρεια Αμερική','30 November'),
('mardarije-libertyville','Saint Mardarije of Libertyville','Άγιος Μαρδάριος Λίμπερτυβιλ','Bishop in North America','Επίσκοπος στη Βόρεια Αμερική','12 December'),
('olga-kwethluk','Saint Olga of Kwethluk','Αγία Όλγα της Κουέθλουκ','Righteous laywoman of Alaska','Δίκαιη λαϊκή γυναίκα της Αλάσκας','27 October'),
('alexei-kabalyuk','Saint Alexei Kabalyuk','Άγιος Αλέξιος Καμπαλιούκ','Priest and confessor','Ιερέας και ομολογητής','19 November'),
('varnava-nastic','Saint Varnava Nastić','Άγιος Βαρνάβας Νάστιτς','Bishop and confessor','Επίσκοπος και ομολογητής','12 November'),
('seraphim-samoilovich','Saint Seraphim Samoilovich','Άγιος Σεραφείμ Σαμοΐλοβιτς','Bishop and new martyr','Επίσκοπος και νεομάρτυρας','4 November'),
]
for id,en,el,ren,rel,feast in saints:
    src=SOURCE_NA if id in {'raphael-brooklyn','alexis-toth','jacob-netsvetov','juvenaly-alaska','peter-aleut','john-kochurov','alexander-hotovitzky','sebastian-dabovich','mardarije-libertyville','olga-kwethluk','alexei-kabalyuk','varnava-nastic','seraphim-samoilovich'} else SOURCE_OCA
    add(id,en,el,'church-saint',ren,rel,feast_en=feast,feast_el=feast,source=src)

# ---- More Old Testament / deuterocanonical righteous figures ----
righteous=[
('jochebed','Righteous Jochebed','Δίκαιη Ιωχαβέδ','Mother of Moses, Aaron, and Miriam','Μητέρα του Μωυσή, του Ααρών και της Μαριάμ','Exodus 2:1–10; 6:20'),
('amram','Righteous Amram','Δίκαιος Αμράμ','Father of Moses, Aaron, and Miriam','Πατέρας του Μωυσή, του Ααρών και της Μαριάμ','Exodus 6:20'),
('zipporah','Righteous Zipporah','Δίκαιη Σεπφώρα','Wife of Moses','Σύζυγος του Μωυσή','Exodus 2:21; 4:24–26; 18'),
('hur','Righteous Hur','Δίκαιος Ωρ','Supporter of Moses during battle','Συνεργός του Μωυσή στη μάχη','Exodus 17:10–12; 24:14'),
('bezalel','Righteous Bezalel','Δίκαιος Βεσελεήλ','Craftsman of the Tabernacle','Τεχνίτης της Σκηνής του Μαρτυρίου','Exodus 31:1–11; 35–38'),
('oholiah','Righteous Oholiab','Δίκαιος Ελιάβ','Craftsman of the Tabernacle','Τεχνίτης της Σκηνής του Μαρτυρίου','Exodus 31:6; 35:34'),
('phinehas','Righteous Phinehas','Δίκαιος Φινεές','Priest and grandson of Aaron','Ιερέας και εγγονός του Ααρών','Numbers 25; Joshua 22'),
('eleazar-priest','Righteous Eleazar the High Priest','Δίκαιος Ελεάζαρ ο Αρχιερέας','Son of Aaron and high priest','Υιός του Ααρών και αρχιερέας','Numbers 20:25–29; Joshua 14:1'),
('zelophehad-daughters','Daughters of Zelophehad','Θυγατέρες Σαλπαάδ','Women whose inheritance case shaped Israelite law','Γυναίκες των οποίων η υπόθεση κληρονομίας διαμόρφωσε τον νόμο','Numbers 27:1–11; 36'),
('achsa','Righteous Achsah','Δίκαιη Αχσά','Daughter of Caleb','Θυγατέρα του Χάλεβ','Joshua 15:16–19; Judges 1:12–15'),
('samuel-mother-hannah','Hannah, Mother of Samuel','Άννα, μητέρα του Σαμουήλ','Woman of prayer and mother of the prophet Samuel','Γυναίκα προσευχής και μητέρα του προφήτη Σαμουήλ','1 Samuel 1–2'),
('abimelech-priest','Ahimelech the Priest','Αχιμέλεχ ο Ιερέας','Priest who aided David','Ιερέας που βοήθησε τον Δαβίδ','1 Samuel 21–22'),
('abiathar','Abiathar the Priest','Αβιάθαρ ο Ιερέας','Priest who served David','Ιερέας που υπηρέτησε τον Δαβίδ','1 Samuel 22:20–23; 2 Samuel 15'),
('ittai-gittite','Ittai the Gittite','Εθθί ο Γετθαίος','Loyal follower of David','Πιστός ακόλουθος του Δαβίδ','2 Samuel 15:19–22; 18'),
('barzillai','Barzillai the Gileadite','Βερζελλί ο Γαλααδίτης','Supporter of David during Absalom’s revolt','Υποστηρικτής του Δαβίδ στην ανταρσία του Αβεσσαλώμ','2 Samuel 17:27–29; 19:31–39'),
('mephibosheth','Mephibosheth','Μεμφιβοσθέ','Son of Jonathan shown covenant mercy by David','Υιός του Ιωνάθαν που δέχθηκε έλεος από τον Δαβίδ','2 Samuel 4:4; 9; 19'),
('widow-zarephath','Widow of Zarephath','Χήρα των Σαρεπτών','Widow who received Elijah and witnessed a miracle','Χήρα που φιλοξένησε τον Ηλία και είδε θαύμα','1 Kings 17:8–24'),
('obadiah-ahab','Righteous Obadiah, Steward of Ahab','Δίκαιος Αβδιού, οικονόμος του Αχαάβ','Court official who protected prophets','Αυλικός που προστάτευσε προφήτες','1 Kings 18:3–16'),
('shunammite-woman','Shunammite Woman','Σουναμίτιδα Γυναίκα','Benefactor of Elisha whose son was restored','Ευεργέτιδα του Ελισαίου της οποίας ο υιός αποκαταστάθηκε','2 Kings 4:8–37; 8:1–6'),
('jehoiada-priest','Righteous Jehoiada the Priest','Δίκαιος Ιωδαέ ο Ιερέας','High priest who preserved the Davidic heir Joash','Αρχιερέας που προστάτευσε τον Δαβιδικό διάδοχο Ιωάς','2 Kings 11–12; 2 Chronicles 23–24'),
('jehosheba','Righteous Jehosheba','Δίκαιη Ιωσαβεέ','Woman who rescued the infant Joash','Γυναίκα που έσωσε τον βρέφος Ιωάς','2 Kings 11:2–3'),
('azariah-high-priest','Azariah the High Priest','Αζαρίας ο Αρχιερέας','High priest during reforms','Αρχιερέας σε περίοδο μεταρρυθμίσεων','2 Chronicles 31:10–13'),
('ebed-melech','Righteous Ebed-melech','Δίκαιος Αβδεμέλεχ','Official who rescued Jeremiah from the cistern','Αξιωματούχος που έσωσε τον Ιερεμία από τον λάκκο','Jeremiah 38:7–13; 39:15–18'),
('gedaliah','Gedaliah son of Ahikam','Γοδολίας υιός Αχικάμ','Governor appointed after Jerusalem’s fall','Διοικητής μετά την πτώση της Ιερουσαλήμ','2 Kings 25:22–25; Jeremiah 40–41'),
('shadrach-meshach-abednego-group','Three Holy Youths','Τρεις Άγιοι Παίδες','Companions of Daniel in Babylon','Σύντροφοι του Δανιήλ στη Βαβυλώνα','Daniel 3'),
('achior','Achior','Αχιώρ','Ammonite who confessed the God of Israel in Judith','Αμμωνίτης που ομολόγησε τον Θεό του Ισραήλ στην Ιουδίθ','Judith 5–6; 14'),
('razis','Righteous Razis','Δίκαιος Ραζίς','Elder honored in the Maccabean narrative','Πρεσβύτερος τιμώμενος στη Μακκαβαϊκή διήγηση','2 Maccabees 14:37–46'),
('oniass-high-priest','Onias the High Priest','Ονίας ο Αρχιερέας','High priest remembered in 2 Maccabees','Αρχιερέας μνημονευόμενος στη Βʹ Μακκαβαίων','2 Maccabees 3–4; 15:12'),
('jeremiah-maccabees-vision','Jeremiah in the Maccabean Vision','Ιερεμίας στο όραμα των Μακκαβαίων','Prophet shown interceding in a vision','Προφήτης που παρουσιάζεται να μεσιτεύει σε όραμα','2 Maccabees 15:13–16'),
]
for id,en,el,ren,rel,sc in righteous:
    add(id,en,el,'righteous',ren,rel,scripture=sc,feast_en='See local Orthodox calendar / biblical commemoration',feast_el='Βλ. τοπικό ορθόδοξο ημερολόγιο / βιβλική μνήμη',source=SOURCE_OCA)

# ---- Additional named biblical context figures: judges, kings, priests, officials, family members, NT figures ----
context=[
('kenan','Kenan','Καϊνάν','Early Genesis patriarch','Πρώιμος πατριάρχης της Γένεσης','Genesis 5:9–14'),
('mahalalel','Mahalalel','Μαλελεήλ','Early Genesis patriarch','Πρώιμος πατριάρχης της Γένεσης','Genesis 5:12–17'),
('jared','Jared','Ιάρεδ','Early Genesis patriarch','Πρώιμος πατριάρχης της Γένεσης','Genesis 5:15–20'),
('methuselah','Methuselah','Μαθουσάλα','Long-lived patriarch before the Flood','Μακρόβιος πατριάρχης πριν τον Κατακλυσμό','Genesis 5:21–27'),
('lamech-noah','Lamech, Father of Noah','Λάμεχ, πατέρας του Νώε','Father of Noah','Πατέρας του Νώε','Genesis 5:28–31'),
('japheth','Japheth','Ιάφεθ','Son of Noah','Υιός του Νώε','Genesis 5:32; 9–10'),
('ham','Ham','Χαμ','Son of Noah','Υιός του Νώε','Genesis 5:32; 9–10'),
('canaan','Canaan','Χαναάν','Son of Ham','Υιός του Χαμ','Genesis 9:18–27; 10:6'),
('terah','Terah','Θάρα','Father of Abraham','Πατέρας του Αβραάμ','Genesis 11:26–32'),
('nahor','Nahor','Ναχώρ','Brother of Abraham','Αδελφός του Αβραάμ','Genesis 11:26–29; 24'),
('haran','Haran','Αρράν','Brother of Abraham and father of Lot','Αδελφός του Αβραάμ και πατέρας του Λωτ','Genesis 11:26–32'),
('bethuel','Bethuel','Βαθουήλ','Father of Rebekah and Laban','Πατέρας της Ρεβέκκας και του Λάβαν','Genesis 22:22–23; 24:15'),
('eliezerdamascus','Eliezer of Damascus','Ελιέζερ Δαμασκού','Steward associated with Abraham','Οικονόμος συνδεδεμένος με τον Αβραάμ','Genesis 15:2–3; cf. 24'),
('kedar','Kedar','Κηδάρ','Son of Ishmael','Υιός του Ισμαήλ','Genesis 25:13; Isaiah 21:16–17'),
('edom','Edom / Esau’s line','Εδώμ / γενιά του Ησαύ','Ancestral identity linked to Esau','Προγονική ταυτότητα συνδεδεμένη με τον Ησαύ','Genesis 36'),
('zophar','Zophar the Naamathite','Σωφάρ ο Νααμαθίτης','Friend of Job','Φίλος του Ιώβ','Job 2:11; 11; 20; 42:9'),
('eliphaz-job','Eliphaz the Temanite','Ελιφάς ο Θαιμανίτης','Friend of Job','Φίλος του Ιώβ','Job 2:11; 4–5; 15; 22; 42:7–9'),
('bildad','Bildad the Shuhite','Βαλδάδ ο Σαυχίτης','Friend of Job','Φίλος του Ιώβ','Job 2:11; 8; 18; 25; 42:9'),
('elihu','Elihu son of Barachel','Ελιού υιός Βαραχιήλ','Young speaker in Job','Νεαρός ομιλητής στο βιβλίο του Ιώβ','Job 32–37'),
('sihon','Sihon','Σηών','Amorite king opposed to Israel','Αμορραίος βασιλιάς αντίπαλος του Ισραήλ','Numbers 21:21–31'),
('og-bashan','Og of Bashan','Ωγ βασιλιάς Βασάν','King defeated east of the Jordan','Βασιλιάς που ηττήθηκε ανατολικά του Ιορδάνη','Numbers 21:33–35; Deuteronomy 3'),
('dathan-abiram','Dathan and Abiram','Δαθάν και Αβειρών','Rebels against Moses','Στασιαστές εναντίον του Μωυσή','Numbers 16'),
('achan','Achan','Αχάν','Israelite judged for taking devoted things','Ισραηλίτης που κρίθηκε για κλοπή αφιερωμένων πραγμάτων','Joshua 7'),
('adoni-zedek','Adoni-zedek','Αδωνισεδέκ','King of Jerusalem opposing Joshua','Βασιλιάς Ιερουσαλήμ αντίπαλος του Ιησού του Ναυή','Joshua 10'),
('jabin-hazor','Jabin of Hazor','Ιαβίν της Ασώρ','Canaanite king in Judges','Χαναναίος βασιλιάς στους Κριτές','Judges 4'),
('abimelech-gideon','Abimelech son of Gideon','Αβιμέλεχ υιός Γεδεών','Violent ruler in Judges','Βίαιος ηγεμόνας στους Κριτές','Judges 8:31–9:57'),
('tola-judge','Tola','Θωλά','Judge of Israel','Κριτής του Ισραήλ','Judges 10:1–2'),
('jair-judge','Jair','Ιαΐρ','Judge of Israel','Κριτής του Ισραήλ','Judges 10:3–5'),
('ibzan','Ibzan','Αβαισσάν','Judge of Israel','Κριτής του Ισραήλ','Judges 12:8–10'),
('elon-judge','Elon','Αιλών','Judge of Israel','Κριτής του Ισραήλ','Judges 12:11–12'),
('abdon-judge','Abdon','Αβδών','Judge of Israel','Κριτής του Ισραήλ','Judges 12:13–15'),
('manoah','Manoah','Μανωέ','Father of Samson','Πατέρας του Σαμψών','Judges 13'),
('mother-samson','Mother of Samson','Μητέρα του Σαμψών','Woman who received angelic announcement of Samson’s birth','Γυναίκα που έλαβε αγγελική αναγγελία για τη γέννηση του Σαμψών','Judges 13'),
('peninnah','Peninnah','Φεννάνα','Second wife of Elkanah','Δεύτερη σύζυγος του Ελκανά','1 Samuel 1'),
('elkanah','Elkanah','Ελκανά','Father of Samuel','Πατέρας του Σαμουήλ','1 Samuel 1–2'),
('hophni-phinehas','Hophni and Phinehas, sons of Eli','Οφνί και Φινεές, υιοί του Ηλί','Corrupt priests in Samuel','Διεφθαρμένοι ιερείς στο βιβλίο του Σαμουήλ','1 Samuel 2–4'),
('agag','Agag','Αγάγ','Amalekite king defeated by Saul','Αμαληκίτης βασιλιάς που ηττήθηκε από τον Σαούλ','1 Samuel 15'),
('abner','Abner','Αβεννήρ','Commander in Saul’s house','Στρατηγός του οίκου του Σαούλ','1 Samuel 14:50; 2 Samuel 2–3'),
('doeg','Doeg the Edomite','Δωήκ ο Ιδουμαίος','Servant of Saul who killed priests','Υπηρέτης του Σαούλ που σκότωσε ιερείς','1 Samuel 21–22'),
('nabal','Nabal','Ναβάλ','Wealthy man rebuked through Abigail','Πλούσιος άνδρας που ελέγχθηκε μέσω της Αβιγαίας','1 Samuel 25'),
('shimei','Shimei son of Gera','Σεμεΐ υιός Γηρά','Benjaminite who cursed David','Βενιαμίτης που καταράστηκε τον Δαβίδ','2 Samuel 16; 19; 1 Kings 2'),
('ahithophel','Ahithophel','Αχιτόφελ','Counselor who joined Absalom','Σύμβουλος που προσχώρησε στον Αβεσσαλώμ','2 Samuel 15–17'),
('hushai','Hushai the Archite','Χουσί ο Αρχίτης','David’s loyal friend and counter-counselor','Πιστός φίλος του Δαβίδ και αντίπαλος σύμβουλος','2 Samuel 15–17'),
('adonijah','Adonijah','Αδωνίας','Son of David who sought the throne','Υιός του Δαβίδ που διεκδίκησε τον θρόνο','1 Kings 1–2'),
('benaiah','Benaiah son of Jehoiada','Βαναίας υιός Ιωδαέ','Warrior and commander under David and Solomon','Πολεμιστής και στρατηγός υπό Δαβίδ και Σολομώντα','2 Samuel 23:20–23; 1 Kings 1–2'),
('queen-sheba','Queen of Sheba','Βασίλισσα Σαβά','Royal visitor who tested Solomon’s wisdom','Βασίλισσα που δοκίμασε τη σοφία του Σολομώντα','1 Kings 10:1–13; Matthew 12:42'),
('nadab-israel','Nadab, King of Israel','Ναδάβ βασιλιάς Ισραήλ','Northern king after Jeroboam','Βόρειος βασιλιάς μετά τον Ιεροβοάμ','1 Kings 15:25–31'),
('baasha','Baasha','Βαασά','King of Israel','Βασιλιάς Ισραήλ','1 Kings 15:33–16:7'),
('elah-israel','Elah, King of Israel','Ηλά βασιλιάς Ισραήλ','King of Israel','Βασιλιάς Ισραήλ','1 Kings 16:8–14'),
('zimri-israel','Zimri','Ζαμβρί','Short-reigning king of Israel','Βραχύβιος βασιλιάς Ισραήλ','1 Kings 16:9–20'),
('omri','Omri','Αμβρί','King of Israel and father of Ahab','Βασιλιάς Ισραήλ και πατέρας του Αχαάβ','1 Kings 16:21–28'),
('ahaziah-israel','Ahaziah of Israel','Οχοζίας Ισραήλ','Son of Ahab and king of Israel','Υιός του Αχαάβ και βασιλιάς Ισραήλ','1 Kings 22:51–53; 2 Kings 1'),
('jehoram-israel','Jehoram of Israel','Ιωράμ Ισραήλ','King of Israel in Elisha narratives','Βασιλιάς Ισραήλ στις διηγήσεις του Ελισαίου','2 Kings 3–9'),
('jehu','Jehu','Ιηού','King who overthrew Ahab’s dynasty','Βασιλιάς που ανέτρεψε τη δυναστεία του Αχαάβ','2 Kings 9–10'),
('jehoahaz-israel','Jehoahaz of Israel','Ιωάχαζ Ισραήλ','King of Israel','Βασιλιάς Ισραήλ','2 Kings 13:1–9'),
('jehoash-israel','Jehoash of Israel','Ιωάς Ισραήλ','King of Israel who visited Elisha','Βασιλιάς Ισραήλ που επισκέφθηκε τον Ελισαίο','2 Kings 13:10–25'),
('jeroboam-ii','Jeroboam II','Ιεροβοάμ Βʹ','King of Israel during prophetic ministry','Βασιλιάς Ισραήλ σε εποχή προφητικής διακονίας','2 Kings 14:23–29; Amos 1:1'),
('zechariah-israel','Zechariah, King of Israel','Ζαχαρίας βασιλιάς Ισραήλ','Last ruler of Jehu’s dynasty','Τελευταίος ηγεμόνας της δυναστείας του Ιηού','2 Kings 15:8–12'),
('shallum-israel','Shallum','Σελλούμ','Short-reigning king of Israel','Βραχύβιος βασιλιάς Ισραήλ','2 Kings 15:13–15'),
('menahem','Menahem','Μαναήμ','King of Israel','Βασιλιάς Ισραήλ','2 Kings 15:17–22'),
('pekahiah','Pekahiah','Φακεσίας','King of Israel','Βασιλιάς Ισραήλ','2 Kings 15:23–26'),
('pekah','Pekah','Φακεέ','King of Israel','Βασιλιάς Ισραήλ','2 Kings 15:27–31; Isaiah 7'),
('hoshea-king','Hoshea, King of Israel','Ωσηέ βασιλιάς Ισραήλ','Last king of the northern kingdom','Τελευταίος βασιλιάς του βόρειου βασιλείου','2 Kings 17'),
('athaliah','Athaliah','Γοθολία','Usurping queen of Judah','Σφετερίστρια βασίλισσα του Ιούδα','2 Kings 11; 2 Chronicles 22–23'),
('joash-judah','Joash of Judah','Ιωάς Ιούδα','King preserved as an infant','Βασιλιάς που διασώθηκε ως βρέφος','2 Kings 11–12; 2 Chronicles 24'),
('amaziah-judah','Amaziah of Judah','Αμεσίας Ιούδα','King of Judah','Βασιλιάς Ιούδα','2 Kings 14; 2 Chronicles 25'),
('jehoahaz-judah','Jehoahaz of Judah','Ιωάχαζ Ιούδα','Short-reigning king of Judah','Βραχύβιος βασιλιάς Ιούδα','2 Kings 23:31–35'),
('jehoiakim','Jehoiakim','Ιωακείμ','King of Judah in Jeremiah’s time','Βασιλιάς Ιούδα στην εποχή του Ιερεμία','2 Kings 23:36–24:7; Jeremiah 36'),
('zedekiah-king','Zedekiah','Σεδεκίας','Last king of Judah before Jerusalem’s fall','Τελευταίος βασιλιάς Ιούδα πριν την πτώση της Ιερουσαλήμ','2 Kings 24:17–25:7; Jeremiah 37–39'),
('rabshakeh','Rabshakeh','Ραψάκης','Assyrian envoy who mocked trust in God','Ασσυριακός απεσταλμένος που χλεύασε την εμπιστοσύνη στον Θεό','2 Kings 18–19; Isaiah 36–37'),
('sennacherib','Sennacherib','Σενναχηρείμ','Assyrian king who threatened Jerusalem','Ασσυριακός βασιλιάς που απείλησε την Ιερουσαλήμ','2 Kings 18–19; Isaiah 36–37'),
('holofernes','Holofernes','Ολοφέρνης','Assyrian general in Judith','Ασσυριακός στρατηγός στην Ιουδίθ','Judith 2–13'),
('bagoses','Bagoas in Judith','Βαγώας στην Ιουδίθ','Officer associated with Holofernes','Αξιωματούχος συνδεδεμένος με τον Ολοφέρνη','Judith 12–14'),
('artaxerxes-esther','Ahasuerus / Artaxerxes in Esther','Ασσουήρης / Αρταξέρξης στην Εσθήρ','Persian king in Esther','Πέρσης βασιλιάς στην Εσθήρ','Esther 1–10'),
('vashti','Queen Vashti','Βασίλισσα Αστίν','Queen removed before Esther’s rise','Βασίλισσα που απομακρύνθηκε πριν την άνοδο της Εσθήρ','Esther 1'),
('sanballat','Sanballat','Σαναβαλλάτ','Opponent of Nehemiah’s rebuilding work','Αντίπαλος του έργου ανοικοδόμησης του Νεεμία','Nehemiah 2–6'),
('tobiah-ammonite','Tobiah the Ammonite','Τωβίας ο Αμμωνίτης','Opponent of Nehemiah','Αντίπαλος του Νεεμία','Nehemiah 2–6; 13'),
('geshem','Geshem the Arab','Γησέμ ο Άραβας','Opponent of Nehemiah','Αντίπαλος του Νεεμία','Nehemiah 2:19; 6'),
('alexander-great-maccabees','Alexander the Great in Maccabees','Αλέξανδρος ο Μέγας στους Μακκαβαίους','Hellenistic ruler mentioned in Maccabean history','Ελληνιστικός ηγεμόνας στη Μακκαβαϊκή ιστορία','1 Maccabees 1:1–9'),
('seleucus-iv','Seleucus IV','Σέλευκος Δʹ','Seleucid ruler in 2 Maccabees','Σελευκίδης ηγεμόνας στη Βʹ Μακκαβαίων','2 Maccabees 3'),
('heliodorus','Heliodorus','Ηλιόδωρος','Royal official in 2 Maccabees','Βασιλικός αξιωματούχος στη Βʹ Μακκαβαίων','2 Maccabees 3'),
('jason-high-priest','Jason the High Priest','Ιάσων ο Αρχιερέας','Controversial high priest in Maccabean era','Αμφιλεγόμενος αρχιερέας στη Μακκαβαϊκή εποχή','2 Maccabees 4'),
('menelaus-high-priest','Menelaus the High Priest','Μενέλαος ο Αρχιερέας','High priest condemned in Maccabean narrative','Αρχιερέας που καταδικάζεται στη Μακκαβαϊκή διήγηση','2 Maccabees 4–13'),
('alcimus','Alcimus','Άλκιμος','High priest and political figure in Maccabees','Αρχιερέας και πολιτικό πρόσωπο στους Μακκαβαίους','1 Maccabees 7–9'),
('nicanor-general','Nicanor the Seleucid General','Νικάνωρ ο Σελευκίδης στρατηγός','Opponent of Judas Maccabeus','Αντίπαλος του Ιούδα Μακκαβαίου','1 Maccabees 7; 2 Maccabees 14–15'),
('jonathan-maccabee','Jonathan Apphus','Ιωνάθαν Απφούς','Hasmonean leader after Judas Maccabeus','Ασμοναίος ηγέτης μετά τον Ιούδα Μακκαβαίο','1 Maccabees 9–12'),
('simon-maccabee','Simon Thassi','Σίμων Θασσί','Hasmonean leader and high priest','Ασμοναίος ηγέτης και αρχιερέας','1 Maccabees 13–16'),
('john-hyrcanus','John Hyrcanus','Ιωάννης Υρκανός','Hasmonean ruler','Ασμοναίος ηγεμόνας','1 Maccabees 16:23–24; later Jewish history'),
('joachim-judith','Joachim the High Priest in Judith','Ιωακείμ ο Αρχιερέας στην Ιουδίθ','High priest in Judith’s setting','Αρχιερέας στο πλαίσιο της Ιουδίθ','Judith 4:6–15'),
('joakim-susanna','Joakim, Husband of Susanna','Ιωακείμ, σύζυγος της Σωσάννας','Husband of Susanna','Σύζυγος της Σωσάννας','Daniel 13 / Susanna'),
('two-elders-susanna','The Two Elders in Susanna','Οι δύο πρεσβύτεροι της Σωσάννας','Corrupt judges exposed by Daniel','Διεφθαρμένοι κριτές που αποκαλύφθηκαν από τον Δανιήλ','Daniel 13 / Susanna'),
('joel-father-john','Joachim, traditional father of the Theotokos','Ιωακείμ, πατέρας της Θεοτόκου κατά την παράδοση','Traditional father of the Virgin Mary','Πατέρας της Θεοτόκου κατά την εκκλησιαστική παράδοση','Church tradition'),
('anna-theotokos','Anna, traditional mother of the Theotokos','Άννα, μητέρα της Θεοτόκου κατά την παράδοση','Traditional mother of the Virgin Mary','Μητέρα της Θεοτόκου κατά την εκκλησιαστική παράδοση','Church tradition'),
('salome-daughter-herodias','Salome, daughter of Herodias','Σαλώμη, θυγατέρα της Ηρωδιάδας','Dancer in the beheading narrative','Χορεύτρια στη διήγηση του αποκεφαλισμού','Mark 6:22–29; Matthew 14:6–11'),
('jairus','Jairus','Ιάειρος','Synagogue ruler whose daughter Christ raised','Αρχισυνάγωγος του οποίου την κόρη ανέστησε ο Χριστός','Mark 5:21–43; Luke 8:40–56'),
('jairus-daughter','Daughter of Jairus','Θυγατέρα του Ιαείρου','Girl raised by Christ','Κορίτσι που ανέστησε ο Χριστός','Mark 5:35–43; Luke 8:49–56'),
('woman-issue-blood','Woman with the Flow of Blood','Αιμορροούσα Γυναίκα','Woman healed by touching Christ’s garment','Γυναίκα που θεραπεύθηκε αγγίζοντας το ιμάτιο του Χριστού','Mark 5:25–34; Luke 8:43–48'),
('centurion-capernaum','Centurion of Capernaum','Εκατόνταρχος Καπερναούμ','Officer praised for faith','Αξιωματικός που επαινέθηκε για την πίστη','Matthew 8:5–13; Luke 7:1–10'),
('widow-nain','Widow of Nain','Χήρα της Ναΐν','Mother whose son Christ raised','Μητέρα της οποίας τον υιό ανέστησε ο Χριστός','Luke 7:11–17'),
('rich-young-ruler','Rich Young Ruler','Πλούσιος Νεανίσκος','Questioner about eternal life','Ερωτών για την αιώνια ζωή','Matthew 19:16–30; Mark 10:17–31; Luke 18:18–30'),
('good-samaritan-figure','Good Samaritan (parable figure)','Καλός Σαμαρείτης (πρόσωπο παραβολής)','Exemplary neighbor in Christ’s parable','Πρότυπο πλησίον στην παραβολή του Χριστού','Luke 10:25–37'),
('prodigal-son-figure','Prodigal Son (parable figure)','Άσωτος Υιός (πρόσωπο παραβολής)','Repentant son in Christ’s parable','Μετανοών υιός στην παραβολή του Χριστού','Luke 15:11–32'),
('elder-brother-prodigal','Elder Brother in the Prodigal Son','Πρεσβύτερος αδελφός του Ασώτου','Parable figure warning against self-righteousness','Πρόσωπο παραβολής που προειδοποιεί για αυτοδικαίωση','Luke 15:25–32'),
('lazarus-parable','Lazarus of the Rich Man and Lazarus Parable','Λάζαρος της παραβολής του Πλουσίου','Poor man in Christ’s parable','Πτωχός στην παραβολή του Χριστού','Luke 16:19–31'),
('rich-man-parable','Rich Man in the Lazarus Parable','Πλούσιος της παραβολής του Λαζάρου','Parable figure warning against hard-hearted luxury','Πρόσωπο παραβολής που προειδοποιεί για ασπλαχνία','Luke 16:19–31'),
('pharisee-parable','Pharisee in the Publican and Pharisee','Φαρισαίος στην παραβολή Τελώνου και Φαρισαίου','Parable figure of pride','Πρόσωπο παραβολής της υπερηφάνειας','Luke 18:9–14'),
('publican-parable','Publican in the Publican and Pharisee','Τελώνης στην παραβολή Τελώνου και Φαρισαίου','Parable figure of humble repentance','Πρόσωπο παραβολής της ταπεινής μετάνοιας','Luke 18:9–14'),
('rich-fool','Rich Fool','Άφρων Πλούσιος','Parable figure warning against greed','Πρόσωπο παραβολής που προειδοποιεί για πλεονεξία','Luke 12:13–21'),
('unjust-steward','Unjust Steward','Άδικος Οικονόμος','Parable figure about stewardship and prudence','Πρόσωπο παραβολής για διαχείριση και φρόνηση','Luke 16:1–13'),
('ten-virgins','Ten Virgins','Δέκα Παρθένες','Parable figures of watchfulness','Πρόσωπα παραβολής της εγρήγορσης','Matthew 25:1–13'),
('talents-servants','Servants in the Parable of the Talents','Δούλοι στην παραβολή των Ταλάντων','Parable figures of stewardship','Πρόσωπα παραβολής της διαχείρισης','Matthew 25:14–30'),
('blind-bartimaeus','Bartimaeus','Βαρτιμαίος','Blind man healed by Christ','Τυφλός που θεραπεύθηκε από τον Χριστό','Mark 10:46–52'),
('malchus','Malchus','Μάλχος','Servant whose ear was healed by Christ','Δούλος του οποίου το αυτί θεράπευσε ο Χριστός','John 18:10; Luke 22:50–51'),
('claudia-procula','Claudia Procula, wife of Pilate','Κλαυδία Πρόκλα, σύζυγος του Πιλάτου','Woman who warned Pilate after a troubling dream','Γυναίκα που προειδοποίησε τον Πιλάτο μετά από όνειρο','Matthew 27:19; later tradition'),
('longinus-centurion','Centurion at the Cross / Longinus in tradition','Εκατόνταρχος του Σταυρού / Λογγίνος κατά την παράδοση','Roman centurion who confessed at the Crucifixion','Ρωμαίος εκατόνταρχος που ομολόγησε στη Σταύρωση','Matthew 27:54; Mark 15:39; Church tradition'),
('gamaliell','Gamaliel','Γαμαλιήλ','Pharisee teacher who counseled restraint toward the apostles','Φαρισαίος διδάσκαλος που συμβούλευσε μετριοπάθεια απέναντι στους αποστόλους','Acts 5:34–39; 22:3'),
('theudas','Theudas','Θευδάς','Insurrectionist mentioned by Gamaliel','Στασιαστής που μνημονεύεται από τον Γαμαλιήλ','Acts 5:36'),
('judas-galilean','Judas the Galilean','Ιούδας ο Γαλιλαίος','Rebel mentioned by Gamaliel','Στασιαστής που μνημονεύεται από τον Γαμαλιήλ','Acts 5:37'),
('ethiopian-eunuch','Ethiopian Eunuch','Αιθίοπας Ευνούχος','Royal official baptized by Philip','Βασιλικός αξιωματούχος που βαπτίστηκε από τον Φίλιππο','Acts 8:26–40'),
('candace','Candace, Queen of the Ethiopians','Κανδάκη, βασίλισσα των Αιθιόπων','Queen served by the Ethiopian eunuch','Βασίλισσα που υπηρετούσε ο Αιθίοπας ευνούχος','Acts 8:27'),
('sergius-paulus','Sergius Paulus','Σέργιος Παύλος','Proconsul of Cyprus who heard Paul','Ανθύπατος Κύπρου που άκουσε τον Παύλο','Acts 13:6–12'),
('jailers-philippi','Philippian Jailer','Δεσμοφύλακας των Φιλίππων','Jailer who believed after the prison miracle','Δεσμοφύλακας που πίστεψε μετά το θαύμα στη φυλακή','Acts 16:25–34'),
('dionysius-areopagus-acts','Dionysius the Areopagite in Acts','Διονύσιος ο Αρεοπαγίτης στις Πράξεις','Athenian convert after Paul’s Areopagus speech','Αθηναίος που πίστεψε μετά τον λόγο του Παύλου στον Άρειο Πάγο','Acts 17:34'),
('gallio','Gallio','Γαλλίων','Proconsul of Achaia who heard charges against Paul','Ανθύπατος Αχαΐας που άκουσε κατηγορίες κατά του Παύλου','Acts 18:12–17'),
('demetrius-silversmith','Demetrius the Silversmith','Δημήτριος ο Αργυροκόπος','Craftsman who stirred opposition to Paul in Ephesus','Τεχνίτης που υποκίνησε αντίδραση κατά του Παύλου στην Έφεσο','Acts 19:23–41'),
('eutychus','Eutychus','Εύτυχος','Young man restored after falling from a window','Νεαρός που αποκαταστάθηκε μετά από πτώση από παράθυρο','Acts 20:7–12'),
('tyrannus','Tyrannus','Τύραννος','Owner or teacher of the hall used by Paul in Ephesus','Ιδιοκτήτης ή διδάσκαλος της σχολής που χρησιμοποίησε ο Παύλος στην Έφεσο','Acts 19:9'),
('scevassons','Seven Sons of Sceva','Επτά υιοί Σκευά','Exorcists in Ephesus overcome by an evil spirit','Εξορκιστές στην Έφεσο που νικήθηκαν από πονηρό πνεύμα','Acts 19:13–17'),
('drusilla','Drusilla','Δρουσίλλα','Wife of Felix who heard Paul','Σύζυγος του Φήλικα που άκουσε τον Παύλο','Acts 24:24'),
('bernice','Bernice','Βερενίκη','Royal woman present at Paul’s hearing','Βασιλική γυναίκα παρούσα στην ακρόαση του Παύλου','Acts 25–26'),
('julius-centurion','Julius the Centurion','Ιούλιος ο Εκατόνταρχος','Officer who escorted Paul to Rome','Αξιωματικός που συνόδευσε τον Παύλο στη Ρώμη','Acts 27'),
('publius-malta','Publius of Malta','Πόπλιος Μάλτας','Leading man of Malta who hosted Paul','Πρώτος της Μάλτας που φιλοξένησε τον Παύλο','Acts 28:7–10'),
('hymenaeus','Hymenaeus','Υμέναιος','Teacher condemned in the Pastoral Epistles','Διδάσκαλος που καταδικάζεται στις Ποιμαντικές Επιστολές','1 Timothy 1:20; 2 Timothy 2:17–18'),
('alexander-coppersmith','Alexander the Coppersmith','Αλέξανδρος ο Χαλκεύς','Opponent mentioned by Paul','Αντίπαλος που μνημονεύεται από τον Παύλο','2 Timothy 4:14–15'),
('diotrephes','Diotrephes','Διοτρεφής','Church figure criticized for pride and rejection of brethren','Εκκλησιαστικό πρόσωπο που ελέγχεται για υπερηφάνεια και απόρριψη αδελφών','3 John 9–10'),
('demetrius-third-john','Demetrius of 3 John','Δημήτριος της Γʹ Ιωάννου','Christian commended by the elder','Χριστιανός που επαινείται από τον πρεσβύτερο','3 John 12'),
('gaius-third-john','Gaius of 3 John','Γάιος της Γʹ Ιωάννου','Christian praised for hospitality','Χριστιανός που επαινείται για φιλοξενία','3 John 1–8'),
]
for id,en,el,ren,rel,sc in context:
    add(id,en,el,'biblical-context',ren,rel,scripture=sc,feast_en='No saintly commemoration assigned in this catalog',feast_el='Δεν αποδίδεται αγιολογική μνήμη σε αυτή την καταχώριση',venerated=False,source='')

# ---- Additional feasts and synaxes ----
feasts=[
('circumcision-lord','Circumcision of Our Lord','Περιτομή του Κυρίου','Feast of the Lord','Δεσποτική εορτή','1 January','Luke 2:21'),
('synaxis-theotokos','Synaxis of the Most Holy Theotokos','Σύναξη της Υπεραγίας Θεοτόκου','Synaxis following the Nativity','Σύναξη μετά τη Γέννηση','26 December','Luke 2; liturgical tradition'),
('synaxis-forerunner','Synaxis of Saint John the Forerunner','Σύναξη Τιμίου Προδρόμου','Synaxis following Theophany','Σύναξη μετά τα Θεοφάνεια','7 January','Matthew 3; liturgical tradition'),
('beheading-forerunner','Beheading of Saint John the Baptist','Αποτομή Τιμίας Κεφαλής Ιωάννου Προδρόμου','Major fast-day commemoration','Μεγάλη νηστήσιμη μνήμη','29 August','Mark 6:14–29'),
('nativity-forerunner','Nativity of Saint John the Baptist','Γενέσιον Τιμίου Προδρόμου','Feast of the Forerunner','Εορτή του Προδρόμου','24 June','Luke 1:5–80'),
('conception-forerunner','Conception of Saint John the Baptist','Σύλληψη Τιμίου Προδρόμου','Feast of the Forerunner','Εορτή του Προδρόμου','23 September','Luke 1:5–25'),
('conception-theotokos','Conception of the Theotokos by Saint Anna','Σύλληψη της Θεοτόκου από την Αγία Άννα','Feast of the Theotokos','Θεομητορική εορτή','9 December','Church tradition'),
('protection-theotokos','Protection of the Most Holy Theotokos','Αγία Σκέπη της Θεοτόκου','Marian feast','Θεομητορική εορτή','1 October','Church tradition'),
('life-giving-spring','Life-Giving Spring of the Theotokos','Ζωοδόχος Πηγή','Bright Friday Marian feast','Θεομητορική εορτή της Διακαινησίμου','Bright Friday','Church tradition'),
('akathist-saturday','Saturday of the Akathist Hymn','Σάββατο του Ακαθίστου Ύμνου','Lenten Marian commemoration','Σαρακοστιανή θεομητορική μνήμη','Fifth Saturday of Great Lent','Luke 1; liturgical tradition'),
('triumph-orthodoxy','Sunday of Orthodoxy','Κυριακή της Ορθοδοξίας','First Sunday of Great Lent','Πρώτη Κυριακή της Μεγάλης Τεσσαρακοστής','First Sunday of Great Lent','John 1:43–51; Seventh Ecumenical Council memory'),
('gregory-palamas-sunday','Sunday of Saint Gregory Palamas','Κυριακή Αγίου Γρηγορίου Παλαμά','Second Sunday of Great Lent','Δεύτερη Κυριακή της Μεγάλης Τεσσαρακοστής','Second Sunday of Great Lent','Mark 2:1–12; liturgical tradition'),
('veneration-cross-lent','Sunday of the Veneration of the Cross','Κυριακή της Σταυροπροσκυνήσεως','Third Sunday of Great Lent','Τρίτη Κυριακή της Μεγάλης Τεσσαρακοστής','Third Sunday of Great Lent','Mark 8:34–9:1'),
('john-climacus-sunday','Sunday of Saint John Climacus','Κυριακή Αγίου Ιωάννου της Κλίμακος','Fourth Sunday of Great Lent','Τέταρτη Κυριακή της Μεγάλης Τεσσαρακοστής','Fourth Sunday of Great Lent','Mark 9:17–31'),
('mary-egypt-sunday','Sunday of Saint Mary of Egypt','Κυριακή Οσίας Μαρίας της Αιγυπτίας','Fifth Sunday of Great Lent','Πέμπτη Κυριακή της Μεγάλης Τεσσαρακοστής','Fifth Sunday of Great Lent','Mark 10:32–45'),
('sunday-zacchaeus','Sunday of Zacchaeus','Κυριακή του Ζακχαίου','Pre-Lenten Sunday','Προπαρασκευαστική Κυριακή','Pre-Lenten cycle','Luke 19:1–10'),
('publican-pharisee-sunday','Sunday of the Publican and Pharisee','Κυριακή Τελώνου και Φαρισαίου','Pre-Lenten Sunday','Προπαρασκευαστική Κυριακή','Pre-Lenten cycle','Luke 18:10–14'),
('prodigal-son-sunday','Sunday of the Prodigal Son','Κυριακή του Ασώτου','Pre-Lenten Sunday','Προπαρασκευαστική Κυριακή','Pre-Lenten cycle','Luke 15:11–32'),
('soul-saturday-meatfare','Saturday of Souls before Meatfare','Ψυχοσάββατο πριν την Απόκρεω','Commemoration of the departed','Μνήμη κεκοιμημένων','Saturday before Meatfare Sunday','1 Thessalonians 4:13–17; liturgical tradition'),
('meatfare-sunday','Sunday of the Last Judgment','Κυριακή της Απόκρεω','Pre-Lenten Sunday of the Last Judgment','Προπαρασκευαστική Κυριακή της Κρίσεως','Meatfare Sunday','Matthew 25:31–46'),
('cheesefare-sunday','Forgiveness Sunday / Cheesefare','Κυριακή της Τυρινής / Συγγνώμης','Entrance into Great Lent','Είσοδος στη Μεγάλη Τεσσαρακοστή','Sunday before Clean Monday','Matthew 6:14–21'),
('clean-monday','Clean Monday','Καθαρά Δευτέρα','Beginning of Great Lent','Αρχή της Μεγάλης Τεσσαρακοστής','First Monday of Great Lent','Lenten liturgical tradition'),
('holy-monday','Great and Holy Monday','Μεγάλη Δευτέρα','Holy Week commemoration','Μνήμη Μεγάλης Εβδομάδας','Monday of Holy Week','Matthew 21–24; liturgical tradition'),
('holy-tuesday','Great and Holy Tuesday','Μεγάλη Τρίτη','Holy Week commemoration','Μνήμη Μεγάλης Εβδομάδας','Tuesday of Holy Week','Matthew 24–25; liturgical tradition'),
('holy-wednesday','Great and Holy Wednesday','Μεγάλη Τετάρτη','Holy Week commemoration','Μνήμη Μεγάλης Εβδομάδας','Wednesday of Holy Week','Matthew 26:6–16; liturgical tradition'),
('thomas-sunday','Thomas Sunday','Κυριακή του Θωμά','Second Sunday of Pascha','Δεύτερη Κυριακή του Πάσχα','Second Sunday of Pascha','John 20:19–31'),
('paralytic-sunday','Sunday of the Paralytic','Κυριακή του Παραλύτου','Paschal-season Sunday','Κυριακή της Πασχάλιας περιόδου','Fourth Sunday of Pascha','John 5:1–15'),
('samaritan-woman-sunday','Sunday of the Samaritan Woman','Κυριακή της Σαμαρείτιδος','Paschal-season Sunday','Κυριακή της Πασχάλιας περιόδου','Fifth Sunday of Pascha','John 4:5–42'),
('blind-man-sunday','Sunday of the Blind Man','Κυριακή του Τυφλού','Paschal-season Sunday','Κυριακή της Πασχάλιας περιόδου','Sixth Sunday of Pascha','John 9:1–38'),
('fathers-first-council','Sunday of the Fathers of the First Ecumenical Council','Κυριακή Πατέρων Αʹ Οικουμενικής Συνόδου','Sunday between Ascension and Pentecost','Κυριακή μεταξύ Αναλήψεως και Πεντηκοστής','Sunday before Pentecost','John 17:1–13; Acts 20:16–18,28–36'),
('all-saints-local','All Saints of the Local Church','Πάντες Άγιοι της Τοπικής Εκκλησίας','Regional synaxis','Τοπική σύναξη','Varies by local Church','Liturgical tradition'),
('three-hierarchs','Synaxis of the Three Hierarchs','Σύναξη των Τριών Ιεραρχών','Common feast of Basil, Gregory, and Chrysostom','Κοινή εορτή Βασιλείου, Γρηγορίου και Χρυσοστόμου','30 January','Church tradition'),
('apostles-peter-paul','Holy Apostles Peter and Paul','Άγιοι Απόστολοι Πέτρος και Παύλος','Apostolic feast','Αποστολική εορτή','29 June','Acts; apostolic tradition'),
('synaxis-twelve-apostles','Synaxis of the Twelve Apostles','Σύναξη των Δώδεκα Αποστόλων','Apostolic synaxis','Αποστολική σύναξη','30 June','Gospels and Acts'),
('all-saints-north-america','All Saints of North America','Πάντες Άγιοι Βορείου Αμερικής','Regional synaxis','Τοπική σύναξη','Second Sunday after Pentecost in OCA usage','Church tradition'),
('new-martyrs-russia-feast','Synaxis of the New Martyrs and Confessors of Russia','Σύναξη Νεομαρτύρων και Ομολογητών Ρωσίας','Synaxis of modern martyrs and confessors','Σύναξη συγχρόνων μαρτύρων και ομολογητών','Sunday nearest 25 January','Church tradition'),
('fathers-seven-councils','Holy Fathers of the Seven Ecumenical Councils','Άγιοι Πατέρες των Επτά Οικουμενικών Συνόδων','Synaxis of conciliar fathers','Σύναξη συνοδικών πατέρων','Various commemorations','Church tradition'),
('church-new-year','Church New Year / Indiction','Αρχή Ινδίκτου / Εκκλησιαστικό Νέο Έτος','Beginning of the ecclesiastical year','Αρχή του εκκλησιαστικού έτους','1 September','Luke 4:16–22; liturgical tradition'),
('mid-pentecost','Mid-Pentecost','Μεσοπεντηκοστή','Midpoint of the Paschal season','Μεσοδιάστημα της Πασχάλιας περιόδου','Wednesday between Pascha and Pentecost','John 7:14–30'),
('leave-taking-pascha','Leave-taking of Pascha','Απόδοση του Πάσχα','Conclusion of Paschal celebration before Ascension','Ολοκλήρωση της πασχάλιας εορτής πριν την Ανάληψη','Wednesday before Ascension','Paschal liturgical tradition'),
]
for id,en,el,ren,rel,feast,sc in feasts:
    add(id,en,el,'feast',ren,rel,scripture=sc,feast_en=feast,feast_el=feast,source=SOURCE_GOARCH)

# Orthodox-tradition corrections for figures who are venerated rather than merely contextual.
_tradition_fixes={
 'joel-father-john':('church-saint','9 September','Saints Joachim and Anna are honored as the righteous parents of the Theotokos and ancestors of Christ in Orthodox tradition.','Οι Άγιοι Ιωακείμ και Άννα τιμώνται ως οι δίκαιοι γονείς της Θεοτόκου και προπάτορες του Χριστού στην Ορθόδοξη παράδοση.'),
 'anna-theotokos':('church-saint','9 September','Saint Anna is honored with Saint Joachim as mother of the Theotokos and grandmother of Christ according to Orthodox tradition.','Η Αγία Άννα τιμάται μαζί με τον Άγιο Ιωακείμ ως μητέρα της Θεοτόκου και γιαγιά του Χριστού κατά την Ορθόδοξη παράδοση.'),
 'longinus-centurion':('church-saint','16 October','Orthodox tradition venerates Saint Longinus as the centurion who confessed Christ at the Crucifixion and later bore witness to Him.','Η Ορθόδοξη παράδοση τιμά τον Άγιο Λογγίνο ως τον εκατόνταρχο που ομολόγησε τον Χριστό στη Σταύρωση και αργότερα μαρτύρησε γι’ Αυτόν.'),
 'claudia-procula':('nt-saint','27 October','In Orthodox tradition, Saint Procla (Claudia), the wife of Pontius Pilate, is remembered for the warning she sent after suffering in a dream because of Christ.','Στην Ορθόδοξη παράδοση, η Αγία Πρόκλα (Κλαυδία), σύζυγος του Ποντίου Πιλάτου, μνημονεύεται για την προειδοποίηση που έστειλε μετά το όνειρό της σχετικά με τον Χριστό.')
}
for e in new:
    if e['id'] in _tradition_fixes:
        cat,fd,sen,sel=_tradition_fixes[e['id']]
        e['category']=cat; e['venerated']=True; e['feast']={'en':fd,'el':fd}; e['story']={'en':sen,'el':sel}
        e['prayer']={'en':f"Holy {e['name']['en']}, pray to God for us, that we may grow in faith, repentance, humility, courage, and love.",'el':f"Άγιε/Αγία {e['name']['el']}, πρέσβευε στον Θεό για μας, ώστε να αυξανόμαστε σε πίστη, μετάνοια, ταπείνωση, θάρρος και αγάπη."}
        e['notes']={'en':'Venerated in Orthodox tradition; consult a local synaxarion for fuller liturgical details.','el':'Τιμάται στην Ορθόδοξη παράδοση· συμβουλευτείτε τοπικό συναξάρι για πληρέστερες λειτουργικές λεπτομέρειες.'}
        e['sourceUrl']=SOURCE_OCA; e['sourceLabel']='Orthodox calendar / reference'

# Generate compact local SVG medallions for new entries.
colors={'church-saint':('#ff9e6f','#50213b'),'righteous':('#9aff8e','#143f37'),'biblical-context':('#aeb6d2','#25294a'),'feast':('#ffe477','#4b3153'),'angel':('#62edff','#163a52'),'forefather':('#ffc970','#49323b'),'prophet':('#b28cff','#342251'),'apostle':('#ff82c8','#4a1e4a'),'nt-saint':('#79f0c8','#174844')}
for e in new:
    p=ROOT/e['image']
    if p.exists(): continue
    c1,c2=colors.get(e['category'],('#dbeafe','#312e81'))
    name=e['name']['en']
    letters=''.join([w[0] for w in re.findall(r"[A-Za-z]+",name) if w.lower() not in {'saint','saints','holy','the','of','and'}])[:3].upper() or '☦'
    seed=sum(ord(ch) for ch in e['id'])%360
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="{html.escape(name)}">
<defs><radialGradient id="g"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient></defs>
<rect width="240" height="240" rx="120" fill="url(#g)"/><circle cx="120" cy="120" r="102" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>
<circle cx="120" cy="91" r="48" fill="#fff" fill-opacity=".13"/><path d="M70 184c8-38 32-58 50-58s42 20 50 58" fill="#fff" fill-opacity=".12"/>
<text x="120" y="32" text-anchor="middle" font-size="20" fill="#fff" fill-opacity=".9">☦</text><text x="120" y="109" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="42" fill="#fff">{letters}</text>
<text x="120" y="211" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#fff" fill-opacity=".78">ORTHODOX WEB</text></svg>'''
    p.write_text(svg,encoding='utf-8')

out=DATA/'further-expansion.js'
out.write_text('window.ORTHODOX_FURTHER_EXPANSION = '+json.dumps(new,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

# Update catalog merger idempotently.
(DATA/'catalog.js').write_text("window.ORTHODOX_ENTRIES = [\n  ...(window.ORTHODOX_ENTRIES || []),\n  ...(window.ORTHODOX_EXPANDED_BIBLICAL || []),\n  ...(window.ORTHODOX_CHURCH_SAINTS || []),\n  ...(window.ORTHODOX_FEASTS || []),\n  ...(window.ORTHODOX_BIBLICAL_CONTEXT || []),\n  ...(window.ORTHODOX_FURTHER_EXPANSION || []),\n  ...(window.ORTHODOX_DEEP_BIBLICAL || [])\n];\n",encoding='utf-8')

stats=Counter(e['category'] for e in existing+new)
print('Added:',len(new)); print('Total:',len(existing)+len(new)); print(dict(sorted(stats.items())))
