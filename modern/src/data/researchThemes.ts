export const researchThemes = [
  {
    slug: "modular-forms",
    label: "Modular forms",
    title: "Modular forms and modular abelian varieties",
    summary: "Explicit arithmetic of modular forms, modular symbols, Hecke algebras, and the abelian varieties attached to them.",
    introduction: "This work combines structural questions in arithmetic geometry with algorithms that make modular forms and their invariants concrete. The links below collect books, representative papers, computational tables, and talks from the archive.",
    works: [
      ["Modular Forms, a Computational Approach", "/books/modform/README.html", "Open book"],
      ["Explicit approaches to modular abelian varieties", "/papers/thesis/", "Ph.D. thesis"],
      ["The Modular Degree, Congruence Primes and Multiplicity One", "/papers/ars-congruence/", "Paper"],
      ["The Manin Constant", "/papers/ars-manin/", "Paper"],
      ["An introduction to computing modular forms using modular symbols", "/papers/msri-stein-ant/", "Lecture notes"]
    ],
    archives: [
      ["Eigenforms", "/Tables/Eigenforms/"],
      ["Characteristic polynomials in level 1", "/Tables/charpoly_level1/"],
      ["Modular degree tables", "/Tables/degphi_table/"],
      ["SageMath and modular forms talk", "/talks/2007-06-05-sage-modform/"]
    ]
  },
  {
    slug: "elliptic-curves",
    label: "Arithmetic geometry",
    title: "Elliptic curves and the BSD conjecture",
    summary: "Computation and conjectures surrounding elliptic curves, modular abelian varieties, ranks, and Shafarevich-Tate groups.",
    introduction: "A central thread is the Birch and Swinnerton-Dyer conjecture: developing algorithms, producing evidence, and studying visibility phenomena that connect analytic and algebraic invariants.",
    works: [
      ["The Birch and Swinnerton-Dyer Conjecture, a Computational Approach", "/books/bsd/", "Book draft"],
      ["Databases of elliptic curves ordered by height", "/papers/2016-height/", "Paper"],
      ["Verification of BSD for specific elliptic curves", "/papers/bsdalg/", "Paper"],
      ["Visibility of Shafarevich-Tate groups of abelian varieties", "/papers/visibility_of_sha/", "Paper"],
      ["A database of elliptic curves - first report", "/papers/stein-watkins/", "Paper"]
    ],
    archives: [
      ["Cremona elliptic curve tables", "/Tables/cremona/"],
      ["BSD data", "/Tables/bsdtable/"],
      ["Elliptic curves over number fields", "/Tables/e_over_k/"],
      ["Elliptic curves talk", "/talks/20090623-elliptic_curves/"]
    ]
  },
  {
    slug: "computational-mathematics",
    label: "Computation and software",
    title: "Computational mathematics and open software",
    summary: "Algorithms, databases, and open systems for doing mathematics reproducibly and collaboratively.",
    introduction: "The mathematical work and software work are closely linked: explicit questions motivate algorithms, implementations expose better questions, and open tools make both available to a much wider community.",
    works: [
      ["Sage: Creating a viable free open-source alternative", "/papers/focm11/", "Paper"],
      ["The Sage Project: unifying free mathematical software", "/papers/icms/icms_2010.pdf", "Paper"],
      ["Three lectures about explicit methods using Sage", "/papers/2008-bordeaux/", "Lecture notes"],
      ["Algebraic Number Theory, a Computational Approach", "/books/ant/", "Open book"],
      ["Beyond the black box", "https://arxiv.org/abs/1604.08472", "Article"]
    ],
    archives: [
      ["Mathematical data and tables", "/Tables/"],
      ["Historical Magma material", "/Tables/magma/"],
      ["SageMath talks catalog", "/talks/"],
      ["Current software on GitHub", "https://github.com/williamstein"]
    ]
  }
] as const;
