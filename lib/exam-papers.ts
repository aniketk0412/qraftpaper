/**
 * SEO landing catalog for the programmatic /exam-papers/[slug] route.
 *
 * Each entry becomes a statically-generated page that targets a real
 * long-tail search ("<subject> previous year question paper", "<code>
 * important questions"). The strategy: rank for the PYQ query students
 * already type, then convert "here's the old paper → generate a fresh one
 * in this exact format" — QraftPaper is the natural next click.
 *
 * To add a page, append an entry. No route changes needed:
 * generateStaticParams() reads straight from this array.
 */
export interface ExamPaperEntry {
  /** URL slug — keep keyword-rich and stable once published (it's the canonical). */
  slug: string;
  subject: string;
  code: string;
  /** Course + level line, e.g. "B.Tech Computer Science · Semester IV". */
  level: string;
  exam: string;
  marks: number;
  durationHrs: number;
  /** One-to-two sentences — reused as the page intro AND meta description. */
  blurb: string;
  /** Syllabus units, shown as chips and fed into the Course JSON-LD. */
  units: string[];
  /** Representative questions in this paper's real format. */
  sampleQuestions: { text: string; marks: number; unit: string }[];
}

export const examPapers: ExamPaperEntry[] = [
  {
    slug: "cs-204-data-structures",
    subject: "Data Structures & Algorithms",
    code: "CS-204",
    level: "B.Tech Computer Science · Semester IV",
    exam: "End-Semester Examination",
    marks: 70,
    durationHrs: 3,
    blurb:
      "Solving the CS-204 previous year paper is the fastest way to revise Data Structures & Algorithms — but you only get one. Upload your syllabus and last year's paper and QraftPaper drafts unlimited fresh mocks in the exact same 70-mark, 3-hour format.",
    units: [
      "Foundations & ADTs",
      "Linear Structures",
      "Trees & Balancing",
      "Hashing",
      "Graphs & Algorithms",
    ],
    sampleQuestions: [
      {
        text: "Construct an AVL tree by inserting 30, 20, 40, 10, 25, 35, 50 in order. Show the rotation after each insertion that triggers rebalancing.",
        marks: 10,
        unit: "Trees & Balancing",
      },
      {
        text: "Compare separate chaining and open addressing as collision-resolution strategies. Discuss load factor and its effect on lookup performance.",
        marks: 10,
        unit: "Hashing",
      },
      {
        text: "Derive the minimum spanning tree of a weighted connected graph using Kruskal's algorithm and analyse its overall time complexity.",
        marks: 15,
        unit: "Graphs & Algorithms",
      },
    ],
  },
  {
    slug: "cs-301-operating-systems",
    subject: "Operating Systems",
    code: "CS-301",
    level: "B.Tech Computer Science · Semester V",
    exam: "End-Semester Examination",
    marks: 70,
    durationHrs: 3,
    blurb:
      "The CS-301 Operating Systems paper rewards practising scheduling, deadlock and memory problems in the real exam pattern. Feed QraftPaper your syllabus and a previous year paper to generate mocks that mirror your sections, marks and difficulty mix.",
    units: [
      "Processes & Threads",
      "CPU Scheduling",
      "Synchronisation & Deadlock",
      "Memory Management",
      "File Systems & I/O",
    ],
    sampleQuestions: [
      {
        text: "Given a set of processes with arrival and burst times, compute the average waiting time under FCFS, SJF and Round Robin (quantum = 2). Compare the results.",
        marks: 10,
        unit: "CPU Scheduling",
      },
      {
        text: "Explain the four necessary conditions for deadlock and describe how the Banker's algorithm avoids it. Work through one safe-state check.",
        marks: 10,
        unit: "Synchronisation & Deadlock",
      },
      {
        text: "Compare paging and segmentation. Derive the effective memory access time for a system with a TLB hit ratio of 90%.",
        marks: 15,
        unit: "Memory Management",
      },
    ],
  },
  {
    slug: "cs-302-dbms",
    subject: "Database Management Systems",
    code: "CS-302",
    level: "B.Tech Computer Science · Semester V",
    exam: "End-Semester Examination",
    marks: 70,
    durationHrs: 3,
    blurb:
      "DBMS papers lean heavily on SQL, normalisation and transactions — exactly the topics worth drilling in the real format. Upload your CS-302 syllabus and last year's question paper and QraftPaper generates practice papers that match it.",
    units: [
      "ER Modelling",
      "Relational Algebra & SQL",
      "Normalisation",
      "Transactions & Concurrency",
      "Indexing & Storage",
    ],
    sampleQuestions: [
      {
        text: "Given a relation with a set of functional dependencies, find the candidate keys and decompose it into 3NF. Verify the decomposition is lossless and dependency-preserving.",
        marks: 10,
        unit: "Normalisation",
      },
      {
        text: "Write SQL queries for the given schema involving a correlated subquery, a GROUP BY with HAVING, and an outer join. Explain what each returns.",
        marks: 10,
        unit: "Relational Algebra & SQL",
      },
      {
        text: "Explain the ACID properties. Show how two-phase locking guarantees serialisability and illustrate a schedule it would prevent.",
        marks: 15,
        unit: "Transactions & Concurrency",
      },
    ],
  },
];

export function getExamPaper(slug: string): ExamPaperEntry | undefined {
  return examPapers.find((p) => p.slug === slug);
}

/** Everything except the given slug — used for the "related papers" block. */
export function relatedExamPapers(slug: string): ExamPaperEntry[] {
  return examPapers.filter((p) => p.slug !== slug);
}
