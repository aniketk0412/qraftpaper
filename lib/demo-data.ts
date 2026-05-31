import type { QuestionPaper, Quiz, UnitWeight } from "./types";

export type {
  Difficulty,
  PaperQuestion,
  PaperSection,
  QuestionPaper,
  Quiz,
  QuizQuestion,
  UnitWeight,
} from "./types";

/* The example paper showcased across landing, dashboard and editor. */
export const examplePaper: QuestionPaper = {
  id: "demo",
  subject: "Data Structures & Algorithms",
  subjectCode: "CS-204",
  course: "B.Tech Computer Science · Semester IV",
  examTitle: "End-Semester Examination",
  durationMins: 180,
  totalMarks: 70,
  sections: [
    {
      id: "a",
      title: "Section A — Short Answer",
      instruction: "Answer all questions. Each question carries 2 marks.",
      questions: [
        {
          id: "a1",
          number: "1",
          text: "Define an abstract data type and give one example distinct from a primitive type.",
          marks: 2,
          unit: "Unit I",
          difficulty: "Easy",
          bloom: "Remember",
        },
        {
          id: "a2",
          number: "2",
          text: "State the worst-case time complexity of insertion into a balanced binary search tree and justify it in one line.",
          marks: 2,
          unit: "Unit III",
          difficulty: "Easy",
          bloom: "Understand",
        },
        {
          id: "a3",
          number: "3",
          text: "Differentiate between a stack and a queue with respect to their access order.",
          marks: 2,
          unit: "Unit II",
          difficulty: "Easy",
          bloom: "Understand",
        },
        {
          id: "a4",
          number: "4",
          text: "What is a collision in hashing? Name one technique to resolve it.",
          marks: 2,
          unit: "Unit IV",
          difficulty: "Easy",
          bloom: "Remember",
        },
        {
          id: "a5",
          number: "5",
          text: "List two real-world applications of a stack in program execution.",
          marks: 2,
          unit: "Unit II",
          difficulty: "Easy",
          bloom: "Remember",
        },
      ],
    },
    {
      id: "b",
      title: "Section B — Descriptive",
      instruction: "Answer any three questions. Each question carries 10 marks.",
      questions: [
        {
          id: "b1",
          number: "6",
          text: "Construct an AVL tree by inserting the keys 30, 20, 40, 10, 25, 35, 50 in order. Show the tree and the rotation performed after each insertion that triggers rebalancing.",
          marks: 10,
          unit: "Unit III",
          difficulty: "Medium",
          bloom: "Apply",
        },
        {
          id: "b2",
          number: "7",
          text: "Explain how a circular queue overcomes the limitation of a linear queue. Write the enqueue and dequeue operations with overflow and underflow checks.",
          marks: 10,
          unit: "Unit II",
          difficulty: "Medium",
          bloom: "Apply",
        },
        {
          id: "b3",
          number: "8",
          text: "Compare separate chaining and open addressing as collision-resolution strategies. Discuss load factor and its effect on lookup performance.",
          marks: 10,
          unit: "Unit IV",
          difficulty: "Medium",
          bloom: "Analyse",
        },
      ],
    },
    {
      id: "c",
      title: "Section C — Long Answer",
      instruction: "Answer any two questions. Each question carries 15 marks.",
      questions: [
        {
          id: "c1",
          number: "9",
          text: "Given a weighted, connected, undirected graph, derive the minimum spanning tree using Kruskal's algorithm. Discuss the role of the disjoint-set data structure and analyse the overall time complexity.",
          marks: 15,
          unit: "Unit V",
          difficulty: "Hard",
          bloom: "Evaluate",
        },
        {
          id: "c2",
          number: "10",
          text: "Design an algorithm to detect a cycle in a directed graph. Prove its correctness and state its complexity. Illustrate with a graph containing at least six vertices.",
          marks: 15,
          unit: "Unit V",
          difficulty: "Hard",
          bloom: "Create",
        },
      ],
    },
  ],
};

/**
 * School-level sample paper (CBSE-style Class 10 Mathematics), shown on the
 * dashboard to school users instead of the college DSA paper — so a school
 * student sees a sample at their level. Picked via examplePaperForLevel().
 */
export const schoolExamplePaper: QuestionPaper = {
  id: "demo-school",
  subject: "Mathematics",
  subjectCode: "MATH-X",
  course: "Class 10 · Secondary (CBSE pattern)",
  examTitle: "Half-Yearly Examination",
  durationMins: 120,
  totalMarks: 20,
  sections: [
    {
      id: "a",
      title: "Section A — Very Short Answer",
      instruction: "Answer all questions. Each question carries 1 mark.",
      questions: [
        {
          id: "a1",
          number: "1",
          text: "State whether the number 7 × 11 × 13 + 13 is prime or composite. Justify in one line.",
          marks: 1,
          unit: "Real Numbers",
          difficulty: "Easy",
          bloom: "Understand",
        },
        {
          id: "a2",
          number: "2",
          text: "Write the sum of the roots of the quadratic equation x² − 5x + 6 = 0.",
          marks: 1,
          unit: "Quadratic Equations",
          difficulty: "Easy",
          bloom: "Apply",
        },
        {
          id: "a3",
          number: "3",
          text: "Find the distance of the point (3, 4) from the origin.",
          marks: 1,
          unit: "Coordinate Geometry",
          difficulty: "Easy",
          bloom: "Apply",
        },
        {
          id: "a4",
          number: "4",
          text: "What is the probability of getting a head when a fair coin is tossed once?",
          marks: 1,
          unit: "Probability",
          difficulty: "Easy",
          bloom: "Remember",
        },
        {
          id: "a5",
          number: "5",
          text: "If sin θ = 1/2 and 0° ≤ θ ≤ 90°, write the value of θ.",
          marks: 1,
          unit: "Trigonometry",
          difficulty: "Easy",
          bloom: "Remember",
        },
      ],
    },
    {
      id: "b",
      title: "Section B — Short Answer",
      instruction: "Answer all questions. Each question carries 2 marks.",
      questions: [
        {
          id: "b1",
          number: "6",
          text: "Solve the pair of linear equations: x + y = 14 and x − y = 4.",
          marks: 2,
          unit: "Linear Equations",
          difficulty: "Medium",
          bloom: "Apply",
        },
        {
          id: "b2",
          number: "7",
          text: "Find the roots of the quadratic equation x² − 7x + 10 = 0 by factorisation.",
          marks: 2,
          unit: "Quadratic Equations",
          difficulty: "Medium",
          bloom: "Apply",
        },
        {
          id: "b3",
          number: "8",
          text: "Find the 10th term of the arithmetic progression 3, 7, 11, 15, …",
          marks: 2,
          unit: "Arithmetic Progressions",
          difficulty: "Medium",
          bloom: "Apply",
        },
      ],
    },
    {
      id: "c",
      title: "Section C — Long Answer",
      instruction: "Answer all questions. Each question carries 3 marks.",
      questions: [
        {
          id: "c1",
          number: "9",
          text: "Prove that √2 is an irrational number.",
          marks: 3,
          unit: "Real Numbers",
          difficulty: "Hard",
          bloom: "Analyse",
        },
        {
          id: "c2",
          number: "10",
          text: "The angle of elevation of the top of a tower from a point 30 m away from its foot on level ground is 45°. Find the height of the tower.",
          marks: 3,
          unit: "Trigonometry",
          difficulty: "Medium",
          bloom: "Apply",
        },
      ],
    },
  ],
};

/**
 * The sample paper to showcase for a given education level. School users get
 * the Class-10 Maths paper; everyone else (college / unknown) gets the
 * engineering DSA paper. Kept here so the dashboard stays a thin consumer.
 */
export function examplePaperForLevel(
  level: string | null | undefined,
): QuestionPaper {
  return level === "school" ? schoolExamplePaper : examplePaper;
}

export const exampleWeightage: UnitWeight[] = [
  { unit: "Unit I", title: "Foundations & ADTs", weight: 10 },
  { unit: "Unit II", title: "Linear Structures", weight: 22 },
  { unit: "Unit III", title: "Trees & Balancing", weight: 26 },
  { unit: "Unit IV", title: "Hashing", weight: 18 },
  { unit: "Unit V", title: "Graphs & Algorithms", weight: 24 },
];

/** Largest unit weight — used to scale weightage meter bars relative to the peak. */
export const maxUnitWeight = Math.max(
  ...exampleWeightage.map((u) => u.weight),
);

/** Example AI-generated quiz showcased across the landing section and /quiz screen. */
export const exampleQuiz: Quiz = {
  id: "demo",
  subject: "Data Structures & Algorithms",
  subjectCode: "CS-204",
  title: "Unit III–V Practice Quiz",
  durationMins: 20,
  questions: [
    {
      id: "q1",
      prompt: "What is the worst-case time complexity of searching for a key in a balanced binary search tree?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctIndex: 1,
      unit: "Unit III",
      difficulty: "Easy",
      explanation:
        "A balanced BST keeps height proportional to log n, so search visits at most O(log n) nodes.",
    },
    {
      id: "q2",
      prompt: "Which data structure follows the Last-In-First-Out (LIFO) principle?",
      options: ["Queue", "Stack", "Linked list", "Priority queue"],
      correctIndex: 1,
      unit: "Unit II",
      difficulty: "Easy",
      explanation:
        "A stack inserts and removes elements from the same end, so the most recent element leaves first.",
    },
    {
      id: "q3",
      prompt: "In an AVL tree, the balance factor of every node must lie within which range?",
      options: ["-2 to +2", "-1 to +1", "0 to +1", "-1 to 0"],
      correctIndex: 1,
      unit: "Unit III",
      difficulty: "Medium",
      explanation:
        "An AVL tree rebalances whenever a node's balance factor leaves the set {-1, 0, +1}.",
    },
    {
      id: "q4",
      prompt: "Which graph traversal uses a queue to visit vertices level by level?",
      options: [
        "Depth-First Search",
        "Breadth-First Search",
        "Topological sort",
        "Dijkstra's algorithm",
      ],
      correctIndex: 1,
      unit: "Unit V",
      difficulty: "Medium",
      explanation:
        "BFS dequeues a vertex, visits its neighbours, and enqueues them — producing level-order traversal.",
    },
    {
      id: "q5",
      prompt: "What is the worst-case time complexity of the Quicksort algorithm?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      correctIndex: 2,
      unit: "Unit IV",
      difficulty: "Medium",
      explanation:
        "When the pivot is consistently the smallest or largest element, partitions are maximally unbalanced, giving O(n²).",
    },
    {
      id: "q6",
      prompt: "In separate chaining, what happens when two keys hash to the same index?",
      options: [
        "The second key is discarded",
        "Both keys are stored in a linked list at that index",
        "The table is resized immediately",
        "The first key is overwritten",
      ],
      correctIndex: 1,
      unit: "Unit IV",
      difficulty: "Medium",
      explanation:
        "Separate chaining stores colliding entries together in a linked list (or bucket) at the shared index.",
    },
    {
      id: "q7",
      prompt: "Which of the following is NOT a linear data structure?",
      options: ["Array", "Queue", "Tree", "Linked list"],
      correctIndex: 2,
      unit: "Unit II",
      difficulty: "Easy",
      explanation:
        "A tree is hierarchical — each node may have multiple children — unlike linear arrays, queues and lists.",
    },
    {
      id: "q8",
      prompt: "Kruskal's algorithm relies on which data structure to detect cycles efficiently?",
      options: [
        "Min-heap",
        "Disjoint-set (union-find)",
        "Hash table",
        "Adjacency matrix",
      ],
      correctIndex: 1,
      unit: "Unit V",
      difficulty: "Hard",
      explanation:
        "Union-find groups connected components so Kruskal's can reject any edge that would join a component to itself.",
    },
  ],
};

