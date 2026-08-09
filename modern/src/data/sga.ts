export interface SgaVolume {
  number: string;
  title: string;
  pages: number;
  scans: string;
  pdf?: string;
  postscript?: string;
  djvu?: string;
}

const djvuRoot = "/sga/djvu";

export const sgaVolumes: SgaVolume[] = [
  { number: "1", title: "Revêtements étales et groupe fondamental", pages: 464, scans: "/sga/sga/1/", pdf: "/sga/sga/pdf/sga1.pdf", postscript: "/sga/sga/ps/sga1.ps", djvu: `${djvuRoot}/SGA%201.tif.djvu` },
  { number: "2", title: "Cohomologie locale des faisceaux cohérents et théorèmes de Lefschetz locaux et globaux", pages: 292, scans: "/sga/sga/2/", pdf: "/sga/sga/pdf/sga2.pdf", postscript: "/sga/sga/ps/sga2.ps", djvu: `${djvuRoot}/SGA%202.tif.djvu` },
  { number: "3-1", title: "Schémas en groupes I: propriétés générales des schémas en groupes", pages: 577, scans: "/sga/sga/3-1/", pdf: "/sga/sga/pdf/sga3-1.pdf", postscript: "/sga/sga/ps/sga3-1.ps", djvu: `${djvuRoot}/SGA%203-1.tif.djvu` },
  { number: "3-2", title: "Schémas en groupes II: groupes de type multiplicatif et structure générale", pages: 661, scans: "/sga/sga/3-2/", pdf: "/sga/sga/pdf/sga3-2.pdf", postscript: "/sga/sga/ps/sga3-2.ps", djvu: `${djvuRoot}/SGA%203-2.tif.djvu` },
  { number: "3-3", title: "Schémas en groupes III: structure des schémas en groupes réductifs", pages: 535, scans: "/sga/sga/3-3/", pdf: "/sga/sga/pdf/sga3-3.pdf", postscript: "/sga/sga/ps/sga3-3.ps", djvu: `${djvuRoot}/SGA%203-3.tif.djvu` },
  { number: "4-1", title: "Théorie des topos et cohomologie étale des schémas I", pages: 539, scans: "/sga/sga/4-1/", pdf: "/sga/sga/pdf/sga4-1.pdf", postscript: "/sga/sga/ps/sga4-1.ps", djvu: `${djvuRoot}/SGA%204-1.tif.djvu` },
  { number: "4-2", title: "Théorie des topos et cohomologie étale des schémas II", pages: 420, scans: "/sga/sga/4-2/", pdf: "/sga/sga/pdf/sga4-2.pdf", postscript: "/sga/sga/ps/sga4-2.ps", djvu: `${djvuRoot}/SGA%204-2.tif.djvu` },
  { number: "4-3", title: "Théorie des topos et cohomologie étale des schémas III", pages: 643, scans: "/sga/sga/4-3/", pdf: "/sga/sga/pdf/sga4-3.pdf", postscript: "/sga/sga/ps/sga4-3.ps", djvu: `${djvuRoot}/SGA%204-3.tif.djvu` },
  { number: "4 1/2", title: "Cohomologie étale", pages: 316, scans: "/sga/sga/4.5/", pdf: "/sga/sga/pdf/sga4h.pdf", postscript: "/sga/sga/ps/sga4.5.ps" },
  { number: "5", title: "Cohomologie l-adique et fonctions L", pages: 496, scans: "/sga/sga/5/", pdf: "/sga/sga5/SGA5.pdf", postscript: "/sga/sga5/SGA5.ps", djvu: "/sga/sga5/SGA5.djvu" },
  { number: "6", title: "Théorie des intersections et théorème de Riemann-Roch", pages: 702, scans: "/sga/sga/6/", pdf: "/sga/sga/pdf/sga6.pdf", postscript: "/sga/sga/ps/sga6.ps", djvu: `${djvuRoot}/SGA%206.tif.djvu` },
  { number: "7-1", title: "Groupes de monodromie en géométrie algébrique I", pages: 528, scans: "/sga/sga/7-1/", pdf: "/sga/sga/pdf/sga7-1.pdf", postscript: "/sga/sga/ps/sga7-1.ps", djvu: `${djvuRoot}/SGA%207-1.tif.djvu` },
  { number: "7-2", title: "Groupes de monodromie en géométrie algébrique II", pages: 444, scans: "/sga/sga/7-2/", pdf: "/sga/sga/pdf/sga7-2.pdf", postscript: "/sga/sga/ps/sga7-2.ps", djvu: `${djvuRoot}/SGA%207-2.tif.djvu` },
];
