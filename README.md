# Berlin · Webspecial-Bewertung

Eigenständiges deutschsprachiges Bewertungstool auf Maturaniveau, statisch und ohne externe Abhängigkeiten. Zwei analytische Kriterienkataloge: Gruppenprodukt 50 Punkte und individuelle 10-Minuten-Prüfung 28 Punkte. 34 Produktpunkte entfallen auf Synthese, Analyse und kreative Erkenntnisleistung.

## Starten

Im Projektordner `npm start` oder `python3 -m http.server 8080` ausführen; danach http://localhost:8080 öffnen. ES-Module erfordern einen HTTP-Server; Doppelklick auf index.html reicht nicht. Node.js wird nur für die Tests benötigt, Python für den lokalen Vorschau-Server.

## GitHub Pages

1. Inhalt dieses Ordners in ein neues GitHub-Repository hochladen (einschliesslich `.github/workflows/pages.yml`). `main` als Standardbranch verwenden.
2. Unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** wählen.
3. Workflow über **Actions → Test and deploy GitHub Pages → Run workflow** starten oder auf `main` pushen.
4. Die veröffentlichte Adresse erscheint beim Deployment. Das Tool funktioniert auch unter einem Repository-Unterpfad.

Der Workflow publiziert ausschliesslich die Anwendungsdateien und den Kriterienkatalog, keine Bewertungsdateien oder Transkripte.

## Bewertungsablauf

- Ein Dossier pro geprüfte Person; Gruppe und Roman angeben.
- Pro Kriterium eine der fünf Stufen wählen und eine konkrete Begründung notieren. Leer bleibt unbewertet, 0 ist ein Urteil.
- Produkt einmal als Gruppe bewerten; **Nur Gruppenbewertung exportieren**. Für jede Person ein neues Dossier starten und diese Datei laden. Die individuelle Prüfung bleibt bei Gruppenimporten unberührt.
- Für das Einzelgespräch Fragen markieren. Timer und separates schulisches Aufnahmegerät zeitgleich starten. Aufnahme-ID und Zeitmarken eintragen. Zeitfenster: 2 Minuten Defense, 4 Minuten Inhalt, 2 Minuten Transfer, 2 Minuten Reflexion.
- Auswertung ergänzen, vollständiges Dossier als JSON sichern und bei Bedarf als PDF drucken. Für andere Personen oder andere Geräte JSON importieren.

Das Tool nimmt selbst kein Audio auf. Die Uhr bleibt nach zehn Minuten sichtbar und signalisiert das Ende. Sie kann für die Zuordnung einer überzogenen Prüfung weiterlaufen. Uhr wird beim Neuladen nicht fortgesetzt; bestehende Zeitmarken bleiben gespeichert. Abweichungen zum Mitschnitt protokollieren.

## Inhalt und Bewertungsregeln

Der vollständige [Kriterienkatalog](KRITERIENKATALOG.md) dokumentiert Deskriptoren, Beleganker, Fragenbank und Beurteilungsregeln. Grundlage ist die lokale Fassung des [Auftrags](https://berlin-thriller-werkstatt.patrickoliverfischer.chatgpt.site/) vom 25.10.2026. Der Live-Auftrag konnte beim Erstellen nicht abgerufen werden. Abweichung gegenüber dieser Fassung: Gespräch 10 statt ca. 8 Minuten, differenziertere Kriterien und neue Gewichtung innerhalb der 50 bzw. 28 Punkte. Vorgängig bekanntgeben.

Notenvorschlag CH: `1 + 5 × Gesamtpunkte / 78`, erst zum Schluss auf eine Dezimalstelle gerundet. Formel vor dem Einsatz mit den schulischen Vorgaben abgleichen. Die Anwendung zeigt eine Note erst bei vollständig bewerteten Kriterien. Fehlende Begründungen werden angezeigt; die Bewertung bleibt eine fachliche Entscheidung der Prüfperson.

## Speicherung

Ein aktuelles Dossier wird unter `berlin-rubric-v1` in localStorage des Browsers gespeichert. Keine Übertragung an einen Server, keine Konten, keine Analyse-Dienste. Ein gemeinsam verwendeter Browser kann die Daten anderer Prüfpersonen anzeigen. Browserdaten löschen entfernt das Dossier; JSON regelmässig sichern. Exporte enthalten Personendaten und gehören in die schulische Ablage, nicht ins öffentliche Repository. Aufbewahrung und Zugriff auf Mitschnitt und Protokoll nach schulischer Regelung organisieren.

## Prüfen und anpassen

`npm test` prüft Gewichtung, Punkteberechnung, Null-/Leerwertbehandlung und Importvalidierung. `data.js` enthält Kriterien und Fragen, `scoring.js` die Rechen- und Importlogik, `style.css` das responsive Layout samt Druckansicht. Kein Build und keine Installation nötig.

## Transkript hochladen

Im Bereich **02 Einzelprüfung** eine TXT-, Markdown-, SRT- oder VTT-Datei in UTF-8 auswählen (bis 1 MB und 500’000 Zeichen) oder Text direkt ins Transkriptfeld einfügen. Zeitstempel und Sprecherbezeichnungen bleiben erhalten. Das Transkript kann bearbeitet und als TXT heruntergeladen werden; es ist ausserdem im vollständigen JSON-Dossier enthalten. Alte Dossiers ohne Transkript bleiben kompatibel. Ein Gruppenexport enthält keine Transkripte; Gruppenimporte verändern das individuelle Transkript nicht.

Eine Passage im Transkript markieren, ein Gesprächskriterium wählen und **Markierung als Beleg übernehmen** anklicken. Dies ergänzt dessen Begründungsfeld, ohne die Bewertungsstufe zu verändern. Es gibt keine automatische Bewertung. Ersetzende Uploads fragen nach; ungültige Dateien lassen das vorhandene Transkript unverändert. Die Druckfassung enthält das Transkript.

Uploads werden ausschliesslich lokal eingelesen. Der Inhalt wird mit dem Dossier im Browser gespeichert; bei Speicherproblemen das JSON exportieren. Keine automatische Transkription von Audiodateien, kein Upload an GitHub und kein KI-Dienst. PDF-/Word-Transkripte zuerst als UTF-8-Text exportieren.

## Inhaltliche Bewertungsstufen

Alle zehn Kriterien verwenden eigene, beobachtbare Stufenbeschreibungen. Die Auswahlfelder nennen die fachliche Leistung direkt (z. B. bei Synthese: «Roman, Geschichte und Gegenwart zur These verbinden»). Unter jedem Kriterium stehen inhaltliche Prüffragen. Die allgemeine Bezeichnung «Maturaziel erreicht» wurde entfernt. Fachlicher Bezug: EDK-Rahmenlehrplan Deutsch S. 27–30; das konkrete Raster und die Gewichtungen sind aufgabenspezifisch.
