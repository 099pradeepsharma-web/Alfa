import { LearningModule } from '../types';

// This map simulates a Retrieval-Augmented Generation (RAG) system's database.
// Keys are formatted as `chapter-title-language`.
const RAG_CONTENT_STORE: Record<string, LearningModule> = {};

// Helper to create a consistent key
const createRagKey = (chapterTitle: string, language: string): string => {
    return `${chapterTitle}-${language}`.toLowerCase().replace(/\s+/g, '-').replace(/[&:]/g, '');
};


// --- START: Content for "The Great Transformation" Chapter ---
const THE_GREAT_TRANSFORMATION_EN: LearningModule = {
  chapterTitle: 'The Great Transformation: Navigating Your Journey from Teen to Adult',
  introduction: "Hey there! Ever feel like you're on a roller coaster you didn't even buy a ticket for? One minute, you're a kid, and the next, your body and mind are doing all sorts of new, confusing things. Welcome to the 'great transformation', a journey every single one of us goes through. It's a time of immense change, not just physically, but emotionally and mentally too.\n\nThis phase, starting around Grade 7, is when you begin to shed your childhood skin and step into a new one. It can feel awkward and a little scary, but trust us, you're not alone. The goal of this section is to help you understand what's happening to you, so you can embrace these changes, stay focused on your dreams, and emerge stronger and more confident.",
  learningObjectives: [
    "Understand the key physical, emotional, and mental changes during adolescence.",
    "Recognize that common struggles like distraction and mood swings are normal during this phase.",
    "Identify healthy coping mechanisms and strategies for managing stress and emotions.",
    "Develop a positive mindset towards personal growth and identity formation."
  ],
  keyConcepts: [
    {
      conceptTitle: 'The Science Behind the Changes',
      explanation: "So, what's really going on? Your brain is undergoing a massive rewiring. The part of your brain responsible for 'emotions and risk-taking' (the limbic system) is developing faster than the part that handles 'reasoning and decision-making' (the prefrontal cortex).\n\nThis developmental mismatch is why you might feel more intense emotions, and why sometimes, a small thing can feel like a huge deal. At the same time, your body is buzzing with hormones that are causing you to grow, change, and develop physically. Understanding this science can help you be a little kinder to yourself when you feel overwhelmed.",
      realWorldExample: "Think about why a sad song might suddenly make you feel extremely emotional, or why you might feel a sudden urge to do something risky with friends. It's often your developing emotional brain taking the lead before your reasoning brain has a chance to catch up.",
      diagramDescription: "A simple diagram of a brain. One part, labeled 'Emotional Center (Limbic System)', is shown brightly lit and larger, with a label 'Developing Fast!'. Another part, labeled 'Reasoning Center (Prefrontal Cortex)', is shown dimmer and smaller, with a label 'Still Developing'."
    },
    {
      conceptTitle: 'Case Study: A Tale of Two Students',
      explanation: "Let's meet two students, Rohan and Priya, both in Grade 9, facing similar challenges.\n\nRohan's Story: Rohan was a fantastic student, but lately, he's feeling easily distracted. He's more interested in spending time with his friends, and feels a lot of pressure to fit in. He finds himself procrastinating, and his grades are starting to slip. He feels guilty but doesn't know how to regain control.\n\nPriya's Story: Priya is experiencing mood swings. One minute she's happy and the next she's crying over something small. She feels a huge amount of pressure from her parents to do well in her exams, and is also navigating new friendships and peer groups. She feels exhausted and can't seem to focus on her studies like she used to.\n\nTheir feelings are completely normal. These aren't signs of weakness or a lack of focus; they are a direct result of the changes happening inside them. The key is to learn how to 'manage these new feelings' and channel that energy in the right direction.",
      realWorldExample: "This case study itself is a real-world example. Many students feel exactly like Rohan or Priya when they navigate school pressure, friendships, and internal changes all at once.",
      diagramDescription: "An illustration showing two students, Rohan and Priya, looking confused. Arrows point from them to icons representing 'procrastination' (a clock), 'peer pressure' (a group of people), 'mood swings' (a happy and a sad mask), and 'exam stress' (a book with a low grade). A separate arrow points towards a toolkit icon, representing the solution."
    },
    {
      conceptTitle: 'Your Toolkit for Success',
      explanation: "So, how do you navigate this? Here are four powerful tools you can use:\n\n1.  Talk it Out: Find a trusted adult—a parent, a teacher, a counselor—and talk to them. You'd be surprised how much better you'll feel just by sharing your thoughts.\n\n2.  Stay Active: Physical activity is a powerful tool to manage stress and anxiety. Whether it's playing a sport, dancing, or even just going for a walk, it helps clear your mind and boosts your mood.\n\n3.  Find Your Anchor: This is a time of exploration, but it helps to have things that ground you. This could be a hobby you love, a goal you're passionate about, or simply your personal values. When you feel overwhelmed, connect with your anchor. Take a deep breath and remind yourself of what's truly important to you.\n\n4.  Embrace Your Identity: This journey is about discovering who you are. Embrace your unique interests, strengths, and even your weaknesses. Your value isn't defined by what others think of you.",
      realWorldExample: "For example, dedicating time to a hobby like music or art ('Find Your Anchor') can be a great way to express yourself and de-stress. Or, talking to a school counselor ('Talk it Out') can give you strategies to manage the pressures you're feeling.",
      diagramDescription: "A visual toolkit with four icons inside: one for talking (two speech bubbles), one for physical activity (a person running), one for an anchor (a literal anchor), and one for identity (a simple mirror)."
    }
  ],
  summary: "This transformational journey is one of the most exciting and significant parts of your life. By understanding what's happening and using the right tools, you can not only survive it but truly thrive. Remember, every challenge you overcome now will prepare you for the even bigger goals you'll achieve in the future.",
  adaptiveStory: {
    title: "The Crossroads of Choice",
    introduction: "Alex, a Grade 9 student, is feeling overwhelmed. A big math test is tomorrow, but friends are messaging about a movie tonight. Alex feels a mix of anxiety, excitement, and pressure.",
    startNodeId: "start",
    nodes: [
        {
            id: "start",
            text: "You're staring at your math homework when your phone buzzes. It's your friends, inviting you to a movie that starts in an hour. The test is tomorrow and you haven't studied much. What do you do?",
            isEnding: false,
            choices: [
                { text: "Go to the movie. I can cram for the test later tonight.", nextNodeId: "node_movie", feedback: "It's totally normal to want to hang out with friends! Socializing is important. However, sometimes our emotional brain (wanting fun now) wins over our reasoning brain (planning for the future). This can lead to stress later on. Recognizing this is a big step!" },
                { text: "Stay home and study. I can't risk failing.", nextNodeId: "node_study_alone", feedback: "Discipline is a fantastic skill, and you should be proud of your focus! But it's also important to remember that mental well-being includes social connection. Completely isolating yourself can also lead to stress and burnout. It's all about finding a healthy balance." },
                { text: "Maybe I can find a balance?", nextNodeId: "node_balance", feedback: "This is a great start! Recognizing the need for balance and communicating your needs is a huge part of navigating these years. It shows you're thinking with both your emotional and reasoning brain. This is a super-power!" }
            ]
        },
        {
            id: "node_movie",
            text: "The movie was a blast! Laughing with friends felt great. But as the credits rolled, a wave of panic washed over you. 'The test!' you thought. You got home late, exhausted. You tried to study, but the words just blurred together. The next morning, you walked into the exam feeling unprepared and stressed.",
            isEnding: true,
            choices: []
        },
        {
            id: "node_study_alone",
            text: "You turned off your phone and forced yourself to focus. Hour after hour, you drilled math problems. You felt prepared for the test, but when you checked your phone later, you saw pictures of your friends having fun. A wave of sadness and FOMO (Fear Of Missing Out) hit you. You felt lonely and disconnected.",
            isEnding: true,
            choices: []
        },
        {
            id: "node_balance",
            text: "You took a deep breath. 'Okay,' you thought, 'there has to be a better way.' You decided to text your friends to see if there's a compromise.",
            isEnding: false,
            choices: [
                { text: "Text: \"Hey, I have a big test. Can we hang out this weekend instead?\"", nextNodeId: "node_postpone", feedback: "Excellent choice! You communicated your priorities, respected your own needs (studying), and still made time for friends. This is a fantastic example of healthy boundary-setting and planning." },
                { text: "Text: \"I can't go to the movie, but how about we all have a quick study session together?\"", nextNodeId: "node_study_group", feedback: "Amazing! You turned a stressful situation into a supportive and productive one. This shows great problem-solving and social skills. Using your friends as a support system for academics can be a powerful tool." }
            ]
        },
        {
            id: "node_postpone",
            text: "Your friends replied, 'Totally understand! Good luck! Let's definitely do something Saturday.' A feeling of relief washed over you. You were able to focus on your studies without feeling like you were missing out. You aced the test and had an amazing time with your friends that weekend.",
            isEnding: true,
            choices: []
        },
        {
            id: "node_study_group",
            text: "A few of your friends thought it was a great idea! They came over, you all worked through the tough math problems for about an hour, and then rewarded yourselves with pizza. You felt connected, supported, and prepared for the test. It was the best of both worlds!",
            isEnding: true,
            choices: []
        }
    ]
  },
  interactiveVideoSimulation: {
    title: 'Understanding Your Changing Brain',
    description: 'This simulation visually explains why you might feel more emotional or distracted during your teen years. It shows the two key parts of your brain developing at different speeds.',
    videoPrompt: 'An animated educational video for teenagers explaining brain development during adolescence. Show a simple 2D brain. Highlight the limbic system, labeling it "Emotion & Reward Center", and show it lighting up and growing rapidly. Then, highlight the prefrontal cortex, labeling it "Planning & Decision-Making Center", and show it developing more slowly with a "Still Under Construction" sign. Use friendly visuals and a calm, reassuring tone.'
  }
};

const THE_GREAT_TRANSFORMATION_HI: LearningModule = {
  chapterTitle: 'महान परिवर्तन: किशोर से वयस्क तक की आपकी यात्रा',
  introduction: "नमस्ते! क्या आपको कभी ऐसा महसूस होता है कि आप एक ऐसी रोलर कोस्टर पर हैं जिसका टिकट भी आपने नहीं खरीदा? एक पल आप बच्चे होते हैं, और अगले ही पल, आपका शरीर और दिमाग हर तरह की नई, भ्रमित करने वाली चीजें करने लगते हैं। 'महान परिवर्तन' में आपका स्वागत है, एक ऐसी यात्रा जिससे हम में से हर एक गुजरता है। यह न केवल शारीरिक रूप से, बल्कि भावनात्मक और मानसिक रूप से भी भारी बदलाव का समय है।\n\nयह चरण, जो लगभग कक्षा 7 से शुरू होता है, वह समय है जब आप अपनी बचपन की त्वचा को उतारना शुरू करते हैं और एक नई त्वचा में कदम रखते हैं। यह अजीब और थोड़ा डरावना महसूस हो सकता है, लेकिन हम पर विश्वास करें, आप अकेले नहीं हैं। इस खंड का लक्ष्य आपको यह समझने में मदद करना है कि आपके साथ क्या हो रहा है, ताकि आप इन परिवर्तनों को अपना सकें, अपने सपनों पर ध्यान केंद्रित रख सकें, और मजबूत और अधिक आत्मविश्वासी बनकर उभर सकें।",
  learningObjectives: [
    "किशोरावस्था के दौरान होने वाले प्रमुख शारीरिक, भावनात्मक और मानसिक परिवर्तनों को समझना।",
    "यह पहचानना कि ध्यान भटकना और मिजाज में बदलाव जैसी आम मुश्किलें इस चरण में सामान्य हैं।",
    "तनाव और भावनाओं के प्रबंधन के लिए स्वस्थ मुकाबला तंत्र और रणनीतियों की पहचान करना।",
    "व्यक्तिगत विकास और पहचान निर्माण के प्रति सकारात्मक मानसिकता विकसित करना।"
  ],
  keyConcepts: [
    {
      conceptTitle: 'परिवर्तनों के पीछे का विज्ञान',
      explanation: "तो, वास्तव में क्या हो रहा है? आपके मस्तिष्क में एक बड़ा पुनर्विन्यास हो रहा है। आपके मस्तिष्क का वह हिस्सा जो 'भावनाओं और जोखिम लेने' (लिम्बिक सिस्टम) के लिए जिम्मेदार है, वह उस हिस्से की तुलना में तेजी से विकसित हो रहा है जो 'तर्क और निर्णय लेने' (प्रीफ्रंटल कॉर्टेक्स) का काम करता है।\n\nयह विकासात्मक असंतुलन ही कारण है कि आप अधिक तीव्र भावनाएं महसूस कर सकते हैं, और क्यों कभी-कभी, एक छोटी सी बात बहुत बड़ी बात महसूस हो सकती है। साथ ही, आपका शरीर भी हार्मोन से गुलजार है जो आपको शारीरिक रूप से बढ़ने, बदलने और विकसित होने का कारण बन रहे हैं। इस विज्ञान को समझने से आपको अभिभूत महसूस होने पर खुद के प्रति थोड़ा दयालु होने में मदद मिल सकती है।",
      realWorldExample: "सोचिए कि कोई उदास गीत अचानक आपको बहुत भावुक क्यों कर सकता है, या दोस्तों के साथ कुछ जोखिम भरा करने की अचानक इच्छा क्यों होती है। यह अक्सर आपका विकसित हो रहा भावनात्मक मस्तिष्क होता है जो आपके तर्कसंगत मस्तिष्क को पकड़ने का मौका मिलने से पहले ही नेतृत्व कर लेता है।",
      diagramDescription: "मस्तिष्क का एक सरल चित्र। एक भाग, जिसे 'भावनात्मक केंद्र (लिम्बिक सिस्टम)' कहा जाता है, को उज्ज्वल रूप से प्रकाशित और बड़ा दिखाया गया है, जिस पर 'तेजी से विकसित हो रहा है!' का लेबल लगा है। दूसरा भाग, जिसे 'तर्क केंद्र (प्रीफ्रंटल कॉर्टेक्स)' कहा जाता है, को धुंधला और छोटा दिखाया गया है, जिस पर 'अभी भी विकसित हो रहा है' का लेबल लगा है।"
    },
    {
      conceptTitle: 'केस स्टडी: दो छात्रों की कहानी',
      explanation: "आइए दो छात्रों, रोहन और प्रिया से मिलते हैं, दोनों कक्षा 9 में हैं, जो समान चुनौतियों का सामना कर रहे हैं।\n\nरोहन की कहानी: रोहन एक शानदार छात्र था, लेकिन हाल ही में, वह आसानी से विचलित महसूस कर रहा है। वह अपने दोस्तों के साथ समय बिताने में अधिक रुचि रखता है, और फिट होने के लिए बहुत दबाव महसूस करता है। वह खुद को टालमटोल करते हुए पाता है है, और उसके ग्रेड गिरने लगे हैं। वह दोषी महसूस करता है लेकिन यह नहीं जानता कि नियंत्रण कैसे वापस पाया जाए।\n\nप्रिया की कहानी: प्रिया के मिजाज में उतार-चढ़ाव हो रहा है। एक पल वह खुश होती है और अगले ही पल वह किसी छोटी सी बात पर रोने लगती है। वह अपनी परीक्षाओं में अच्छा करने के लिए अपने माता-पिता से बहुत अधिक दबाव महसूस करती है, और नई दोस्ती और सहकर्मी समूहों को भी नेविगेट कर रही है। वह थका हुआ महसूस करती है और अपनी पढ़ाई पर पहले की तरह ध्यान केंद्रित नहीं कर पाती है।\n\nउनकी भावनाएं पूरी तरह से सामान्य हैं। ये कमजोरी या ध्यान की कमी के संकेत नहीं हैं; वे उनके अंदर हो रहे परिवर्तनों का प्रत्यक्ष परिणाम हैं। कुंजी यह सीखना है कि 'इन नई भावनाओं को कैसे प्रबंधित किया जाए' और उस ऊर्जा को सही दिशा में कैसे लगाया जाए।",
      realWorldExample: "यह केस स्टडी अपने आप में एक वास्तविक दुनिया का उदाहरण है। बहुत से छात्र स्कूल के दबाव, दोस्ती और आंतरिक परिवर्तनों को एक साथ नेविगेट करते समय बिल्कुल रोहन या प्रिया जैसा महसूस करते हैं।",
      diagramDescription: "एक चित्रण जिसमें दो छात्र, रोहन और प्रिया, भ्रमित दिख रहे हैं। तीर उनसे 'टालमटोल' (एक घड़ी), 'सहकर्मी दबाव' (लोगों का एक समूह), 'मिजाज में बदलाव' (एक खुश और एक उदास मुखौटा), और 'परीक्षा तनाव' (कम ग्रेड वाली एक किताब) का प्रतिनिधित्व करने वाले आइकन की ओर इशारा करते हैं। एक अलग तीर समाधान का प्रतिनिधित्व करने वाले एक टूलकिट आइकन की ओर इशारा करता है।"
    },
    {
      conceptTitle: 'आपकी सफलता की टूलकिट',
      explanation: "तो, आप इसे कैसे संभालते हैं? यहाँ चार शक्तिशाली उपकरण दिए गए हैं जिनका आप उपयोग कर सकते हैं:\n\n1.  बात करें: किसी विश्वसनीय वयस्क से बात करें—एक माता-पिता, एक शिक्षक, एक परामर्शदाता। आप केवल अपने विचार साझा करके कितना बेहतर महसूस करेंगे, इस पर आपको आश्चर्य होगा।\n\n2.  सक्रिय रहें: शारीरिक गतिविधि तनाव और चिंता को प्रबंधित करने का एक शक्तिशाली उपकरण है। चाहे वह कोई खेल खेलना हो, नृत्य करना हो, या सिर्फ टहलने जाना हो, यह आपके दिमाग को साफ करने और आपके मूड को बेहतर बनाने में मदद करता है।\n\n3.  अपना एंकर खोजें: यह खोज का समय है, लेकिन ऐसी चीजें रखना मददगार होता है जो आपको स्थिर रखती हैं। यह आपका कोई पसंदीदा शौक हो सकता है, कोई ऐसा लक्ष्य जिसके प्रति आप जुनूनी हों, या बस आपके व्यक्तिगत मूल्य। जब आप अभिभूत महसूस करें, तो अपने एंकर से जुड़ें। एक गहरी सांस लें और खुद को याद दिलाएं कि आपके लिए वास्तव में क्या महत्वपूर्ण है।\n\n4.  अपनी पहचान को अपनाएं: यह यात्रा यह खोजने के बारे में है कि आप कौन हैं। अपनी अनूठी रुचियों, शक्तियों और यहां तक कि अपनी कमजोरियों को भी अपनाएं। आपका मूल्य इस बात से परिभाषित नहीं होता है कि दूसरे आपके बारे में क्या सोचते हैं।",
      realWorldExample: "उदाहरण के लिए, संगीत या कला जैसे किसी शौक के लिए समय समर्पित करना ('अपना एंकर खोजें') खुद को अभिव्यक्त करने और तनाव दूर करने का एक शानदार तरीका हो सकता है। या, एक स्कूल परामर्शदाता से बात करना ('बात करें') आपको महसूस हो रहे दबावों को प्रबंधित करने के लिए रणनीतियाँ दे सकता है।",
      diagramDescription: "एक दृश्य टूलकिट जिसके अंदर चार आइकन हैं: बात करने के लिए एक (दो भाषण बुलबुले), शारीरिक गतिविधि के लिए एक (एक दौड़ता हुआ व्यक्ति), एक एंकर के लिए एक (एक शाब्दिक एंकर), और पहचान के लिए एक (एक साधारण दर्पण)।"
    }
  ],
  summary: "यह परिवर्तनकारी यात्रा आपके जीवन के सबसे रोमांचक और महत्वपूर्ण हिस्सों में से एक है। क्या हो रहा है, यह समझकर और सही उपकरणों का उपयोग करके, आप न केवल इससे बच सकते हैं, बल्कि वास्तव में फल-फूल सकते हैं। याद रखें, अब आप जिस भी चुनौती को पार करते हैं, वह आपको भविष्य में प्राप्त होने वाले और भी बड़े लक्ष्यों के लिए तैयार करेगी।",
  adaptiveStory: {
    title: "चुनाव का चौराहा",
    introduction: "आरव, एक 9वीं कक्षा का छात्र, अभिभूत महसूस कर रहा है। कल एक बड़ी गणित की परीक्षा है, लेकिन दोस्त आज रात एक फिल्म के बारे में संदेश भेज रहे हैं। आरव चिंता, उत्साह और दबाव का मिश्रण महसूस करता है।",
    startNodeId: "start",
    nodes: [
        {
            id: "start",
            text: "आप अपने गणित के होमवर्क को घूर रहे हैं जब आपका फोन बजता है। यह आपके दोस्त हैं, जो आपको एक घंटे में शुरू होने वाली फिल्म के लिए आमंत्रित कर रहे हैं। परीक्षा कल है और आपने ज्यादा पढ़ाई नहीं की है। आप क्या करते हैं?",
            isEnding: false,
            choices: [
                { text: "फिल्म देखने जाता हूँ। मैं आज रात बाद में परीक्षा के लिए रट्टा मार सकता हूँ।", nextNodeId: "node_movie", feedback: "दोस्तों के साथ घूमना पूरी तरह से सामान्य है! सामाजिक मेलजोल महत्वपूर्ण है। हालांकि, कभी-कभी हमारा भावनात्मक मस्तिष्क (अभी मज़ा करना चाहता है) हमारे तर्क मस्तिष्क (भविष्य के लिए योजना बनाना) पर जीत जाता है। इससे बाद में तनाव हो सकता है। इसे पहचानना एक बड़ा कदम है!" },
                { text: "घर पर रहकर पढ़ाई करता हूँ। मैं फेल होने का जोखिम नहीं उठा सकता।", nextNodeId: "node_study_alone", feedback: "अनुशासन एक शानदार कौशल है, और आपको अपने ध्यान पर गर्व होना चाहिए! लेकिन यह याद रखना भी महत्वपूर्ण है कि मानसिक कल्याण में सामाजिक संबंध भी शामिल हैं। खुद को पूरी तरह से अलग करना भी तनाव और बर्नआउट का कारण बन सकता है। यह सब एक स्वस्थ संतुलन खोजने के बारे में है।" },
                { text: "शायद मैं संतुलन बना सकता हूँ?", nextNodeId: "node_balance", feedback: "यह एक शानदार शुरुआत है! संतुलन की आवश्यकता को पहचानना और अपनी जरूरतों को संप्रेषित करना इन वर्षों को नेविगेट करने का एक बड़ा हिस्सा है। यह दर्शाता है कि आप अपने भावनात्मक और तर्क दोनों मस्तिष्क से सोच रहे हैं। यह एक सुपर-पावर है!" }
            ]
        },
        {
            id: "node_movie",
            text: "फिल्म शानदार थी! दोस्तों के साथ हंसना बहुत अच्छा लगा। लेकिन जैसे ही क्रेडिट रोल हुए, आप पर घबराहट की एक लहर दौड़ गई। 'परीक्षा!' आपने सोचा। आप देर से घर पहुंचे, थके हुए। आपने पढ़ने की कोशिश की, लेकिन शब्द बस धुंधले हो गए। अगली सुबह, आप बिना तैयारी और तनाव महसूस करते हुए परीक्षा में गए।",
            isEnding: true,
            choices: []
        },
        {
            id: "node_study_alone",
            text: "आपने अपना फोन बंद कर दिया और खुद को ध्यान केंद्रित करने के लिए मजबूर किया। घंटे दर घंटे, आपने गणित की समस्याओं का अभ्यास किया। आपने परीक्षा के लिए तैयार महसूस किया, लेकिन जब आपने बाद में अपना फोन देखा, तो आपने अपने दोस्तों की मौज-मस्ती की तस्वीरें देखीं। आप पर उदासी और FOMO (कुछ छूट जाने का डर) की एक लहर दौड़ गई। आपने अकेला और अलग-थलग महसूस किया।",
            isEnding: true,
            choices: []
        },
        {
            id: "node_balance",
            text: "आपने एक गहरी साँस ली। 'ठीक है,' आपने सोचा, 'कोई बेहतर तरीका होना चाहिए।' आपने अपने दोस्तों को यह देखने के लिए टेक्स्ट करने का फैसला किया कि क्या कोई समझौता हो सकता है।",
            isEnding: false,
            choices: [
                { text: "टेक्स्ट: \"अरे, मेरी एक बड़ी परीक्षा है। क्या हम इसके बजाय इस सप्ताह के अंत में मिल सकते हैं?\"", nextNodeId: "node_postpone", feedback: "उत्कृष्ट विकल्प! आपने अपनी प्राथमिकताओं को संप्रेषित किया, अपनी जरूरतों (पढ़ाई) का सम्मान किया, और फिर भी दोस्तों के लिए समय निकाला। यह स्वस्थ सीमा-निर्धारण और योजना का एक शानदार उदाहरण है।" },
                { text: "टेक्स्ट: \"मैं फिल्म देखने नहीं जा सकता, लेकिन क्या हम सब मिलकर एक छोटा अध्ययन सत्र कर सकते हैं?\"", nextNodeId: "node_study_group", feedback: "अद्भुत! आपने एक तनावपूर्ण स्थिति को एक सहायक और उत्पादक स्थिति में बदल दिया। यह महान समस्या-समाधान और सामाजिक कौशल दिखाता है। शिक्षाविदों के लिए अपने दोस्तों को एक समर्थन प्रणाली के रूप में उपयोग करना एक शक्तिशाली उपकरण हो सकता है।" }
            ]
        },
        {
            id: "node_postpone",
            text: "आपके दोस्तों ने जवाब दिया, 'पूरी तरह से समझते हैं! शुभकामनाएँ! चलो निश्चित रूप से शनिवार को कुछ करते हैं।' आप पर राहत की भावना छा गई। आप बिना यह महसूस किए कि आप कुछ खो रहे हैं, अपनी पढ़ाई पर ध्यान केंद्रित करने में सक्षम थे। आपने परीक्षा में उत्कृष्ट प्रदर्शन किया और उस सप्ताहांत अपने दोस्तों के साथ एक अद्भुत समय बिताया।",
            isEnding: true,
            choices: []
        },
        {
            id: "node_study_group",
            text: "आपके कुछ दोस्तों को यह एक अच्छा विचार लगा! वे घर आए, आप सभी ने लगभग एक घंटे तक कठिन गणित की समस्याओं पर काम किया, और फिर पिज्जा के साथ खुद को पुरस्कृत किया। आपने जुड़ा हुआ, समर्थित और परीक्षा के लिए तैयार महसूस किया। यह दोनों दुनिया का सबसे अच्छा था!",
            isEnding: true,
            choices: []
        }
    ]
  },
  interactiveVideoSimulation: {
    title: 'अपने बदलते मस्तिष्क को समझना',
    description: 'यह सिमुलेशन नेत्रहीन रूप से बताता है कि आप अपनी किशोरावस्था के दौरान अधिक भावनात्मक या विचलित क्यों महसूस कर सकते हैं। यह आपके मस्तिष्क के दो प्रमुख हिस्सों को अलग-अलग गति से विकसित होते हुए दिखाता है।',
    videoPrompt: 'किशोरों के लिए यौवन के दौरान मस्तिष्क के विकास की व्याख्या करने वाला एक एनिमेटed शैक्षिक वीडियो। एक सरल 2D मस्तिष्क दिखाएं। लिम्बिक सिस्टम को हाइलाइट करें, इसे "भावना और पुरस्कार केंद्र" के रूप में लेबल करें, और इसे तेजी से रोशन और बढ़ते हुए दिखाएं। फिर, प्रीफ्रंटल कॉर्टेक्स को हाइलाइट करें, इसे "योजना और निर्णय लेने वाला केंद्र" के रूप में लेबल करें, और इसे "अभी भी निर्माणाधीन" चिह्न के साथ अधिक धीरे-धीरे विकसित होते हुए दिखाएं। मैत्रीपूर्ण दृश्यों और एक शांत, आश्वस्त स्वर का उपयोग करें।'
  }
};
// --- END: Content for "The Great Transformation" Chapter ---


// Populate the store
RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'en')] = THE_GREAT_TRANSFORMATION_EN;
RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'hi')] = THE_GREAT_TRANSFORMATION_HI;


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
