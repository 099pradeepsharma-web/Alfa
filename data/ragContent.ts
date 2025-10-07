import { LearningModule, Trigger } from '../types';

// This map simulates a Retrieval-Augmented Generation (RAG) system's database.
// Keys are formatted as `chapter-title-language`.
const RAG_CONTENT_STORE: Record<string, LearningModule> = {};

// Helper to create a consistent key
const createRagKey = (chapterTitle: string, language: string): string => {
    return `${chapterTitle}-${language}`.toLowerCase().replace(/\s+/g, '-').replace(/[:–]/g, '');
};


// --- START: Content for "The Great Transformation" Chapter ---
const THE_GREAT_TRANSFORMATION_EN: LearningModule = {
  chapterTitle: 'The Great Transformation: Navigating Your Journey from Teen to Adult',
  missionBriefing: [
    {
      triggerType: 'paradoxicalQuestion',
      title: "Why do you sometimes feel intense emotions over small things?",
      description: "It's not just you, it's science. Your brain is temporarily upgrading its emotional hardware before its reasoning software. This mission helps you understand this powerful, normal process.",
      pushNotification: "Feeling extra? Your brain is getting a superpower upgrade. Find out how."
    },
    {
      triggerType: 'realWorldVideo',
      title: "From Student to Leader: The Hidden Skills",
      description: "A fast-paced video showing successful young Indian entrepreneurs and leaders (like Ritesh Agarwal, Neha Kakkar) talking about resilience and emotional control, not just academic knowledge. The video ends with the question: 'Their journey started where you are now. Ready to build your success toolkit?'",
      pushNotification: "What do India's top leaders and YOU have in common? The answer is inside."
    }
  ],
  coreConceptTraining: [
    {
      title: "The Science Behind the Changes: Your Brain 'Under Construction'",
      explanation: "Your brain is undergoing a massive rewiring, like upgrading a computer's operating system. It's a normal, healthy process that makes you smarter and more capable.\n\nKey Areas of Development:\n- <u>The Limbic System (The Emotional Center):</u> This part matures early. It's responsible for emotions, rewards, and social connection. During teen years, it's highly active, which is why friendships feel so important and emotions can feel so intense.\n- <u>The Prefrontal Cortex (The 'CEO' or Reasoning Center):</u> This part, right behind your forehead, is responsible for planning, decision-making, and controlling impulses. It's the last part to fully mature, often in your early 20s.\n\nThe Developmental 'Mismatch':\nFor a while, your super-charged emotional center is more developed than your reasoning center. Think of it as having the powerful engine of a sports car (emotions) but still learning to use the steering wheel and brakes (reasoning). This 'mismatch' is why you might:\n- Act on impulse sometimes.\n- Feel emotions very strongly (both good and bad).\n- Find it harder to see long-term consequences.\n\nThis is NOT a weakness; it's a temporary phase of incredible growth! Understanding this science is the first step to navigating it.",
      knowledgeCheck: [
        { conceptTitle: "Brain Development", question: "Which part of the brain, responsible for reasoning and impulse control, is the LAST to fully mature?", options: ["Limbic System", "Prefrontal Cortex", "Cerebellum", "Brain Stem"], correctAnswer: "Prefrontal Cortex", explanation: "The prefrontal cortex, our 'CEO' of the brain, continues developing into our early 20s, which is why reasoning skills and impulse control improve over time." },
        { conceptTitle: "Normalcy of Change", question: "Feeling emotional or distracted as a teen is a sign of:", options: ["Weakness", "Laziness", "Normal brain growth", "Lack of sleep"], correctAnswer: "Normal brain growth", explanation: "These feelings are a direct result of the natural and healthy rewiring happening in your brain, especially the mismatch between the emotional and reasoning centers." }
      ]
    }
  ],
  practiceArena: {
    problems: [
        { level: 'Level 1: NCERT Basics', problemStatement: "Priya feels she can't focus on her studies like she used to. What is a simple, effective first step she can take?", solution: "A great first step is 'Talk it Out'. Sharing her feelings with a trusted parent, teacher, or counselor can immediately reduce the burden and help her get a new perspective. It's not about solving everything at once, but about not carrying the weight alone." },
        { level: 'Level 2: Reference Application', problemStatement: "Rohan is feeling immense peer pressure to skip studying for a movie. How can he use the 'Find Your Anchor' tool to make a good decision?", solution: "Rohan can 'Find His Anchor' by reminding himself of his long-term goal, perhaps getting into a good college. This goal is his anchor. By focusing on it, he can weigh the short-term fun of a movie against his long-term ambition. This makes it easier to say 'no' or suggest a compromise, like celebrating after the exam." }
    ],
    reward: {
        type: 'xp',
        points: 150
    }
  },
  practicalApplicationLab: {
      type: 'project',
      title: "Create Your 'Success Toolkit' Poster",
      description: "Design a poster for your room that visually represents your 'Toolkit for Success'. Draw your 'anchors', list people you can 'talk to', and add your favorite 'active' pursuits."
  },
  bossFight: [
      { type: 'ACADEMIC', conceptTitle: "Brain Development", question: "The part of the brain responsible for planning and decision-making is called the:", options: ["Limbic System", "Cerebellum", "Prefrontal Cortex", "Brain Stem"], correctAnswer: "Prefrontal Cortex", explanation: "The prefrontal cortex is our 'CEO' of the brain, handling complex thinking and reasoning." },
      { type: 'ACADEMIC', conceptTitle: "Toolkit", question: "Which 'Toolkit' item is most about managing stress through physical means?", options: ["Talk it Out", "Stay Active", "Find Your Anchor", "Embrace Your Identity"], correctAnswer: "Stay Active", explanation: "Physical activity is a proven way to reduce stress hormones and boost mood." },
      { type: 'ACADEMIC', conceptTitle: "Emotional Response", question: "The developmental 'mismatch' in the brain can lead to:", options: ["Better memory", "More intense emotions", "Improved athletic skill", "Less need for sleep"], correctAnswer: "More intense emotions", explanation: "When the emotional center is more developed than the reasoning center, feelings can be stronger and harder to manage." },
      { type: 'ACADEMIC', conceptTitle: "Toolkit", question: "What does 'Find Your Anchor' mean?", options: ["Going sailing", "Focusing on a core value or goal", "Holding onto something heavy", "Arguing with friends"], correctAnswer: "Focusing on a core value or goal", explanation: "Your 'anchor' is something stable and important to you that helps you stay grounded during stressful times." },
      { type: 'ACADEMIC', conceptTitle: "Case Study", question: "In the case study, Priya's mood swings are a sign of:", options: ["A serious problem", "Her not trying hard enough", "Normal adolescent development", "A poor diet"], correctAnswer: "Normal adolescent development", explanation: "The story emphasizes that these experiences are a normal part of the changes happening inside her." },
      { type: 'ACADEMIC', conceptTitle: "Growth Mindset", question: "Seeing a failed test as 'feedback' instead of 'failure' is an example of:", options: ["A fixed mindset", "A growth mindset", "Low self-esteem", "A competitive mindset"], correctAnswer: "A growth mindset", explanation: "A growth mindset sees challenges as opportunities to learn and improve, rather than as final judgments of ability." },
      { type: 'ACADEMIC', conceptTitle: "Resilience", question: "The ability to bounce back from setbacks is called:", options: ["Intelligence", "Resilience", "Empathy", "Creativity"], correctAnswer: "Resilience", explanation: "Resilience is the key skill for overcoming challenges and continuing to strive towards your goals." },
      { type: 'ACADEMIC', conceptTitle: "Real-World Application", question: "The skills of resilience and emotional intelligence are important for:", options: ["Only for students", "Only for athletes", "Only for artists", "Everyone, including future leaders"], correctAnswer: "Everyone, including future leaders", explanation: "These 'soft skills' are crucial for success in any career and in life in general." },
      { type: 'ACADEMIC', conceptTitle: "Toolkit", question: "Why is 'Talk it Out' an effective tool?", options: ["It magically solves problems", "It helps you avoid responsibility", "It reduces the feeling of being alone with a problem", "It makes others feel sorry for you"], correctAnswer: "It reduces the feeling of being alone with a problem", explanation: "Sharing your burden makes it lighter and allows others to offer support and new perspectives." },
      { type: 'ACADEMIC', conceptTitle: "Brain Development", question: "The 'Under Construction' sign in the brain analogy applies to the:", options: ["Emotional Center", "Reasoning Center", "The whole brain", "The spinal cord"], correctAnswer: "Reasoning Center", explanation: "The prefrontal cortex, or reasoning center, is the part of the brain that continues to develop throughout adolescence and into your early 20s." }
  ]
};

// --- START: New Content for "Light: Reflection and Refraction" ---
const LIGHT_REFLECTION_REFRACTION_EN: LearningModule = {
    chapterTitle: "Light: Reflection and Refraction",
    missionBriefing: [
        {
            triggerType: 'realWorldVideo',
            title: "From Superheroes to Super-Fast Internet",
            description: "A 45-second video starting with a superhero using lasers, cutting to a fiber optic cable, then to a desert mirage. Voiceover: 'What do superheroes, the internet, and desert illusions have in common? They all obey the laws of light. Accept this mission to become a Master of Light and bend reality to your will.'",
            pushNotification: "Superheroes, the Internet, and desert illusions share a secret. Unlock it now."
        },
        {
            triggerType: 'paradoxicalQuestion',
            title: "How can you be in two places at once?",
            description: "When you look at your reflection in a calm lake, you see yourself, but you also see the fish swimming below. Light is reaching your eyes from two different places at the same time. This mission explores the two fundamental rules of light—reflection and refraction—that make this possible.",
            pushNotification: "You can be in two places at once. We'll show you how light does it."
        }
    ],
    coreConceptTraining: [
        {
            title: "The Laws of Reflection",
            explanation: "Reflection is when light bounces off a surface, like a mirror. It follows two simple but powerful rules that govern everything from how we see ourselves to how telescopes work.\n\nKey Terminology:\n- <u>Incident Ray:</u> The ray of light that strikes the surface.\n- <u>Reflected Ray:</u> The ray of light that bounces off the surface.\n- <u>Normal:</u> An imaginary line drawn perpendicular (at 90°) to the surface at the point of incidence.\n- <u>Angle of Incidence (∠i):</u> The angle between the incident ray and the normal.\n- <u>Angle of Reflection (∠r):</u> The angle between the reflected ray and the normal.\n\nThe Two Laws of Reflection are:\n- 1. First Law: The angle of incidence is always equal to the angle of reflection. (<u>∠i = ∠r</u>)\n- 2. Second Law: The incident ray, the reflected ray, and the normal at the point of incidence all lie in the same plane.\n\nSolved Numerical Example:\nProblem: A ray of light makes an angle of 35° with a plane mirror. What is the angle of reflection?\nSolution:\n=> The given angle is with the mirror surface, not the normal. The angle of the normal to the surface is 90°.\n=> Angle of Incidence (∠i) = 90° - (angle with the surface)\n=> ∠i = 90° - 35° = 55°.\n=> According to the First Law of Reflection, Angle of Reflection (∠r) = Angle of Incidence (∠i).\n=> <u>∠r = 55°</u>.\n\nAnalytical Insight:\nDiffuse vs. Specular Reflection: These laws apply perfectly to smooth surfaces like mirrors (specular reflection). On rough surfaces (like paper), light rays hit at many different angles, causing them to reflect in all directions (diffuse reflection). This is why you can't see your reflection in a wall!",
            knowledgeCheck: [
                { conceptTitle: "Laws of Reflection", question: "If a light ray hits a mirror at an angle of 30° to the normal, what is the angle of reflection?", options: ["30°", "60°", "90°", "15°"], correctAnswer: "30°", explanation: "The angle of incidence is given as 30° (the angle to the normal). According to the first law of reflection, the angle of reflection is equal to the angle of incidence, which is 30°." },
                { conceptTitle: "Laws of Reflection", question: "Which of the following best describes the second law of reflection?", options: ["Light travels in straight lines", "The angles are always equal", "The incident ray, reflected ray, and normal are in the same plane", "Light speed is constant"], correctAnswer: "The incident ray, reflected ray, and normal are in the same plane", explanation: "This law defines the 2D plane on which reflection occurs." }
            ]
        },
        {
            title: "Image Formation by Concave & Convex Mirrors",
            explanation: "Concave Mirrors:\n- These mirrors curve inward, like a cave. They are <u>'converging' mirrors</u> because they bring parallel rays of light to a single point called the <u>focus (F)</u>.\n- Used in: Shaving mirrors (magnified image), car headlights (to produce a parallel beam), solar cookers (to focus sunlight).\n- Image type depends on object position, for example, if the object is between F and Pole (P), the image is <u>Virtual, erect, and magnified.</u>\n\nConvex Mirrors:\n- These mirrors curve outward. They are <u>'diverging' mirrors</u> because they spread out parallel rays of light so they appear to come from a focus behind the mirror.\n- Used in: Rear-view mirrors in vehicles (wide field of view), security mirrors in shops.\n- Image type is always the same: <u>Virtual, erect, and diminished (smaller)</u>, regardless of object position.\n\nThe Mirror Formula & Magnification:\n- Formula: <u>1/f = 1/v + 1/u</u>\n- Where: `f` = focal length, `v` = image distance, `u` = object distance.\n- Magnification (m): <u>m = -v/u</u>\n- If `m` is negative, the image is <u>real and inverted</u>.\n- If `m` is positive, the image is <u>virtual and erect</u>.\n\nSolved Numerical Example:\nProblem: An object is placed 10 cm in front of a concave mirror of focal length 15 cm. Find the position, nature, and magnification of the image.\nSolution (using Sign Convention):\n=> Object distance <u>u = -10 cm</u> (always negative).\n=> Focal length <u>f = -15 cm</u> (concave).\n=> Using mirror formula: 1/f = 1/v + 1/u\n=> 1/(-15) = 1/v + 1/(-10)\n=> 1/v = 1/10 - 1/15\n=> 1/v = (3-2)/30 = 1/30\n=> <u>v = +30 cm</u>. Since `v` is positive, the image is formed behind the mirror.\n=> Magnification <u>m = -v/u</u> = -(+30)/(-10) = +3.\n=> Result: The image is <u>virtual</u> (positive `v`), <u>erect</u> (positive `m`), and <u>magnified 3 times</u> (`m` > 1).",
            knowledgeCheck: [
                { conceptTitle: "Concave Mirrors", question: "To get a real, inverted, and same-sized image with a concave mirror, where should the object be placed?", options: ["At infinity", "At the center of curvature (C)", "At the focus (F)", "Between F and the pole (P)"], correctAnswer: "At the center of curvature (C)", explanation: "When the object is placed at C, the image is also formed at C, and it is real, inverted, and of the same size." },
                { conceptTitle: "Convex Mirrors", question: "A rear-view mirror in a car is a convex mirror because it provides a:", options: ["Magnified image", "Wider field of view", "Real image", "Inverted image"], correctAnswer: "Wider field of view", explanation: "Convex mirrors always form smaller, erect images but cover a much larger area behind the car, which is essential for safe driving." }
            ]
        },
        {
            title: "The Laws of Refraction (Snell's Law)",
            videoPrompt: "Create a 2-minute animated video explaining Snell's Law. Show a laser beam passing from air into a glass block and then into water. Visualize the normal, the angles, and how the beam bends towards the normal in denser media and away in rarer media. Display the formula n1*sin(θ1) = n2*sin(θ2) on screen and plug in values for an air-to-glass example.",
            explanation: "Refraction is the fascinating phenomenon of light bending as it travels from one medium to another, like from air to water. This bending occurs because the speed of light changes.\n\nKey Principles:\n- When light enters a <u>denser medium</u> (e.g., air to glass), it slows down and bends <u>towards the normal</u>.\n- When light enters a <u>rarer medium</u> (e.g., glass to air), it speeds up and bends <u>away from the normal</u>.\n\nSnell's Law (The Law of Refraction):\n- This law mathematically describes how much light bends.\n- It is given by: <u>n1 * sin(θ1) = n2 * sin(θ2)</u>\n  - n1 = refractive index of medium 1\n  - n2 = refractive index of medium 2\n  - θ1 = angle of incidence\n  - θ2 = angle of refraction\n\nSolved Numerical Example:\nProblem: A ray of light traveling in air is incident on a glass slab (refractive index = 1.5) at an angle of 45°. Find the angle of refraction.\nSolution:\n=> Given: n1 (air) ≈ 1.0, n2 (glass) = 1.5, θ1 = 45°.\n=> Using Snell's Law: n1 * sin(θ1) = n2 * sin(θ2)\n=> 1.0 * sin(45°) = 1.5 * sin(θ2)\n=> 0.707 = 1.5 * sin(θ2)\n=> sin(θ2) = 0.707 / 1.5 ≈ 0.471\n=> θ2 = arcsin(0.471)\n=> <u>θ2 ≈ 28.1°</u>\n\nAnalytical Insight:\nIf n1 > n2, the light bends away from the normal. If the angle of incidence is large enough, it can lead to <u>Total Internal Reflection (TIR)</u>, the principle behind optical fibers.",
            knowledgeCheck: [
                { conceptTitle: "Snell's Law", question: "When light enters from air (rarer medium) into glass (denser medium), it bends:", options: ["Towards the normal", "Away from the normal", "It does not bend", "It reflects back"], correctAnswer: "Towards the normal", explanation: "Light slows down in a denser medium, causing it to bend towards the normal to satisfy Snell's Law." },
                { conceptTitle: "Snell's Law", question: "What happens to the speed of light when it enters a medium with a higher refractive index?", options: ["It increases", "It decreases", "It stays the same", "It becomes zero"], correctAnswer: "It decreases", explanation: "The refractive index is a measure of how much light slows down in a medium. A higher 'n' means a lower speed." }
            ]
        }
    ],
    practiceArena: {
        problems: [
            { level: 'Level 1: NCERT Basics', problemStatement: "An object is placed 10 cm in front of a concave mirror of focal length 15 cm. Find the position, nature, and magnification of the image.", solution: "Given: u = -10 cm, f = -15 cm.\nUsing mirror formula 1/f = 1/v + 1/u, we get:\n=> 1/v = 1/f - 1/u\n=> 1/v = 1/(-15) - 1/(-10)\n=> 1/v = (-2+3)/30 = 1/30\n=> v = +30 cm.\nSince v is positive, the image is virtual.\nMagnification m = -v/u = -30/(-10) = +3.\nSince m is positive and > 1, the image is erect and magnified." },
            { level: 'Level 1: NCERT Basics', problemStatement: "Find the power of a concave lens of focal length 2 m.", solution: "Focal length of a concave lens is negative, so <u>f = -2 m</u>.\nPower P = 1/f (where f is in meters).\n=> P = 1/(-2)\n=> <u>P = -0.5 D</u>." },
            { level: 'Level 1: NCERT Basics', problemStatement: "A convex lens has a focal length of 50 cm. Calculate its power.", solution: "Given: f = 50 cm = 0.5 m.\nPower P = 1/f.\n=> P = 1 / 0.5\n=> <u>P = +2 D</u>.\nSince power is positive, it is a converging lens." },
            { level: 'Level 2: Reference Application', problemStatement: "A small bulb is placed at the bottom of a tank containing water to a depth of 80 cm. What is the area of the surface of water through which light from the bulb can emerge out? Refractive index of water is 4/3. (Inspired by H.C. Verma)", solution: "Light emerges through a circle where the edge corresponds to the critical angle 'c'.\n=> sin(c) = 1/n = 1 / (4/3) = 3/4.\nFrom geometry, tan(c) = r/h, where 'r' is the radius and 'h' is depth.\n=> tan(c) = sin(c) / sqrt(1 - sin^2(c))\n=> tan(c) = (3/4) / sqrt(1 - 9/16) = (3/4) / (sqrt(7)/4) = 3/sqrt(7).\n=> r = h * tan(c) = 0.80 * (3/sqrt(7)) m.\n=> Area = π * r^2\n=> Area = π * (0.80 * 3/sqrt(7))^2\n=> <u>Area ≈ 2.59 m²</u>." },
            { level: 'Level 2: Reference Application', problemStatement: "A convex lens is dipped in a liquid whose refractive index is equal to the refractive index of the lens. What will be its focal length?", solution: "The focal length will become infinite.\nLens Maker's formula: 1/f = (n_lens/n_medium - 1) * (1/R1 - 1/R2).\nIf n_lens = n_medium, then (n_lens/n_medium - 1) = (1 - 1) = 0.\n=> 1/f = 0\n=> <u>f = ∞</u>.\nThe lens will behave like a plane glass slab." },
            { level: 'Level 2: Reference Application', problemStatement: "An object is placed 30 cm in front of a convex mirror of focal length 15 cm. Find the position and nature of the image.", solution: "Given: u = -30 cm, f = +15 cm (convex).\nUsing mirror formula: 1/f = 1/v + 1/u.\n=> 1/15 = 1/v + 1/(-30)\n=> 1/v = 1/15 + 1/30 = (2+1)/30 = 3/30 = 1/10.\n=> <u>v = +10 cm</u>.\nThe image is 10 cm behind the mirror (virtual and erect)." },
            { level: 'Level 3: Competitive Challenge', problemStatement: "Two thin lenses of power +3.5 D and -2.5 D are placed in contact. Find the power and focal length of the combination. What is the nature of this combination? (NTSE Pattern)", solution: "Power of combination P = P1 + P2.\n=> P = 3.5 D + (-2.5 D) = +1.0 D.\nFocal length f = 1/P.\n=> f = 1/1.0 = 1 m.\nSince power is positive, the combination behaves as a <u>convex (converging) lens</u>." },
            { level: 'Level 3: Competitive Challenge', problemStatement: "A 4.5 cm needle is placed 12 cm away from a convex mirror of focal length 15 cm. Give the location of the image and the magnification. Describe what happens as the needle is moved farther from the mirror. (JEE Foundation Pattern)", solution: "Given: h1 = 4.5 cm, u = -12 cm, f = +15 cm.\nUsing mirror formula: 1/v = 1/f - 1/u\n=> 1/v = 1/15 - 1/(-12) = (4+5)/60 = 9/60.\n=> v = 60/9 = 6.7 cm.\nMagnification m = -v/u = -6.7/(-12) ≈ +0.56.\n<u>Image is virtual, erect, diminished, at 6.7 cm behind the mirror.</u>\nAs the needle moves farther, the image moves from the pole towards the focus, and its size decreases." }
        ],
        reward: {
            type: 'video',
            title: "Pro Tip: Mastering Sign Convention",
            videoPrompt: "Create a 90-second animated video explaining the Cartesian sign convention for spherical mirrors and lenses. Use a simple mnemonic like 'Light travels left to right, so anything against it is negative'. Show clear examples for both concave and convex systems."
        }
    },
    practicalApplicationLab: {
        type: 'virtualLab',
        title: "Virtual Optics Workbench",
        description: "Apply the lens formula in a practical simulation. Your task is to create a virtual telescope that can focus on a distant object.",
        labInstructions: "Drag and place one concave lens and one convex lens onto the workbench. Input the correct focal lengths and distances between them to successfully focus the image. Hint: A simple telescope uses a convex lens as the objective and another as the eyepiece."
    },
    bossFight: [
      { conceptTitle: "Reflection", question: "A ray of light is incident on a plane mirror at an angle of 35° with the mirror surface. The angle of reflection will be:", options: ["35°", "55°", "45°", "90°"], correctAnswer: "55°", explanation: "The angle of incidence is the angle with the normal, not the surface. Angle of incidence = 90° - 35° = 55°. Angle of reflection = Angle of incidence = 55°." },
      { conceptTitle: "Concave Mirror", question: "Which of the following is a use of a concave mirror?", options: ["Rear-view mirror in vehicles", "Shaving mirror", "Shop security mirror", "Reflector in street lamps"], correctAnswer: "Shaving mirror", explanation: "Concave mirrors are used as shaving mirrors because they produce a magnified and erect image when the face is held close to them (within the focal length)." },
      { conceptTitle: "Refraction", question: "The primary reason for the twinkling of stars is:", options: ["Atmospheric reflection", "Atmospheric dispersion", "Atmospheric refraction", "Total internal reflection"], correctAnswer: "Atmospheric refraction", explanation: "The continuously changing atmosphere refracts the starlight by different amounts from one moment to the next, causing the apparent position of the star to fluctuate, which we perceive as twinkling." },
      { conceptTitle: "Refractive Index", question: "Light travels fastest in which of the following media? (Refractive indices given in brackets)", options: ["Water (1.33)", "Glass (1.52)", "Diamond (2.42)", "Air (1.0003)"], correctAnswer: "Air (1.0003)", explanation: "The speed of light is inversely proportional to the refractive index. The medium with the lowest refractive index (Air) will have the fastest speed of light." },
      { conceptTitle: "Lens Formula", question: "An object is placed 20 cm from a convex lens of focal length 10 cm. The image is formed at:", options: ["-20 cm", "+20 cm", "-10 cm", "+10 cm"], correctAnswer: "+20 cm", explanation: "Using lens formula 1/f = 1/v - 1/u. Given u=-20cm, f=+10cm. 1/10 = 1/v - 1/(-20) => 1/v = 1/10 - 1/20 = 1/20. So, v = +20 cm." },
      { conceptTitle: "Power of Lens", question: "A person is prescribed glasses with a power of -2.0 D. The lens must be:", options: ["Concave", "Convex", "Bifocal", "Cylindrical"], correctAnswer: "Concave", explanation: "A negative power indicates a negative (diverging) focal length, which corresponds to a concave lens. This is used to correct myopia (nearsightedness)." },
      { conceptTitle: "Magnification", question: "A real, inverted image of size -2 is formed by a mirror. This means the object was magnified:", options: ["2 times", "0.5 times", "4 times", "1 time"], correctAnswer: "2 times", explanation: "Magnification is the ratio of image height to object height. A value of -2 means the image is inverted and twice the size of the object. The magnitude of magnification is 2." },
      { conceptTitle: "Total Internal Reflection", question: "The sparkle of a diamond is due to:", options: ["Its hardness", "Its high refractive index leading to TIR", "Its cutting", "Its reflection properties"], correctAnswer: "Its high refractive index leading to TIR", explanation: "Diamond has a very high refractive index, resulting in a small critical angle. Light entering the diamond undergoes multiple total internal reflections before it exits, creating the sparkling effect." },
      { conceptTitle: "Spherical Mirrors", question: "The focus of a convex mirror is:", options: ["In front of the mirror", "On the surface of the mirror", "Behind the mirror", "At infinity"], correctAnswer: "Behind the mirror", explanation: "For a convex mirror, parallel rays appear to diverge from a point behind the mirror. This point is the virtual principal focus." },
      { conceptTitle: "Assertion-Reason", question: "Assertion (A): The mirror formula can be applied to a plane mirror. Reason (R): A plane mirror is a spherical mirror of infinite focal length.", options: ["Both A and R are true and R is the correct explanation of A", "Both A and R are true but R is not the correct explanation of A", "A is true but R is false", "A is false but R is true"], correctAnswer: "Both A and R are true and R is the correct explanation of A", explanation: "A plane mirror can be considered a spherical mirror with an infinite radius of curvature, and thus an infinite focal length. If f=∞, 1/f=0. Mirror formula becomes 1/v + 1/u = 0, or v = -u, which is correct for a plane mirror." }
    ]
};

// Populate the store
RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'en')] = THE_GREAT_TRANSFORMATION_EN;
// RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'hi')] = THE_GREAT_TRANSFORMATION_HI; // Hindi content can be added here
RAG_CONTENT_STORE[createRagKey('Light-ReflectionandRefraction', 'en')] = LIGHT_REFLECTION_REFRACTION_EN;
// RAG_CONTENT_STORE[createRagKey('Light-ReflectionandRefraction', 'hi')] = LIGHT_REFLECTION_REFRACTION_HI; // Hindi content can be added here


/**
 * Retrieves pre-generated, authentic educational content from the RAG system.
 * This ensures speed and consistency for core modules.
 * @param chapterTitle The title of the chapter.
 * @param language The language ('en' or 'hi').
 * @returns A LearningModule if found, otherwise null.
 */
export const retrieveFromRag = (chapterTitle: string, language: string): LearningModule | null => {
    const key = createRagKey(chapterTitle, language);
    return RAG_CONTENT_STORE[key] || null;
};