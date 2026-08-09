export type TableStatus =
  | "Usable static data"
  | "Downloadable archive"
  | "Historical record"
  | "Broken interactive software";

export interface TableCollection {
  name: string;
  path: string;
  href?: string;
  description: string;
  status: TableStatus;
  area: "Modular forms" | "Elliptic curves" | "Arithmetic geometry" | "Software" | "Research archive";
  size: string;
}

export const tableCollections: TableCollection[] = [
  { name: "389", path: "389", href: "/papers/389/", description: "Computations and working files surrounding level 389, visibility, and Weierstrass points.", status: "Historical record", area: "Research archive", size: "1.4 MB" },
  { name: "Eigenforms", path: "Eigenforms", href: "/Tables/Eigenforms/", description: "Eigenvalues of modular forms at high level and high weight, stored as large static tables.", status: "Usable static data", area: "Modular forms", size: "267 MB" },
  { name: "Selected notes and talks", path: "Notes", href: "/Tables/Notes/", description: "A large collection of lecture notes, slides, source files, and mathematical talks.", status: "Historical record", area: "Research archive", size: "88 MB" },
  { name: "ABC conjecture tables", path: "abc", href: "/Tables/abc/", description: "An early ABC-conjecture table with TeX source and a packaged HTML copy.", status: "Usable static data", area: "Arithmetic geometry", size: "380 KB" },
  { name: "Elliptic-curve isogeny matrices", path: "allisog", href: "/Tables/allisog/", description: "Isogeny-class matrices for elliptic curves of conductor at most 40,000.", status: "Usable static data", area: "Elliptic curves", size: "19 MB" },
  { name: "Antwerp IV", path: "antwerp", href: "/Tables/antwerp/", description: "Scanned and extended copies of the classical Modular Functions of One Variable IV tables.", status: "Downloadable archive", area: "Modular forms", size: "72 MB" },
  { name: "Arithmetic of weight 2 newforms", path: "arith_of_factors", href: "/Tables/arith_of_factors/", description: "Arithmetic data for weight 2 newforms on Gamma0(N), including many levels through 7248.", status: "Usable static data", area: "Modular forms", size: "356 MB" },
  { name: "Artin representation computations", path: "artin", href: "/Tables/artin/", description: "Magma inputs, operator data, and outputs from explicit Artin-representation computations.", status: "Usable static data", area: "Arithmetic geometry", size: "860 KB" },
  { name: "BSD special-value table", path: "bsdtable", href: "/Tables/bsdtable/", description: "An early generated table of Birch and Swinnerton-Dyer special values and its source artifacts.", status: "Historical record", area: "Elliptic curves", size: "1.6 MB" },
  { name: "Level 1 characteristic polynomials", path: "charpoly_level1", href: "/Tables/charpoly_level1/", description: "Characteristic polynomials of Hecke operators at level 1; static bulk data remains available.", status: "Usable static data", area: "Modular forms", size: "430 MB" },
  { name: "Real component groups", path: "compgrp", href: "/Tables/compgrp/", description: "Orders of real component groups of J0(N), with tables and Magma source.", status: "Usable static data", area: "Arithmetic geometry", size: "36 KB" },
  { name: "Cremona elliptic-curve data", path: "cremona", href: "/Tables/cremona/INDEX.html", description: "John Cremona's compressed elliptic-curve tables, including rank, isogeny, and Sha data.", status: "Usable static data", area: "Elliptic curves", size: "93 MB" },
  { name: "Elliptic curves over imaginary quadratic fields", path: "cremona_imagquad", href: "/Tables/cremona_imagquad/iqfcurvedata.tar.gz", description: "Cremona's equations, primes, and supporting scripts, packaged as a data archive.", status: "Downloadable archive", area: "Elliptic curves", size: "648 KB" },
  { name: "Cuspidal subgroup of J0(N)", path: "cuspgroup", href: "/Tables/cuspgroup/", description: "Tables and Magma/Python source for computations of rational cuspidal subgroups.", status: "Usable static data", area: "Arithmetic geometry", size: "96 KB" },
  { name: "Congruence modulus and modular degree", path: "degphi_table", href: "/Tables/degphi_table/", description: "Comparison data for the congruence number and modular degree of elliptic curves.", status: "Usable static data", area: "Elliptic curves", size: "104 KB" },
  { name: "Discriminants of Hecke algebras", path: "discriminants", href: "/Tables/discriminants/disc.html", description: "Notes, source, and computed discriminant data for Hecke algebras.", status: "Historical record", area: "Modular forms", size: "292 KB" },
  { name: "ComputeL", path: "dokchitser_computel", href: "/Tables/dokchitser_computel/", description: "A preserved 2004 copy of Tim Dokchitser's PARI package for motivic L-functions.", status: "Downloadable archive", area: "Software", size: "368 KB" },
  { name: "Elliptic curves over number fields", path: "e_over_k", href: "/Tables/e_over_k/", description: "Jennifer Sinnott's equations and isogeny tables over quadratic and other number fields.", status: "Usable static data", area: "Elliptic curves", size: "69 MB" },
  { name: "Gamma1(N) eigenforms", path: "eigeng1", href: "/Tables/eigeng1/", description: "Compressed Magma-readable q-expansions of eigenforms on Gamma1(N).", status: "Usable static data", area: "Modular forms", size: "9.6 MB" },
  { name: "Elliptic curves in nature", path: "elliptic_curves_in_nature", href: "/Tables/elliptic_curves_in_nature/", description: "An experimental mathematical exhibit linking notable equations to elliptic curves; calculators are retired.", status: "Historical record", area: "Elliptic curves", size: "7.7 MB" },
  { name: "Fischman characteristic polynomials", path: "fischman", href: "/Tables/fischman/", description: "Compressed characteristic-polynomial tables for quadratic-character spaces.", status: "Usable static data", area: "Modular forms", size: "14 MB" },
  { name: "Fundamental domain drawer", path: "fundomain", href: "/Tables/fundomain/", description: "A Java-era interactive fundamental-domain program; source and packaged binaries remain for study.", status: "Broken interactive software", area: "Software", size: "852 KB" },
  { name: "Genus 2 reduction", path: "genus2reduction", href: "/Tables/genus2reduction/", description: "Qing Liu's genus 2 reduction program, documentation, source, and historical binaries.", status: "Downloadable archive", area: "Software", size: "2.9 MB" },
  { name: "Greek letter image set", path: "greek", href: "/Tables/greek/greek.tar.gz", description: "A collection of tiny GIF glyphs once used to typeset mathematics in early web pages.", status: "Historical record", area: "Research archive", size: "744 KB" },
  { name: "Magma modular-forms FAQ", path: "hecke-magma-faq", href: "/Tables/hecke-magma-faq/1.txt", description: "A short preserved support note for the old Magma HECKE package.", status: "Historical record", area: "Software", size: "4 KB" },
  { name: "HECKE tutorial", path: "hecke-tutorial", href: "/Tables/hecke-tutorial/hecke.pdf", description: "TeX, DVI, PostScript, and PDF documentation for the historical HECKE program.", status: "Historical record", area: "Software", size: "372 KB" },
  { name: "High-weight modular forms", path: "highweight", href: "/papers/highweight/", description: "Research files and computations concerning modular forms of high weight.", status: "Historical record", area: "Research archive", size: "8.6 MB" },
  { name: "Hilbert modular forms over Q(sqrt(5))", path: "hmf", href: "/Tables/hmf/sqrt5/dimensions.txt", description: "Dimensions, Hecke characteristic polynomials, and elliptic-curve ap-lists over Q(sqrt(5)).", status: "Usable static data", area: "Modular forms", size: "40 MB" },
  { name: "Invariants of J0(N)", path: "j0n_invariants", href: "/Tables/j0n_invariants/j0_1501-1705.out.bz2", description: "Large raw and compressed outputs computing arithmetic invariants of modular Jacobians.", status: "Usable static data", area: "Arithmetic geometry", size: "867 MB" },
  { name: "Elliptic-curve L-ratios", path: "lratio", href: "/Tables/lratio/", description: "Values of L(E,1)/Omega_E for elliptic curves of conductor at most 40,000.", status: "Usable static data", area: "Elliptic curves", size: "12 MB" },
  { name: "Magma modular-forms package", path: "magma", href: "/Tables/magma/", description: "A preserved distribution, documentation, and examples for the old Magma modular-forms code.", status: "Downloadable archive", area: "Software", size: "2 MB" },
  { name: "Magma package source", path: "magma_src", href: "/Tables/magma_src/william-stein_packages_2004-11-23.tgz", description: "Source for modular symbols, modular forms, supersingular points, and modular abelian varieties.", status: "Downloadable archive", area: "Software", size: "1.7 MB" },
  { name: "Merel supersingular computations", path: "merel", href: "/Tables/merel/ss_p1-499.gp", description: "PARI/GP programs and tables for supersingular and small-prime-order computations.", status: "Usable static data", area: "Elliptic curves", size: "388 KB" },
  { name: "Meyer modular-form data", path: "meyer", href: "/Tables/meyer/w2modforms.dat", description: "Weight 2, 4, and 6 modular-form datasets supplied as plain data files.", status: "Usable static data", area: "Modular forms", size: "1.1 MB" },
  { name: "Modular abelian varieties that are Jacobians", path: "modjac", href: "/Tables/modjac/curves.txt", description: "Curve equations and supporting computations for modular abelian varieties realized as Jacobians.", status: "Usable static data", area: "Arithmetic geometry", size: "1.1 MB" },
  { name: "Elliptic curves in nature, early edition", path: "nature", href: "/Tables/nature/", description: "The earlier two-page edition of the Elliptic Curves in Nature experiment.", status: "Historical record", area: "Elliptic curves", size: "52 KB" },
  { name: "NM600-700 data", path: "new", href: "/Tables/new/NM600-700.dat", description: "A standalone numerical dataset retained under its original archival path.", status: "Usable static data", area: "Modular forms", size: "56 KB" },
  { name: "Optimal elliptic curves", path: "optimalcurves", href: "/Tables/optimalcurves/", description: "PARI-readable tables and notes concerning optimal curves through conductor 5300.", status: "Usable static data", area: "Elliptic curves", size: "4.6 MB" },
  { name: "Ordinary modular forms", path: "ordinary", href: "/Tables/ordinary/ordinary/", description: "A generated mathematical note, source, and images concerning ordinary forms.", status: "Historical record", area: "Modular forms", size: "140 KB" },
  { name: "PARI elliptic-curve tables", path: "pari-elldata", href: "/Tables/pari-elldata/", description: "A PARI-readable packaged conversion of Cremona's elliptic-curve data.", status: "Downloadable archive", area: "Elliptic curves", size: "2.3 MB" },
  { name: "Parity structures", path: "parity", href: "/Tables/parity/", description: "A generated paper and its source artifacts on parity structures and Boolean rings.", status: "Historical record", area: "Research archive", size: "592 KB" },
  { name: "Peter Green's Heegner-point package", path: "peter_green", href: "/Tables/peter_green/", description: "A local mirror of an early Heegner-point software package and its source archive.", status: "Downloadable archive", area: "Software", size: "1.2 MB" },
  { name: "Prime-level visibility of Sha", path: "primevis", href: "/Tables/primevis/", description: "Prime-level visibility computations, source, and a surviving generated table.", status: "Usable static data", area: "Arithmetic geometry", size: "324 KB" },
  { name: "Real Tamagawa data", path: "real_tamagawa", href: "/Tables/real_tamagawa/", description: "Component groups of J0(N)(R) and J1(N)(R) in two plain static tables.", status: "Usable static data", area: "Arithmetic geometry", size: "16 KB" },
  { name: "Rubinstein phi data", path: "rubinstein", href: "/Tables/rubinstein/phi_11.bz2", description: "Compressed phi datasets indexed by prime, preserved as bulk computation outputs.", status: "Usable static data", area: "Modular forms", size: "138 MB" },
  { name: "Serre's conjecture modulo pq", path: "serremodpq", href: "/Tables/serremodpq/", description: "Notes and exploratory computations concerning Serre's conjecture modulo composite primes.", status: "Historical record", area: "Arithmetic geometry", size: "396 KB" },
  { name: "Serre modulo pq, generated edition", path: "serremodpq2", href: "/Tables/serremodpq2/", description: "A second generated edition with TeX sources and image assets.", status: "Historical record", area: "Arithmetic geometry", size: "632 KB" },
  { name: "Images of Galois representations", path: "surj", href: "/Tables/surj/", description: "Surjectivity data for elliptic-curve Galois representations through conductor 30,000.", status: "Usable static data", area: "Elliptic curves", size: "11 MB" },
  { name: "Thesis source archive", path: "thesis", href: "/papers/thesis/", description: "Source files, figures, bibliography, and packaged material for the Berkeley Ph.D. thesis.", status: "Historical record", area: "Research archive", size: "1.9 MB" },
  { name: "Weierstrass points on X0(N)+", path: "weierstrass_point_plus", href: "/papers/389/wp/", description: "Static computations determining when infinity is a Weierstrass point on X0(p)+.", status: "Usable static data", area: "Arithmetic geometry", size: "24 KB" },
  { name: "Hecke eigenvalues and q-expansions", path: "an.html", href: "/Tables/an.html", description: "PARI-readable q-expansions of eigenforms on Gamma0(N), including high-precision weight 2 batches.", status: "Usable static data", area: "Modular forms", size: "194 MB" },
  { name: "Characteristic polynomials by level and weight", path: "charpoly.html", href: "/Tables/charpoly.html", description: "Characteristic-polynomial tables for Hecke operators on Gamma0(N) and Gamma1(N).", status: "Usable static data", area: "Modular forms", size: "28 MB" },
  { name: "Dimensions for Gamma0(N)", path: "dimensions.html", href: "/Tables/dimensions.html", description: "PARI-readable dimension tables and source formulas for spaces of cusp forms on Gamma0(N).", status: "Usable static data", area: "Modular forms", size: "204 KB" },
  { name: "Dimensions for Gamma1(N) with character", path: "dimensions-all.html", href: "/Tables/dimensions-all.html", description: "A large static Magma-readable dimension table for Gamma1(N), organized by character.", status: "Usable static data", area: "Modular forms", size: "674 KB" },
  { name: "BSD special values for modular abelian varieties", path: "bsd.html", href: "/Tables/bsd.html", description: "Rational parts of L(Af,1) for modular abelian varieties, with underlying PARI data.", status: "Usable static data", area: "Arithmetic geometry", size: "444 KB" },
  { name: "Level 1 central critical values", path: "level1_central_values", href: "/Tables/level1_central_values", description: "Central critical values for level 1 modular forms of weight at most 200.", status: "Usable static data", area: "Modular forms", size: "17 KB" },
  { name: "p-adic slopes", path: "gm-slopes.html", href: "/Tables/gm-slopes.html", description: "A historical index to 2-adic and 3-adic slopes of characteristic polynomials at small level.", status: "Historical record", area: "Modular forms", size: "Root files" },
  { name: "Supersingular eigenforms", path: "ss_p11-997.gp", href: "/Tables/ss_p11-997.gp", description: "Eigenforms on Gamma0(p) expressed using the free abelian group on supersingular j-invariants.", status: "Usable static data", area: "Modular forms", size: "3 MB" },
  { name: "Detailed motive decompositions", path: "MotiveDecomp_N1-200_k2", href: "/Tables/MotiveDecomp_N1-200_k2", description: "Detailed arithmetic decomposition data for J0(N), extending from small levels through N=200.", status: "Usable static data", area: "Arithmetic geometry", size: "1.2 MB" },
  { name: "Modular degree and congruence modulus", path: "moddegcongmod-table.1-500", href: "/Tables/moddegcongmod-table.1-500", description: "A plain static comparison table for levels through 500, with a small set of recorded omissions.", status: "Usable static data", area: "Arithmetic geometry", size: "44 KB" },
  { name: "Optimal quotients with exceptional torsion", path: "non_zeroinf_tor.txt", href: "/Tables/non_zeroinf_tor.txt", description: "Optimal quotients whose rational torsion is not generated by the divisor (0)-(infinity).", status: "Usable static data", area: "Arithmetic geometry", size: "11 KB" },
  { name: "HECKE modular-forms calculator", path: "hecke.html", href: "/Tables/hecke.html", description: "Documentation and downloads for the original standalone HECKE calculator, retained without a supported runtime.", status: "Downloadable archive", area: "Software", size: "26 MB" },
  { name: "PARI/GP Hecke calculator", path: "heckegp.html", href: "/Tables/heckegp.html", description: "A compact, slow, and historically useful PARI/GP implementation of Hecke operators.", status: "Downloadable archive", area: "Software", size: "Source" },
  { name: "Plane model calculator", path: "model.html", href: "/Tables/model.html", description: "Archived PARI source and a package for computing plane models in the old modular-forms workflow.", status: "Downloadable archive", area: "Software", size: "1.5 MB" },
  { name: "Odd intersection graph query", path: "odd_intersection_graph_gamma0.html", href: "/Tables/odd_intersection_graph_gamma0.html", description: "A former CGI query for odd intersection graphs; no static result set survives at this route.", status: "Broken interactive software", area: "Software", size: "Retired" },
];

export const tableStatuses: TableStatus[] = [
  "Usable static data",
  "Downloadable archive",
  "Historical record",
  "Broken interactive software",
];
