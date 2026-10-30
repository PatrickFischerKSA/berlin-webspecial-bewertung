# Bewertung des Berlin Thriller Webspecials

Statische Anwendung für die Produktbewertung und eine zehnminütige mündliche Einzelprüfung. Produktnote auf 50 Punkte und Prüfungsnote auf 28 Punkte werden unabhängig berechnet. 34 Produktpunkte gelten Synthese, Analyse und kreativer Erkenntnisleistung.

## Abgestufte Bewertung mit dokumentierten Belegen

Rasterfassung 4 vom 30.10.2026: Jedes der 40 Teilkriterien hat vier eigene Deskriptoren für 0, 1, 2 und 3 Rohpunkte. Die höchste vollständig belegte Stufe wird gewählt. Vier Teilkriterien ergeben maximal 12 Rohpunkte je Hauptkriterium. Gewichtete Punkte = Hauptkriteriumsgewicht × Rohpunktsumme / 12. Zwischenrechnungen bleiben ungerundet; nur die beiden Noten werden auf eine Dezimalstelle gerundet.

Bei jedem Urteil sind Fundstelle und fachliche Erklärung erforderlich; bei 0–2 Punkten zusätzlich der konkrete Abstand zur nächsthöheren Stufe. Ohne diesen Eintrag bleibt die Einstufung offen. Das Tool prüft die Dokumentation, nicht deren fachliche Richtigkeit. Die vollständigen Einstufungs-, Fehler- und Grenzfallregeln stehen im [Kriterienkatalog](KRITERIENKATALOG.md) und unter Massstab & Ablauf. Vorab bekanntgeben und nicht rückwirkend anwenden. Absolute Rekursfestigkeit wird nicht zugesichert; schulische Prüfungs- und Verfahrensvorgaben müssen separat geprüft werden.

## Word Export

Unter **Auswertung → Bewertung als Word (.docx)** ein echtes editierbares Word-Dokument herunterladen. Es enthält Stammdaten, beide getrennten Noten, das verwendete Raster, alle 40 Nachweisregeln und Abgrenzungen, Urteile, Punkte, Begründungen, ergänzende Notizen, ausgewählte Fragen und Zeitmarken. Das vollständige Transkript ist über eine Checkbox optional. Offene Bewertungen werden klar als offen ausgewiesen; ein Export erfindet keine fehlenden Urteile. Noten werden aus den Nachweisen neu berechnet. Die Datei wird vollständig im Browser erstellt.

Die DOCX-Bibliothek `docx` 9.6.1 ist lokal unter `vendor/` eingebunden. Ihre MIT-Lizenz liegt bei. Kein CDN, keine Serververarbeitung und kein externer API-Dienst. Word-Dokumente können lokal verändert werden; JSON bleibt das wieder einlesbare Bewertungsformat.

## Transkript

Unter **Einzelprüfung** TXT, Markdown, SRT oder VTT in UTF-8 einlesen (bis 1 MB und 500’000 Zeichen) oder direkt einfügen. Zeitmarken und Sprecherangaben bleiben erhalten. Der Text ist bearbeitbar, separat als TXT sicherbar und im vollständigen JSON enthalten. Markierte Passagen können als ergänzende Begründung einem Gesprächskriterium zugeordnet werden; sie bestätigen keine Einzelnachweise automatisch. PDF und Word zuerst als Text exportieren. Keine automatische Audiotranskription.

## Daten und ältere Dossiers

Das aktuelle Dossier wird lokal im Browser unter `berlin-rubric-v1` gespeichert. Der Schlüssel bleibt aus Kompatibilitätsgründen erhalten, die neue JSON-Dateiversion ist 4. Alte Dateien der Version 1 werden eingelesen: frühere Stufen bleiben als frühere Urteile sichtbar, Notizen und Transkripte erhalten. Neue Nachweise bleiben offen, weil aus einer früheren Stufe keine vier Belege rekonstruiert werden können. Dateien der Versionen 2 und 3 behalten ihre früheren Ja/Nein-Urteile als Dokumentation; die neue Punktevergabe bleibt bis zur erneuten Prüfung offen. Version 3 ergänzt Produkttext, verknüpfte Originalbelege und die dokumentierten Antwortgelegenheiten.

Ein Dossier je Person anlegen. Gruppenbewertung separat exportieren und für weitere Personen importieren; dabei bleiben individuelle Prüfung, Transkript und Zeitmarken erhalten. Gruppenexporte enthalten keine individuellen Daten. Vollständige JSON-Sicherungen bis 32 MB lassen sich wieder laden. Regelmässig sichern: Löschen der Browserdaten entfernt das lokale Dossier. Keine Personendaten, Mitschnitte, Transkripte oder Bewertungsdateien ins öffentliche Repository hochladen.

## Prüfung und Noten

10 Minuten: 2 Minuten Defense, 4 Minuten Inhaltsanalyse, 2 Minuten Transfer, 2 Minuten Quellen-/Eigenbeitragsreflexion. Die Lehrperson eröffnet alle 16 mündlichen Nachweise; eine Antwort darf mehrere liefern. Neutrale Nachfrage ist zulässig; vorgegebene Deutungen sind kein eigener Nachweis. Nicht eröffnete Antwortgelegenheiten bleiben offen und werden vor Abschluss unter vergleichbaren Bedingungen nachgeholt. Mitschnitt separat führen, Aufnahme-ID und Zeitmarken eintragen. Der Timer zeichnet kein Audio auf und wird nach Neuladen nicht fortgesetzt.

Produktnote = `1 + 5 × Produktpunkte / 50`. Mündliche Note = `1 + 5 × Gesprächspunkte / 28`. Jeweils auf eine Dezimalstelle gerundet. Bereichsnote erst bei allen begründeten Einzelurteilen. Keine Gesamtnote. Formel mit den schulischen Vorgaben abgleichen.

## Start und Veröffentlichung

`python3 -m http.server 8080` im Projektordner, dann http://localhost:8080 öffnen. Kein Build und keine Installation erforderlich. ES-Module benötigen HTTP; Doppelklick auf index.html genügt nicht.

[Veröffentlichtes Tool](https://patrickfischerksa.github.io/berlin-webspecial-bewertung/) · [Repository](https://github.com/PatrickFischerKSA/berlin-webspecial-bewertung)

GitHub Pages verwendet **Settings → Pages → Source → GitHub Actions**. Der mitgelieferte Workflow testet und publiziert auf jedem Push auf `main`. Nur aufgelistete Anwendungsdateien, Kriterienkatalog und `vendor/` werden publiziert. Tests mit `npm test` (Node 22 oder neuer).

## Grundlage

Lokale Auftragsfassung der Berlin-Thriller-Werkstatt vom 25.10.2026; bei der ersten Erstellung war die Live-Seite nicht abrufbar. Fachlicher Bezug: EDK-Rahmenlehrplan Deutsch S. 27–30. Die konkretisierten Nachweise und Gewichtungen sind die eigenständige Ausarbeitung für diesen Auftrag und keine amtliche Skala.

## Belegarbeitsplatz ohne KI

Der Bereich **01 Belegarbeitsplatz** zeigt Quelltext und Zielnachweis nebeneinander. Produkttext als TXT, Markdown oder HTML importieren, einfügen oder von einer öffentlichen URL abrufen. Der URL-Abruf benötigt vom Ziel erlaubten Browserzugriff (CORS), liest nur statisches HTML und verwendet keine Anmeldung. Bei geschützten oder dynamischen Seiten Datei oder Textauszug verwenden. HTML wird in einem inerten Template zu Text verarbeitet; Skripte, Styles, mit hidden oder aria-hidden markierte Inhalte und aktive Einbettungen werden entfernt. Videos, Audio und interaktive Funktionen werden nicht automatisch geprüft.

1. Produkttext und Transkript einlesen. Der bestehende Transkriptbereich bleibt unter **03 Einzelprüfung** verfügbar.
2. Suchbegriff eingeben. Produkt und Transkript gemeinsam oder getrennt durchsuchen; Gross-/Kleinschreibung ist optional. Die Suche findet wörtliche Begriffe, keine Bedeutungen. Maximal 100 Treffer je Quelle werden mit Kontext angezeigt.
3. Treffer anklicken oder im Quellfenster eine längere Passage mit Maus oder Tastatur markieren. Zielnachweis aus den 40 Nachweisen wählen und zuordnen.
4. Urteil und eigene fachliche Erklärung rechts eingeben. Der Beleg enthält den unveränderten Wortlaut, Quelle, Zeilen, bei Transkripten die letzte vorangehende Zeitmarke. Bei SRT/VTT ist dies der Beginn des letzten Untertitelintervalls, keine exakte Wortzeit. Das Zuordnen vergibt keine Punkte.
5. Für mündliche Nachweise die eröffnete Antwortgelegenheit, gestellte Frage, Zeitmarke und relevante Hilfen dokumentieren. Diese Felder sind Kontrollhinweise; das Tool entscheidet nicht, ob eine Frage fachlich genügt.
6. Bewertungskontrolle prüfen und Word/JSON exportieren. Im Word-Dokument werden Originalbelege auch dann aufgenommen, wenn das vollständige Transkript nicht beigefügt wird.

Belege werden als Ausschnitte mit Textposition und Quellrevision gespeichert. Eine nachträgliche Textänderung markiert betroffene Zuordnungen als veraltet, auch wenn der zitierte Satz noch vorkommt. Ursprünglicher Wortlaut und ursprüngliches Urteil bleiben erhalten; betroffene Kriterien werden bis zur erneuten Zuordnung bzw. bewussten Entfernung alter Belege nicht als abgeschlossen gerechnet. Metadatenänderungen bei identischem Text lassen die Referenz bestehen.

Die Bewertungskontrolle trennt offene Urteile, fehlende Begründungen, veränderte Beleggrundlagen, undokumentierte mündliche Antwortgelegenheiten und manuelle Fundstellenkontrolle. Ein fehlender Textbeleg ist ein Prüfhinweis, kein automatischer Abzug: auch Romanstellen ausserhalb des importierten Auszugs, technische Tests und eigene Medien können manuell dokumentiert werden. Die Kontrolle bewertet keine Interpretationsqualität und keine sachliche Wahrheit.

JSON enthält die Quellen und Zuordnungen (maximal 400 Belege à 15’000 Zeichen). Gruppenexport enthält Produkttext und produktbezogene Produktbelege, aber weder Transkriptbelege noch die individuellen Antwortgelegenheiten. Ein Gruppenimport erhält individuelle Daten; auf einen ersetzten Produkttext bezogene individuelle Belege werden nötigenfalls als veraltet markiert. Alte Dateiversionen 1 und 2 bleiben lesbar.

## Migration auf Punktestufen

Dateiversionen 1–3 bleiben lesbar. Frühere binäre Einzelurteile werden als `legacyStatus` erhalten; ihre Belege, Notizen, Quelltexte und Zuordnungen bleiben bestehen. Die neuen Punktestufen beginnen offen und müssen fachlich neu beurteilt werden. Keine stille Umrechnung alter Ablehnungen in 0 Rohpunkte. Neue Version-4-Dateien speichern Teilstufen und den Abstand zur nächsten Stufe.
