# Peníze · ukázka

**Vyzkoušej: https://petr-simik.github.io/penize-demo/**

Aplikace, ve které vedu vlastní peníze: měsíční rozpočet, platby,
společné nákupy se spolubydlícími a od podzimu 2026 i živnost na focení
včetně daní. Tahle verze běží se smyšlenými daty, takže se v ní dá
všechno proklikat a měnit. Nic se nikam neodesílá.

Funguje v prohlížeči na počítači i v telefonu (na iPhonu jde přidat
na plochu přes Sdílet → Přidat na plochu).

## Co v ní najdeš

**Měsíc.** Rozpočet od 15. do 15. podle výplaty. Každý výdaj má účet,
kam peníze odejdou, a z toho se spočítá, kolik na začátku měsíce poslat
na běžný, spořicí a investiční účet. Platby se odškrtávají, inkasa se
zaškrtnou sama v den splatnosti, jídlo a benzín se platí z „balíčku“
po částech.

**Období.** Přehled všech měsíců a rozdělení výdajů podle účtů.

**Společné.** Nákupy se spolubydlícími: kdo komu kolik dluží a vyrovnání
penězi nebo odečtem z nájmu.

**Podnikání.** Živnost na vedlejší činnost vedle zaměstnání:

- příjmy a výdaje s doklady (fotka účtenky z telefonu, PDF faktury),
  vyhledávání podle obchodu, částky nebo měsíce,
- u každé platby částka, kterou odložit na daň a pojištění, a převod
  na účet Daně přímo v měsíčním rozpočtu,
- hranice pro přiznání, sociální pojištění a DPH s čísly pro rok 2026
  a 2027 a termíny podání,
- porovnání paušálních a skutečných výdajů a hodnoty do přiznání
  a přehledů,
- upozornění na služby ze zahraničí (identifikovaná osoba k DPH),
- podklady pro účetní jako ZIP: souhrn, tabulky pro Excel a všechny
  doklady pojmenované podle čísla.

## Jak je postavená

- Čisté HTML, CSS a JavaScript (ES moduly), žádný framework ani knihovna.
- Na počítači běží s malým serverem v Node.js bez závislostí. Data jsou
  v jednom JSON souboru, při každém uložení vzniká záloha.
- V telefonu jako webová aplikace, která funguje i bez internetu.
- Počítač a telefon se synchronizují přes soukromý GitHub repozitář.
  Změny z obou zařízení se slučují po jednotlivých položkách, takže se
  navzájem nepřepíšou.
- Výpočty daní, pojištění, hranic a termínů (včetně státních svátků)
  hlídají automatické testy.
- Světlý i tmavý režim, ovládání klávesnicí, popisky pro čtečky obrazovky.

## K ukázce

- Lidé, firmy, částky i doklady jsou smyšlené. Data se skládají podle
  dnešního data, takže ukázka vypadá aktuálně.
- Změny se ukládají jen v tvém prohlížeči. V Nastavení je vrátíš
  tlačítkem Vrátit ukázková data.
- Daně se počítají podle pravidel pro rok 2026 a 2027. Je to přehled
  pro mě, ne daňové poradenství.
