/* ============================================================
   Ukázková data pro veřejnou ukázku aplikace (publikovat-demo.js)

   Všechno je smyšlené: lidé, částky, firmy i doklady. Data se skládají
   podle dnešního data, takže ukázka vypadá aktuálně, ať ji někdo
   otevře kdykoliv. Doklady se kreslí za běhu jako SVG.
   ============================================================ */
import { spocitej, mesiceCinnosti } from './dane.js?v=muzv5o4t';

const MESICE = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}
// Den v měsíci uvnitř období 15.–15. (dny pod 15 padnou do dalšího měsíce).
function dayIn(p, day) {
  const [y, m] = p.from.split('-').map(Number);
  const base = day >= Number(p.from.slice(8, 10)) ? ymd(y, m, 1) : addMonths(ymd(y, m, 1), 1);
  const [by, bm] = base.split('-').map(Number);
  const last = new Date(Date.UTC(by, bm, 0)).getUTCDate();
  return ymd(by, bm, Math.min(day, last));
}

export function createData(today) {
  let n = 0;
  const id = () => `d${(++n).toString(36)}`;
  const Y = Number(today.slice(0, 4));

  /* ---------- osobní rozpočet: čtyři období 15.–15. ---------- */
  const curFrom = Number(today.slice(8, 10)) >= 15 ? ymd(Y, Number(today.slice(5, 7)), 15) : addMonths(ymd(Y, Number(today.slice(5, 7)), 15), -1);
  const periods = [];
  for (let k = 3; k >= 0; k--) {
    const from = addMonths(curFrom, -k);
    const to = addMonths(from, 1);
    const mi = Number(from.slice(5, 7)) - 1;
    periods.push({ id: id(), name: `${MESICE[mi]} ${from.slice(0, 4)}`, from, to, income: [], blocks: [] });
  }

  // [název, účet, plán, kdy: { auto: den } | { den } | { po: [[den, částka], …] }, odchylka skutečnosti]
  const PLAN = [
    ['Bydlení', 'c-home', 'nutne', [
      ['Nájem', 'bezny', 9500, { auto: 15 }],
      ['Energie', 'bezny', 1850, { auto: 20 }],
      ['Internet', 'bezny', 450, { auto: 25 }],
    ]],
    ['Jídlo a domácnost', 'c-cart', 'nutne', [
      ['Potraviny', 'bezny', 5000, { po: [[16, 640], [19, 820], [23, 455], [27, 910], [2, 530], [6, 760], [10, 690]] }],
      ['Drogerie', 'bezny', 600, { den: 18 }, -45],
    ]],
    ['Doprava', 'c-car', 'nutne', [
      ['Benzín', 'bezny', 1600, { po: [[17, 820], [3, 760]] }],
      ['Jízdenky', 'bezny', 550, { auto: 1 }],
    ]],
    ['Zdraví a pojištění', 'c-health', 'nutne', [
      ['Pojištění domácnosti', 'bezny', 210, { auto: 5 }],
      ['Lékárna', 'bezny', 300, { den: 21 }, -112],
    ]],
    ['Podnikání', 'c-briefcase', 'nutne', [
      ['Adobe Lightroom', 'bezny', 460, { auto: 2 }],
      ['Online galerie pro klienty', 'bezny', 290, { auto: 20 }],
      ['Rezervační systém', 'bezny', 250, { auto: 22 }],
      ['Úložiště iCloud', 'bezny', 80, { auto: 22 }],
    ]],
    ['Spoření a investice', 'c-piggy', 'sporeni', [
      ['Rezerva na horší časy', 'sporici', 3000, { auto: 16 }],
      ['ETF', 'akcie', 2500, { auto: 16 }],
    ]],
    ['Osobní', 'c-user', 'volitelne', [
      ['Telefon', 'bezny', 399, { auto: 8 }],
      ['Posilovna', 'bezny', 690, { den: 17 }],
      ['Kino a kultura', 'bezny', 600, { po: [[24, 280], [8, 190]] }],
    ]],
    ['Cestování', 'c-plane', 'volitelne', [
      ['Na dovolenou', 'sporici', 1500, { den: 16 }],
    ]],
    ['Ostatní', 'c-receipt', 'volitelne', [
      ['Dárky', 'bezny', 500, { den: 26 }, 150],
    ]],
  ];

  for (const p of periods) {
    const past = p.to <= today;
    p.income.push({ id: id(), label: 'Výplata', plan: 34200, actual: 34200, icon: 'c-wallet' });
    for (const [name, icon, kind, items] of PLAN) {
      const block = { id: id(), name, icon, kind, items: [] };
      for (const [label, account, plan, when, diff = 0] of items) {
        const it = { id: id(), label, account, plan, actual: null };
        if (when.po) {
          it.split = true;
          it.spends = when.po.map(([d, amount]) => ({ id: id(), amount, date: dayIn(p, d) }))
            .filter((s) => s.date <= today && s.date < p.to);
          it.actual = it.spends.length ? it.spends.reduce((s, x) => s + x.amount, 0) : null;
          if (past) it.closed = true;
        } else {
          const date = dayIn(p, when.auto || when.den);
          if (when.auto) it.auto = { day: when.auto };
          if (date <= today && date < p.to) {
            it.paid = true;
            it.paidAt = date;
            if (when.auto) it.paidAuto = true;
            it.actual = plan + diff;
          }
        }
        block.items.push(it);
      }
      p.blocks.push(block);
    }
  }

  /* ---------- společné nákupy se spolubydlícími ---------- */
  const cur = periods[periods.length - 1];
  const prev = periods[periods.length - 2];
  const shares3 = (amount) => {
    const each = Math.floor(amount / 3);
    return { ja: amount - 2 * each, p1: each, p2: each };
  };
  const shared = {
    people: [
      { id: 'ja', name: 'Já', me: true },
      { id: 'p1', name: 'Tomáš', settle: 'collect' },
      { id: 'p2', name: 'Klára', settle: 'rent' },
    ],
    entries: [],
    settlements: [],
  };
  const sharedBuy = (date, label, amount, paidBy, settled = {}) => {
    if (date > today) return;
    shared.entries.unshift({ id: id(), date, label, amount, paidBy, shares: shares3(amount), settled });
  };
  const sid = id();
  // Starší nákupy: s Tomášem vyrovnáno penězi, Klára svůj podíl poslala sama.
  sharedBuy(dayIn(prev, 18), 'Velký nákup na celý byt', 1860, 'ja', { p1: sid, p2: 'ruka' });
  sharedBuy(dayIn(prev, 27), 'Čisticí prostředky', 420, 'p1', { p1: sid });
  const settledAt = dayIn(prev, 5) <= today ? dayIn(prev, 5) : dayIn(prev, 28);
  shared.settlements.push({ id: sid, date: settledAt, person: 'p1', amount: 480, via: 'cash', entries: shared.entries.map((e) => e.id) });
  sharedBuy(dayIn(cur, 17), 'Nákup na grilovačku', 1290, 'ja');
  sharedBuy(dayIn(cur, 22), 'Toaletní papír a kapsle do pračky', 515, 'ja');
  sharedBuy(dayIn(cur, 24), 'Pizza na společný večer', 780, 'p2');

  /* ---------- podnikání: fotograf na vedlejší činnost ---------- */
  const start = ymd(Y - 1, 4, 1);
  const income = [];
  const expenses = [];
  let inv = 0;
  const doc = (kind, y, data) => {
    const fid = id();
    return { id: fid, path: `${y}/${fid}.svg`, type: 'image/svg+xml', size: 2400 + Math.round(Math.random() * 900), name: `${kind === 'faktura' ? `Faktura ${data.no}` : `Účtenka ${data.supplier}`}.svg`, at: `${data.date}T12:00:00.000Z`, demo: { kind, ...data } };
  };
  const addIncome = (date, amount, client, label, cat, { method = 'ucet', reserve = true, files = true } = {}) => {
    if (date > today) return;
    const y = Number(date.slice(0, 4));
    const no = `${y}${pad(++inv).padStart(3, '0')}`;
    const e = { id: id(), created: `${date}T09:00:00.000Z`, date, amount, client, label, cat, method, invoiceNo: no, files: [], note: '' };
    if (files) e.files.push(doc('faktura', y, { no, date, client, label, amount }));
    e._reserve = reserve;
    income.push(e);
  };
  const addExpense = (date, amount, supplier, label, cat, { foreign = false, files = true, share = 100 } = {}) => {
    if (date > today) return;
    const y = Number(date.slice(0, 4));
    const e = { id: id(), created: `${date}T10:00:00.000Z`, date, amount, supplier, label, cat, deductible: true, share, foreign, files: [], note: '' };
    if (files) e.files.push(doc('uctenka', y, { supplier, date, label, amount }));
    expenses.push(e);
  };

  // Výdaje z kategorie Podnikání v měsíci: aplikace je zapisuje sama
  // (id b-<položka>), tady rovnou i s doklady. Jeden doklad schválně chybí.
  for (const p of periods) {
    for (const bl of p.blocks) {
      if (bl.name !== 'Podnikání') continue;
      for (const it of bl.items) {
        if (!it.paid) continue;
        const amount = it.actual ?? it.plan;
        const e = {
          id: 'b-' + it.id, created: `${it.paidAt}T08:00:00.000Z`, date: it.paidAt, amount,
          label: it.label, supplier: it.label, cat: 'software', deductible: true, share: 100,
          foreign: /adobe|icloud/i.test(it.label), files: [], note: '',
          fromBudget: { periodId: p.id, itemId: it.id },
        };
        if (!(p === periods[periods.length - 1] && /iCloud/.test(it.label))) {
          e.files.push(doc('uctenka', Number(it.paidAt.slice(0, 4)), { supplier: it.label, date: it.paidAt, label: 'Předplatné na měsíc', amount }));
        }
        expenses.push(e);
      }
    }
  }

  // Loňský rok – od dubna
  const L = Y - 1;
  addIncome(ymd(L, 5, 14), 3000, 'Rodina Králových', 'Rodinné focení na zahradě', 'foceni');
  addIncome(ymd(L, 6, 22), 12000, 'Veronika a Adam', 'Svatba, menší balíček', 'svatba');
  addIncome(ymd(L, 8, 9), 15000, 'Simona a Jiří', 'Svatba', 'svatba');
  addIncome(ymd(L, 9, 17), 4000, 'Rodina Benešových', 'Podzimní focení v parku', 'foceni');
  addIncome(ymd(L, 10, 12), 3500, 'Anna Říhová', 'Portréty na web', 'foceni');
  addIncome(ymd(L, 12, 8), 6000, 'Vánoční minifocení', 'Šest rodin za jedno odpoledne', 'foceni', { method: 'hotove' });
  addExpense(ymd(L, 4, 9), 2400, 'Virtuální sídlo', 'Adresa sídla na rok', 'sidlo');
  addExpense(ymd(L, 5, 3), 7990, 'Fotoobchod', 'Objektiv 50 mm f/1.8', 'technika');
  addExpense(ymd(L, 11, 20), 1290, 'Elektro', 'Paměťové karty 2× 128 GB', 'technika');

  // Letošek
  const T = [
    [1, 12, 3500, 'Rodina Novotných', 'Rodinné focení doma', 'foceni'],
    [2, 8, 2500, 'Eva Malá', 'Portréty na profil', 'foceni'],
    [2, 21, 5000, 'Kavárna U Mlýna', 'Fotky jídla a interiéru na web', 'foceni'],
    [3, 14, 6000, 'Jana a Petr', 'Záloha na svatbu', 'svatba'],
    [3, 27, 3200, 'Rodina Dvořákových', 'Jarní rodinné focení', 'foceni'],
    [4, 10, 4500, 'Lucie Kovářová', 'Těhotenské focení', 'foceni'],
    [4, 24, 2000, 'Dárkový poukaz', 'Poukaz na rodinné focení', 'poukaz'],
    [5, 9, 18000, 'Kateřina a Ondřej', 'Svatba, celý den', 'svatba'],
    [5, 22, 3500, 'Rodina Horákových', 'Focení v přírodě', 'foceni'],
    [6, 6, 16000, 'Jana a Petr', 'Svatba, doplatek', 'svatba'],
    [6, 19, 2900, 'Rodina Horákových', 'Tisk fotoknihy', 'produkty'],
    [7, 4, 19500, 'Markéta a Tomáš', 'Svatba', 'svatba'],
    [7, 25, 3500, 'Rodina Veselých', 'Rodinné focení', 'foceni'],
    [8, 8, 21000, 'Lenka a Jakub', 'Svatba se zkouškou šatů', 'svatba'],
    [8, 20, 1500, 'Obec Lipnice', 'Prodej fotek na web obce', 'licence'],
    [9, 5, 17500, 'Tereza a Martin', 'Svatba', 'svatba'],
    [9, 18, 4200, 'Pekárna Klas', 'Fotky zaměstnanců', 'foceni'],
    [10, 3, 3800, 'Rodina Pokorných', 'Podzimní focení', 'foceni'],
    [10, 21, 2500, 'Dárkový poukaz', 'Poukaz k narozeninám', 'poukaz'],
    [11, 7, 4000, 'Rodina Marešových', 'Focení s miminkem', 'foceni'],
    [12, 6, 7200, 'Vánoční minifocení', 'Osm rodin za víkend', 'foceni'],
  ];
  for (const [m, d, amount, client, label, cat] of T) addIncome(ymd(Y, m, d), amount, client, label, cat);
  // Poslední dvě letošní platby ještě nemají odloženo – ať je vidět, kolik odložit.
  const thisYear = income.filter((e) => e.date.startsWith(`${Y}-`));
  thisYear.slice(-2).forEach((e) => { e._reserve = false; });
  // Vystavená faktura, která ještě nepřišla.
  const issued = addDays(today, -6);
  income.push({
    id: id(), created: `${issued}T09:00:00.000Z`, date: null, issued, due: addDays(today, 8), amount: 6500,
    client: 'Studio Pohyb', label: 'Fotky lektorů na web', cat: 'foceni', method: 'ucet', invoiceNo: `${Y}${pad(++inv).padStart(3, '0')}`,
    files: [], note: '',
  });
  income.at(-1).files.push(doc('faktura', Y, { no: income.at(-1).invoiceNo, date: issued, client: 'Studio Pohyb', label: 'Fotky lektorů na web', amount: 6500 }));

  addExpense(ymd(Y, 1, 20), 1450, 'Pojišťovna', 'Pojištění odpovědnosti na rok', 'pojisteni');
  addExpense(ymd(Y, 2, 15), 2500, 'Fotoškola', 'Kurz práce se světlem', 'vzdelavani');
  addExpense(ymd(Y, 3, 30), 4390, 'Fotoobchod', 'Blesk s odpalovačem', 'technika');
  addExpense(ymd(Y, 4, 9), 2400, 'Virtuální sídlo', 'Adresa sídla na rok', 'sidlo');
  addExpense(ymd(Y, 5, 9), 820, 'Čerpací stanice', 'Benzín na svatbu', 'doprava');
  addExpense(ymd(Y, 5, 9), 120, 'Parkoviště u zámku', 'Parkování na svatbě', 'doprava', { files: false });
  addExpense(ymd(Y, 6, 12), 1650, 'Fotolab', 'Tisk fotoknihy pro klienta', 'tisk');
  addExpense(ymd(Y, 7, 1), 500, 'Meta Platforms Ireland', 'Reklama na Instagramu', 'web', { foreign: true });
  addExpense(ymd(Y, 8, 14), 6990, 'Fotoobchod', 'Druhé tělo foťáku, bazar', 'technika');
  addExpense(ymd(Y, 9, 9), 640, 'Hobby market', 'Rekvizity na podzimní focení', 'material');
  addExpense(ymd(Y, 10, 2), 1200, 'Webhosting', 'Doména a hosting na rok', 'web');
  addExpense(ymd(Y, 11, 12), 980, 'Elektro', 'Náhradní baterie', 'technika');
  // Účtenka vyfocená v telefonu, částka zatím nedoplněná.
  const snap = addDays(today, -1);
  expenses.push({
    id: id(), created: `${snap}T18:00:00.000Z`, date: snap, amount: null, supplier: '', label: '', cat: 'ostatni',
    deductible: true, share: 100, foreign: false, draft: true, note: '',
    files: [doc('uctenka', Number(snap.slice(0, 4)), { supplier: 'Papírnictví', date: snap, label: 'Obálky na poukazy', amount: 189 })],
  });

  // Rezervy: u odložených plateb přesně to, co z nich vyšlo (stejně jako aplikace).
  const yearsOf = [...new Set(income.filter((e) => e.date).map((e) => Number(e.date.slice(0, 4))))];
  for (const y of yearsOf) {
    const list = income.filter((e) => e.date && e.date.startsWith(`${y}-`)).sort((a, z) => a.date.localeCompare(z.date));
    const mesice = mesiceCinnosti(y, start);
    let before = 0;
    let cum = 0;
    for (const e of list) {
      cum += e.amount;
      const after = spocitej({ rok: y, prijmy: cum, mesice }).celkem;
      if (e._reserve) e.reserve = { amount: after - before, date: e.date };
      before = after;
    }
  }
  income.forEach((e) => { delete e._reserve; });

  // Loňské daně a pojištění zaplacené na jaře.
  const payments = [];
  const lastYear = income.filter((e) => e.date && e.date.startsWith(`${L}-`)).reduce((s, e) => s + e.amount, 0);
  const lc = spocitej({ rok: L, prijmy: lastYear, mesice: mesiceCinnosti(L, start) });
  if (ymd(Y, 5, 4) <= today) payments.push({ id: id(), kind: 'dan', amount: lc.dan, date: ymd(Y, 4, 28), year: L });
  if (ymd(Y, 6, 10) <= today) payments.push({ id: id(), kind: 'zdravotni', amount: lc.zdr, date: ymd(Y, 6, 8), year: L });

  const checklist = Object.fromEntries(['ico', 'cssz', 'zp', 'ds', 'ucet', 'zamestnavatel', 'web'].map((k) => [k, addDays(start, 10)]));

  return {
    version: 1,
    settings: { showActual: true },
    accounts: [
      { id: 'bezny', name: 'Běžný účet', note: 'zůstane na běžném účtu', slot: 0 },
      { id: 'sporici', name: 'Spořicí účet', note: 'posílám na spořicí účet', slot: 1 },
      { id: 'invest', name: 'Investice', note: 'posílám na investice', slot: 2 },
      { id: 'akcie', name: 'Akcie', note: 'z investic do akcií', parent: 'invest' },
      { id: 'dane', name: 'Daně', note: 'rezerva na daně z podnikání', parent: 'sporici' },
    ],
    periods,
    shared,
    business: {
      settings: {
        start, end: null, rezim: 'auto', pausal: 60, reserveAccount: 'dane', bizBlocks: null,
        jmeno: 'Ukázkový fotograf', ico: '', link: { income: true, reserve: true, expenses: true },
      },
      income, expenses, payments, moves: [], checklist,
    },
  };
}

/* ---------- doklady: faktura nebo účtenka nakreslená jako SVG ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(n)} Kč`;
const czDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d}. ${m}. ${y}`; };

export async function doc(meta) {
  const x = meta.demo;
  if (!x) return null;
  const lines = [];
  let svg;
  if (x.kind === 'faktura') {
    const t = (y, text, size = 22, weight = 400, fill = '#222') => lines.push(`<text x="60" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(text)}</text>`);
    t(110, 'FAKTURA', 44, 700);
    t(150, `číslo ${x.no}`, 22, 400, '#666');
    t(230, 'Dodavatel', 18, 700, '#888');
    t(262, 'Ukázkový fotograf, IČO 00000000');
    t(292, 'Nejsem plátce DPH.', 18, 400, '#666');
    t(360, 'Odběratel', 18, 700, '#888');
    t(392, x.client);
    t(460, 'Datum vystavení', 18, 700, '#888');
    t(492, czDate(x.date));
    lines.push('<line x1="60" y1="560" x2="740" y2="560" stroke="#ddd" stroke-width="2"/>');
    t(610, x.label, 24, 600);
    lines.push(`<text x="740" y="610" font-size="24" font-weight="600" text-anchor="end" fill="#222">${esc(money(x.amount))}</text>`);
    lines.push('<line x1="60" y1="650" x2="740" y2="650" stroke="#ddd" stroke-width="2"/>');
    t(720, 'Celkem k úhradě', 22, 700);
    lines.push(`<text x="740" y="720" font-size="30" font-weight="700" text-anchor="end" fill="#222">${esc(money(x.amount))}</text>`);
    t(1030, 'Ukázkový doklad, smyšlené údaje', 16, 400, '#aaa');
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1080" width="800" height="1080"><rect width="800" height="1080" fill="#fff"/><rect x="0" y="0" width="800" height="14" fill="#2f7d4f"/><g font-family="Helvetica, Arial, sans-serif">${lines.join('')}</g></svg>`;
  } else {
    const t = (y, text, anchor = 'middle', size = 22, weight = 400) => lines.push(`<text x="${anchor === 'middle' ? 250 : anchor === 'end' ? 450 : 50}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="#222">${esc(text)}</text>`);
    t(80, x.supplier, 'middle', 28, 700);
    t(115, 'Hlavní 12, Brno', 'middle', 18);
    t(145, `${czDate(x.date)}  14:${pad((x.amount * 7) % 60)}`, 'middle', 18);
    lines.push('<line x1="50" y1="180" x2="450" y2="180" stroke="#999" stroke-dasharray="6 6"/>');
    t(225, x.label, 'start', 20);
    t(260, money(x.amount), 'end', 20);
    lines.push('<line x1="50" y1="300" x2="450" y2="300" stroke="#999" stroke-dasharray="6 6"/>');
    t(345, 'CELKEM', 'start', 26, 700);
    t(345, money(x.amount), 'end', 26, 700);
    t(395, 'Platba kartou', 'start', 18);
    t(480, 'Děkujeme za nákup', 'middle', 18);
    t(560, 'ukázková účtenka', 'middle', 14);
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 620" width="500" height="620"><rect width="500" height="620" fill="#fbfaf6"/><g font-family="Courier New, monospace">${lines.join('')}</g></svg>`;
  }
  return new Blob([svg], { type: 'image/svg+xml' });
}

window.PENIZE_DEMO = { createData, doc };
