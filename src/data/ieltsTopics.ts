import { IELTSTopic } from "../types";

export const IELTS_TOPICS: IELTSTopic[] = [
  {
    id: "work-or-study",
    title: "Work or Study",
    category: "Personal Life",
    questions: [
      {
        id: "ws-p1-1",
        part: 1,
        questionText: "Do you work, or are you a student?",
        tips: ["State clearly which one you are.", "Add a small detail about what you study or what your job is."]
      },
      {
        id: "ws-p1-2",
        part: 1,
        questionText: "Why did you choose that subject or that career path?",
        tips: ["Explain your motivation (passion, career prospects, influence of others).", "Try using vocabulary like 'drawn to', 'lucrative path', or 'vocation'."]
      },
      {
        id: "ws-p2-c",
        part: 2,
        questionText: "Describe a job you would like to have in the future.",
        description: "You should say:\n- What job it is\n- What qualifications or skills you need for it\n- How you can prepare for it\n- And explain why you would like to do this job.",
        tips: ["Take 1 minute to plan key words.", "Structure your answer using sequencing terms ('Firstly', 'With regard to qualifications', 'Ultimately').", "Aim to speak for a full 2 minutes."]
      },
      {
        id: "ws-p3-1",
        part: 3,
        questionText: "What do you think is more important for a successful career: high salary or job satisfaction?",
        tips: ["Do not just pick one; weigh the pros and cons of both.", "Give a general opinion about how society views this, rather than just talking about yourself."]
      },
      {
        id: "ws-p3-2",
        part: 3,
        questionText: "How has technology changed the way people work in your country?",
        tips: ["Compare working today with working in the past.", "Mention remote work, automation, or productivity tools."]
      }
    ]
  },
  {
    id: "hometown",
    title: "Hometown & Places",
    category: "Personal Life",
    questions: [
      {
        id: "ht-p1-1",
        part: 1,
        questionText: "Can you describe your hometown?",
        tips: ["Mention where it is located.", "Name one or two unique features (e.g., bustling metropolis, coastal town)."]
      },
      {
        id: "ht-p1-2",
        part: 1,
        questionText: "What is your favorite part of your hometown?",
        tips: ["Talk about a specific landmark, park, or restaurant.", "Describe the vibe or atmosphere."]
      },
      {
        id: "ht-p2-c",
        part: 2,
        questionText: "Describe an interesting house or apartment that you have visited.",
        description: "You should say:\n- Where it is\n- Who lives there\n- What it looks like inside\n- And explain why you found it interesting.",
        tips: ["Describe the architecture, interior design, or ambience.", "Use sensory details (what you saw, felt, or heard)."]
      },
      {
        id: "ht-p3-1",
        part: 3,
        questionText: "Do you think it is better to live in a big city or a small village?",
        tips: ["Mention factors like amenities, peace of mind, job opportunities, and pollution.", "Structure your arguments clearly: 'On one hand... On the other hand...'"]
      },
      {
        id: "ht-p3-2",
        part: 3,
        questionText: "How are residential buildings changing in modern cities?",
        tips: ["Talk about high-rises, energy-efficient 'green' homes, or smart home technology.", "Use advanced collocations like 'urban sprawl', 'sustainability', and 'sky-high prices'."]
      }
    ]
  },
  {
    id: "technology",
    title: "Technology & Innovation",
    category: "Society",
    questions: [
      {
        id: "tech-p1-1",
        part: 1,
        questionText: "What electronic devices do you use most often in your daily life?",
        tips: ["List your primary devices (smartphone, laptop, tablet).", "Mention briefly what you use them for (study, social connection, work)."]
      },
      {
        id: "tech-p1-2",
        part: 1,
        questionText: "Do you think you use your phone too much?",
        tips: ["Be honest. Mention your average screen time.", "Use terms like 'glued to the screen' or 'digital detox'."]
      },
      {
        id: "tech-p2-c",
        part: 2,
        questionText: "Describe a piece of technology (not computer/smartphone) that you find useful.",
        description: "You should say:\n- What it is\n- What it is used for\n- How often you use it\n- And explain why you find it particularly useful.",
        tips: ["Think of devices like smartwatches, air fryers, noise-canceling headphones, or robotic vacuums.", "Focus on the convenience it brings into your routine."]
      },
      {
        id: "tech-p3-1",
        part: 3,
        questionText: "In what ways has technology improved our social interactions, and in what ways has it harmed them?",
        tips: ["Contrast instant global connectivity with decreased face-to-face deep conversations.", "Use vocabulary like 'facilitate connections', 'detrimental impact', and 'superficial relations'."]
      },
      {
        id: "tech-p3-2",
        part: 3,
        questionText: "Do you believe artificial intelligence will replace human teachers or doctors in the future?",
        tips: ["Acknowledge AI's speed and diagnostic accuracy, but highlight the human element of empathy and inspiration.", "Employ collocations like 'irreplaceable human touch', 'algorithmic efficiency', and 'pedagogical methods'."]
      }
    ]
  },
  {
    id: "environment",
    title: "Environment & Travel",
    category: "Global Issues",
    questions: [
      {
        id: "env-p1-1",
        part: 1,
        questionText: "Do you like spending time in nature?",
        tips: ["Describe where you go (parks, beaches, hiking trails).", "Talk about how nature recharges you."]
      },
      {
        id: "env-p2-c",
        part: 2,
        questionText: "Describe a beautiful place you visited that had a clean environment.",
        description: "You should say:\n- Where it is\n- When you went there\n- What you did there\n- And explain why you think the environment was so clean.",
        tips: ["Mention local rules, public awareness, or eco-friendly practices.", "Use adjectives like 'pristine', 'unspoiled', 'breathtaking', and 'crystal-clear'."]
      },
      {
        id: "env-p3-1",
        part: 3,
        questionText: "Who should take the lead in protecting the environment: individuals, corporations, or governments?",
        tips: ["Argue that it is a collaborative effort, but highlight the power of policy versus consumer choices.", "Utilize phrases like 'legislative measures', 'carbon footprint', and 'collective responsibility'."]
      },
      {
        id: "env-p3-2",
        part: 3,
        questionText: "Do you think ecotourism is a realistic solution to preserve biodiversity?",
        tips: ["Discuss how it funds conservation but can still cause pollution or disrupt local wildlife if poorly managed.", "Try terms like 'sustainable revenue', 'ecological footprint', and 'habitat encroachment'."]
      }
    ]
  }
];
