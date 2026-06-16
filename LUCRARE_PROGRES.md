# Progres Lucrare de Licență — PCShop

## STATUS GENERAL
Capitolul 1 ✅ | Capitolul 2 ✅ | Capitolul 3 🔄 (în progres)

---

## CAPITOLUL 1 — ANALIZA PROBLEMEI ✅ GATA
- 1.1 Contextul domeniului ✅
- 1.2 Sisteme similare existente ✅ (eMAG, Altex, CEL.ro, PCPartPicker, Amazon)
- 1.3 Servicii oferite de un astfel de sistem ✅
- 1.4 Tipuri de utilizatori și rolurile acestora ✅
- 1.5 Operații realizate de fiecare tip de utilizator ✅

---

## CAPITOLUL 2 — SPECIFICAREA CERINȚELOR ✅ GATA
- 2.1 Cerințe funcționale generale ✅
- 2.2 Cerințe funcționale pe tipuri de utilizatori ✅
  - 2.2.1 Vizitatorul neautentificat ✅
  - 2.2.2 Clientul înregistrat ✅
  - 2.2.3 Responsabilul cu achizițiile ✅
  - 2.2.4 Responsabilul de marketing ✅
  - 2.2.5 Agentul de asistență ✅
  - 2.2.6 Tehnicianul de service ✅
  - 2.2.7 Managerul ✅
  - 2.2.8 Administratorul de sistem ✅
- 2.3 Cerințe non-funcționale ✅

---

## CAPITOLUL 3 — PROIECTAREA SISTEMULUI 🔄 ÎN PROGRES

### Text introductiv 3.1
> "În cadrul proiectării sistemului dezvoltat în această lucrare, au fost realizate
> diagrame UML pentru modelarea comportamentului aplicației. Diagramele prezentate
> în secțiunile următoare surprind principalele fluxuri de interacțiune dintre
> utilizatori și sistem, structura claselor de date și tranzițiile de stare ale
> entităților principale. Diagramele prezentate în acest capitol au fost realizate
> cu ajutorul instrumentului PlantUML, iar diagramele bazei de date cu instrumentul dbdiagram.io."

### 3.1 Diagrame UML 🔄
- 3.1.1 Diagrama cazurilor de utilizare ✅
  - Fig. 3.1 — utilizatori (PlantUML)
  - Fig. 3.2 — personal intern (PlantUML)
- 3.1.2 Diagrama de clase ✅
  - Fig. 3.3 — toate clasele (PlantUML)
- 3.1.3 Diagrama de activități ✅
  - Fig. 3.5 — plasarea unei comenzi (PlantUML)
- 3.1.4 Diagrama de stări ✅
  - Fig. 3.6 — statusul unei comenzi (PlantUML)
- 3.1.5 Diagrama de secvențe ✅
  - Fig. 3.7 — căutarea semantică (PlantUML)

### 3.2 Proiectarea bazei de date 🔄
- Text introductiv 3.2 ✅
- 3.2.1 Proiectarea la nivel conceptual ✅
  - Fig. 3.8 — utilizatori și autentificare (dbdiagram.io)
  - Fig. 3.9 — produse și comenzi (dbdiagram.io)
  - Fig. 3.10 — post-vânzare și marketing (dbdiagram.io)
- 3.2.2 Proiectarea la nivel logic ❌ DE FĂCUT
- 3.2.3 Proiectarea la nivel fizic ❌ DE FĂCUT

### 3.3 Proiectarea interfeței utilizator 🔄
- 3.3.1 Principii de UI/UX design utilizate ❌ DE FĂCUT

### 3.4 Arhitectura hardware ❌ DE FĂCUT

---

## CAPITOLUL 4 — IMPLEMENTAREA SISTEMULUI ❌ DE FĂCUT
- 4.1 Tehnologii și limbaje utilizate
- 4.2 Realizarea aplicației (fragmente de cod)
- 4.3 Detalii de infrastructură și deployment

---

## CAPITOLUL 5 — SECURITATEA APLICAȚIEI ❌ DE FĂCUT
- OWASP Top 10
- Autentificare și autorizare
- Criptare, validare date, GDPR

---

## CAPITOLUL 6 — TESTAREA ❌ DE FĂCUT
- Testare manuală
- Testare automată

---

## CAPITOLUL 7 — DESCRIEREA APLICAȚIEI ❌ DE FĂCUT
- Capturi de ecran per funcționalitate
- Comparații cu alte sisteme

---

## BIBLIOGRAFIE ❌ DE FĂCUT

---

## NOTE IMPORTANTE
- Stripe — implementat real (nu simulat)
- Ollama — scos din aplicație, doar Gemini
- Roluri: admin, manager, achizitii, marketing, suport, garantii_service, client
- Marketing NU are acces la contact messages (doar admin/manager/suport)
- Marketing stats: units_sold, revenue, review_count (NU views_count)
- Numerotare figuri: Fig. 3.X (manual în Word)
- Stil diagrame: PlantUML pentru UML, dbdiagram.io pentru ERD
- Humanizer skill activ — tot textul trecut prin humanizer
