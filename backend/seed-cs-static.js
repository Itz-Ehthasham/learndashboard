/**
 * Seeds 10 engineering/computing courses and 20 published static assessments (CSE / CS engineering topics).
 * Branches: CSE, CSC, AIML, DS, CSD, CYBER, CSM, CIVIL, IT, EEE.
 * Requires at least one trainer (run seed-data.js first).
 *
 * Usage:  node seed-cs-static.js
 *     or: npm run seed:cs
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Assessment = require('./src/models/Assessment');

const COURSE_CODES = [
  'CS1001',
  'CS1002',
  'CS1003',
  'CS1004',
  'CS1005',
  'CS1006',
  'CS1007',
  'CS1008',
  'CS1009',
  'CS1010',
];

const scheduleTemplate = () => ({
  startDate: new Date('2025-01-20'),
  endDate: new Date('2025-06-15'),
  daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
  startTime: '10:00',
  endTime: '11:30',
});

/** One row per course code; branch drives programme */
const COURSE_SPECS = [
  {
    branch: 'CSE',
    category: 'Computer Science',
    title: 'Introduction to Programming & Problem Solving',
    description:
      'Core computer science and engineering: variables, control flow, functions, debugging, and computational thinking for CSE students.',
    level: 'Beginner',
    credits: 3,
    duration: 16,
    maxStudents: 40,
    tags: ['cse', 'programming', 'static-seed'],
  },
  {
    branch: 'CSC',
    category: 'Computer Science',
    title: 'Data Structures for Computer Scientists',
    description:
      'Arrays, linked lists, stacks, queues, trees, hash tables, and heaps—foundations for the CS (core) curriculum.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 35,
    tags: ['csc', 'data-structures', 'static-seed'],
  },
  {
    branch: 'AIML',
    category: 'Computer Science',
    title: 'Machine Learning & Neural Networks',
    description:
      'Supervised and unsupervised learning, model evaluation, neural network basics, and responsible AI for AIML programmes.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 32,
    tags: ['aiml', 'ml', 'static-seed'],
  },
  {
    branch: 'DS',
    category: 'Computer Science',
    title: 'Data Science: Statistics & Analytics',
    description:
      'Probability, descriptive statistics, data wrangling, visualization, and introductory predictive modelling for DS majors.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 34,
    tags: ['data-science', 'statistics', 'static-seed'],
  },
  {
    branch: 'CSD',
    category: 'Computer Science',
    title: 'Human–Computer Interaction & Design',
    description:
      'User research, prototyping, usability, accessibility, and interaction design aligned with Computer Science & Design.',
    level: 'Intermediate',
    credits: 3,
    duration: 14,
    maxStudents: 36,
    tags: ['csd', 'hci', 'ux', 'static-seed'],
  },
  {
    branch: 'CYBER',
    category: 'Computer Science',
    title: 'Cybersecurity: Cryptography & Defensive Security',
    description:
      'CIA triad, threat modelling, cryptography basics, network security, and secure engineering practices.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 33,
    tags: ['cyber-security', 'infosec', 'static-seed'],
  },
  {
    branch: 'CSM',
    category: 'Mathematics',
    title: 'Discrete Mathematics for Computing',
    description:
      'Logic, proofs, combinatorics, graphs, and recurrence relations for Computer Science & Mathematics programmes.',
    level: 'Beginner',
    credits: 3,
    duration: 16,
    maxStudents: 45,
    tags: ['csm', 'discrete-math', 'static-seed'],
  },
  {
    branch: 'CIVIL',
    category: 'Engineering',
    title: 'Structural Analysis & Mechanics of Materials',
    description:
      'Stresses and strains, beams, deflection, and material behaviour—core civil engineering mechanics.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 40,
    tags: ['civil', 'structures', 'static-seed'],
  },
  {
    branch: 'IT',
    category: 'Computer Science',
    title: 'Cloud Computing & IT Infrastructure',
    description:
      'Virtualization, containers, cloud service models, networking for IT, and DevOps fundamentals.',
    level: 'Intermediate',
    credits: 3,
    duration: 14,
    maxStudents: 38,
    tags: ['it', 'cloud', 'static-seed'],
  },
  {
    branch: 'EEE',
    category: 'Engineering',
    title: 'Electric Circuits & Electronic Devices',
    description:
      'DC/AC circuit laws, operational amplifiers, diodes, and transistors—foundation for electrical and electronics engineering.',
    level: 'Intermediate',
    credits: 4,
    duration: 16,
    maxStudents: 36,
    tags: ['eee', 'circuits', 'static-seed'],
  },
];

/**
 * 20 CSE-themed assessments: courseCode + short title + assessment type + question bank id.
 * Titles kept ≤100 chars for schema.
 */
const ASSESSMENT_SPECS = [
  { courseCode: 'CS1001', title: 'CS1001 Quiz: Programming Fundamentals', assessmentType: 'quiz', bank: 0 },
  { courseCode: 'CS1001', title: 'CS1001: OOP & Modularity', assessmentType: 'quiz', bank: 1 },
  { courseCode: 'CS1001', title: 'CS1001 Lab Check: Testing & Debugging', assessmentType: 'lab', bank: 2 },
  { courseCode: 'CS1002', title: 'CS1002 Midterm: Core Data Structures', assessmentType: 'exam', bank: 3 },
  { courseCode: 'CS1002', title: 'CS1002: Trees, Heaps & Priority Queues', assessmentType: 'quiz', bank: 4 },
  { courseCode: 'CS1002', title: 'CS1002: Graphs & Hash Tables', assessmentType: 'quiz', bank: 5 },
  { courseCode: 'CS1003', title: 'CS1003: Supervised & Unsupervised Learning', assessmentType: 'quiz', bank: 6 },
  { courseCode: 'CS1003', title: 'CS1003: Neural Networks Essentials', assessmentType: 'quiz', bank: 7 },
  { courseCode: 'CS1004', title: 'CS1004: Probability & Distributions', assessmentType: 'quiz', bank: 8 },
  { courseCode: 'CS1004', title: 'CS1004: Data Cleaning & Features', assessmentType: 'assignment', bank: 9 },
  { courseCode: 'CS1005', title: 'CS1005: Usability Heuristics & UX', assessmentType: 'quiz', bank: 10 },
  { courseCode: 'CS1005', title: 'CS1005: User Research Methods', assessmentType: 'quiz', bank: 11 },
  { courseCode: 'CS1006', title: 'CS1006: Threat Models & Security Goals', assessmentType: 'quiz', bank: 12 },
  { courseCode: 'CS1006', title: 'CS1006: Cryptography & Protocols', assessmentType: 'quiz', bank: 13 },
  { courseCode: 'CS1007', title: 'CS1007: Logic, Sets & Proofs', assessmentType: 'quiz', bank: 14 },
  { courseCode: 'CS1007', title: 'CS1007: Combinatorics & Graph Theory', assessmentType: 'exam', bank: 15 },
  { courseCode: 'CS1008', title: 'CS1008: Numerical Methods & Matrices (Computing)', assessmentType: 'quiz', bank: 16 },
  { courseCode: 'CS1009', title: 'CS1009: Virtualization & Containers', assessmentType: 'quiz', bank: 17 },
  { courseCode: 'CS1009', title: 'CS1009: Cloud Models & Networking', assessmentType: 'quiz', bank: 18 },
  { courseCode: 'CS1010', title: 'CS1010: Digital Logic & Embedded Basics', assessmentType: 'quiz', bank: 19 },
];

/** Two MCQs per assessment; 50 pts each → 100 total */
const QUESTION_BANKS = [
  // 0 — Programming fundamentals
  [
    { q: 'Which keyword declares a constant in JavaScript?', o: ['var', 'let', 'const', 'static'], c: 'const' },
    {
      q: 'Time complexity of a single array index lookup by subscript?',
      o: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      c: 'O(1)',
    },
  ],
  // 1 — OOP
  [
    {
      q: 'Encapsulation primarily means:',
      o: [
        'Hiding implementation behind an interface',
        'Using only global variables',
        'Removing all classes',
        'Compiling without errors',
      ],
      c: 'Hiding implementation behind an interface',
    },
    {
      q: 'In classical OOP, polymorphism allows:',
      o: [
        'One interface, multiple implementations',
        'Only single inheritance',
        'No inheritance',
        'Static typing only',
      ],
      c: 'One interface, multiple implementations',
    },
  ],
  // 2 — Testing / debugging
  [
    {
      q: 'A unit test typically targets:',
      o: ['The entire production cluster', 'A small isolated unit of code', 'Only the database', 'Only CSS'],
      c: 'A small isolated unit of code',
    },
    {
      q: 'A regression test is used to:',
      o: [
        'Ensure new changes do not break existing behaviour',
        'Delete old code',
        'Measure only UI colour contrast',
        'Compile faster',
      ],
      c: 'Ensure new changes do not break existing behaviour',
    },
  ],
  // 3 — DSA core
  [
    {
      q: 'Which structure follows LIFO?',
      o: ['Queue', 'Stack', 'Deque only', 'B-tree'],
      c: 'Stack',
    },
    {
      q: 'Average-case time to search in a balanced BST with n nodes?',
      o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      c: 'O(log n)',
    },
  ],
  // 4 — Trees / heaps
  [
    {
      q: 'A binary max-heap property at each node means:',
      o: [
        'Parent ≥ children (for numeric keys)',
        'Parent ≤ children always',
        'Tree must be complete binary and sorted in-order',
        'All leaves at same depth',
      ],
      c: 'Parent ≥ children (for numeric keys)',
    },
    {
      q: 'In-order traversal of a BST visits nodes in:',
      o: ['Random order', 'Sorted key order', 'Reverse sorted only', 'Level order'],
      c: 'Sorted key order',
    },
  ],
  // 5 — Graphs / hashing
  [
    {
      q: 'Average-case lookup in a good hash table is often:',
      o: ['O(n²)', 'O(1)', 'O(n log n)', 'O(log n) only'],
      c: 'O(1)',
    },
    {
      q: 'Breadth-first search (BFS) uses which auxiliary structure?',
      o: ['Stack', 'Queue', 'Priority queue only', 'Heap only'],
      c: 'Queue',
    },
  ],
  // 6 — ML foundations
  [
    {
      q: 'Training with labeled input–output pairs is:',
      o: ['Unsupervised learning', 'Supervised learning', 'Clustering only', 'Dimensionality reduction only'],
      c: 'Supervised learning',
    },
    {
      q: 'Cross-validation is mainly used to:',
      o: [
        'Estimate generalization performance',
        'Increase training loss',
        'Remove all regularization',
        'Guarantee zero error',
      ],
      c: 'Estimate generalization performance',
    },
  ],
  // 7 — Neural networks
  [
    {
      q: 'A common activation for hidden layers in deep nets is:',
      o: ['Step function only', 'ReLU', 'Constant zero', 'Linear only everywhere'],
      c: 'ReLU',
    },
    {
      q: 'Backpropagation computes:',
      o: ['DNS records', 'Gradients for network weights', 'Disk free space', 'Compiler tokens'],
      c: 'Gradients for network weights',
    },
  ],
  // 8 — Stats / DS
  [
    {
      q: 'Which is most sensitive to extreme outliers among these?',
      o: ['Median', 'Mode', 'Mean', 'IQR'],
      c: 'Mean',
    },
    {
      q: 'The variance of a dataset measures:',
      o: ['Central tendency only', 'Spread around the mean', 'Only min value', 'Only max value'],
      c: 'Spread around the mean',
    },
  ],
  // 9 — Data prep
  [
    {
      q: 'One-hot encoding is typically used for:',
      o: ['Continuous sensor streams only', 'Categorical variables', 'Images only', 'Audio waveforms only'],
      c: 'Categorical variables',
    },
    {
      q: 'Train/validation/test split helps to:',
      o: [
        'Leak labels into training',
        'Reduce overfitting assessment and tune models honestly',
        'Remove all test data',
        'Disable metrics',
      ],
      c: 'Reduce overfitting assessment and tune models honestly',
    },
  ],
  // 10 — HCI / UX
  [
    {
      q: 'Nielsen usability heuristics emphasize:',
      o: [
        'Recognizable patterns and consistency',
        'Maximum animation count',
        'Removing all error messages',
        'CPU cache size',
      ],
      c: 'Recognizable patterns and consistency',
    },
    {
      q: 'WCAG accessibility guidelines mainly address:',
      o: [
        'Making content usable for people with disabilities',
        'Compiler warnings',
        'GPU shader performance',
        'Database sharding',
      ],
      c: 'Making content usable for people with disabilities',
    },
  ],
  // 11 — User research
  [
    {
      q: 'A semi-structured interview is:',
      o: [
        'Only yes/no questions',
        'Guided topics with flexible follow-up questions',
        'Only analytics dashboards',
        'Only A/B without users',
      ],
      c: 'Guided topics with flexible follow-up questions',
    },
    {
      q: 'Think-aloud usability studies ask participants to:',
      o: [
        'Remain completely silent',
        'Verbalize thoughts while using a system',
        'Write machine code',
        'Only fill surveys afterward',
      ],
      c: 'Verbalize thoughts while using a system',
    },
  ],
  // 12 — Security goals
  [
    {
      q: 'The CIA triad includes Confidentiality, Integrity, and:',
      o: ['Availability', 'Anonymity', 'Agility', 'Automation'],
      c: 'Availability',
    },
    {
      q: 'STRIDE is an example of:',
      o: ['Sorting algorithm', 'Threat modelling framework', 'SQL join type', 'CPU register'],
      c: 'Threat modelling framework',
    },
  ],
  // 13 — Crypto
  [
    {
      q: 'AES is best described as:',
      o: ['A hash function', 'A symmetric block cipher', 'A public-key only scheme', 'A routing protocol'],
      c: 'A symmetric block cipher',
    },
    {
      q: 'RSA is based on:',
      o: ['Difficulty of factoring large integers', 'Sorting arrays', 'BFS traversal', 'SQL joins'],
      c: 'Difficulty of factoring large integers',
    },
  ],
  // 14 — Logic / discrete
  [
    {
      q: 'How many rows in a truth table for 3 propositional variables?',
      o: ['3', '6', '8', '9'],
      c: '8',
    },
    {
      q: 'De Morgan’s laws relate:',
      o: [
        'AND/OR with negated complements',
        'Only matrix multiplication',
        'Only graph colouring',
        'Only CPU pipelines',
      ],
      c: 'AND/OR with negated complements',
    },
  ],
  // 15 — Combinatorics / graphs
  [
    {
      q: 'A tree with n nodes has how many edges?',
      o: ['n', 'n-1', 'n+1', '2n'],
      c: 'n-1',
    },
    {
      q: 'Number of permutations of n distinct objects is:',
      o: ['n²', '2^n', 'n!', 'n(n-1)/2'],
      c: 'n!',
    },
  ],
  // 16 — Numerical / linear algebra (CSE maths)
  [
    {
      q: 'Gaussian elimination solves primarily:',
      o: ['Nonlinear ODEs only', 'Systems of linear equations', 'Only eigenvalues symbolically', 'DNS queries'],
      c: 'Systems of linear equations',
    },
    {
      q: 'A matrix is singular if:',
      o: ['Determinant is zero', 'It is square', 'It is diagonal', 'It has positive entries'],
      c: 'Determinant is zero',
    },
  ],
  // 17 — Virtualization / containers
  [
    {
      q: 'A hypervisor primarily:',
      o: [
        'Runs multiple VMs on shared hardware',
        'Only compiles JavaScript',
        'Replaces TCP',
        'Stores only JSON',
      ],
      c: 'Runs multiple VMs on shared hardware',
    },
    {
      q: 'Docker images are built from:',
      o: ['Layers', 'Only raw disks without metadata', 'DNS zones', 'Git commits only'],
      c: 'Layers',
    },
  ],
  // 18 — Cloud / networking
  [
    {
      q: 'SaaS delivers:',
      o: [
        'Applications over the internet',
        'Only raw VMs',
        'Only block storage volumes',
        'Physical cables only',
      ],
      c: 'Applications over the internet',
    },
    {
      q: 'DNS resolves:',
      o: ['IP to MAC only', 'Hostnames to IP addresses', 'Ports to PIDs', 'Files to inodes only'],
      c: 'Hostnames to IP addresses',
    },
  ],
  // 19 — Digital logic / embedded
  [
    {
      q: "De Morgan's theorem on NOR/NAND is used in:",
      o: ['Digital logic simplification', 'SQL normalization', 'HTTP caching', 'GPU rasterization only'],
      c: 'Digital logic simplification',
    },
    {
      q: 'A flip-flop stores:',
      o: ['One bit of state', 'Entire filesystems', 'Floating-point infinity', 'DNS TTL only'],
      c: 'One bit of state',
    },
  ],
];

function questionsForBank(bankId) {
  const bank = QUESTION_BANKS[bankId] || QUESTION_BANKS[0];
  return bank.map((item) => ({
    question: item.q,
    type: 'multiple-choice',
    options: item.o,
    correctAnswer: item.c,
    points: 50,
  }));
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-analytics');

  const trainers = await User.find({ role: 'trainer', isActive: true });
  if (trainers.length === 0) {
    console.error('No active trainers found. Seed users first (e.g. node seed-data.js).');
    process.exit(1);
  }

  const existing = await Course.find({ code: { $in: COURSE_CODES } }).select('_id');
  const oldIds = existing.map((c) => c._id);
  if (oldIds.length) {
    await Assessment.deleteMany({ course: { $in: oldIds } });
    await Course.deleteMany({ _id: { $in: oldIds } });
    console.log(`Removed ${oldIds.length} previous static courses and their assessments.`);
  }

  const createdCourses = [];
  for (let i = 0; i < 10; i++) {
    const spec = COURSE_SPECS[i];
    const trainer = trainers[i % trainers.length];
    const course = new Course({
      title: spec.title,
      code: COURSE_CODES[i],
      description: spec.description,
      category: spec.category,
      branch: spec.branch,
      level: spec.level,
      credits: spec.credits,
      duration: spec.duration,
      maxStudents: spec.maxStudents,
      instructor: trainer._id,
      schedule: scheduleTemplate(),
      isActive: true,
      tags: spec.tags,
      assessments: [],
    });
    await course.save();
    createdCourses.push(course);
    console.log(`Course ${course.code} [${spec.branch}]: ${course.title}`);
  }

  const courseByCode = {};
  for (const c of createdCourses) {
    courseByCode[c.code] = c;
  }

  const now = new Date();
  const due = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const spec of ASSESSMENT_SPECS) {
    const course = courseByCode[spec.courseCode];
    if (!course) {
      console.error('Missing course for', spec.courseCode);
      process.exit(1);
    }
    const qs = questionsForBank(spec.bank);
    const assessment = new Assessment({
      title: spec.title,
      description: `Computer Science & Engineering assessment. Question bank ${spec.bank + 1}/20. Total points: 100.`,
      course: course._id,
      instructor: course.instructor,
      type: spec.assessmentType,
      maxScore: 100,
      passingScore: 60,
      duration: spec.assessmentType === 'exam' ? 120 : 60,
      scheduledDate: now,
      dueDate: due,
      instructions:
        'Answer all multiple-choice questions. Select the best option. No external materials unless stated by your instructor.',
      questions: qs,
      isActive: true,
      isPublished: true,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      randomizeQuestions: false,
      showResults: true,
      showCorrectAnswers: false,
    });
    await assessment.save();
    course.assessments.push(assessment._id);
    console.log(`Assessment [${spec.bank + 1}/20]: ${assessment.title}`);
  }

  for (const c of createdCourses) {
    await c.save();
  }

  console.log(`\nDone. 10 courses and ${ASSESSMENT_SPECS.length} CSE-themed assessments created.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
