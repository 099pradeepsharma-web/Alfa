

import { LearningModule } from '../types';

// This file simulates a Retrieval-Augmented Generation (RAG) system.
// In a real-world scenario, this content would be stored in a vector database
// and retrieved based on semantic similarity to a query. For this app,
// we use a simple key-value store to hold pre-generated, high-quality content
// for specific chapters, bypassing the need for live generation for these topics.

const LIGHT_REFLECTION_REFRACTION_EN: LearningModule = {
    chapterTitle: "Light: Reflection and Refraction",
    missionBriefing: [
        {
            triggerType: 'paradoxicalQuestion',
            title: "Why does a spoon look bent in a glass of water?",
            description: "It's an illusion that reveals a fundamental property of light. This mission will uncover the secrets behind this everyday magic.",
            pushNotification: "Ever seen a broken spoon in a glass of water? It's not magic, it's physics! ✨"
        },
        {
            triggerType: 'realWorldVideo',
            title: "The Science of Invisibility",
            description: "A short, engaging video showing how scientists use the principles of refraction with special materials (metamaterials) to bend light around an object, making it appear invisible.",
            pushNotification: "Did you know invisibility is REAL science? It all starts with how light bends..."
        }
    ],
    coreConceptTraining: [
        {
            title: "Reflection of Light and Spherical Mirrors",
            explanation: `
## The Phenomenon of Reflection
When light hits a polished surface, like a mirror, it bounces back. This is called <u>reflection</u>.

- **Laws of Reflection:**
- The angle of incidence (∠i) is equal to the angle of reflection (∠r).
- The incident ray, the normal to the mirror at the point of incidence, and the reflected ray, all lie in the same plane.

[DIAGRAM: A simple diagram showing the law of reflection on a plane mirror, with incident ray, reflected ray, normal, angle of incidence (i), and angle of reflection (r) clearly labeled.]

### Spherical Mirrors
Unlike plane mirrors, spherical mirrors have a curved reflecting surface. They can be concave or convex.

> [!KEY] Concave Mirror: A spherical mirror whose reflecting surface is curved inwards. It's a <u>converging mirror</u>.
> [!KEY] Convex Mirror: A spherical mirror whose reflecting surface is curved outwards. It's a <u>diverging mirror</u>.

**Key Terms for Spherical Mirrors:**
- <u>Pole (P)</u>: The center of the reflecting surface.
- <u>Center of Curvature (C)</u>: The center of the sphere of which the mirror is a part.
- <u>Radius of Curvature (R)</u>: The radius of the sphere.
- <u>Principal Axis</u>: The straight line passing through the Pole and the Center of Curvature.
- <u>Principal Focus (F)</u>: The point on the principal axis where rays parallel to the axis converge (concave) or appear to diverge from (convex) after reflection.
- <u>Focal Length (f)</u>: The distance between the Pole and the Principal Focus. Relationship: <u>f = R/2</u>.

[DIAGRAM: A clear diagram of a concave mirror and a convex mirror on separate halves, showing the Pole (P), Focus (F), Center of Curvature (C), and Principal Axis for each.]
            `,
            knowledgeCheck: [
                {
                    question: "The focal length of a spherical mirror is 20 cm. What is its radius of curvature?",
                    options: ["10 cm", "20 cm", "40 cm", "80 cm"],
                    correctAnswer: "40 cm",
                    explanation: "The radius of curvature (R) is twice the focal length (f). So, R = 2 * f = 2 * 20 cm = 40 cm.",
                    conceptTitle: "Reflection of Light and Spherical Mirrors"
                },
                {
                    question: "Which type of mirror is known as a diverging mirror?",
                    options: ["Plane mirror", "Concave mirror", "Convex mirror", "Parabolic mirror"],
                    correctAnswer: "Convex mirror",
                    explanation: "A convex mirror's outer surface reflects light, causing parallel rays to spread out or diverge as if from a focal point behind the mirror.",
                    conceptTitle: "Reflection of Light and Spherical Mirrors"
                }
            ]
        },
        {
            title: "Image Formation by Spherical Mirrors & Mirror Formula",
            explanation: `
## Ray Diagrams for Image Formation
To find the position and nature of the image formed by a spherical mirror, we can draw ray diagrams using at least two of the following rays:
1.  A ray parallel to the principal axis, after reflection, will pass through the principal focus (concave) or appear to diverge from it (convex).
2.  A ray passing through the principal focus (concave) or directed towards it (convex) will emerge parallel to the principal axis after reflection.
3.  A ray passing through the center of curvature (concave) or directed towards it (convex) will reflect back along the same path.

| Object Position (Concave) | Image Position      | Image Nature                 |
|---------------------------|---------------------|------------------------------|
| At infinity               | At F                | Real, inverted, point-sized  |
| Beyond C                  | Between F and C     | Real, inverted, diminished   |
| At C                      | At C                | Real, inverted, same size    |
| Between C and F           | Beyond C            | Real, inverted, enlarged     |
| At F                      | At infinity         | Real, inverted, huge         |
| Between P and F           | Behind the mirror   | Virtual, erect, enlarged     |

> [!NOTE] Convex mirrors always form a <u>virtual, erect, and diminished</u> image, regardless of the object's position. This is why they are used as rear-view mirrors in vehicles.

### The Mirror Formula and Magnification
The relationship between object distance (u), image distance (v), and focal length (f) is given by the <u>Mirror Formula</u>:
\`1/v + 1/u = 1/f\`

**Sign Convention (New Cartesian Sign Convention):**
- The pole (P) is the origin.
- The principal axis is the x-axis.
- Distances are measured from the pole.
- Distances in the direction of incident light are positive (+).
- Distances against the direction of incident light are negative (-).
- Heights above the principal axis are positive (+).
- Heights below the principal axis are negative (-).

> [!EXAMPLE] For a concave mirror, u is always negative. f is negative. v is negative for real images and positive for virtual images.

<u>Magnification (m)</u> is the ratio of the height of the image (h') to the height of the object (h).
m = h'/h = -v/u
- If m is negative, the image is real and inverted.
- If m is positive, the image is virtual and erect.
- If |m| > 1, the image is enlarged.
- If |m| < 1, the image is diminished.
- If |m| = 1, the image is the same size.
            `,
            knowledgeCheck: [
                {
                    question: "An object is placed at the center of curvature of a concave mirror. The image formed will be:",
                    options: ["At focus, real and inverted", "At infinity, real and inverted", "At the center of curvature, real and inverted", "Behind the mirror, virtual and erect"],
                    correctAnswer: "At the center of curvature, real and inverted",
                    explanation: "When an object is placed at 'C' of a concave mirror, a real, inverted image of the same size is formed at 'C' itself.",
                    conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
                },
                {
                    question: "A convex mirror is used as a rear-view mirror in cars because:",
                    options: ["It forms real images", "It has a wide field of view", "It forms magnified images", "It does not invert the image"],
                    correctAnswer: "It has a wide field of view",
                    explanation: "Convex mirrors are diverging mirrors that provide a wider field of view, allowing the driver to see more of the traffic behind them. They also always form erect and diminished images.",
                    conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
                }
            ]
        },
        {
            title: "Refraction of Light and Refractive Index",
            explanation: `
## The Phenomenon of Refraction
When light travels from one transparent medium to another, it changes its direction. This phenomenon is called <u>refraction of light</u>. Refraction occurs because the <u>speed of light is different</u> in different media.

- When light enters a denser medium from a rarer medium, it bends <u>towards the normal</u>.
- When light enters a rarer medium from a denser medium, it bends <u>away from the normal</u>.

[DIAGRAM: Refraction through a rectangular glass slab, showing the incident ray, refracted ray, emergent ray, and the lateral displacement.]

### Laws of Refraction
1.  The incident ray, the refracted ray, and the normal to the interface of two transparent media at the point of incidence, all lie in the same plane.
2.  **Snell's Law:** The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant, for the light of a given color and for the given pair of media.
    <u>sin i / sin r = constant</u> (n₂₁)

### Refractive Index
This constant value is called the <u>refractive index</u> of the second medium with respect to the first.
n₂₁ = Speed of light in medium 1 / Speed of light in medium 2 = v₁ / v₂

The <u>absolute refractive index</u> (n) of a medium is the ratio of the speed of light in vacuum (c) to the speed of light in that medium (v).
<u>n = c / v</u>

> [!NOTE] The refractive index of diamond is the highest (approx 2.42), which is why it sparkles so much due to total internal reflection.
            `,
            knowledgeCheck: [
                {
                    question: "Why does a swimming pool appear shallower than it actually is?",
                    options: ["Reflection", "Dispersion", "Refraction", "Scattering"],
                    correctAnswer: "Refraction",
                    explanation: "Light rays from the bottom of the pool bend away from the normal as they travel from water (denser) to air (rarer) before reaching our eyes. Our brain traces these rays back in a straight line, making the bottom appear raised.",
                    conceptTitle: "Refraction of Light and Refractive Index"
                },
                {
                    question: "The refractive index of water is 1.33 and glass is 1.5. In which medium does light travel faster?",
                    options: ["Water", "Glass", "Same speed in both", "Cannot be determined"],
                    correctAnswer: "Water",
                    explanation: "Refractive index is inversely proportional to the speed of light in the medium (n = c/v). A lower refractive index means a higher speed. Since 1.33 < 1.5, light travels faster in water.",
                    conceptTitle: "Refraction of Light and Refractive Index"
                }
            ]
        }
    ],
    practiceArena: {
        problems: [
            {
                level: 'Level 1: NCERT Basics',
                problemStatement: "A concave mirror produces a real image three times magnified when an object is placed at a distance of 10 cm from it. Where is the image located?",
                solution: `
Given:
- Magnification, m = -3 (real image is inverted)
- Object distance, u = -10 cm

We know, m = -v/u
=> -3 = -v / (-10)
=> -3 = v / 10
=> v = -30 cm

The image is located 30 cm in front of the mirror.
                `
            },
            {
                level: 'Level 2: Reference Application',
                problemStatement: "Light enters from air to a glass plate having a refractive index of 1.50. What is the speed of light in the glass? The speed of light in a vacuum is 3 x 10⁸ m/s.",
                solution: `
Given:
- Refractive index of glass, n = 1.50
- Speed of light in vacuum, c = 3 x 10⁸ m/s

We know the formula for absolute refractive index is n = c / v, where v is the speed of light in the medium.
=> v = c / n
=> v = (3 x 10⁸ m/s) / 1.50
=> v = 2 x 10⁸ m/s

The speed of light in the glass is 2 x 10⁸ m/s.
                `
            },
            {
                level: 'Level 3: Competitive Challenge',
                problemStatement: "An object is placed 20 cm from a convex mirror of focal length 15 cm. Find the position and nature of the image.",
                solution: `
Given:
- Object distance, u = -20 cm (always negative)
- Focal length, f = +15 cm (convex mirror has positive focal length)

Using the mirror formula: 1/v + 1/u = 1/f
=> 1/v = 1/f - 1/u
=> 1/v = 1/15 - 1/(-20)
=> 1/v = 1/15 + 1/20
=> 1/v = (4 + 3) / 60
=> 1/v = 7 / 60
=> v = 60 / 7 ≈ +8.57 cm

The image is formed 8.57 cm behind the mirror (since v is positive).

Now for magnification:
m = -v/u
=> m = -(8.57) / (-20)
=> m ≈ +0.428

Nature of the image:
- Since v is positive, the image is <u>virtual</u>.
- Since m is positive, the image is <u>erect</u>.
- Since |m| < 1, the image is <u>diminished</u>.
                `
            }
        ]
    },
    practicalApplicationLab: {
        type: 'project',
        title: "Build a Simple Periscope",
        description: "Apply the laws of reflection to see over obstacles!",
        labInstructions: `
- Take a long cardboard box (like from a tube light or kitchen foil).
- Cut two square holes on opposite sides, one at the top and one at the bottom.
- Create two slots at a 45° angle inside the box near each hole.
- Insert two small, flat mirrors into the slots, ensuring they are parallel to each other.
- Seal the box and look through the bottom hole. You should be able to see through the top hole!
- **Observation:** Explain how the laws of reflection make this work. Draw the path of light through your periscope.
        `
    },
    bossFight: [
        {
            question: "To get an image larger than the object, one can use:",
            options: ["a convex mirror but not a concave mirror", "a concave mirror but not a convex mirror", "either a convex or a concave mirror", "a plane mirror"],
            correctAnswer: "a concave mirror but not a convex mirror",
            explanation: "Convex mirrors always produce diminished images. Concave mirrors can produce enlarged images when the object is placed between C and P.",
            conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
        },
        {
            question: "A light ray travels from a medium of refractive index n1 to a medium of refractive index n2. If the angle of incidence is i and the angle of refraction is r, then sin(i)/sin(r) is equal to:",
            options: ["n1", "n2", "n2 / n1", "n1 / n2"],
            correctAnswer: "n2 / n1",
            explanation: "According to Snell's Law, n1 * sin(i) = n2 * sin(r). Rearranging this gives sin(i)/sin(r) = n2/n1.",
            conceptTitle: "Refraction of Light and Refractive Index"
        },
         {
            question: "Where should an object be placed in front of a concave mirror to produce a real, inverted image of the same size?",
            options: ["At the pole", "At the focus", "At the center of curvature", "Between focus and center of curvature"],
            correctAnswer: "At the center of curvature",
            explanation: "Placing an object at 'C' results in a real, inverted image of the same size also at 'C'.",
            conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
        },
        {
            question: "The power of a lens is -2.0 D. What is its focal length and what type of lens is it?",
            options: ["-50 cm, Convex", "+50 cm, Concave", "-50 cm, Concave", "+50 cm, Convex"],
            correctAnswer: "-50 cm, Concave",
            explanation: "Power (P) = 1/f(in m). So, f = 1/P = 1/(-2.0) = -0.5 m = -50 cm. A negative focal length indicates a concave lens.",
            conceptTitle: "Refraction of Light and Refractive Index" // Assuming lens concepts are grouped here
        },
        {
            question: "Magnification produced by a plane mirror is always:",
            options: ["Less than 1", "Greater than 1", "+1", "-1"],
            correctAnswer: "+1",
            explanation: "A plane mirror produces a virtual, erect image of the same size as the object. So magnification is +1.",
            conceptTitle: "Reflection of Light and Spherical Mirrors"
        },
        {
            question: "The speed of light is maximum in:",
            options: ["Water", "Glass", "Vacuum", "Diamond"],
            correctAnswer: "Vacuum",
            explanation: "Light travels fastest in a vacuum where there is no medium to slow it down. Its speed is approximately 3 x 10⁸ m/s.",
            conceptTitle: "Refraction of Light and Refractive Index"
        },
        {
            question: "A dentist uses a mirror to examine a small cavity. This mirror is likely a:",
            options: ["Concave mirror", "Convex mirror", "Plane mirror", "A combination of concave and convex"],
            correctAnswer: "Concave mirror",
            explanation: "A dentist needs a magnified, erect image of the tooth. A concave mirror provides this when the object (tooth) is placed between the pole and the focus.",
            conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
        },
        {
            question: "What is the unit of refractive index?",
            options: ["meter", "radian", "dioptre", "It has no units"],
            correctAnswer: "It has no units",
            explanation: "Refractive index is a ratio of the speed of light in two different media, so the units cancel out, making it a dimensionless quantity.",
            conceptTitle: "Refraction of Light and Refractive Index"
        },
         {
            question: "If an object is placed at the focus of a concave mirror, the image is formed at:",
            options: ["The focus", "The center of curvature", "Infinity", "The pole"],
            correctAnswer: "Infinity",
            explanation: "Rays originating from the focus become parallel to the principal axis after reflection, forming an image at infinity.",
            conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
        },
        {
            question: "An object of height 5 cm is placed 20 cm in front of a concave mirror of focal length 15 cm. What is the height of the image?",
            options: ["-15 cm", "-10 cm", "10 cm", "15 cm"],
            correctAnswer: "-15 cm",
            explanation: "Using mirror formula 1/v + 1/u = 1/f, 1/v = 1/(-15) - 1/(-20) => v=-60cm. Magnification m = -v/u = -(-60)/(-20) = -3. Image height h' = m * h = -3 * 5cm = -15cm.",
            conceptTitle: "Image Formation by Spherical Mirrors & Mirror Formula"
        }
    ]
};

// This is the "database" of pre-generated content.
// Keys are [language_code][chapter_title]
const RAG_CONTENT_STORE: { [key: string]: { [key: string]: LearningModule } } = {
  'en': {
    'Light: Reflection and Refraction': LIGHT_REFLECTION_REFRACTION_EN,
  },
  // 'hi': { ... } can be added later for Hindi content
};

/**
 * Retrieves pre-generated, high-quality content for a specific chapter if it exists.
 * This simulates a RAG system by looking up content in a pre-defined store.
 * @param chapterTitle The title of the chapter to retrieve.
 * @param language The language code ('en', 'hi', etc.).
 * @returns A LearningModule object or null if no pre-generated content is found.
 */
export const retrieveFromRag = (chapterTitle: string, language: string): LearningModule | null => {
  const langStore = RAG_CONTENT_STORE[language];
  if (langStore) {
    return langStore[chapterTitle] || null;
  }
  return null;
};