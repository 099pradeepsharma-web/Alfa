import { Grade } from '../types';

export const CURRICULUM: Grade[] = [
  // =================================================================
  // == PRIMARY SCHOOL (GRADES 1-5)
  // =================================================================
  {
    level: 'Grade 1',
    description: 'Starting the journey of learning.',
    subjects: [
      { name: 'English', icon: 'BookOpenIcon', chapters: [{ title: 'The Alphabet & Phonics' }, { title: 'Vowels and Consonants' }, { title: 'Simple Words & Sentences' }, { title: 'Rhyming Words' }, { title: 'Story Time: Listening and Reciting' }] },
      { name: 'Hindi', icon: 'LanguageIcon', chapters: [{ title: 'Varnmala (Alphabet)' }, { title: 'Swar and Vyanjan' }, { title: 'Do Akshar Wale Shabd (Two-letter words)' }, { title: 'Choti Kavitaayein (Short Poems)' }] },
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Numbers up to 20' }, { title: 'Shapes and Space' }, { title: 'Simple Addition & Subtraction' }, { title: 'Measurement: Length and Weight' }, { title: 'Time Concepts' }] },
      { name: 'EVS', icon: 'GlobeAltIcon', chapters: [{ title: 'My Family and Me' }, { title: 'Our Body Parts' }, { title: 'Plants Around Us' }, { title: 'Animals Around Us' }, { title: 'Our Helpers in the Community' }, { title: 'Festivals and Celebrations' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Introduction to Computers' }, { title: 'Using the Mouse and Keyboard' }, { title: 'Fun with Digital Painting' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Fun Body Movements' }, { title: 'Playing Together: Simple Games' }, { title: 'Basic Yoga Poses for Kids' }] },
      { name: 'Robotics & AI', icon: 'CpuChipIcon', chapters: [{ title: 'What are Instructions? (Sequencing)' }, { title: 'Building with Blocks (Pre-robotics)' }, { title: 'Interacting with Smart Devices' }] },
    ],
  },
  {
    level: 'Grade 2',
    description: 'Building foundational skills.',
    subjects: [
      { name: 'English', icon: 'BookOpenIcon', chapters: [{ title: 'Nouns (Naming Words)' }, { title: 'Verbs (Action Words)' }, { title: 'Punctuation Basics' }, { title: 'Reading Short Stories' }, { title: 'Picture Composition' }] },
      { name: 'Hindi', icon: 'LanguageIcon', chapters: [{ title: 'Matraayein (Vowel Signs)' }, { title: 'Ginti (Numbers in Hindi)' }, { title: 'Vakya Rachna (Sentence Formation)' }, { title: 'Kahani Lekhan (Story Writing)' }] },
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Numbers up to 100' }, { title: 'Addition with Carrying' }, { title: 'Subtraction with Borrowing' }, { title: 'Introduction to Multiplication Tables' }, { title: 'Mental Arithmetic Practice' }] },
      { name: 'EVS', icon: 'GlobeAltIcon', chapters: [{ title: 'Types of Houses' }, { title: 'Food We Eat and Healthy Habits' }, { title: 'Water and Its Uses' }, { title: 'Festivals We Celebrate' }, { title: 'Safety Rules at Home and School' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Starting and Shutting Down a Computer' }, { title: 'Introduction to Typing' }, { title: 'Creating Digital Stories' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Running, Jumping, and Throwing' }, { title: 'Introduction to Team Sports' }, { title: 'Rhythm and Dance Movements' }] },
      { name: 'Robotics & AI', icon: 'CpuChipIcon', chapters: [{ title: 'Simple Logic Puzzles (If/Then)' }, { title: 'Building Simple Mechanisms with Kits' }, { title: 'How Voice Assistants Understand Us' }] },
    ],
  },
  {
    level: 'Grade 3',
    description: 'Exploring new concepts.',
    subjects: [
      { name: 'English', icon: 'BookOpenIcon', chapters: [{ title: 'Adjectives (Describing Words)' }, { title: 'Pronouns' }, { title: 'Tenses: Simple Present and Past' }, { title: 'Paragraph Writing' }, { title: 'Comprehension Passages' }] },
      { name: 'Hindi', icon: 'LanguageIcon', chapters: [{ title: 'Sangya aur Sarvanam (Nouns and Pronouns)' }, { title: 'Visheshan (Adjectives)' }, { title: 'Ling aur Vachan (Gender and Number)' }, { title: 'Patra Lekhan (Letter Writing)' }] },
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Four-Digit Numbers' }, { title: 'Multiplication and Division' }, { title: 'Money: Calculations and Conversions' }, { title: 'Introduction to Fractions' }, { title: 'Time and Calendar' }, { title: 'Data Handling with Pictographs' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Living and Non-Living Things' }, { title: 'Parts of a Plant and their Functions' }, { title: 'Birds: Beaks, Feet, and Nests' }, { title: 'The Human Body: An Introduction' }, { title: 'The Sun, Moon, and Stars' }] },
      { name: 'Social Studies', icon: 'GlobeAltIcon', chapters: [{ title: 'Our Earth: Continents and Oceans' }, { title: 'Life of Early Humans' }, { title: 'Our Community and Helpers' }, { title: 'Means of Transport and Communication' }, { title: 'Delhi: Our National Capital' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Internet Safety Basics' }, { title: 'Introduction to MS Word' }, { title: 'Block Coding with Scratch Jr.' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Basic Rules of Team Sports' }, { title: 'Introduction to Fitness Components' }, { title: 'Coordination and Balance Exercises' }] },
      { name: 'Robotics & AI', icon: 'CpuChipIcon', chapters: [{ title: 'Introduction to Algorithms' }, { title: 'Building a Simple Moving Car' }, { title: 'Understanding Sensors: Light and Sound' }] },
    ],
  },
  {
    level: 'Grade 4',
    description: 'Developing deeper understanding.',
    subjects: [
      { name: 'English', icon: 'BookOpenIcon', chapters: [{ title: 'Types of Sentences' }, { title: 'Adverbs' }, { title: 'Conjunctions' }, { title: 'Formal and Informal Letter Writing' }, { title: 'Synonyms and Antonyms' }] },
      { name: 'Hindi', icon: 'LanguageIcon', chapters: [{ title: 'Kriya (Verbs) and its Types' }, { title: 'Kaal (Tenses)' }, { title: 'Vilom Shabd (Antonyms)' }, { title: 'Paryayvachi Shabd (Synonyms)' }] },
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Large Numbers (Up to 6 digits)' }, { title: 'Factors and Multiples' }, { title: 'Fractions: Types and Operations' }, { title: 'Decimals: Introduction and Place Value' }, { title: 'Geometry: Lines, Angles, and Circles' }, { title: 'Area and Perimeter of Simple Shapes' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Adaptations in Plants' }, { title: 'Adaptations in Animals' }, { title: 'Food and Digestion' }, { title: 'Teeth and Microbes' }, { title: 'States of Matter: Solid, Liquid, Gas' }, { title: 'Force, Work, and Energy' }] },
      { name: 'Social Studies', icon: 'GlobeAltIcon', chapters: [{ title: 'The Northern Mountains of India' }, { title: 'The Northern Plains of India' }, { title: 'Our Climate and Seasons' }, { title: 'Soils of India' }, { title: 'Our Rich Heritage and Culture' }, { title: 'Our Rights and Duties as Citizens' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Creating Presentations (PowerPoint)' }, { title: 'Introduction to Block Coding (Scratch)' }, { title: 'Managing Files and Folders' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Developing Sports Skills and Techniques' }, { title: 'Importance of Health and Hygiene' }, { title: 'Teamwork and Strategy Drills' }] },
      { name: 'Robotics & AI', icon: 'CpuChipIcon', chapters: [{ title: 'Programming Animations and Games in Scratch' }, { title: 'Building a Simple Gripper Mechanism' }, { title: 'What is Data and How is it Used?' }] },
    ],
  },
  {
    level: 'Grade 5',
    description: 'Foundation building for young learners.',
    subjects: [
      { name: 'English', icon: 'BookOpenIcon', chapters: [{ title: 'Subject and Predicate' }, { title: 'Verbs, Tenses, and Forms' }, { title: 'Prepositions and their Usage' }, { title: 'Reading Comprehension Strategies' }, { title: 'Creative Writing: Diary Entry' }] },
      { name: 'Hindi', icon: 'LanguageIcon', chapters: [{ title: 'Karak (Case) and its Types' }, { title: 'Muhavare aur Lokoktiyan (Idioms and Proverbs)' }, { title: 'Apathit Gadyansh (Unseen Passages)' }, { title: 'Anuchchhed Lekhan (Paragraph Writing)' }] },
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Large Numbers and Place Value' }, { title: 'The Four Operations with Large Numbers' }, { title: 'Fractions and Decimals Operations' }, { title: 'Geometry: Angles and Polygons' }, { title: 'Measurement: Area, Perimeter, and Volume' }, { title: 'Introduction to Profit and Loss' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Reproduction in Plants' }, { title: 'The Human Body: Skeletal and Nervous Systems' }, { title: 'Health and Hygiene' }, { title: 'Rocks and Minerals' }, { title: 'Simple Machines in Daily Life' }, { title: 'The Moon: Phases and Eclipses' }] },
      { name: 'Social Studies', icon: 'GlobeAltIcon', chapters: [{ title: 'Globes and Maps: Reading and Interpretation' }, { title: 'Major Landforms and Water Bodies' }, { title: 'The Earth and The Solar System' }, { title: 'Our Government: Local and National' }, { title: 'The Coming of the British in India' }, { title: 'The Indian Freedom Struggle' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Advanced Scratch Programming Projects' }, { title: 'Introduction to Spreadsheets (Excel)' }, { title: 'Responsible Use of the Internet' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Strategy in Sports' }, { title: 'Nutrition for a Healthy Body' }, { title: 'Introduction to Athletics Events' }] },
      { name: 'Robotics & AI', icon: 'CpuChipIcon', chapters: [{ title: 'Project: Create a Scratch Animation' }, { title: 'Building a Sensor-based Machine' }, { title: 'How AI Learns from Data (Simple Examples)' }] },
    ],
  },
  // =================================================================
  // == MIDDLE SCHOOL (GRADES 6-8)
  // =================================================================
  {
    level: 'Grade 6',
    description: 'Transitioning to complex subjects.',
    subjects: [
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Knowing Our Numbers' }, { title: 'Whole Numbers' }, { title: 'Playing with Numbers: Factors and Multiples' }, { title: 'Basic Geometrical Ideas' }, { title: 'Understanding Elementary Shapes' }, { title: 'Integers' }, { title: 'Fractions' }, { title: 'Decimals' }, { title: 'Data Handling' }, { title: 'Mensuration: Perimeter and Area' }, { title: 'Introduction to Algebra' }, { title: 'Ratio and Proportion' }, { title: 'Symmetry' }, { title: 'Practical Geometry' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Food: Where Does It Come From?' }, { title: 'Components of Food' }, { title: 'Fibre to Fabric' }, { title: 'Sorting Materials into Groups' }, { title: 'Separation of Substances' }, { title: 'Changes Around Us' }, { title: 'Getting to Know Plants: Structure and Function' }, { title: 'Body Movements and Joints' }, { title: 'The Living Organisms and Their Surroundings' }, { title: 'Motion and Measurement of Distances' }, { title: 'Light, Shadows, and Reflection' }, { title: 'Electricity and Circuits' }, { title: 'Fun with Magnets' }, { title: 'Water: A Precious Resource' }, { title: 'Air Around Us' }, { title: 'Garbage In, Garbage Out' }] },
      { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'Introduction: What, Where, How and When?' }, { title: 'On The Trail of the Earliest People' }, { title: 'From Gathering to Growing Food' }, { title: 'In the Earliest Cities: Harappan Civilization' }, { title: 'What Books and Burials Tell Us' }, { title: 'Kingdoms, Kings and an Early Republic' }, { title: 'New Questions and Ideas: Buddhism and Jainism' }, { title: 'Ashoka, The Emperor Who Gave Up War' }, { title: 'Vital Villages, Thriving Towns' }, { title: 'Traders, Kings and Pilgrims' }, { title: 'New Empires and Kingdoms' }, { title: 'Buildings, Paintings and Books' }] },
      { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'The Earth in the Solar System' }, { title: 'Globe: Latitudes and Longitudes' }, { title: 'Motions of the Earth: Rotation and Revolution' }, { title: 'Maps and their Components' }, { title: 'Major Domains of the Earth' }, { title: 'Major Landforms of the Earth' }, { title: 'Our Country - India' }, { title: 'India: Climate, Vegetation and Wildlife' }] },
      { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'Understanding Diversity' }, { title: 'Diversity and Discrimination' }, { title: 'What is Government?' }, { title: 'Key Elements of a Democratic Government' }, { title: 'Panchayati Raj: Rural Local Government' }, { title: 'Rural Administration' }, { title: 'Urban Administration' }, { title: 'Rural Livelihoods' }, { title: 'Urban Livelihoods' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Introduction to HTML' }, { title: 'Understanding Algorithms and Flowcharts' }, { title: 'Cybersecurity Basics' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Rules and Gameplay of Major Sports' }, { title: 'Importance of Warm-up and Cool-down' }, { title: 'Leadership in Sports' }] },
      { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Introduction to Electronics (Circuits, LEDs)' }, { title: 'Building with Arduino: First Project' }, { title: 'Programming a Simple Robot Arm' }] },
      { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'History and Types of AI' }, { title: 'How Search Engines Work' }, { title: 'Project: Create a Simple Chatbot' }] },
      { name: 'Entrepreneurship & Finance', icon: 'SparklesIcon', chapters: [{ title: 'What is Money?' }, { title: 'Understanding Needs vs. Wants' }, { title: 'My First Budget' }, { title: 'Introduction to Business: Solving Problems' }] },
    ],
  },
  {
    level: 'Grade 7',
    description: 'Building on core concepts.',
    subjects: [
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Integers' }, { title: 'Fractions and Decimals' }, { title: 'Data Handling: Mean, Median, Mode' }, { title: 'Simple Equations' }, { title: 'Lines and Angles' }, { title: 'The Triangle and Its Properties' }, { title: 'Congruence of Triangles' }, { title: 'Comparing Quantities: Percentages, Profit & Loss' }, { title: 'Rational Numbers' }, { title: 'Practical Geometry' }, { title: 'Perimeter and Area' }, { title: 'Algebraic Expressions' }, { title: 'Exponents and Powers' }, { title: 'Symmetry' }, { title: 'Visualising Solid Shapes' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Nutrition in Plants' }, { title: 'Nutrition in Animals' }, { title: 'Fibre to Fabric: Wool and Silk' }, { title: 'Heat and Temperature' }, { title: 'Acids, Bases and Salts' }, { title: 'Physical and Chemical Changes and Reactions' }, { title: 'Weather, Climate and Adaptations of Animals to Climate' }, { title: 'Winds, Storms and Cyclones' }, { title: 'Soil: Properties and Types' }, { title: 'Respiration in Organisms' }, { title: 'Transportation in Animals and Plants' }, { title: 'Reproduction in Plants' }, { title: 'Motion and Time: Speed and Measurement' }, { title: 'Electric Current and its Effects' }, { title: 'Light: Reflection and Lenses' }, { title: 'Water: A Precious Resource' }, { title: 'Forests: Our Lifeline' }, { title: 'Wastewater Story' }] },
      { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'Tracing Changes Through A Thousand Years' }, { title: 'New Kings And Kingdoms' }, { title: 'The Delhi Sultans' }, { title: 'The Mughal Empire' }, { title: 'Rulers And Buildings' }, { title: 'Towns, Traders And Craftspersons' }, { title: 'Tribes, Nomads And Settled Communities' }, { title: 'Devotional Paths to the Divine' }, { title: 'The Making Of Regional Cultures' }, { title: 'Eighteenth-Century Political Formations' }] },
      { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'Environment' }, { title: 'Inside Our Earth' }, { title: 'Our Changing Earth: Plate Tectonics' }, { title: 'Air: Composition and Structure' }, { title: 'Water: Circulation and Tides' }, { title: 'Natural Vegetation and Wildlife' }, { title: 'Human Environment: Settlement, Transport and Communication' }, { title: 'Human Environment Interactions: Tropical and Subtropical Regions' }, { title: 'Life in the Deserts' }] },
      { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'On Equality' }, { title: 'Role of the Government in Health' }, { title: 'How the State Government Works' }, { title: 'Growing Up as Boys and Girls' }, { title: 'Women Change The World' }, { title: 'Understanding Media' }, { title: 'Markets Around Us' }, { title: 'A Shirt in the Market' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Styling with CSS' }, { title: 'Introduction to Python' }, { title: 'Digital Citizenship and Ethics' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Advanced Drills and Techniques' }, { title: 'First Aid and Sports Injuries' }, { title: 'Mental Toughness in Sports' }] },
      { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Using Sensors with Arduino (Light, Distance)' }, { title: 'Motor Control and Movement' }, { title: 'Project: Line-Following Robot' }] },
      { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'What is Machine Learning?' }, { title: 'Supervised vs. Unsupervised Learning' }, { title: 'How Recommendation Systems Work' }] },
      { name: 'Entrepreneurship & Finance', icon: 'SparklesIcon', chapters: [{ title: 'The Journey of Money: Earning and Spending' }, { title: 'Creating Value: Products vs. Services' }, { title: 'Simple Business Ideas' }, { title: 'Budgeting for a Goal' }] },
    ],
  },
  {
    level: 'Grade 8',
    description: 'Intermediate concepts for growing minds.',
    subjects: [
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Rational Numbers' }, { title: 'Linear Equations in One Variable' }, { title: 'Understanding Quadrilaterals' }, { title: 'Practical Geometry' }, { title: 'Data Handling: Probability and Pie Charts' }, { title: 'Squares and Square Roots' }, { title: 'Cubes and Cube Roots' }, { title: 'Comparing Quantities: Compound Interest' }, { title: 'Algebraic Expressions and Identities' }, { title: 'Visualising Solid Shapes' }, { title: 'Mensuration: Surface Area and Volume' }, { title: 'Exponents and Powers' }, { title: 'Direct and Inverse Proportions' }, { title: 'Factorisation' }, { title: 'Introduction to Graphs' }, { title: 'Playing with Numbers' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Crop Production and Management' }, { title: 'Microorganisms: Friend and Foe' }, { title: 'Synthetic Fibres and Plastics' }, { title: 'Materials: Metals and Non-metals' }, { title: 'Coal and Petroleum' }, { title: 'Combustion and Flame' }, { title: 'Conservation of Plants and Animals' }, { title: 'Cell: Structure and Functions' }, { title: 'Reproduction in Animals' }, { title: 'The Age of Adolescence: Puberty and Hormonal Changes' }, { title: 'Force and Pressure' }, { title: 'Friction: A Necessary Evil' }, { title: 'Sound' }, { title: 'Chemical Effects of Electric Current' }, { title: 'Some Natural Phenomena: Lightning and Earthquakes' }, { title: 'Light: Human Eye and Refraction' }, { title: 'Stars and the Solar System' }, { title: 'Pollution of Air and Water' }] },
      { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'How, When and Where' }, { title: 'From Trade to Territory: The Company Establishes Power' }, { title: 'Ruling the Countryside' }, { title: 'Tribals, Dikus and the Vision of a Golden Age' }, { title: 'When People Rebel: 1857 and After' }, { title: 'Colonialism and the City' }, { title: 'Weavers, Iron Smelters and Factory Owners' }, { title: 'Civilising the "Native", Educating the Nation' }, { title: 'Women, Caste and Reform' }, { title: 'The Changing World of Visual Arts' }, { title: 'The Making of the National Movement: 1870s-1947' }, { title: 'India After Independence' }] },
      { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'Resources: Types and Conservation' }, { title: 'Land, Soil, Water, Natural Vegetation and Wildlife Resources' }, { title: 'Mineral and Power Resources' }, { title: 'Agriculture' }, { title: 'Industries' }, { title: 'Human Resources' }] },
      { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'The Indian Constitution' }, { title: 'Understanding Secularism' }, { title: 'Why Do We Need a Parliament?' }, { title: 'Understanding Laws' }, { title: 'Judiciary' }, { title: 'Understanding Our Criminal Justice System' }, { title: 'Understanding Marginalisation' }, { title: 'Confronting Marginalisation' }, { title: 'Public Facilities' }, { title: 'Law and Social Justice' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Python Basics: Variables and Loops' }, { title: 'Introduction to JavaScript' }, { title: 'Creating a Simple Website' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Sports Training Principles' }, { title: 'Diet Planning for Athletes' }, { title: 'Officiating and Coaching Basics' }] },
      { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Introduction to Raspberry Pi' }, { title: 'Building a Multi-functional Robot' }, { title: 'Wireless Control (Bluetooth)' }] },
      { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'Introduction to Data Sets' }, { title: 'Project: Train a Simple Image Classifier' }, { title: 'Bias and Fairness in AI' }] },
      { name: 'Entrepreneurship & Finance', icon: 'SparklesIcon', chapters: [{ title: 'Earning Ethically and Legally' }, { title: 'Understanding Profit and Loss' }, { title: 'The Power of Saving' }, { title: 'Introduction to Investing' }, { title: 'My First Business Plan' }] },
    ],
  },
  // =================================================================
  // == HIGH SCHOOL (GRADES 9-10)
  // =================================================================
  {
    level: 'Grade 9',
    description: 'Preparing for secondary examinations.',
    subjects: [
        { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Number Systems' }, { title: 'Polynomials' }, { title: 'Coordinate Geometry' }, { title: 'Linear Equations in Two Variables' }, { title: 'Introduction to Euclid\'s Geometry' }, { title: 'Lines and Angles' }, { title: 'Triangles' }, { title: 'Quadrilaterals' }, { title: 'Areas of Parallelograms and Triangles' }, { title: 'Circles' }, { title: 'Geometric Constructions' }, { title: 'Heron\'s Formula' }, { title: 'Surface Areas and Volumes' }, { title: 'Statistics' }, { title: 'Probability' }] },
        { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Matter in Our Surroundings: States and Properties' }, { title: 'Is Matter Around Us Pure?: Mixtures and Solutions' }, { title: 'Atoms and Molecules' }, { title: 'Structure of the Atom' }, { title: 'The Fundamental Unit of Life: Cell' }, { title: 'Tissues: Plant and Animal' }, { title: 'Diversity in Living Organisms' }, { title: 'Motion: Describing Motion, Rate of Motion, and Graphs' }, { title: 'Force and the Laws of Motion' }, { title: 'Gravitation: Universal Law and Free Fall' }, { title: 'Work, Energy, and Power' }, { title: 'Sound' }, { title: 'Why Do We Fall Ill?' }, { title: 'Natural Resources' }, { title: 'Improvement in Food Resources' }] },
        { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'The French Revolution' }, { title: 'Socialism in Europe and the Russian Revolution' }, { title: 'Nazism and the Rise of Hitler' }, { title: 'Forest Society and Colonialism' }, { title: 'Pastoralists in the Modern World' }] },
        { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'India: Size and Location' }, { title: 'Physical Features of India' }, { title: 'Drainage Systems of India' }, { title: 'Climate of India' }, { title: 'Natural Vegetation and Wildlife' }, { title: 'Population' }] },
        { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'What is Democracy? Why Democracy?' }, { title: 'Constitutional Design' }, { title: 'Electoral Politics' }, { title: 'Working of Institutions' }, { title: 'Democratic Rights' }] },
        { name: 'Economics', icon: 'GlobeAltIcon', chapters: [{ title: 'The Story of Village Palampur' }, { title: 'People as Resource' }, { title: 'Poverty as a Challenge' }, { title: 'Food Security in India' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Python: Functions and Data Structures' }, { title: 'Advanced Web Design with JavaScript' }, { title: 'Introduction to SQL Databases' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Anatomy and Physiology in Sports' }, { title: 'Sports Psychology' }, { title: 'Career in Physical Education' }] },
        { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Introduction to Robot Operating System (ROS)' }, { title: 'Simulating a Robot' }, { title: 'Advanced Sensor Integration' }] },
        { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'How Neural Networks Work' }, { title: 'Building a Predictive Model (e.g., house prices)' }, { title: 'Ethics of AI and Automation' }] },
        { name: 'Entrepreneurship & Finance', icon: 'SparklesIcon', chapters: [{ title: 'Advanced Budgeting and Financial Goals' }, { title: 'Exploring Different Business Models' }, { title: 'Marketing Your Idea' }, { title: 'Understanding Basic Contracts (for 18+)' }, { title: 'Case Study: A Local Entrepreneur' }] },
    ],
  },
  {
    level: 'Grade 10',
    description: 'Advanced topics for high school students.',
    subjects: [
      { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Real Numbers' }, { title: 'Polynomials' }, { title: 'Pair of Linear Equations in Two Variables' }, { title: 'Quadratic Equations' }, { title: 'Arithmetic Progressions' }, { title: 'Triangles' }, { title: 'Coordinate Geometry' }, { title: 'Introduction to Trigonometry' }, { title: 'Some Applications of Trigonometry' }, { title: 'Circles' }, { title: 'Geometric Constructions' }, { title: 'Areas Related to Circles' }, { title: 'Surface Areas and Volumes' }, { title: 'Statistics' }, { title: 'Probability' }] },
      { name: 'Science', icon: 'BeakerIcon', chapters: [{ title: 'Chemical Reactions and Equations' }, { title: 'Acids, Bases and Salts' }, { title: 'Metals and Non-metals' }, { title: 'Carbon and its Compounds: Covalent Bonding and Versatile Nature' }, { title: 'Periodic Classification of Elements' }, { title: 'Life Processes: Nutrition, Respiration, Transport, Excretion' }, { title: 'Control and Coordination in Animals and Plants' }, { title: 'How do Organisms Reproduce?' }, { title: 'Heredity' }, { title: 'Light: Reflection and Refraction' }, { title: 'The Human Eye and the Colourful World' }, { title: 'Electricity' }, { title: 'Magnetic Effects of Electric Current' }, { title: 'Sources of Energy' }, { title: 'Our Environment' }, { title: 'Management of Natural Resources' }] },
      { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'The Rise of Nationalism in Europe' }, { title: 'Nationalism in India' }, { title: 'The Making of a Global World' }, { title: 'The Age of Industrialisation' }, { title: 'Print Culture and the Modern World' }] },
      { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'Resources and Development' }, { title: 'Forest and Wildlife Resources' }, { title: 'Water Resources' }, { title: 'Agriculture' }, { title: 'Minerals and Energy Resources' }, { title: 'Manufacturing Industries' }, { title: 'Lifelines of National Economy' }] },
      { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'Power Sharing' }, { title: 'Federalism' }, { title: 'Democracy and Diversity' }, { title: 'Gender, Religion and Caste' }, { title: 'Political Parties' }, { title: 'Outcomes of Democracy' }, { title: 'Challenges to Democracy' }] },
      { name: 'Economics', icon: 'GlobeAltIcon', chapters: [{ title: 'Development' }, { title: 'Sectors of the Indian Economy' }, { title: 'Money and Credit' }, { title: 'Globalization and the Indian Economy' }, { title: 'Consumer Rights' }] },
      { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Object-Oriented Programming with Python' }, { title: 'Introduction to Web Frameworks (Flask/Django)' }, { title: 'Project: Full Stack Web Application' }] },
      { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Biomechanics in Sports' }, { title: 'Sports Medicine Fundamentals' }, { title: 'Event Management in Sports' }] },
      { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Building an Autonomous Robot' }, { title: 'SLAM (Simultaneous Localization and Mapping) Basics' }, { title: 'Competitive Robotics Project' }] },
      { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'Introduction to Deep Learning' }, { title: 'Natural Language Processing (NLP) Basics' }, { title: 'Computer Vision Basics' }] },
      { name: 'Entrepreneurship & Finance', icon: 'SparklesIcon', chapters: [{ title: 'Scaling a Business Idea' }, { title: 'Financial Statements for Beginners' }, { title: 'Introduction to Stocks and Mutual Funds' }, { title: 'Social Entrepreneurship: Making an Impact' }, { title: 'Pitching Your Business Idea' }] },
    ],
  },
  // =================================================================
  // == SENIOR SECONDARY (GRADES 11-12)
  // =================================================================
  {
    level: 'Grade 11 (Science)',
    description: 'Specialization in scientific studies.',
    subjects: [
        { name: 'Physics', icon: 'BeakerIcon', chapters: [{ title: 'Physical World' }, { title: 'Units and Measurements' }, { title: 'Motion in a Straight Line' }, { title: 'Motion in a Plane' }, { title: 'Laws of Motion' }, { title: 'Work, Energy and Power' }, { title: 'Systems of Particles and Rotational Motion' }, { title: 'Gravitation' }, { title: 'Mechanical Properties of Solids: Elasticity and Stress' }, { title: 'Mechanical Properties of Fluids: Pressure, Buoyancy, and Viscosity' }, { title: 'Thermal Properties of Matter' }, { title: 'Thermodynamics' }, { title: 'Kinetic Theory of Gases' }, { title: 'Oscillations' }, { title: 'Waves' }] },
        { name: 'Chemistry', icon: 'BeakerIcon', chapters: [{ title: 'Some Basic Concepts of Chemistry' }, { title: 'Structure of the Atom' }, { title: 'Classification of Elements and Periodicity in Properties' }, { title: 'Chemical Bonding and Molecular Structure' }, { title: 'States of Matter: Gases and Liquids' }, { title: 'Thermodynamics' }, { title: 'Equilibrium' }, { title: 'Redox Reactions' }, { title: 'Hydrogen' }, { title: 'The s-Block Elements: Alkali and Alkaline Earth Metals' }, { title: 'The p-Block Elements: Groups 13 to 18' }, { title: 'Organic Chemistry: Basic Principles and Techniques' }, { title: 'Hydrocarbons' }, { title: 'Environmental Chemistry' }] },
        { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Sets' }, { title: 'Relations and Functions' }, { title: 'Trigonometric Functions' }, { title: 'Principle of Mathematical Induction' }, { title: 'Complex Numbers and Quadratic Equations' }, { title: 'Linear Inequalities' }, { title: 'Permutations and Combinations' }, { title: 'Binomial Theorem' }, { title: 'Sequences and Series' }, { title: 'Straight Lines' }, { title: 'Conic Sections' }, { title: 'Introduction to Three-Dimensional Geometry' }, { title: 'Limits and Derivatives' }, { title: 'Mathematical Reasoning' }, { title: 'Statistics' }, { title: 'Probability' }] },
        { name: 'Biology', icon: 'BeakerIcon', chapters: [{ title: 'The Living World' }, { title: 'Biological Classification' }, { title: 'Plant Kingdom' }, { title: 'Animal Kingdom' }, { title: 'Morphology of Flowering Plants' }, { title: 'Anatomy of Flowering Plants' }, { title: 'Structural Organisation in Animals' }, { title: 'Cell: The Unit of Life - An Overview' }, { title: 'Biomolecules: Structure and Function' }, { title: 'Cell Cycle and Cell Division' }, { title: 'Transport in Plants' }, { title: 'Mineral Nutrition' }, { title: 'Photosynthesis in Higher Plants' }, { title: 'Respiration in Plants' }, { title: 'Plant Growth and Development' }, { title: 'Digestion and Absorption' }, { title: 'Breathing and Exchange of Gases' }, { title: 'Body Fluids and Circulation' }, { title: 'Excretory Products and their Elimination' }, { title: 'Locomotion and Movement' }, { title: 'Neural Control and Coordination' }, { title: 'Chemical Coordination and Integration' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Advanced Algorithms & Data Structures' }, { title: 'Software Engineering Principles' }, { title: 'Introduction to Cloud Computing' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Advanced Training and Conditioning' }, { title: 'Sports Sociology' }, { title: 'Research in Physical Education' }] },
        { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Advanced ROS Programming' }, { title: 'Robot Vision and Perception' }, { title: 'Human-Robot Interaction Project' }] },
        { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'Deep Learning Frameworks (TensorFlow/PyTorch)' }, { title: 'Project: Building a Chatbot or Translator' }, { title: 'Reinforcement Learning Basics' }] },
    ],
  },
  {
    level: 'Grade 11 (Commerce)',
    description: 'Foundations of business and finance.',
    subjects: [
        { name: 'Accountancy', icon: 'BookOpenIcon', chapters: [{ title: 'Introduction to Accounting' }, { title: 'Theory Base of Accounting' }, { title: 'Recording of Transactions - I' }, { title: 'Recording of Transactions - II' }, { title: 'Bank Reconciliation Statement' }, { title: 'Trial Balance and Rectification of Errors' }, { title: 'Depreciation, Provisions and Reserves' }, { title: 'Bills of Exchange' }, { title: 'Financial Statements - I' }, { title: 'Financial Statements - II' }] },
        { name: 'Business Studies', icon: 'BookOpenIcon', chapters: [{ title: 'Business, Trade, and Commerce' }, { title: 'Forms of Business Organisation' }, { title: 'Private, Public and Global Enterprises' }, { title: 'Business Services' }, { title: 'Emerging Modes of Business' }, { title: 'Social Responsibilities of Business and Business Ethics' }, { title: 'Formation of a Company' }, { title: 'Sources of Business Finance' }, { title: 'Small Business and Entrepreneurship' }, { title: 'Internal Trade' }, { title: 'International Business' }] },
        { name: 'Economics', icon: 'GlobeAltIcon', chapters: [{ title: 'Indian Economy on the Eve of Independence' }, { title: 'Indian Economy (1950-1990)' }, { title: 'Liberalisation, Privatisation and Globalisation: An Appraisal' }, { title: 'Poverty' }, { title: 'Human Capital Formation in India' }, { title: 'Rural Development' }, { title: 'Employment: Growth, Informalisation and Other Issues' }, { title: 'Infrastructure' }, { title: 'Environment and Sustainable Development' }, { title: 'Development Experience of India, Pakistan and China' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Advanced Algorithms & Data Structures' }, { title: 'Software Engineering Principles' }, { title: 'Introduction to Cloud Computing' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Advanced Training and Conditioning' }, { title: 'Sports Sociology' }, { title: 'Research in Physical Education' }] },
    ],
  },
    {
    level: 'Grade 11 (Humanities)',
    description: 'Exploring society, history, and culture.',
    subjects: [
        { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'From the Beginning of Time' }, { title: 'Writing and City Life' }, { title: 'An Empire Across Three Continents' }, { title: 'The Central Islamic Lands' }, { title: 'Nomadic Empires' }, { title: 'The Three Orders: Feudalism' }, { title: 'Changing Cultural Traditions' }, { title: 'Confrontation of Cultures' }, { title: 'The Industrial Revolution' }, { title: 'Displacing Indigenous Peoples' }, { title: 'Paths to Modernisation' }] },
        { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'Constitution: Why and How?' }, { title: 'Rights in the Indian Constitution' }, { title: 'Election and Representation' }, { title: 'Executive' }, { title: 'Legislature' }, { title: 'Judiciary' }, { title: 'Federalism' }, { title: 'Local Governments' }, { title: 'Political Theory: An Introduction' }, { title: 'Freedom' }, { title: 'Equality' }, { title: 'Social Justice' }] },
        { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'Geography as a Discipline' }, { title: 'The Origin and Evolution of the Earth' }, { title: 'Interior of the Earth' }, { title: 'Distribution of Oceans and Continents' }, { title: 'Landforms and their Evolution' }, { title: 'Composition and Structure of Atmosphere' }, { title: 'Solar Radiation, Heat Balance and Temperature' }, { title: 'Water (Oceans)' }, { title: 'Life on the Earth' }, { title: 'India: Location and Physiography' }, { title: 'Drainage System of India' }, { title: 'Climate, Vegetation, and Soil' }, { title: 'Natural Hazards and Disasters' }] },
        { name: 'Sociology', icon: 'BookOpenIcon', chapters: [{ title: 'Sociology and Society' }, { title: 'Terms, Concepts and their Use in Sociology' }, { title: 'Understanding Social Institutions' }, { title: 'Culture and Socialisation' }, { title: 'Doing Sociology: Research Methods' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Advanced Algorithms & Data Structures' }, { title: 'Software Engineering Principles' }, { title: 'Introduction to Cloud Computing' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Advanced Training and Conditioning' }, { title: 'Sports Sociology' }, { title: 'Research in Physical Education' }] },
    ],
  },
  {
    level: 'Grade 12 (Science)',
    description: 'Advanced studies for competitive exams.',
    subjects: [
        { name: 'Physics', icon: 'BeakerIcon', chapters: [{ title: 'Electric Charges and Fields' }, { title: 'Electrostatic Potential and Capacitance' }, { title: 'Current Electricity' }, { title: 'Moving Charges and Magnetism' }, { title: 'Magnetism and Matter' }, { title: 'Electromagnetic Induction' }, { title: 'Alternating Current' }, { title: 'Electromagnetic Waves' }, { title: 'Ray Optics and Optical Instruments' }, { title: 'Wave Optics' }, { title: 'Dual Nature of Radiation and Matter: Photoelectric Effect' }, { title: 'Atoms' }, { title: 'Nuclei' }, { title: 'Semiconductor Electronics: Materials, Devices, and Simple Circuits' }] },
        { name: 'Chemistry', icon: 'BeakerIcon', chapters: [{ title: 'Solutions' }, { title: 'Electrochemistry' }, { title: 'Chemical Kinetics' }, { title: 'The d-and f-Block Elements' }, { title: 'Coordination Compounds' }, { title: 'Haloalkanes and Haloarenes' }, { title: 'Alcohols, Phenols and Ethers' }, { title: 'Aldehydes, Ketones and Carboxylic Acids' }, { title: 'Amines' }, { title: 'Biomolecules' }] },
        { name: 'Mathematics', icon: 'CalculatorIcon', chapters: [{ title: 'Relations and Functions' }, { title: 'Inverse Trigonometric Functions' }, { title: 'Matrices' }, { title: 'Determinants' }, { title: 'Continuity and Differentiability' }, { title: 'Applications of Derivatives' }, { title: 'Integrals' }, { title: 'Application of Integrals' }, { title: 'Differential Equations' }, { title: 'Vector Algebra' }, { title: 'Three Dimensional Geometry' }, { title: 'Linear Programming' }, { title: 'Probability' }] },
        { name: 'Biology', icon: 'BeakerIcon', chapters: [{ title: 'Sexual Reproduction in Flowering Plants' }, { title: 'Human Reproduction' }, { title: 'Reproductive Health' }, { title: 'Principles of Inheritance and Variation' }, { title: 'Molecular Basis of Inheritance' }, { title: 'Evolution' }, { title: 'Human Health and Disease' }, { title: 'Strategies for Enhancement in Food Production' }, { title: 'Microbes in Human Welfare' }, { title: 'Biotechnology: Principles and Processes' }, { title: 'Biotechnology and its Applications' }, { title: 'Organisms and Populations' }, { title: 'Ecosystem' }, { title: 'Biodiversity and Conservation' }, { title: 'Environmental Issues' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Mobile Application Development (React Native/Flutter)' }, { title: 'DevOps and CI/CD' }, { title: 'Final Capstone Project' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Sports Management and Marketing' }, { title: 'Advanced Biomechanics Analysis' }, { title: 'Thesis on a Sports Topic' }] },
        { name: 'Robotics', icon: 'CpuChipIcon', chapters: [{ title: 'Autonomous Navigation and Drones' }, { title: 'Advanced Robotics Capstone Project' }, { title: 'AI in Robotics' }] },
        { name: 'AI and Machine Learning', icon: 'SparklesIcon', chapters: [{ title: 'Advanced Computer Vision (Object Detection)' }, { title: 'Advanced NLP (Sentiment Analysis)' }, { title: 'Deploying Machine Learning Models' }] },
    ],
  },
  {
    level: 'Grade 12 (Commerce)',
    description: 'Mastering commerce and financial literacy.',
    subjects: [
        { name: 'Accountancy', icon: 'BookOpenIcon', chapters: [{ title: 'Accounting for Not-for-Profit Organisation' }, { title: 'Accounting for Partnership: Basic Concepts' }, { title: 'Reconstitution of a Partnership Firm: Admission' }, { title: 'Reconstitution of a Partnership Firm: Retirement/Death' }, { title: 'Dissolution of Partnership Firm' }, { title: 'Accounting for Share Capital' }, { title: 'Issue and Redemption of Debentures' }, { title: 'Financial Statements of a Company' }, { title: 'Analysis of Financial Statements' }, { title: 'Accounting Ratios' }, { title: 'Cash Flow Statement' }] },
        { name: 'Business Studies', icon: 'BookOpenIcon', chapters: [{ title: 'Nature and Significance of Management' }, { title: 'Principles of Management' }, { title: 'Business Environment' }, { title: 'Planning' }, { title: 'Organising' }, { title: 'Staffing' }, { title: 'Directing' }, { title: 'Controlling' }, { title: 'Financial Management' }, { title: 'Financial Markets' }, { title: 'Marketing' }, { title: 'Consumer Protection' }] },
        { name: "Economics", icon: 'GlobeAltIcon', chapters: [{ title: 'Introduction to Macroeconomics' }, { title: 'National Income and Related Aggregates' }, { title: 'Money and Banking' }, { title: 'Determination of Income and Employment' }, { title: 'Government Budget and the Economy' }, { title: 'Balance of Payments' }, { title: 'Indian Economic Development' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Mobile Application Development (React Native/Flutter)' }, { title: 'DevOps and CI/CD' }, { title: 'Final Capstone Project' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Sports Management and Marketing' }, { title: 'Advanced Biomechanics Analysis' }, { title: 'Thesis on a Sports Topic' }] },
    ],
  },
  {
    level: 'Grade 12 (Humanities)',
    description: 'In-depth analysis of human society.',
    subjects: [
        { name: 'History', icon: 'GlobeAltIcon', chapters: [{ title: 'Bricks, Beads and Bones: The Harappan Civilisation' }, { title: 'Kings, Farmers and Towns' }, { title: 'Kinship, Caste and Class' }, { title: 'Thinkers, Beliefs and Buildings' }, { title: 'Through the Eyes of Travellers' }, { title: 'Bhakti-Sufi Traditions' }, { title: 'An Imperial Capital: Vijayanagara' }, { title: 'Peasants, Zamindars and the State' }, { title: 'Colonialism and the Countryside' }, { title: 'Rebels and the Raj' }, { title: 'Mahatma Gandhi and the Nationalist Movement' }, { title: 'Framing the Constitution' }] },
        { name: 'Political Science', icon: 'GlobeAltIcon', chapters: [{ title: 'The Cold War Era' }, { title: 'The End of Bipolarity' }, { title: 'US Hegemony in World Politics' }, { title: 'Alternative Centres of Power' }, { title: 'Contemporary South Asia' }, { title: 'International Organisations' }, { title: 'Security in the Contemporary World' }, { title: 'Globalisation' }, { title: 'Challenges of Nation-Building' }, { title: 'Era of One-Party Dominance' }, { title: 'Politics of Planned Development' }, { title: 'India’s External Relations' }] },
        { name: 'Geography', icon: 'GlobeAltIcon', chapters: [{ title: 'Human Geography: Nature and Scope' }, { title: 'The World Population: Distribution, Density and Growth' }, { title: 'Human Development' }, { title: 'Primary Activities' }, { title: 'Secondary Activities' }, { title: 'Tertiary and Quaternary Activities' }, { title: 'Transport and Communication' }, { title: 'International Trade' }, { title: 'Human Settlements' }, { title: 'India: People and Economy' }] },
        { name: 'Sociology', icon: 'BookOpenIcon', chapters: [{ title: 'The Demographic Structure of Indian Society' }, { title: 'Social Institutions: Continuity and Change' }, { title: 'The Market as a Social Institution' }, { title: 'Patterns of Social Inequality and Exclusion' }, { title: 'Challenges of Cultural Diversity' }, { title: 'Structural Change' }, { title: 'Cultural Change' }, { title: 'Social Movements' }] },
        { name: 'Computer Science', icon: 'ComputerDesktopIcon', chapters: [{ title: 'Mobile Application Development (React Native/Flutter)' }, { title: 'DevOps and CI/CD' }, { title: 'Final Capstone Project' }] },
        { name: 'Physical Education', icon: 'TrophyIcon', chapters: [{ title: 'Sports Management and Marketing' }, { title: 'Advanced Biomechanics Analysis' }, { title: 'Thesis on a Sports Topic' }] },
    ],
  },
];
