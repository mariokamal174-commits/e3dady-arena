import type { GameSettings, Question, Team } from "./types";

export const TEAM_PALETTE = [
  "#38bdf8",
  "#f43f5e",
  "#4ade80",
  "#facc15",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
  "#f472b6",
];

export const TEAM_ICONS = ["🦊", "🐺", "🦁", "🐯", "🦅", "🐙", "🐉", "🦈", "⚡", "🔥", "🚀", "🌟"];

export const demoSettings: GameSettings = {
  title: "Quiz Arena Live",
  defaultTimer: 20,
  stealTimer: 10,
  speedTimer: 10,
  defaultPoints: 20,
  stealPoints: 10,
  speedPoints: 30,
  sound: true,
  animations: true,
};

export const demoTeams: Team[] = [
  { id: "t1", name: "Team Alpha", color: "#38bdf8", icon: "🦊", score: 0 },
  { id: "t2", name: "Team Bravo", color: "#f43f5e", icon: "🦁", score: 0 },
  { id: "t3", name: "Team Charlie", color: "#4ade80", icon: "🐉", score: 0 },
  { id: "t4", name: "Team Delta", color: "#facc15", icon: "⚡", score: 0 },
];

export const demoQuestions: Question[] = [
  {
    id: "q1",
    type: "normal",
    text: "Which planet is known as the Red Planet?",
    choices: ["Earth", "Mars", "Venus", "Jupiter"],
    correctIndex: 1,
    points: 20,
    explanation: "Mars looks red because of iron oxide (rust) on its surface.",
  },
  {
    id: "q2",
    type: "steal",
    text: "What is the capital city of Australia?",
    choices: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctIndex: 2,
    points: 20,
    explanation: "Canberra was purpose-built as the capital in 1913.",
  },
  {
    id: "q3",
    type: "speed",
    text: "How many sides does a hexagon have?",
    choices: ["5", "6", "7", "8"],
    correctIndex: 1,
    points: 30,
  },
  {
    id: "q4",
    type: "normal",
    text: "Who painted the Mona Lisa?",
    choices: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    correctIndex: 2,
    points: 20,
  },
  {
    id: "q5",
    type: "steal",
    text: "Which element has the chemical symbol 'Au'?",
    choices: ["Silver", "Gold", "Aluminium", "Argon"],
    correctIndex: 1,
    points: 25,
    explanation: "Au comes from the Latin word 'aurum'.",
  },
  {
    id: "q6",
    type: "speed",
    text: "What is 12 × 12?",
    choices: ["124", "132", "144", "154"],
    correctIndex: 2,
    points: 30,
  },
  {
    id: "q7",
    type: "normal",
    text: "Which ocean is the largest on Earth?",
    choices: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIndex: 3,
    points: 20,
  },
  {
    id: "q8",
    type: "steal",
    text: "In which year did the first human land on the Moon?",
    choices: ["1965", "1969", "1972", "1958"],
    correctIndex: 1,
    points: 25,
  },
  {
    id: "q9",
    type: "speed",
    text: "Which animal is the fastest land animal?",
    choices: ["Lion", "Cheetah", "Horse", "Pronghorn"],
    correctIndex: 1,
    points: 30,
  },
  {
    id: "q10",
    type: "normal",
    text: "How many continents are there on Earth?",
    choices: ["5", "6", "7", "8"],
    correctIndex: 2,
    points: 20,
  },
  {
    id: "q11",
    type: "normal",
    text: "What is the largest internal organ in the human body?",
    choices: ["Heart", "Liver", "Lungs", "Brain"],
    correctIndex: 1,
    points: 20,
  },
  {
    id: "q12",
    type: "speed",
    text: "Which language has the most native speakers worldwide?",
    choices: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    correctIndex: 2,
    points: 30,
  },
];
