import importedPapers from "./papers.json";

export type PaperKind = "Paper" | "Article" | "Book" | "Thesis" | "Exposition";
export interface PaperLink { label: string; href: string; }
export interface PaperRecord {
  title: string;
  href: string;
  citation: string;
  year: string;
  topic: string;
  kind: PaperKind;
  links: PaperLink[];
  search: string;
}

type PaperOverride = Partial<Omit<PaperRecord, "search">>;

const books = new Set([
  "Elementary Number Theory: Primes, Congruences, and Secrets",
  "The Birch and Swinnerton-Dyer Conjecture, a Computational Approach,",
  "Modular Forms: A Computational Approach (free online book)",
  "A Brief Introduction To Classical and Adelic Algebraic Number Theory",
]);
const articles = new Set(["Beyond the black box", "Open Source Mathematical Software"]);
const exposition = new Set([
  "Numerical computation of Chow-Heegner points associated to pairs of elliptic curves",
  "Three Lectures about Explicit Methods in Number Theory Using Sage",
  "Studying the Birch and Swinnerton-Dyer Conjecture for Modular Abelian Varieties Using MAGMA",
  "An introduction to computing modular forms using modular symbols",
  "Lectures on Serre's conjectures",
]);

const overrides: Record<string, PaperOverride> = {
  "Beyond the black box": {
    href: "/papers/black-box/black-box.pdf",
    citation: "With Jeroen Demeyer and Ursula Whitcher. Notices of the AMS 63 (2016), 928-929.",
    links: [
      { label: "PDF", href: "/papers/black-box/black-box.pdf" },
      { label: "arXiv", href: "https://arxiv.org/abs/1604.08472" },
      { label: "DOI", href: "https://doi.org/10.1090/noti1408" },
    ],
  },
  "Databases of elliptic curves ordered by height and distributions of Selmer groups and ranks": {
    href: "https://doi.org/10.1112/S1461157016000152",
    citation: "With Jennifer S. Balakrishnan, Wei Ho, Nathan Kaplan, Simon Spicer, and James Weigandt. LMS Journal of Computation and Mathematics 19 (2016), 351-370.",
    links: [
      { label: "DOI", href: "https://doi.org/10.1112/S1461157016000152" },
      { label: "arXiv", href: "https://arxiv.org/abs/1602.01894" },
      { label: "Data", href: "/papers/2016-height/" },
    ],
  },
  "A p -adic analogue of the conjecture of Birch and Swinnerton-Dyer for modular abelian varieties": {
    title: "A p-adic analogue of the conjecture of Birch and Swinnerton-Dyer for modular abelian varieties",
    href: "https://doi.org/10.1090/mcom/3029",
    citation: "With Jennifer S. Balakrishnan and J. Steffen Muller. Mathematics of Computation 85 (2016), no. 298, 983-1016.",
    year: "2016",
    links: [
      { label: "PDF", href: "/papers/mcom3029.pdf" },
      { label: "arXiv", href: "https://arxiv.org/abs/1210.2739" },
      { label: "DOI", href: "https://doi.org/10.1090/mcom/3029" },
    ],
  },
  "p -adic Heights of Heegner Points and Anticyclotomic Lambda-Adic Regulators": {
    title: "p-adic heights of Heegner points and Lambda-adic regulators",
    href: "/papers/mcom2876-padic-heights-heegner.pdf",
    citation: "With Jennifer S. Balakrishnan and Mirela Ciperiani. Mathematics of Computation 84 (2015), no. 292, 923-954.",
    year: "2015",
    links: [
      { label: "PDF", href: "/papers/mcom2876-padic-heights-heegner.pdf" },
      { label: "Draft", href: "/papers/Heights/heegner_padic_height.pdf" },
    ],
  },
  "Non-commutative Iwasawa theory for modular forms": {
    href: "https://doi.org/10.1112/plms/pds061",
    citation: "With John Coates, Tim Dokchitser, Zhibin Liang, and Ramdorai Sujatha. Proceedings of the London Mathematical Society 107 (2013), 481-516.",
    year: "2013",
    links: [
      { label: "PDF", href: "/papers/nimft/nimftdata.pdf" },
      { label: "arXiv", href: "https://arxiv.org/abs/1203.1908" },
      { label: "DOI", href: "https://doi.org/10.1112/plms/pds061" },
      { label: "Archive", href: "/papers/nimft/" },
    ],
  },
  "A Database Of Elliptic Curves Over Q(sqrt(5)) -- First Report": {
    title: "A database of elliptic curves over Q(sqrt(5)): first report",
    href: "/papers/sqrt5/sqrt5.pdf",
    citation: "With Jonathan Bober, Alyson Deines, Ariah Klages-Mundt, Benjamin LeVeque, R. Andrew Ohana, Ashwath Rabindranath, and Paul Sharaba. ANTS X proceedings (2012).",
    links: [
      { label: "PDF", href: "/papers/sqrt5/sqrt5.pdf" },
      { label: "arXiv", href: "https://arxiv.org/abs/1202.6612" },
      { label: "Data", href: "/papers/sqrt5/tables/" },
      { label: "Archive", href: "/papers/sqrt5/" },
    ],
  },
  "Numerical computation of Chow-Heegner points associated to pairs of elliptic curves": {
    href: "/papers/mcom2927-chow-heegner.pdf",
    citation: "2012 preprint; a modified version was published as an appendix in Mathematics of Computation.",
    year: "2012",
    links: [
      { label: "Published PDF", href: "/papers/mcom2927-chow-heegner.pdf" },
      { label: "Draft", href: "/papers/chow_heegner/chowheeg1.pdf" },
    ],
  },
  "Sage: Creating a Viable Free Open Source Alternative to Magma, Maple, Mathematica, and MATLAB": {
    href: "/papers/focm11/focm11.pdf",
    citation: "Foundations of Computational Mathematics 2011 proceedings.",
    links: [
      { label: "PDF", href: "/papers/focm11/focm11.pdf" },
      { label: "TeX", href: "/papers/focm11/focm11.tex" },
      { label: "Archive", href: "/papers/focm11/" },
    ],
  },
  "Algorithms for the Arithmetic of Elliptic Curves using Iwasawa Theory": {
    title: "Algorithms for arithmetic elliptic curves using Iwasawa theory",
    href: "https://doi.org/10.1090/S0025-5718-2012-02649-4",
    citation: "With Christian Wuthrich. Mathematics of Computation 82 (2013), no. 283, 1757-1792.",
    year: "2013",
    links: [
      { label: "PDF", href: "/papers/mcom2649-iwasawa-alg.pdf" },
      { label: "DOI", href: "https://doi.org/10.1090/S0025-5718-2012-02649-4" },
      { label: "Archive", href: "/papers/shark/" },
    ],
  },
  "Kolyvagin's Conjecture for Some Specific Higher Rank Elliptic Curves": {
    href: "/papers/kolyconj2/kolyconj.pdf",
    citation: "2011 preprint (40 pages).",
    links: [
      { label: "PDF", href: "/papers/kolyconj2/kolyconj.pdf" },
      { label: "TeX", href: "/papers/kolyconj2/kolyconj.tex" },
      { label: "Archive", href: "/papers/kolyconj2/" },
    ],
  },
  "Heegner Points and the Arithmetic of Elliptic Curves over Ring Class Extensions": {
    href: "https://doi.org/10.1016/j.jnt.2011.12.018",
    citation: "With Robert Bradshaw. Journal of Number Theory 132 (2012), no. 8, 1707-1719.",
    links: [
      { label: "PDF", href: "/papers/bs-heegner/bs-heegner.pdf" },
      { label: "DOI", href: "https://doi.org/10.1016/j.jnt.2011.12.018" },
      { label: "Archive", href: "/papers/bs-heegner/" },
    ],
  },
  "The Sage Project: Unifying Free Mathematical Software to Create a Viable Alternative to Magma, Maple, Mathematica and Matlab": {
    href: "/papers/icms/icms_2010.pdf",
    citation: "With Burcin Erocal. Plenary paper for the 2010 International Congress on Mathematical Software.",
    links: [{ label: "PDF", href: "/papers/icms/icms_2010.pdf" }],
  },
  "The Modular Degree, Congruence Primes and Multiplicity One": {
    href: "/papers/ars-congruence/current.pdf",
    citation: "With Amod Agashe and Kenneth Ribet. Number theory, analysis and geometry (2012), 19-49.",
    year: "2012",
    links: [
      { label: "PDF", href: "/papers/ars-congruence/current.pdf" },
      { label: "TeX", href: "/papers/ars-congruence/current.tex" },
      { label: "Archive", href: "/papers/ars-congruence/" },
    ],
  },
  "Toward a Generalization of the Gross-Zagier Conjecture": {
    href: "/papers/stein-ggz/stein-ggz.pdf",
    links: [
      { label: "PDF", href: "/papers/stein-ggz/stein-ggz.pdf" },
      { label: "TeX", href: "/papers/stein-ggz/stein-ggz.tex" },
      { label: "Archive", href: "/papers/stein-ggz/" },
    ],
  },
  "Fast Computation of Hermite Normal Forms of Random Integer Matrices": {
    href: "/papers/hnf/hnf.pdf",
    links: [
      { label: "PDF", href: "/papers/hnf/hnf.pdf" },
      { label: "TeX", href: "/papers/hnf/hnf.tex" },
      { label: "Archive", href: "/papers/hnf/" },
    ],
  },
  "Modular Forms: A Computational Approach (free online book)": {
    title: "Modular Forms: A Computational Approach",
    href: "/books/modform/modform/",
    citation: "With an appendix by Paul Gunnells. Graduate Studies in Mathematics 79, American Mathematical Society.",
    links: [
      { label: "HTML", href: "/books/modform/modform/" },
      { label: "PDF", href: "/books/modform/stein-modform.pdf" },
    ],
  },
};

function classify(title: string): PaperKind {
  if (books.has(title)) return "Book";
  if (title === "Explicit approaches to modular abelian varieties") return "Thesis";
  if (articles.has(title)) return "Article";
  if (exposition.has(title)) return "Exposition";
  return "Paper";
}

function defaultLinks(href: string): PaperLink[] {
  if (href.toLowerCase().endsWith(".pdf")) return [{ label: "PDF", href }];
  if (href.startsWith("http")) return [{ label: "External", href }];
  return [{ label: "Archive", href: href.endsWith("/") ? href : `${href}/` }];
}

const addedPapers: Omit<PaperRecord, "search">[] = [{
  title: "Torsion points on elliptic curves over number fields of small degree",
  href: "https://doi.org/10.2140/ant.2023.17.267",
  citation: "With Maarten Derickx, Sheldon Kamienny, and Michael Stoll. Algebra & Number Theory 17 (2023), 267-308.",
  year: "2023",
  topic: "Elliptic curves and BSD",
  kind: "Paper",
  links: [
    { label: "DOI", href: "https://doi.org/10.2140/ant.2023.17.267" },
    { label: "arXiv", href: "https://arxiv.org/abs/1707.00364" },
  ],
}];

function curate(paper: (typeof importedPapers)[number]): Omit<PaperRecord, "search"> {
  const override = overrides[paper.title] ?? {};
  return { ...paper, kind: classify(paper.title), links: defaultLinks(paper.href), ...override };
}

export const papers: PaperRecord[] = [...addedPapers, ...importedPapers.map(curate)]
  .map((paper) => ({
    ...paper,
    search: [paper.title, paper.citation, paper.year, paper.topic, paper.kind].join(" ").toLowerCase(),
  }))
  .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
