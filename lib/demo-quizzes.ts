import { exampleQuiz } from "@/lib/demo-data";
import type { Quiz, QuizQuestion } from "@/lib/types";

/**
 * Catalog for the public "try before signup" demo. The visitor first tells us
 * who they are — a school class (1–10) or a college department — and we run a
 * grade/stream-appropriate sample quiz instead of dropping everyone into the
 * same Data Structures quiz.
 *
 * Coverage strategy (deliberate): every class 1–10 is individually selectable,
 * but classes share quizzes within a band (Primary 1–5, Middle 6–8, Secondary
 * 9–10). A demo only needs to feel level-appropriate; authoring a unique, and
 * *correct*, quiz for all 200+ class×subject combinations would trade accuracy
 * for breadth, and a wrong answer in a demo is worse than a shared one. The
 * chosen class is still shown in the quiz header. To extend: add a DemoSubject
 * to a band or department, or add a whole department — the picker derives its
 * options from these arrays.
 *
 * Everything here is static and answer-keys-inline, so the demo runs entirely
 * client-side: no AI cost, no signup, no database.
 */

export type DemoTrack = "school" | "college";

export interface DemoSubject {
  subject: string;
  blurb: string;
  /** Optional stream label (Class 11–12), e.g. "Science" / "Commerce". */
  stream?: string;
  quiz: Quiz;
}

export interface SchoolBand {
  id: string;
  label: string;
  /** Human range, e.g. "Classes 1–5". */
  range: string;
  grades: number[];
  subjects: DemoSubject[];
}

export interface CollegeDept {
  id: string;
  label: string;
  blurb: string;
  subjects: DemoSubject[];
}

/** Every school class the picker offers. */
export const SCHOOL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function quiz(
  meta: {
    subject: string;
    subjectCode: string;
    title: string;
    durationMins: number;
  },
  questions: QuizQuestion[],
): Quiz {
  return { id: "demo", ...meta, questions };
}

/* ========================================================================== */
/*  SCHOOL                                                                     */
/* ========================================================================== */

const primaryMaths = quiz(
  { subject: "Mathematics", subjectCode: "MATH-P", title: "Primary Mathematics Quiz", durationMins: 10 },
  [
    { id: "q1", prompt: "What is 7 + 6?", options: ["12", "13", "14", "11"], correctIndex: 1, unit: "Addition", difficulty: "Easy", explanation: "7 + 6 = 13." },
    { id: "q2", prompt: "What is 9 − 4?", options: ["3", "4", "5", "6"], correctIndex: 2, unit: "Subtraction", difficulty: "Easy", explanation: "9 − 4 = 5." },
    { id: "q3", prompt: "What is 3 × 5?", options: ["8", "12", "15", "18"], correctIndex: 2, unit: "Multiplication", difficulty: "Easy", explanation: "3 × 5 = 15." },
    { id: "q4", prompt: "Which number is the largest?", options: ["45", "54", "35", "50"], correctIndex: 1, unit: "Numbers", difficulty: "Easy", explanation: "54 is greater than 45, 50 and 35." },
    { id: "q5", prompt: "What number comes just after 19?", options: ["18", "20", "21", "29"], correctIndex: 1, unit: "Numbers", difficulty: "Easy", explanation: "Counting up, 20 comes right after 19." },
  ],
);

const primaryEnglish = quiz(
  { subject: "English", subjectCode: "ENG-P", title: "Primary English Quiz", durationMins: 10 },
  [
    { id: "q1", prompt: "Which of these letters is a vowel?", options: ["b", "c", "a", "d"], correctIndex: 2, unit: "Alphabet", difficulty: "Easy", explanation: "The vowels are a, e, i, o, u." },
    { id: "q2", prompt: "What is the plural of 'cat'?", options: ["cat", "cats", "cates", "caties"], correctIndex: 1, unit: "Grammar", difficulty: "Easy", explanation: "Most nouns add -s for the plural: cat → cats." },
    { id: "q3", prompt: "What is the opposite of 'hot'?", options: ["warm", "cold", "boiling", "wet"], correctIndex: 1, unit: "Vocabulary", difficulty: "Easy", explanation: "The opposite (antonym) of hot is cold." },
    { id: "q4", prompt: "Which word is the name of a colour?", options: ["run", "red", "ran", "rat"], correctIndex: 1, unit: "Vocabulary", difficulty: "Easy", explanation: "'Red' is a colour." },
    { id: "q5", prompt: "Fill in the blank: 'I ___ a student.'", options: ["is", "am", "are", "be"], correctIndex: 1, unit: "Grammar", difficulty: "Easy", explanation: "With 'I' we use 'am': I am a student." },
  ],
);

const primaryGk = quiz(
  { subject: "General Knowledge", subjectCode: "EVS-P", title: "Primary General Knowledge Quiz", durationMins: 10 },
  [
    { id: "q1", prompt: "How many legs does a spider have?", options: ["6", "8", "10", "4"], correctIndex: 1, unit: "Animals", difficulty: "Easy", explanation: "Spiders have eight legs." },
    { id: "q2", prompt: "Which animal gives us milk?", options: ["dog", "cow", "cat", "hen"], correctIndex: 1, unit: "Animals", difficulty: "Easy", explanation: "Cows give us milk." },
    { id: "q3", prompt: "The sun rises in the…", options: ["west", "east", "north", "south"], correctIndex: 1, unit: "Nature", difficulty: "Easy", explanation: "The sun rises in the east and sets in the west." },
    { id: "q4", prompt: "Which of these is a fruit?", options: ["potato", "apple", "onion", "carrot"], correctIndex: 1, unit: "Plants", difficulty: "Easy", explanation: "An apple is a fruit; the others are vegetables." },
    { id: "q5", prompt: "Which gas do we breathe in to stay alive?", options: ["carbon dioxide", "oxygen", "nitrogen", "helium"], correctIndex: 1, unit: "Our Body", difficulty: "Easy", explanation: "We breathe in oxygen and breathe out carbon dioxide." },
  ],
);

const middleMaths = quiz(
  { subject: "Mathematics", subjectCode: "MATH-M", title: "Middle School Mathematics Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "What is the LCM of 4 and 6?", options: ["10", "12", "24", "8"], correctIndex: 1, unit: "Number Theory", difficulty: "Medium", explanation: "The least common multiple of 4 and 6 is 12." },
    { id: "q2", prompt: "Write 3/4 as a decimal.", options: ["0.34", "0.75", "0.43", "0.5"], correctIndex: 1, unit: "Fractions", difficulty: "Easy", explanation: "3 ÷ 4 = 0.75." },
    { id: "q3", prompt: "What is −5 + 8?", options: ["−3", "3", "13", "−13"], correctIndex: 1, unit: "Integers", difficulty: "Easy", explanation: "Moving 8 up from −5 gives 3." },
    { id: "q4", prompt: "The area of a rectangle 5 cm by 3 cm is…", options: ["8 cm²", "15 cm²", "16 cm²", "30 cm²"], correctIndex: 1, unit: "Mensuration", difficulty: "Easy", explanation: "Area = length × breadth = 5 × 3 = 15 cm²." },
    { id: "q5", prompt: "What is 2³ (2 cubed)?", options: ["6", "8", "9", "12"], correctIndex: 1, unit: "Exponents", difficulty: "Easy", explanation: "2³ = 2 × 2 × 2 = 8." },
  ],
);

const middleScience = quiz(
  { subject: "Science", subjectCode: "SCI-M", title: "Middle School Science Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "Plants make their own food by the process of…", options: ["respiration", "photosynthesis", "digestion", "evaporation"], correctIndex: 1, unit: "Biology", difficulty: "Easy", explanation: "Green plants make food from sunlight, water and CO₂ by photosynthesis." },
    { id: "q2", prompt: "At sea level, water boils at…", options: ["50°C", "90°C", "100°C", "120°C"], correctIndex: 2, unit: "Physics", difficulty: "Easy", explanation: "Pure water boils at 100°C at normal atmospheric pressure." },
    { id: "q3", prompt: "The largest planet in our solar system is…", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctIndex: 2, unit: "Astronomy", difficulty: "Easy", explanation: "Jupiter is the largest planet." },
    { id: "q4", prompt: "The SI unit of force is the…", options: ["joule", "newton", "watt", "volt"], correctIndex: 1, unit: "Physics", difficulty: "Medium", explanation: "Force is measured in newtons (N)." },
    { id: "q5", prompt: "Which of these is a metal?", options: ["oxygen", "iron", "plastic", "wood"], correctIndex: 1, unit: "Chemistry", difficulty: "Easy", explanation: "Iron is a metal; the others are non-metals or materials." },
  ],
);

const middleSocial = quiz(
  { subject: "Social Science", subjectCode: "SST-M", title: "Middle School Social Science Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "What is the capital of India?", options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"], correctIndex: 2, unit: "Geography", difficulty: "Easy", explanation: "New Delhi is the capital of India." },
    { id: "q2", prompt: "Which is the longest river in India?", options: ["Yamuna", "Ganga", "Godavari", "Narmada"], correctIndex: 1, unit: "Geography", difficulty: "Medium", explanation: "The Ganga is the longest river in India." },
    { id: "q3", prompt: "Mount Everest lies in which mountain range?", options: ["Aravalli", "Himalayas", "Western Ghats", "Vindhya"], correctIndex: 1, unit: "Geography", difficulty: "Easy", explanation: "Mount Everest is part of the Himalayas." },
    { id: "q4", prompt: "Which is the smallest continent by area?", options: ["Africa", "Asia", "Australia", "Europe"], correctIndex: 2, unit: "Geography", difficulty: "Medium", explanation: "Australia is the smallest continent." },
    { id: "q5", prompt: "The Earth revolves around the…", options: ["Moon", "Sun", "Mars", "stars"], correctIndex: 1, unit: "Geography", difficulty: "Easy", explanation: "The Earth orbits the Sun once a year." },
  ],
);

const secondaryMaths = quiz(
  { subject: "Mathematics", subjectCode: "MATH-10", title: "Class 9–10 Mathematics Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "Solve for x: 2x + 3 = 11.", options: ["2", "3", "4", "5"], correctIndex: 2, unit: "Algebra", difficulty: "Easy", explanation: "2x = 11 − 3 = 8, so x = 4." },
    { id: "q2", prompt: "What is the area of a circle of radius r?", options: ["2πr", "πr²", "πd", "r²"], correctIndex: 1, unit: "Mensuration", difficulty: "Easy", explanation: "Area = πr²; 2πr is the circumference." },
    { id: "q3", prompt: "In a right triangle with legs a, b and hypotenuse c, Pythagoras' theorem states…", options: ["a + b = c", "a² + b² = c²", "a² − b² = c²", "ab = c²"], correctIndex: 1, unit: "Geometry", difficulty: "Easy", explanation: "The square of the hypotenuse equals the sum of the squares of the legs." },
    { id: "q4", prompt: "What is 15% of 200?", options: ["15", "30", "45", "20"], correctIndex: 1, unit: "Percentages", difficulty: "Easy", explanation: "0.15 × 200 = 30." },
    { id: "q5", prompt: "The sum of the interior angles of a triangle is…", options: ["90°", "180°", "270°", "360°"], correctIndex: 1, unit: "Geometry", difficulty: "Easy", explanation: "They always add up to 180°." },
    { id: "q6", prompt: "Which of these is a prime number?", options: ["21", "27", "29", "33"], correctIndex: 2, unit: "Number Theory", difficulty: "Medium", explanation: "29 has no factors besides 1 and itself; the others are divisible by 3." },
  ],
);

const secondaryScience = quiz(
  { subject: "Science", subjectCode: "SCI-10", title: "Class 9–10 Science Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "What is the chemical formula of water?", options: ["CO₂", "H₂O", "O₂", "NaCl"], correctIndex: 1, unit: "Chemistry", difficulty: "Easy", explanation: "Water is two hydrogen atoms and one oxygen atom: H₂O." },
    { id: "q2", prompt: "Which organelle is the 'powerhouse of the cell'?", options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"], correctIndex: 2, unit: "Biology", difficulty: "Easy", explanation: "Mitochondria release energy (ATP) through respiration." },
    { id: "q3", prompt: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 2, unit: "Biology", difficulty: "Easy", explanation: "Plants take in CO₂ and release oxygen." },
    { id: "q4", prompt: "The SI unit of electric current is the…", options: ["volt", "watt", "ampere", "ohm"], correctIndex: 2, unit: "Physics", difficulty: "Medium", explanation: "Current is measured in amperes (A)." },
    { id: "q5", prompt: "What is the pH of a neutral solution?", options: ["0", "7", "14", "1"], correctIndex: 1, unit: "Chemistry", difficulty: "Easy", explanation: "Neutral solutions like pure water have pH 7." },
    { id: "q6", prompt: "The approximate speed of light in vacuum is…", options: ["3 × 10⁸ m/s", "340 m/s", "9.8 m/s", "1.6 × 10⁶ m/s"], correctIndex: 0, unit: "Physics", difficulty: "Medium", explanation: "Light travels at about 3 × 10⁸ m/s; 340 m/s is the speed of sound in air." },
  ],
);

const secondarySocial = quiz(
  { subject: "Social Science", subjectCode: "SST-10", title: "Class 9–10 Social Science Quiz", durationMins: 12 },
  [
    { id: "q1", prompt: "In which year did India gain independence?", options: ["1942", "1945", "1947", "1950"], correctIndex: 2, unit: "History", difficulty: "Easy", explanation: "India became independent on 15 August 1947." },
    { id: "q2", prompt: "The Constitution of India came into effect on…", options: ["15 August 1947", "26 January 1950", "2 October 1950", "26 November 1949"], correctIndex: 1, unit: "Civics", difficulty: "Medium", explanation: "It came into force on 26 January 1950, celebrated as Republic Day." },
    { id: "q3", prompt: "Who is known as the 'Father of the Nation' in India?", options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Sardar Patel", "Subhas Chandra Bose"], correctIndex: 1, unit: "History", difficulty: "Easy", explanation: "Mahatma Gandhi is called the Father of the Nation." },
    { id: "q4", prompt: "The ozone layer is found in which layer of the atmosphere?", options: ["Troposphere", "Stratosphere", "Mesosphere", "Exosphere"], correctIndex: 1, unit: "Geography", difficulty: "Medium", explanation: "Most ozone sits in the stratosphere, shielding us from UV rays." },
    { id: "q5", prompt: "Democracy is a form of government ruled by the…", options: ["king", "army", "people", "courts"], correctIndex: 2, unit: "Civics", difficulty: "Easy", explanation: "Democracy means government by the people, usually through elected representatives." },
  ],
);

const secondaryEnglish = quiz(
  { subject: "English", subjectCode: "ENG-10", title: "Class 9–10 English Grammar Quiz", durationMins: 10 },
  [
    { id: "q1", prompt: "Which of the following words is a noun?", options: ["Run", "Quickly", "Happiness", "Blue"], correctIndex: 2, unit: "Parts of Speech", difficulty: "Easy", explanation: "'Happiness' names a state, so it is a noun." },
    { id: "q2", prompt: "What is the past tense of 'go'?", options: ["Goed", "Gone", "Went", "Going"], correctIndex: 2, unit: "Verbs", difficulty: "Easy", explanation: "'Go' is irregular; its simple past is 'went'." },
    { id: "q3", prompt: "Choose the correct form: 'She ___ to school every day.'", options: ["go", "goes", "going", "gone"], correctIndex: 1, unit: "Subject–Verb Agreement", difficulty: "Easy", explanation: "A singular subject takes 'goes' in the simple present." },
    { id: "q4", prompt: "Which word is a synonym of 'happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correctIndex: 1, unit: "Vocabulary", difficulty: "Easy", explanation: "'Joyful' means full of joy — closest to 'happy'." },
    { id: "q5", prompt: "Identify the adjective in: 'The tall building collapsed.'", options: ["The", "Tall", "Building", "Collapsed"], correctIndex: 1, unit: "Parts of Speech", difficulty: "Medium", explanation: "'Tall' describes the noun 'building'." },
    { id: "q6", prompt: "Which punctuation mark ends a question?", options: ["Full stop", "Comma", "Question mark", "Exclamation mark"], correctIndex: 2, unit: "Punctuation", difficulty: "Easy", explanation: "A direct question ends with a question mark (?)." },
  ],
);

// ---- Senior Secondary (Classes 11–12), grouped by stream -----------------

const srPhysics = quiz(
  { subject: "Physics", subjectCode: "PHY-12", title: "Class 11–12 Physics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The SI unit of work is the…", options: ["Newton", "Joule", "Watt", "Pascal"], correctIndex: 1, unit: "Mechanics", difficulty: "Easy", explanation: "Work and energy are measured in joules (J)." },
    { id: "q2", prompt: "Which of these is a scalar quantity?", options: ["Force", "Velocity", "Speed", "Acceleration"], correctIndex: 2, unit: "Mechanics", difficulty: "Medium", explanation: "Speed has only magnitude; the others are vectors." },
    { id: "q3", prompt: "The acceleration of a freely falling body near Earth is about…", options: ["9.8 m/s²", "0", "19.6 m/s²", "4.9 m/s²"], correctIndex: 0, unit: "Gravitation", difficulty: "Easy", explanation: "g ≈ 9.8 m/s² downward for a freely falling body." },
    { id: "q4", prompt: "Newton's first law of motion is also called the law of…", options: ["gravitation", "inertia", "action–reaction", "conservation"], correctIndex: 1, unit: "Laws of Motion", difficulty: "Easy", explanation: "It describes inertia — bodies resist changes to their motion." },
    { id: "q5", prompt: "The SI unit of electric charge is the…", options: ["ampere", "coulomb", "volt", "ohm"], correctIndex: 1, unit: "Electricity", difficulty: "Medium", explanation: "Charge is measured in coulombs (C)." },
  ],
);

const srChemistry = quiz(
  { subject: "Chemistry", subjectCode: "CHE-12", title: "Class 11–12 Chemistry Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The atomic number of carbon is…", options: ["6", "12", "8", "14"], correctIndex: 0, unit: "Atomic Structure", difficulty: "Easy", explanation: "Carbon has 6 protons, so its atomic number is 6." },
    { id: "q2", prompt: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 1, unit: "Environmental Chemistry", difficulty: "Easy", explanation: "Nitrogen makes up about 78% of the atmosphere." },
    { id: "q3", prompt: "The pH of a strongly acidic solution is closest to…", options: ["1", "7", "10", "14"], correctIndex: 0, unit: "Acids & Bases", difficulty: "Easy", explanation: "Strong acids have a low pH, close to 1." },
    { id: "q4", prompt: "The chemical symbol for sodium is…", options: ["S", "So", "Na", "Sd"], correctIndex: 2, unit: "Periodic Table", difficulty: "Easy", explanation: "Sodium's symbol Na comes from the Latin 'natrium'." },
    { id: "q5", prompt: "An atom that has lost an electron becomes a…", options: ["neutron", "cation", "anion", "molecule"], correctIndex: 1, unit: "Bonding", difficulty: "Medium", explanation: "Losing an electron leaves a net positive charge — a cation." },
  ],
);

const srBiology = quiz(
  { subject: "Biology", subjectCode: "BIO-12", title: "Class 11–12 Biology Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The basic structural and functional unit of life is the…", options: ["tissue", "cell", "organ", "atom"], correctIndex: 1, unit: "Cell Biology", difficulty: "Easy", explanation: "All living things are made of cells." },
    { id: "q2", prompt: "Which blood cells help fight infection?", options: ["red blood cells", "white blood cells", "platelets", "plasma"], correctIndex: 1, unit: "Human Physiology", difficulty: "Easy", explanation: "White blood cells (leucocytes) defend the body against pathogens." },
    { id: "q3", prompt: "Photosynthesis mainly occurs in which part of a plant cell?", options: ["mitochondria", "chloroplast", "nucleus", "ribosome"], correctIndex: 1, unit: "Plant Physiology", difficulty: "Easy", explanation: "Chloroplasts contain chlorophyll and carry out photosynthesis." },
    { id: "q4", prompt: "Humans normally have how many pairs of chromosomes?", options: ["21", "23", "46", "24"], correctIndex: 1, unit: "Genetics", difficulty: "Medium", explanation: "Humans have 23 pairs (46 chromosomes in total)." },
    { id: "q5", prompt: "The process by which organisms produce offspring is called…", options: ["respiration", "reproduction", "digestion", "excretion"], correctIndex: 1, unit: "Reproduction", difficulty: "Easy", explanation: "Reproduction is how organisms produce new individuals." },
  ],
);

const srMaths = quiz(
  { subject: "Mathematics", subjectCode: "MATH-12", title: "Class 11–12 Mathematics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The derivative of x² with respect to x is…", options: ["x", "2x", "x²/2", "2"], correctIndex: 1, unit: "Calculus", difficulty: "Medium", explanation: "By the power rule, d/dx(x²) = 2x." },
    { id: "q2", prompt: "What is sin 90°?", options: ["0", "1", "−1", "1/2"], correctIndex: 1, unit: "Trigonometry", difficulty: "Easy", explanation: "sin 90° = 1." },
    { id: "q3", prompt: "The value of log₁₀(1000) is…", options: ["2", "3", "10", "100"], correctIndex: 1, unit: "Logarithms", difficulty: "Medium", explanation: "10³ = 1000, so log₁₀(1000) = 3." },
    { id: "q4", prompt: "If f(x) = x², then f(3) equals…", options: ["6", "9", "3", "27"], correctIndex: 1, unit: "Functions", difficulty: "Easy", explanation: "f(3) = 3² = 9." },
    { id: "q5", prompt: "In how many ways can 3 distinct books be arranged in a row?", options: ["3", "6", "9", "27"], correctIndex: 1, unit: "Permutations", difficulty: "Medium", explanation: "3! = 3 × 2 × 1 = 6." },
  ],
);

const srAccountancy = quiz(
  { subject: "Accountancy", subjectCode: "ACC-12", title: "Class 11–12 Accountancy Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The accounting equation is: Assets = Liabilities + …", options: ["Expenses", "Capital", "Revenue", "Drawings"], correctIndex: 1, unit: "Fundamentals", difficulty: "Medium", explanation: "Assets = Liabilities + Capital (owner's equity)." },
    { id: "q2", prompt: "The book in which a transaction is first recorded is the…", options: ["Ledger", "Journal", "Balance Sheet", "Trial Balance"], correctIndex: 1, unit: "Recording", difficulty: "Medium", explanation: "Transactions are first entered in the journal (book of original entry)." },
    { id: "q3", prompt: "Goodwill is an example of a/an…", options: ["current asset", "intangible asset", "liability", "expense"], correctIndex: 1, unit: "Assets", difficulty: "Medium", explanation: "Goodwill has no physical form, so it is an intangible asset." },
    { id: "q4", prompt: "Which statement shows a firm's profit or loss?", options: ["Balance Sheet", "Income Statement", "Cash Flow", "Trial Balance"], correctIndex: 1, unit: "Final Accounts", difficulty: "Easy", explanation: "The income (profit & loss) statement reports profit or loss." },
    { id: "q5", prompt: "Double-entry bookkeeping records each transaction in at least how many accounts?", options: ["1", "2", "3", "4"], correctIndex: 1, unit: "Fundamentals", difficulty: "Easy", explanation: "Every transaction affects at least two accounts (debit and credit)." },
  ],
);

const srEconomics = quiz(
  { subject: "Economics", subjectCode: "ECO-12", title: "Class 11–12 Economics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The law of demand states that, other things equal, when price rises, quantity demanded…", options: ["rises", "falls", "stays the same", "doubles"], correctIndex: 1, unit: "Microeconomics", difficulty: "Easy", explanation: "Higher price generally means lower quantity demanded." },
    { id: "q2", prompt: "GDP stands for…", options: ["Gross Domestic Product", "General Domestic Price", "Gross Demand Product", "Government Domestic Policy"], correctIndex: 0, unit: "Macroeconomics", difficulty: "Easy", explanation: "GDP = Gross Domestic Product." },
    { id: "q3", prompt: "A market with a single seller is called a…", options: ["monopoly", "oligopoly", "perfect competition", "duopoly"], correctIndex: 0, unit: "Market Structure", difficulty: "Medium", explanation: "A monopoly has one seller dominating the market." },
    { id: "q4", prompt: "Inflation refers to a sustained general rise in…", options: ["employment", "prices", "exports", "savings"], correctIndex: 1, unit: "Macroeconomics", difficulty: "Easy", explanation: "Inflation is a general increase in the price level." },
    { id: "q5", prompt: "Which of these is a factor of production?", options: ["money", "labour", "profit", "demand"], correctIndex: 1, unit: "Fundamentals", difficulty: "Medium", explanation: "Land, labour, capital and enterprise are the factors of production." },
  ],
);

const srBusiness = quiz(
  { subject: "Business Studies", subjectCode: "BST-12", title: "Class 11–12 Business Studies Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The first function of management is usually…", options: ["controlling", "planning", "staffing", "directing"], correctIndex: 1, unit: "Management", difficulty: "Easy", explanation: "Management begins with planning, then organizing, staffing, directing and controlling." },
    { id: "q2", prompt: "A company owned by shareholders with limited liability is a…", options: ["sole proprietorship", "partnership", "joint stock company", "cooperative"], correctIndex: 2, unit: "Forms of Business", difficulty: "Medium", explanation: "A joint stock company is owned by shareholders with limited liability." },
    { id: "q3", prompt: "Marketing's '4 Ps' include Product, Price, Place and…", options: ["Profit", "Promotion", "People", "Process"], correctIndex: 1, unit: "Marketing", difficulty: "Easy", explanation: "The classic marketing mix is Product, Price, Place, Promotion." },
    { id: "q4", prompt: "The person who bears the risk of a business is the…", options: ["employee", "entrepreneur", "customer", "supplier"], correctIndex: 1, unit: "Entrepreneurship", difficulty: "Easy", explanation: "The entrepreneur takes on the risks and rewards of the business." },
    { id: "q5", prompt: "Which of these is a source of long-term finance?", options: ["trade credit", "shares", "bank overdraft", "creditors"], correctIndex: 1, unit: "Finance", difficulty: "Medium", explanation: "Issuing shares raises long-term capital; the others are short-term." },
  ],
);

const srHistory = quiz(
  { subject: "History", subjectCode: "HIS-12", title: "Class 11–12 History Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "India gained independence in which year?", options: ["1942", "1947", "1950", "1930"], correctIndex: 1, unit: "Modern India", difficulty: "Easy", explanation: "India became independent on 15 August 1947." },
    { id: "q2", prompt: "The Indian National Congress was founded in…", options: ["1885", "1905", "1920", "1947"], correctIndex: 0, unit: "Freedom Struggle", difficulty: "Medium", explanation: "The INC was founded in 1885." },
    { id: "q3", prompt: "Who led the Salt March (Dandi March) of 1930?", options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Subhas Chandra Bose", "Sardar Patel"], correctIndex: 1, unit: "Freedom Struggle", difficulty: "Easy", explanation: "Gandhi led the Dandi Salt March in 1930." },
    { id: "q4", prompt: "The French Revolution began in which year?", options: ["1689", "1789", "1889", "1719"], correctIndex: 1, unit: "World History", difficulty: "Medium", explanation: "The French Revolution began in 1789." },
    { id: "q5", prompt: "The Quit India Movement was launched in…", options: ["1930", "1942", "1945", "1947"], correctIndex: 1, unit: "Freedom Struggle", difficulty: "Medium", explanation: "The Quit India Movement began in August 1942." },
  ],
);

const srPolitical = quiz(
  { subject: "Political Science", subjectCode: "POL-12", title: "Class 11–12 Political Science Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The head of state of India is the…", options: ["Prime Minister", "President", "Chief Justice", "Speaker"], correctIndex: 1, unit: "Indian Polity", difficulty: "Easy", explanation: "The President of India is the head of state." },
    { id: "q2", prompt: "The Indian Parliament consists of the President, Lok Sabha and…", options: ["Vidhan Sabha", "Rajya Sabha", "Supreme Court", "Cabinet"], correctIndex: 1, unit: "Indian Polity", difficulty: "Medium", explanation: "Parliament = President + Lok Sabha + Rajya Sabha." },
    { id: "q3", prompt: "The minimum age to vote in India is…", options: ["16", "18", "21", "25"], correctIndex: 1, unit: "Democracy", difficulty: "Easy", explanation: "Indian citizens can vote from age 18." },
    { id: "q4", prompt: "Fundamental Rights are guaranteed in which part of the Constitution?", options: ["Part I", "Part III", "Part IV", "Part V"], correctIndex: 1, unit: "Constitution", difficulty: "Medium", explanation: "Fundamental Rights are in Part III of the Constitution." },
    { id: "q5", prompt: "A form of government in which people elect their representatives is called…", options: ["monarchy", "democracy", "dictatorship", "oligarchy"], correctIndex: 1, unit: "Political Theory", difficulty: "Easy", explanation: "In a democracy, people rule through elected representatives." },
  ],
);

export const SCHOOL_BANDS: SchoolBand[] = [
  {
    id: "primary",
    label: "Primary",
    range: "Classes 1–5",
    grades: [1, 2, 3, 4, 5],
    subjects: [
      { subject: "Mathematics", blurb: "Counting, addition, subtraction and tables.", quiz: primaryMaths },
      { subject: "English", blurb: "Letters, vocabulary and simple grammar.", quiz: primaryEnglish },
      { subject: "General Knowledge", blurb: "Animals, nature and the world around us.", quiz: primaryGk },
    ],
  },
  {
    id: "middle",
    label: "Middle",
    range: "Classes 6–8",
    grades: [6, 7, 8],
    subjects: [
      { subject: "Mathematics", blurb: "Fractions, integers, area and exponents.", quiz: middleMaths },
      { subject: "Science", blurb: "Physics, chemistry and biology basics.", quiz: middleScience },
      { subject: "Social Science", blurb: "Geography, history and civics.", quiz: middleSocial },
    ],
  },
  {
    id: "secondary",
    label: "Secondary",
    range: "Classes 9–10",
    grades: [9, 10],
    subjects: [
      { subject: "Mathematics", blurb: "Algebra, geometry and mensuration.", quiz: secondaryMaths },
      { subject: "Science", blurb: "Physics, chemistry and biology.", quiz: secondaryScience },
      { subject: "Social Science", blurb: "History, civics and geography.", quiz: secondarySocial },
      { subject: "English", blurb: "Grammar, parts of speech and vocabulary.", quiz: secondaryEnglish },
    ],
  },
  {
    id: "senior",
    label: "Senior Secondary",
    range: "Classes 11–12",
    grades: [11, 12],
    subjects: [
      { subject: "Physics", stream: "Science", blurb: "Mechanics, gravitation and electricity.", quiz: srPhysics },
      { subject: "Chemistry", stream: "Science", blurb: "Atomic structure, acids and the periodic table.", quiz: srChemistry },
      { subject: "Biology", stream: "Science", blurb: "Cells, genetics and human physiology.", quiz: srBiology },
      { subject: "Mathematics", stream: "Science", blurb: "Calculus, trigonometry and logarithms.", quiz: srMaths },
      { subject: "Accountancy", stream: "Commerce", blurb: "Accounting equation, journals and final accounts.", quiz: srAccountancy },
      { subject: "Economics", stream: "Commerce", blurb: "Demand, GDP, markets and inflation.", quiz: srEconomics },
      { subject: "Business Studies", stream: "Commerce", blurb: "Management, business forms and marketing.", quiz: srBusiness },
      { subject: "History", stream: "Arts", blurb: "Modern India and the freedom struggle.", quiz: srHistory },
      { subject: "Political Science", stream: "Arts", blurb: "Indian polity, the Constitution and democracy.", quiz: srPolitical },
    ],
  },
];

/* ========================================================================== */
/*  COLLEGE                                                                    */
/* ========================================================================== */

const collegeProgramming = quiz(
  { subject: "Programming Fundamentals", subjectCode: "CS-101", title: "Programming Fundamentals Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "Which of these is NOT an object-oriented programming concept?", options: ["Inheritance", "Polymorphism", "Compilation", "Encapsulation"], correctIndex: 2, unit: "OOP", difficulty: "Medium", explanation: "Inheritance, polymorphism and encapsulation are OOP pillars; compilation is a build step." },
    { id: "q2", prompt: "The worst-case time complexity of binary search is…", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndex: 1, unit: "Algorithms", difficulty: "Medium", explanation: "Binary search halves the range each step, giving O(log n)." },
    { id: "q3", prompt: "SQL stands for…", options: ["Simple Query Language", "Structured Query Language", "Standard Question Language", "System Query Logic"], correctIndex: 1, unit: "Databases", difficulty: "Easy", explanation: "SQL = Structured Query Language." },
    { id: "q4", prompt: "Which data type stores only true or false?", options: ["int", "float", "boolean", "char"], correctIndex: 2, unit: "Data Types", difficulty: "Easy", explanation: "A boolean holds true/false." },
    { id: "q5", prompt: "In programming, a loop is used to…", options: ["store data", "repeat a block of code", "define a class", "end a program"], correctIndex: 1, unit: "Control Flow", difficulty: "Easy", explanation: "Loops repeat a block of code while a condition holds." },
  ],
);

const collegeMaths = quiz(
  { subject: "Engineering Mathematics", subjectCode: "MATH-UG", title: "Calculus & Algebra Practice Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "What is the derivative of sin(x) with respect to x?", options: ["sin(x)", "cos(x)", "−sin(x)", "−cos(x)"], correctIndex: 1, unit: "Calculus", difficulty: "Easy", explanation: "d/dx sin(x) = cos(x)." },
    { id: "q2", prompt: "Evaluate the limit of sin(x)/x as x → 0.", options: ["0", "1", "∞", "Undefined"], correctIndex: 1, unit: "Calculus", difficulty: "Medium", explanation: "The standard limit lim(x→0) sin(x)/x = 1." },
    { id: "q3", prompt: "A square matrix is invertible if and only if its determinant is…", options: ["Zero", "Non-zero", "Positive", "Equal to 1"], correctIndex: 1, unit: "Linear Algebra", difficulty: "Medium", explanation: "det ≠ 0 means the matrix is invertible." },
    { id: "q4", prompt: "What is ∫ x dx?", options: ["x + C", "x²/2 + C", "2x + C", "1 + C"], correctIndex: 1, unit: "Calculus", difficulty: "Easy", explanation: "∫ xⁿ dx = xⁿ⁺¹/(n+1); for n = 1 that is x²/2 + C." },
    { id: "q5", prompt: "What is the derivative of eˣ?", options: ["x·eˣ⁻¹", "eˣ", "eˣ/x", "1"], correctIndex: 1, unit: "Calculus", difficulty: "Easy", explanation: "eˣ is its own derivative." },
  ],
);

const collegePhysics = quiz(
  { subject: "Engineering Physics", subjectCode: "PHY-UG", title: "Mechanics & Electricity Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correctIndex: 1, unit: "Mechanics", difficulty: "Easy", explanation: "Force is measured in newtons (1 N = 1 kg·m/s²)." },
    { id: "q2", prompt: "Newton's second law of motion is expressed as…", options: ["F = m/a", "F = ma", "F = m + a", "F = a/m"], correctIndex: 1, unit: "Mechanics", difficulty: "Easy", explanation: "Net force = mass × acceleration." },
    { id: "q3", prompt: "Which of these is a vector quantity?", options: ["Speed", "Mass", "Velocity", "Temperature"], correctIndex: 2, unit: "Mechanics", difficulty: "Medium", explanation: "Velocity has magnitude and direction; the others are scalars." },
    { id: "q4", prompt: "The work done by a force perpendicular to the motion is…", options: ["Maximum", "Zero", "Negative", "Infinite"], correctIndex: 1, unit: "Mechanics", difficulty: "Medium", explanation: "Work = F·d·cos θ; at 90°, cos θ = 0, so work is zero." },
    { id: "q5", prompt: "The approximate acceleration due to gravity near Earth's surface is…", options: ["9.8 m/s²", "3 × 10⁸ m/s", "1.6 m/s²", "6.67 × 10⁻¹¹ m/s²"], correctIndex: 0, unit: "Mechanics", difficulty: "Easy", explanation: "g ≈ 9.8 m/s² on Earth (1.6 m/s² is the Moon's)." },
  ],
);

const collegeElectronics = quiz(
  { subject: "Basic Electronics", subjectCode: "ECE-101", title: "Basic Electronics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "A diode allows current to flow in…", options: ["both directions", "one direction", "no direction", "random directions"], correctIndex: 1, unit: "Devices", difficulty: "Easy", explanation: "A diode conducts in one (forward) direction only." },
    { id: "q2", prompt: "The SI unit of capacitance is the…", options: ["Ohm", "Henry", "Farad", "Tesla"], correctIndex: 2, unit: "Components", difficulty: "Medium", explanation: "Capacitance is measured in farads (F)." },
    { id: "q3", prompt: "Which logic gate outputs 1 only when both inputs are 1?", options: ["OR", "AND", "NOT", "NOR"], correctIndex: 1, unit: "Digital", difficulty: "Easy", explanation: "An AND gate outputs 1 only if all inputs are 1." },
    { id: "q4", prompt: "Ohm's law states that voltage V equals…", options: ["I / R", "I × R", "R / I", "I + R"], correctIndex: 1, unit: "Circuits", difficulty: "Easy", explanation: "V = IR (current times resistance)." },
    { id: "q5", prompt: "A transistor is commonly used as a…", options: ["resistor only", "switch or amplifier", "capacitor", "battery"], correctIndex: 1, unit: "Devices", difficulty: "Medium", explanation: "Transistors act as electronic switches and amplifiers." },
  ],
);

const collegeElectrical = quiz(
  { subject: "Basic Electrical Engineering", subjectCode: "EEE-101", title: "Basic Electrical Engineering Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "Electrical power P is given by…", options: ["V / I", "V × I", "I / V", "V + I"], correctIndex: 1, unit: "Power", difficulty: "Easy", explanation: "Power = voltage × current (P = VI)." },
    { id: "q2", prompt: "The SI unit of electrical resistance is the…", options: ["Volt", "Ampere", "Ohm", "Watt"], correctIndex: 2, unit: "Circuits", difficulty: "Easy", explanation: "Resistance is measured in ohms (Ω)." },
    { id: "q3", prompt: "In 'AC supply', AC stands for…", options: ["Average Current", "Alternating Current", "Active Charge", "Applied Current"], correctIndex: 1, unit: "Fundamentals", difficulty: "Easy", explanation: "AC = Alternating Current, which periodically reverses direction." },
    { id: "q4", prompt: "A transformer works on the principle of…", options: ["conduction", "mutual induction", "resistance", "refraction"], correctIndex: 1, unit: "Machines", difficulty: "Medium", explanation: "Transformers transfer energy between coils by mutual induction." },
    { id: "q5", prompt: "In a series circuit, the current through each component is…", options: ["different", "zero", "the same", "doubled"], correctIndex: 2, unit: "Circuits", difficulty: "Medium", explanation: "Series components share one path, so the same current flows through each." },
  ],
);

const collegeCommerce = quiz(
  { subject: "Accountancy & Economics", subjectCode: "COM-101", title: "Commerce Fundamentals Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The accounting equation is: Assets = Liabilities + …", options: ["Expenses", "Capital", "Revenue", "Drawings"], correctIndex: 1, unit: "Accountancy", difficulty: "Medium", explanation: "Assets = Liabilities + Capital (owner's equity)." },
    { id: "q2", prompt: "GST stands for…", options: ["General Sales Tax", "Goods and Services Tax", "Gross State Tax", "Government Service Tax"], correctIndex: 1, unit: "Taxation", difficulty: "Easy", explanation: "GST = Goods and Services Tax." },
    { id: "q3", prompt: "A statement showing a firm's financial position on a given date is the…", options: ["Trial Balance", "Balance Sheet", "Cash Book", "Journal"], correctIndex: 1, unit: "Accountancy", difficulty: "Medium", explanation: "The Balance Sheet shows assets, liabilities and capital on a date." },
    { id: "q4", prompt: "In economics, when the price of a normal good rises, the quantity demanded usually…", options: ["rises", "falls", "stays the same", "doubles"], correctIndex: 1, unit: "Economics", difficulty: "Easy", explanation: "The law of demand: higher price → lower quantity demanded." },
    { id: "q5", prompt: "Profit is calculated as…", options: ["Revenue + Cost", "Revenue − Cost", "Cost − Revenue", "Revenue × Cost"], correctIndex: 1, unit: "Economics", difficulty: "Easy", explanation: "Profit = Total Revenue − Total Cost." },
  ],
);

const collegeManagement = quiz(
  { subject: "Principles of Management", subjectCode: "BBA-101", title: "Management Basics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The '4 Ps' of marketing are Product, Price, Place and…", options: ["Profit", "Promotion", "People", "Process"], correctIndex: 1, unit: "Marketing", difficulty: "Easy", explanation: "The classic marketing mix is Product, Price, Place, Promotion." },
    { id: "q2", prompt: "In a SWOT analysis, the 'S' stands for…", options: ["Sales", "Strengths", "Strategy", "Systems"], correctIndex: 1, unit: "Strategy", difficulty: "Easy", explanation: "SWOT = Strengths, Weaknesses, Opportunities, Threats." },
    { id: "q3", prompt: "A person who starts and runs a new business is called an…", options: ["employee", "entrepreneur", "investor", "auditor"], correctIndex: 1, unit: "Entrepreneurship", difficulty: "Easy", explanation: "An entrepreneur founds and runs a venture, bearing its risks." },
    { id: "q4", prompt: "Which of these is a core function of management?", options: ["Photosynthesis", "Planning", "Soldering", "Welding"], correctIndex: 1, unit: "Management", difficulty: "Easy", explanation: "Planning, organizing, leading and controlling are core management functions." },
    { id: "q5", prompt: "ROI stands for…", options: ["Rate of Inflation", "Return on Investment", "Risk of Interest", "Revenue of Industry"], correctIndex: 1, unit: "Finance", difficulty: "Easy", explanation: "ROI = Return on Investment." },
  ],
);

const collegeScience = quiz(
  { subject: "General Science", subjectCode: "BSC-101", title: "B.Sc General Science Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The 'powerhouse of the cell' is the…", options: ["nucleus", "mitochondria", "ribosome", "chloroplast"], correctIndex: 1, unit: "Biology", difficulty: "Easy", explanation: "Mitochondria generate most of the cell's ATP." },
    { id: "q2", prompt: "The atomic number of an element equals its number of…", options: ["neutrons", "protons", "molecules", "isotopes"], correctIndex: 1, unit: "Chemistry", difficulty: "Medium", explanation: "Atomic number = number of protons in the nucleus." },
    { id: "q3", prompt: "A solution with a pH of 7 is…", options: ["acidic", "neutral", "basic", "saline"], correctIndex: 1, unit: "Chemistry", difficulty: "Easy", explanation: "pH 7 is neutral; below 7 is acidic, above is basic." },
    { id: "q4", prompt: "The chemical formula of common table salt is…", options: ["H₂O", "NaCl", "CO₂", "CaCO₃"], correctIndex: 1, unit: "Chemistry", difficulty: "Easy", explanation: "Table salt is sodium chloride, NaCl." },
    { id: "q5", prompt: "DNA carries the ___ information of an organism.", options: ["thermal", "genetic", "kinetic", "magnetic"], correctIndex: 1, unit: "Biology", difficulty: "Easy", explanation: "DNA stores hereditary (genetic) information." },
  ],
);

const collegeCivil = quiz(
  { subject: "Civil Engineering Basics", subjectCode: "CE-101", title: "Civil Engineering Basics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The main binding material in concrete is…", options: ["sand", "cement", "gravel", "water"], correctIndex: 1, unit: "Materials", difficulty: "Easy", explanation: "Cement binds the aggregates together in concrete." },
    { id: "q2", prompt: "The SI unit of stress is the…", options: ["Newton", "Pascal", "Joule", "Watt"], correctIndex: 1, unit: "Mechanics of Solids", difficulty: "Medium", explanation: "Stress = force/area, measured in pascals (N/m²)." },
    { id: "q3", prompt: "Reinforced cement concrete (RCC) combines concrete with…", options: ["wood", "steel bars", "plastic", "glass"], correctIndex: 1, unit: "Structures", difficulty: "Easy", explanation: "Steel reinforcement carries tension that concrete alone cannot." },
    { id: "q4", prompt: "Which instrument is used to measure horizontal angles in surveying?", options: ["barometer", "theodolite", "ammeter", "vernier caliper"], correctIndex: 1, unit: "Surveying", difficulty: "Medium", explanation: "A theodolite measures horizontal and vertical angles." },
    { id: "q5", prompt: "A beam primarily resists which kind of load action?", options: ["bending", "magnetism", "evaporation", "refraction"], correctIndex: 0, unit: "Structures", difficulty: "Medium", explanation: "Beams are designed mainly to resist bending." },
  ],
);

const collegeBiotech = quiz(
  { subject: "Biotechnology Basics", subjectCode: "BT-101", title: "Biotechnology Basics Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The molecule that carries genetic information is…", options: ["protein", "DNA", "glucose", "lipid"], correctIndex: 1, unit: "Molecular Biology", difficulty: "Easy", explanation: "DNA stores the genetic blueprint of an organism." },
    { id: "q2", prompt: "Enzymes are biological…", options: ["catalysts", "acids", "salts", "gases"], correctIndex: 0, unit: "Biochemistry", difficulty: "Easy", explanation: "Enzymes speed up reactions without being consumed — biological catalysts." },
    { id: "q3", prompt: "Making genetically identical copies of an organism or gene is called…", options: ["mutation", "cloning", "digestion", "respiration"], correctIndex: 1, unit: "Genetic Engineering", difficulty: "Medium", explanation: "Cloning produces identical genetic copies." },
    { id: "q4", prompt: "Human insulin for diabetics is now produced using…", options: ["fermentation of fruit", "recombinant DNA technology", "simple distillation", "crystallization"], correctIndex: 1, unit: "Applications", difficulty: "Medium", explanation: "Recombinant DNA technology lets microbes produce human insulin." },
    { id: "q5", prompt: "The basic unit of heredity is the…", options: ["cell", "gene", "atom", "tissue"], correctIndex: 1, unit: "Genetics", difficulty: "Easy", explanation: "A gene is the basic unit of inheritance." },
  ],
);

const collegePharmacy = quiz(
  { subject: "Pharmacy Fundamentals", subjectCode: "PHARM-101", title: "Pharmacy Fundamentals Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The study of drugs and their effects on the body is called…", options: ["pathology", "pharmacology", "radiology", "cardiology"], correctIndex: 1, unit: "Pharmacology", difficulty: "Medium", explanation: "Pharmacology studies how drugs act on living systems." },
    { id: "q2", prompt: "The branch dealing with dosage forms like tablets and capsules is…", options: ["pharmaceutics", "anatomy", "botany", "surgery"], correctIndex: 0, unit: "Pharmaceutics", difficulty: "Medium", explanation: "Pharmaceutics covers formulating and preparing dosage forms." },
    { id: "q3", prompt: "A medicine that reduces fever is called a/an…", options: ["antibiotic", "antipyretic", "antiseptic", "anaesthetic"], correctIndex: 1, unit: "Drug Classes", difficulty: "Medium", explanation: "Antipyretics (e.g. paracetamol) lower fever." },
    { id: "q4", prompt: "Paracetamol is commonly used as a…", options: ["pain reliever", "vitamin", "vaccine", "antacid"], correctIndex: 0, unit: "Drug Classes", difficulty: "Easy", explanation: "Paracetamol is an analgesic (pain reliever) and antipyretic." },
    { id: "q5", prompt: "The amount of a drug administered at one time is called the…", options: ["dose", "formula", "residue", "solvent"], correctIndex: 0, unit: "Fundamentals", difficulty: "Easy", explanation: "A dose is the measured quantity of drug given at one time." },
  ],
);

const collegeLaw = quiz(
  { subject: "Law Fundamentals", subjectCode: "LAW-101", title: "Law Fundamentals Quiz", durationMins: 15 },
  [
    { id: "q1", prompt: "The supreme law of India is the…", options: ["Indian Penal Code", "Constitution of India", "Code of Civil Procedure", "Contract Act"], correctIndex: 1, unit: "Constitutional Law", difficulty: "Easy", explanation: "The Constitution is the supreme law from which all others derive." },
    { id: "q2", prompt: "The highest court in India is the…", options: ["High Court", "Supreme Court", "District Court", "Tribunal"], correctIndex: 1, unit: "Judiciary", difficulty: "Easy", explanation: "The Supreme Court of India is the apex court." },
    { id: "q3", prompt: "A legally enforceable agreement between parties is a…", options: ["tort", "contract", "will", "notice"], correctIndex: 1, unit: "Contract Law", difficulty: "Medium", explanation: "A contract is an agreement enforceable by law." },
    { id: "q4", prompt: "In criminal law, the accused is presumed to be…", options: ["guilty", "innocent until proven guilty", "liable", "convicted"], correctIndex: 1, unit: "Criminal Law", difficulty: "Medium", explanation: "The presumption of innocence places the burden of proof on the prosecution." },
    { id: "q5", prompt: "The branch of law that deals with crimes is…", options: ["civil law", "criminal law", "corporate law", "tax law"], correctIndex: 1, unit: "Fundamentals", difficulty: "Easy", explanation: "Criminal law defines offences and their punishments." },
  ],
);

export const COLLEGE_DEPTS: CollegeDept[] = [
  {
    id: "cse",
    label: "Computer Science / IT",
    blurb: "Algorithms, programming and databases.",
    subjects: [
      { subject: "Data Structures", blurb: "Trees, graphs, sorting and hashing.", quiz: exampleQuiz },
      { subject: "Programming Fundamentals", blurb: "OOP, complexity and databases.", quiz: collegeProgramming },
    ],
  },
  {
    id: "ece",
    label: "Electronics & Communication",
    blurb: "Devices, circuits and digital logic.",
    subjects: [
      { subject: "Basic Electronics", blurb: "Diodes, transistors and logic gates.", quiz: collegeElectronics },
    ],
  },
  {
    id: "mech",
    label: "Mechanical Engineering",
    blurb: "Mechanics, forces and energy.",
    subjects: [
      { subject: "Engineering Physics", blurb: "Mechanics and electricity fundamentals.", quiz: collegePhysics },
    ],
  },
  {
    id: "eee",
    label: "Electrical Engineering",
    blurb: "Power, circuits and machines.",
    subjects: [
      { subject: "Basic Electrical Engineering", blurb: "Ohm's law, AC/DC and transformers.", quiz: collegeElectrical },
    ],
  },
  {
    id: "math",
    label: "Mathematics & Statistics",
    blurb: "Calculus, algebra and probability.",
    subjects: [
      { subject: "Engineering Mathematics", blurb: "Calculus, linear algebra and probability.", quiz: collegeMaths },
    ],
  },
  {
    id: "commerce",
    label: "Commerce (B.Com)",
    blurb: "Accountancy, economics and taxation.",
    subjects: [
      { subject: "Accountancy & Economics", blurb: "Accounting equation, GST and demand.", quiz: collegeCommerce },
    ],
  },
  {
    id: "management",
    label: "Management (BBA / MBA)",
    blurb: "Marketing, strategy and finance.",
    subjects: [
      { subject: "Principles of Management", blurb: "Marketing mix, SWOT and ROI.", quiz: collegeManagement },
    ],
  },
  {
    id: "science",
    label: "Science (B.Sc)",
    blurb: "Physics, chemistry and biology.",
    subjects: [
      { subject: "General Science", blurb: "Cells, atoms, pH and genetics.", quiz: collegeScience },
    ],
  },
  {
    id: "civil",
    label: "Civil Engineering",
    blurb: "Materials, structures and surveying.",
    subjects: [
      { subject: "Civil Engineering Basics", blurb: "Concrete, stress, RCC and surveying.", quiz: collegeCivil },
    ],
  },
  {
    id: "biotech",
    label: "Biotechnology",
    blurb: "Molecular biology and genetic engineering.",
    subjects: [
      { subject: "Biotechnology Basics", blurb: "DNA, enzymes, cloning and genetics.", quiz: collegeBiotech },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy (B.Pharm)",
    blurb: "Drugs, dosage forms and pharmacology.",
    subjects: [
      { subject: "Pharmacy Fundamentals", blurb: "Pharmacology, dosage forms and drug classes.", quiz: collegePharmacy },
    ],
  },
  {
    id: "law",
    label: "Law (LLB)",
    blurb: "Constitution, contracts and the judiciary.",
    subjects: [
      { subject: "Law Fundamentals", blurb: "Constitution, courts, contracts and criminal law.", quiz: collegeLaw },
    ],
  },
];

/* ========================================================================== */
/*  Lookups                                                                    */
/* ========================================================================== */

/** The band a school class belongs to (Primary / Middle / Secondary). */
export function bandForGrade(grade: number): SchoolBand | undefined {
  return SCHOOL_BANDS.find((band) => band.grades.includes(grade));
}

/** Subjects offered for a given school class. */
export function subjectsForGrade(grade: number): DemoSubject[] {
  return bandForGrade(grade)?.subjects ?? [];
}

/** Look up a college department by id. */
export function deptById(id: string): CollegeDept | undefined {
  return COLLEGE_DEPTS.find((dept) => dept.id === id);
}
