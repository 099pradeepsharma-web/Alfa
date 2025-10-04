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
      explanation: "आइए दो छात्रों, रोहन और प्रिया से मिलते हैं, दोनों कक्षा 9 में हैं, जो समान चुनौतियों का सामना कर रहे हैं।\n\nरोहन की कहानी: रोहन एक शानदार छात्र था, लेकिन हाल ही में, वह आसानी से विचलित महसूस कर रहा है। वह अपने दोस्तों के साथ समय बिताने में अधिक रुचि रखता है, और फिट होने के लिए बहुत दबाव महसूस करता है। वह खुद को टालमटोल करते हुए पाता है है, और उसके ग्रेड गिरने लगे हैं। वह दोषी महसूस करता है लेकिन यह नहीं जानता कि नियंत्रण कैसे वापस पाया जाए।\n\nPriya's Story: प्रिया के मिजाज में उतार-चढ़ाव हो रहा है। एक पल वह खुश होती है और अगले ही पल वह किसी छोटी सी बात पर रोने लगती है। वह अपनी परीक्षाओं में अच्छा करने के लिए अपने माता-पिता से बहुत अधिक दबाव महसूस करती है, और नई दोस्ती और सहकर्मी समूहों को भी नेविगेट कर रही है। वह थका हुआ महसूस करती है और अपनी पढ़ाई पर पहले की तरह ध्यान केंद्रित नहीं कर पाती है।\n\nउनकी भावनाएं पूरी तरह से सामान्य हैं। ये कमजोरी या ध्यान की कमी के संकेत नहीं हैं; वे उनके अंदर हो रहे परिवर्तनों का प्रत्यक्ष परिणाम हैं। कुंजी यह सीखना है कि 'इन नई भावनाओं को कैसे प्रबंधित किया जाए' और उस ऊर्जा को सही दिशा में कैसे लगाया जाए।",
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

// --- START: New Content for "Light: Reflection and Refraction" ---
const LIGHT_REFLECTION_REFRACTION_EN: LearningModule = {
    chapterTitle: "Light: Reflection and Refraction",
    introduction: "Ever wondered how a simple mirror shows your reflection, or why a pencil in a glass of water looks bent? These everyday magic tricks are all thanks to the fascinating properties of light! In this chapter, we'll embark on an illuminating journey to explore two fundamental phenomena: 'reflection', how light bounces off surfaces, and 'refraction', how it bends when passing from one medium to another. From the secrets of spherical mirrors used in cars and telescopes to the principles behind lenses that correct our vision, you'll uncover the science that governs how we see the world. Get ready to have your perspective on light completely transformed!",
    learningObjectives: [
        "Understand and apply the laws of reflection.",
        "Differentiate between concave and convex mirrors and their uses.",
        "Construct ray diagrams to determine the position, nature, and size of images formed by spherical mirrors.",
        "Apply the mirror formula and magnification formula to solve numerical problems.",
        "Understand the phenomenon of refraction and the laws of refraction, including Snell's law.",
        "Explain the concept of refractive index and its significance.",
        "Construct ray diagrams for image formation by spherical lenses (concave and convex).",
        "Apply the lens formula and magnification formula to solve numerical problems.",
        "Understand and calculate the power of a lens."
    ],
    prerequisitesCheck: ["Basic understanding of straight-line propagation of light.", "Familiarity with basic geometric concepts like angles, parallel lines, and circles."],
    keyConcepts: [
        {
            conceptTitle: "Reflection of Light & Spherical Mirrors",
            explanation: "Reflection is the phenomenon of light bouncing back after striking a surface. The 'laws of reflection' are simple but powerful:\n- The angle of incidence (the angle at which light hits the surface) is equal to the angle of reflection (the angle at which it bounces off).\n- The incident ray, the reflected ray, and the normal (an imaginary line perpendicular to the surface at the point of incidence) all lie in the same plane.\n\nWhile this is straightforward for plane mirrors, it gets interesting with 'spherical mirrors', which are curved. There are two types:\n- 'Concave mirrors': Curved inwards, like the inside of a spoon. They are 'converging' mirrors because they bring parallel rays of light together at a single point called the 'principal focus' (F).\n- 'Convex mirrors': Curved outwards, like the back of a spoon. They are 'diverging' mirrors because they spread parallel rays of light out, making them appear to come from a virtual focus behind the mirror.",
            realWorldExample: "The side-view mirror of a car is a convex mirror. It gives a 'wider field of view', allowing the driver to see more of the traffic behind them, even though the objects appear smaller. Shaving mirrors or makeup mirrors are often concave because when you stand close to them, they produce a magnified, upright image, helping you see details more clearly.",
            diagramDescription: "A diagram showing a concave mirror and a convex mirror side-by-side. For the concave mirror, parallel light rays are shown coming from the left, hitting the inner curved surface, and converging at a single point 'F' in front of the mirror. For the convex mirror, parallel rays hit the outer curved surface and diverge, with dotted lines tracing them back to a virtual focus 'F' behind the mirror."
        },
        {
            conceptTitle: "Refraction of Light & Snell's Law",
            explanation: "Refraction is the bending of light as it passes from one transparent medium to another (e.g., from air to water). This happens because light travels at different speeds in different media. The denser the medium, the slower the light travels.\n\nThe 'laws of refraction' are:\n- The incident ray, the refracted ray, and the normal all lie in the same plane.\n- 'Snell's Law': The ratio of the sine of the angle of incidence (i) to the sine of the angle of refraction (r) is a constant, known as the 'refractive index' (n). Mathematically, n = sin(i) / sin(r). The refractive index is a measure of how much a medium can bend light.",
            realWorldExample: "When you look at a swimming pool, it often appears shallower than it actually is. This is due to refraction. The light rays coming from the bottom of the pool bend away from the normal as they travel from the denser medium (water) to the rarer medium (air) before reaching your eyes. Your brain traces these rays back in a straight line, making you perceive the bottom at a shallower depth.",
            diagramDescription: "An illustration showing a ray of light passing from Air (rarer medium) into a block of Glass (denser medium). The ray is shown bending 'towards' the normal as it enters the glass. The angle of incidence (i) and the angle of refraction (r) are clearly labeled with respect to the normal line. 'i > r' is written to emphasize the bending."
        },
        {
            conceptTitle: "Spherical Lenses & Power",
            explanation: "A 'lens' is a transparent material with two curved surfaces that refracts light to form an image. Like mirrors, there are two main types:\n- 'Convex lens': Thicker in the middle. It is a 'converging' lens, bringing parallel rays to a focus. It can form both real and virtual images.\n- 'Concave lens': Thinner in the middle. It is a 'diverging' lens, spreading parallel rays out. It always forms a virtual, erect, and diminished image.\n\nThe 'power of a lens' (P) is a measure of its ability to converge or diverge light rays. It is the reciprocal of its focal length (f) in meters. P = 1/f. The unit of power is the 'diopter' (D). A convex lens has positive power, while a concave lens has negative power.",
            realWorldExample: "Eyeglasses are the most common application of lenses. A person who is 'farsighted' (can't see near objects clearly) uses a convex lens to converge light rays onto their retina. A person who is 'nearsighted' (can't see distant objects clearly) uses a concave lens to diverge light rays before they enter the eye, allowing them to focus correctly on the retina. The prescription from an optometrist, like '+2.0 D' or '-1.5 D', directly refers to the power of the lens needed.",
            diagramDescription: "Side-by-side diagrams of a convex and a concave lens. For the convex lens, parallel rays converge to a focal point after passing through it. For the concave lens, parallel rays diverge, with dotted lines tracing them back to a virtual focal point on the same side as the incident light."
        }
    ],
    formulaSheet: [
        { formula: "1/f = 1/v + 1/u", description: "Mirror Formula: Relates focal length (f), image distance (v), and object distance (u) for spherical mirrors." },
        { formula: "m = -v/u = h'/h", description: "Magnification (Mirrors): Relates image distance (v), object distance (u), image height (h'), and object height (h)." },
        { formula: "n = sin(i) / sin(r)", description: "Snell's Law of Refraction: Relates refractive index (n) to the angles of incidence (i) and refraction (r)." },
        { formula: "1/f = 1/v - 1/u", description: "Lens Formula: Relates focal length (f), image distance (v), and object distance (u) for spherical lenses." },
        { formula: "m = v/u = h'/h", description: "Magnification (Lenses): Relates image distance (v), object distance (u), image height (h'), and object height (h)." },
        { formula: "P = 1/f (where f is in meters)", description: "Power of a Lens: Power (P) in diopters is the reciprocal of the focal length (f) in meters." }
    ],
    summary: "- Reflection follows two laws: angle of incidence equals angle of reflection, and they lie on the same plane with the normal.\n- Concave mirrors converge light and can form real or virtual images; Convex mirrors diverge light and form virtual, diminished images.\n- Refraction is the bending of light due to a change in speed when it enters a new medium, governed by Snell's Law.\n- Convex lenses converge light, while concave lenses diverge light.\n- The Power of a lens (in Diopters) is the inverse of its focal length in meters.",
    conceptMap: "graph TD; A[Light] --> B{Phenomena}; B --> C[Reflection]; B --> D[Refraction]; C --> E[Laws of Reflection]; C --> F{Mirrors}; F --> G[Plane]; F --> H[Spherical]; H --> I[Concave]; H --> J[Convex]; I & J --> K[Mirror Formula & Magnification]; D --> L[Laws of Refraction]; L --> M[Snell's Law]; M --> N[Refractive Index]; D --> O{Lenses}; O --> P[Convex]; O --> Q[Concave]; P & Q --> R[Lens Formula & Magnification]; R --> S[Power of a Lens];",
    interactiveVideoSimulation: {
        title: "Dispersion of Light Through a Prism",
        description: "See how a single beam of white light magically splits into a beautiful rainbow of seven colors when it passes through a glass prism. This video explains the phenomenon of dispersion.",
        videoPrompt: "A visually stunning, high-definition animated video showing a single beam of white light entering a glass prism from one side. As the light passes through the prism, it splits into the seven colors of the rainbow (VIBGYOR). Show that red light bends the least and violet light bends the most. The colors should then project onto a screen, forming a clear spectrum. Use elegant light rays and a clean, dark background to make the colors pop. Add text labels for 'White Light', 'Prism', and 'Spectrum'."
    },
    virtualLab: {
        title: "Verify Snell's Law",
        description: "In this virtual lab, you can change the angle at which light enters different materials and observe how much it bends. Measure the angles to verify Snell's Law for yourself!",
        baseScenarioPrompt: "A top-down view of a physics experiment setup. A ray box on the left emits a single, sharp beam of red light. In the center is a semi-circular block made of a transparent material.",
        variables: [
            { name: "Material", options: ["Glass", "Water", "Diamond"] },
            { name: "Angle of Incidence", options: ["15 degrees", "30 degrees", "45 degrees", "60 degrees"] }
        ],
        outcomePromptTemplate: "The light ray from the ray box strikes the flat surface of the {{Material}} block at an angle of {{Angle of Incidence}} to the normal. Show the refracted ray bending inside the material and then exiting the curved surface without further deviation. Clearly show the angle of refraction inside the block. A protractor graphic should be overlaid to help visualize the angles."
    }
};

const LIGHT_REFLECTION_REFRACTION_HI: LearningModule = {
    chapterTitle: "प्रकाश: परावर्तन तथा अपवर्तन",
    introduction: "क्या आपने कभी सोचा है कि एक साधारण दर्पण आपका प्रतिबिंब कैसे दिखाता है, या पानी के गिलास में एक पेंसिल मुड़ी हुई क्यों दिखती है? ये रोजमर्रा के जादू के करतब प्रकाश के आकर्षक गुणों के कारण होते हैं! इस अध्याय में, हम दो मूलभूत घटनाओं का पता लगाने के लिए एक ज्ञानवर्धक यात्रा पर निकलेंगे: 'परावर्तन', प्रकाश सतहों से कैसे टकराकर वापस आता है, और 'अपवर्तन', यह एक माध्यम से दूसरे माध्यम में जाने पर कैसे झुकता है। कारों और दूरबीनों में उपयोग होने वाले गोलीय दर्पणों के रहस्यों से लेकर हमारी दृष्टि को ठीक करने वाले लेंसों के सिद्धांतों तक, आप उस विज्ञान को उजागर करेंगे जो यह नियंत्रित करता है कि हम दुनिया को कैसे देखते हैं। प्रकाश पर अपने दृष्टिकोण को पूरी तरह से बदलने के लिए तैयार हो जाइए!",
    learningObjectives: [
        "परावर्तन के नियमों को समझना और लागू करना।",
        "अवतल और उत्तल दर्पण और उनके उपयोगों के बीच अंतर करना।",
        "गोलीय दर्पणों द्वारा बनने वाले प्रतिबिंबों की स्थिति, प्रकृति और आकार को निर्धारित करने के लिए किरण आरेख बनाना।",
        "संख्यात्मक समस्याओं को हल करने के लिए दर्पण सूत्र और आवर्धन सूत्र लागू करना।",
        "अपवर्तन की घटना और अपवर्तन के नियमों को समझना, जिसमें स्नेल का नियम भी शामिल है।",
        "अपवर्तनांक की अवधारणा और उसके महत्व की व्याख्या करना।",
        "गोलीय लेंस (अवतल और उत्तल) द्वारा प्रतिबिंब निर्माण के लिए किरण आरेख बनाना।",
        "संख्यात्मक समस्याओं को हल करने के लिए लेंस सूत्र और आवर्धन सूत्र लागू करना।",
        "लेंस की क्षमता को समझना और उसकी गणना करना।"
    ],
    prerequisitesCheck: ["प्रकाश के सीधी-रेखा में प्रसार की बुनियादी समझ।", "कोण, समानांतर रेखाएं और वृत्त जैसी बुनियादी ज्यामितीय अवधारणाओं से परिचित होना।"],
    keyConcepts: [
        {
            conceptTitle: "प्रकाश का परावर्तन और गोलीय दर्पण",
            explanation: "परावर्तन किसी सतह से टकराने के बाद प्रकाश के वापस लौटने की घटना है। 'परावर्तन के नियम' सरल लेकिन शक्तिशाली हैं:\n- आपतन कोण (जिस कोण पर प्रकाश सतह से टकराता है) परावर्तन कोण (जिस कोण पर वह वापस लौटता है) के बराबर होता है।\n- आपतित किरण, परावर्तित किरण, और अभिलंब (आपतन बिंदु पर सतह के लंबवत एक काल्पनिक रेखा) सभी एक ही तल में स्थित होते हैं।\n\nहालांकि यह समतल दर्पणों के लिए सीधा है, यह 'गोलीय दर्पणों' के साथ दिलचस्प हो जाता है, जो घुमावदार होते हैं। दो प्रकार के होते हैं:\n- 'अवतल दर्पण': अंदर की ओर घुमावदार, चम्मच के अंदर की तरह। वे 'अभिसारी' दर्पण होते हैं क्योंकि वे प्रकाश की समानांतर किरणों को 'मुख्य फोकस' (F) नामक एक बिंदु पर एक साथ लाते हैं।\n- 'उत्तल दर्पण': बाहर की ओर घुमावदार, चम्मच के पीछे की तरह। वे 'अपसारी' दर्पण होते हैं क्योंकि वे प्रकाश की समानांतर किरणों को फैलाते हैं, जिससे वे दर्पण के पीछे एक आभासी फोकस से आते हुए प्रतीत होते हैं।",
            realWorldExample: "कार का साइड-व्यू मिरर एक उत्तल दर्पण होता है। यह एक 'व्यापक दृष्टि क्षेत्र' देता है, जिससे चालक को अपने पीछे के अधिक यातायात को देखने की अनुमति मिलती है, भले ही वस्तुएं छोटी दिखाई दें। शेविंग दर्पण या मेकअप दर्पण अक्सर अवतल होते हैं क्योंकि जब आप उनके करीब खड़े होते हैं, तो वे एक आवर्धित, सीधा प्रतिबिंब उत्पन्न करते हैं, जिससे आपको विवरण अधिक स्पष्ट रूप से देखने में मदद मिलती है।",
            diagramDescription: "एक अवतल दर्पण और एक उत्तल दर्पण को अगल-बगल दिखाते हुए एक आरेख। अवतल दर्पण के लिए, समानांतर प्रकाश किरणें बाईं ओर से आती हुई, आंतरिक घुमावदार सतह से टकराती हुई, और दर्पण के सामने एक बिंदु 'F' पर अभिसरित होती हुई दिखाई गई हैं। उत्तल दर्पण के लिए, समानांतर किरणें बाहरी घुमावदार सतह से टकराती हैं और अपसरित होती हैं, बिंदीदार रेखाएं उन्हें दर्पण के पीछे एक आभासी फोकस 'F' तक वापस ले जाती हैं।"
        },
        {
            conceptTitle: "प्रकाश का अपवर्तन और स्नेल का नियम",
            explanation: "अपवर्तन प्रकाश का एक पारदर्शी माध्यम से दूसरे में (जैसे, हवा से पानी में) गुजरते समय झुकना है। ऐसा इसलिए होता है क्योंकि प्रकाश विभिन्न माध्यमों में अलग-अलग गति से यात्रा करता है। माध्यम जितना सघन होता है, प्रकाश उतना ही धीमा यात्रा करता है।\n\n'अपवर्तन के नियम' हैं:\n- आपतित किरण, अपवर्तित किरण, और अभिलंब सभी एक ही तल में स्थित होते हैं।\n- 'स्नेल का नियम': आपतन कोण (i) की ज्या (sine) और अपवर्तन कोण (r) की ज्या (sine) का अनुपात एक स्थिरांक होता है, जिसे 'अपवर्तनांक' (n) के रूप में जाना जाता है। गणितीय रूप से, n = sin(i) / sin(r)। अपवर्तनांक एक माप है कि कोई माध्यम प्रकाश को कितना मोड़ सकता है।",
            realWorldExample: "जब आप किसी स्विमिंग पूल को देखते हैं, तो वह अक्सर अपनी वास्तविक गहराई से कम गहरा दिखाई देता है। यह अपवर्तन के कारण होता है। पूल के तल से आने वाली प्रकाश किरणें सघन माध्यम (पानी) से विरल माध्यम (हवा) में यात्रा करते समय अभिलंब से दूर झुक जाती हैं, इससे पहले कि वे आपकी आँखों तक पहुँचें। आपका मस्तिष्क इन किरणों को एक सीधी रेखा में वापस ट्रेस करता है, जिससे आप तल को कम गहराई पर महसूस करते हैं।",
            diagramDescription: "एक चित्रण जिसमें प्रकाश की एक किरण वायु (विरल माध्यम) से एक कांच (सघन माध्यम) के ब्लॉक में गुजरती हुई दिखाई गई है। किरण को कांच में प्रवेश करते समय अभिलंब की 'ओर' झुकते हुए दिखाया गया है। आपतन कोण (i) और अपवर्तन कोण (r) को अभिलंब रेखा के संबंध में स्पष्ट रूप से लेबल किया गया है। झुकाव पर जोर देने के लिए 'i > r' लिखा गया है।"
        },
        {
            conceptTitle: "गोलीय लेंस और क्षमता",
            explanation: "एक 'लेंस' दो घुमावदार सतहों वाला एक पारदर्शी पदार्थ है जो प्रतिबिंब बनाने के लिए प्रकाश को अपवर्तित करता है। दर्पणों की तरह, दो मुख्य प्रकार होते हैं:\n- 'उत्तल लेंस': बीच में मोटा। यह एक 'अभिसारी' लेंस है, जो समानांतर किरणों को एक फोकस पर लाता है। यह वास्तविक और आभासी दोनों प्रतिबिंब बना सकता है।\n- 'अवतल लेंस': बीच में पतला। यह एक 'अपसारी' लेंस है, जो समानांतर किरणों को फैलाता है। यह हमेशा एक आभासी, सीधा और छोटा प्रतिबिंब बनाता है।\n\n'लेंस की क्षमता' (P) प्रकाश किरणों को अभिसरित या अपसरित करने की उसकी क्षमता का एक माप है। यह मीटर में उसकी फोकस दूरी (f) का व्युत्क्रम है। P = 1/f। क्षमता की इकाई 'डायोप्टर' (D) है। एक उत्तल लेंस की क्षमता धनात्मक होती है, जबकि एक अवतल लेंस की क्षमता ऋणात्मक होती है।",
            realWorldExample: "चश्मा लेंस का सबसे आम अनुप्रयोग है। एक व्यक्ति जो 'दूर-दृष्टि' दोष से पीड़ित है (निकट की वस्तुओं को स्पष्ट रूप से नहीं देख सकता) अपनी रेटिना पर प्रकाश किरणों को अभिसरित करने के लिए एक उत्तल लेंस का उपयोग करता है। एक व्यक्ति जो 'निकट-दृष्टि' दोष से पीड़ित है (दूर की वस्तुओं को स्पष्ट रूप से नहीं देख सकता) आंख में प्रवेश करने से पहले प्रकाश किरणों को अपसरित करने के लिए एक अवतल लेंस का उपयोग करता है, जिससे वे रेटिना पर सही ढंग से ध्यान केंद्रित कर पाते हैं। एक नेत्र चिकित्सक से मिलने वाला प्रिस्क्रिप्शन, जैसे '+2.0 D' या '-1.5 D', सीधे आवश्यक लेंस की क्षमता को संदर्भित करता है।",
            diagramDescription: "एक उत्तल और एक अवतल लेंस के अगल-बगल के आरेख। उत्तल लेंस के लिए, समानांतर किरणें इससे गुजरने के बाद एक फोकल बिंदु पर अभिसरित होती हैं। अवतल लेंस के लिए, समानांतर किरणें अपसरित होती हैं, बिंदीदार रेखाएं उन्हें आपतित प्रकाश के समान तरफ एक आभासी फोकल बिंदु पर वापस ले जाती हैं।"
        }
    ],
    formulaSheet: [
        { formula: "1/f = 1/v + 1/u", description: "दर्पण सूत्र: गोलीय दर्पणों के लिए फोकस दूरी (f), प्रतिबिंब दूरी (v), और वस्तु दूरी (u) से संबंधित है।" },
        { formula: "m = -v/u = h'/h", description: "आवर्धन (दर्पण): प्रतिबिंब दूरी (v), वस्तु दूरी (u), प्रतिबिंब की ऊँचाई (h'), और वस्तु की ऊँचाई (h) से संबंधित है।" },
        { formula: "n = sin(i) / sin(r)", description: "स्नेल का अपवर्तन का नियम: अपवर्तनांक (n) को आपतन (i) और अपवर्तन (r) के कोणों से संबंधित करता है।" },
        { formula: "1/f = 1/v - 1/u", description: "लेंस सूत्र: गोलीय लेंस के लिए फोकस दूरी (f), प्रतिबिंब दूरी (v), और वस्तु दूरी (u) से संबंधित है।" },
        { formula: "m = v/u = h'/h", description: "आवर्धन (लेंस): प्रतिबिंब दूरी (v), वस्तु दूरी (u), प्रतिबिंब की ऊँचाई (h'), और वस्तु की ऊँचाई (h) से संबंधित है।" },
        { formula: "P = 1/f (जहाँ f मीटर में है)", description: "लेंस की क्षमता: डायोप्टर में क्षमता (P) मीटर में फोकस दूरी (f) का व्युत्क्रम है।" }
    ],
    summary: "- परावर्तन दो नियमों का पालन करता है: आपतन कोण परावर्तन कोण के बराबर होता है, और वे अभिलंब के साथ एक ही तल पर स्थित होते हैं।\n- अवतल दर्पण प्रकाश को अभिसरित करते हैं और वास्तविक या आभासी प्रतिबिंब बना सकते हैं; उत्तल दर्पण प्रकाश को अपसरित करते हैं और आभासी, छोटे प्रतिबिंब बनाते हैं।\n- अपवर्तन प्रकाश का एक नए माध्यम में प्रवेश करने पर गति में परिवर्तन के कारण झुकना है, जो स्नेल के नियम द्वारा नियंत्रित होता है।\n- उत्तल लेंस प्रकाश को अभिसरित करते हैं, जबकि अवतल लेंस प्रकाश को अपसरित करते हैं।\n- एक लेंस की क्षमता (डायोप्टर में) मीटर में उसकी फोकस दूरी का व्युत्क्रम है।",
    conceptMap: "graph TD; A[प्रकाश] --> B{घटनाएँ}; B --> C[परावर्तन]; B --> D[अपवर्तन]; C --> E[परावर्तन के नियम]; C --> F{दर्पण}; F --> G[समतल]; F --> H[गोलीय]; H --> I[अवतल]; H --> J[उत्तल]; I & J --> K[दर्पण सूत्र और आवर्धन]; D --> L[अपवर्तन के नियम]; L --> M[स्नेल का नियम]; M --> N[अपवर्तनांक]; D --> O{लेंस}; O --> P[उत्तल]; O --> Q[अवतल]; P & Q --> R[लेंस सूत्र और आवर्धन]; R --> S[लेंस की क्षमता];",
    interactiveVideoSimulation: {
        title: "प्रिज्म के माध्यम से प्रकाश का विक्षेपण",
        description: "देखें कि कैसे सफेद प्रकाश की एक किरण एक कांच के प्रिज्म से गुजरने पर सात रंगों के एक सुंदर इंद्रधनुष में विभाजित हो जाती है। यह वीडियो विक्षेपण की घटना की व्याख्या करता है।",
        videoPrompt: "एक नेत्रहीन आश्चर्यजनक, उच्च-परिभाषा एनिमेटेड वीडियो जो सफेद प्रकाश की एक किरण को एक तरफ से एक कांच के प्रिज्म में प्रवेश करते हुए दिखाता है। जैसे ही प्रकाश प्रिज्म से गुजरता है, यह इंद्रधनुष के सात रंगों (VIBGYOR) में विभाजित हो जाता है। दिखाएँ कि लाल प्रकाश सबसे कम झुकता है और बैंगनी प्रकाश सबसे अधिक झुकता है। रंग फिर एक स्क्रीन पर प्रक्षेपित होने चाहिए, जिससे एक स्पष्ट स्पेक्ट्रम बनता है। रंगों को पॉप करने के लिए सुंदर प्रकाश किरणों और एक साफ, गहरे रंग की पृष्ठभूमि का उपयोग करें। 'सफेद प्रकाश', 'प्रिज्म', और 'स्पेक्ट्रम' के लिए टेक्स्ट लेबल जोड़ें।"
    },
    virtualLab: {
        title: "स्नेल के नियम को सत्यापित करें",
        description: "इस वर्चुअल लैब में, आप उस कोण को बदल सकते हैं जिस पर प्रकाश विभिन्न सामग्रियों में प्रवेश करता है और देख सकते हैं कि यह कितना झुकता है। अपने लिए स्नेल के नियम को सत्यापित करने के लिए कोणों को मापें!",
        baseScenarioPrompt: "एक भौतिकी प्रयोग सेटअप का टॉप-डाउन दृश्य। बाईं ओर एक रे बॉक्स लाल प्रकाश की एक तेज किरण उत्सर्जित करता है। केंद्र में एक पारदर्शी सामग्री से बना एक अर्ध-वृत्ताकार ब्लॉक है।",
        variables: [
            { name: "पदार्थ", options: ["कांच", "पानी", "हीरा"] },
            { name: "आपतन कोण", options: ["15 डिग्री", "30 डिग्री", "45 डिग्री", "60 डिग्री"] }
        ],
        outcomePromptTemplate: "रे बॉक्स से प्रकाश की किरण {{पदार्थ}} ब्लॉक की समतल सतह पर अभिलंब से {{आपतन कोण}} के कोण पर टकराती है। पदार्थ के अंदर अपवर्तित किरण को झुकते हुए दिखाएं और फिर बिना किसी और विचलन के घुमावदार सतह से बाहर निकलते हुए दिखाएं। ब्लॉक के अंदर अपवर्तन के कोण को स्पष्ट रूप से दिखाएं। कोणों की कल्पना करने में मदद के लिए एक चांदा ग्राफिक को ओवरले किया जाना चाहिए।"
    }
};
// --- END: New Content ---


// Populate the store
RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'en')] = THE_GREAT_TRANSFORMATION_EN;
RAG_CONTENT_STORE[createRagKey('The Great Transformation: Navigating Your Journey from Teen to Adult', 'hi')] = THE_GREAT_TRANSFORMATION_HI;
RAG_CONTENT_STORE[createRagKey('Light: Reflection and Refraction', 'en')] = LIGHT_REFLECTION_REFRACTION_EN;
RAG_CONTENT_STORE[createRagKey('Light: Reflection and Refraction', 'hi')] = LIGHT_REFLECTION_REFRACTION_HI;


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
