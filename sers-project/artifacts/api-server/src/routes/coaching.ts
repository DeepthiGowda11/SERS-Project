import { Router, type IRouter } from "express";
import { ListCoachingSuggestionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const COACHING_SUGGESTIONS = [
  { id: 1, emotion: "sad", suggestion: "Acknowledge the student's feelings with empathy. Use 'I notice you seem quiet today — is there anything on your mind?'", strategy: "Emotional Validation" },
  { id: 2, emotion: "sad", suggestion: "Pair the student with a supportive peer for collaborative work to re-engage them socially.", strategy: "Peer Support" },
  { id: 3, emotion: "sad", suggestion: "Offer a brief one-on-one check-in during independent work time to understand underlying concerns.", strategy: "Individual Check-in" },
  { id: 4, emotion: "anxious", suggestion: "Introduce a 2-minute breathing exercise for the class before starting a high-stakes activity.", strategy: "Mindfulness Technique" },
  { id: 5, emotion: "anxious", suggestion: "Break the current task into smaller, clearly defined steps to reduce cognitive load.", strategy: "Task Decomposition" },
  { id: 6, emotion: "anxious", suggestion: "Reassure students that mistakes are part of learning; normalise struggle explicitly.", strategy: "Growth Mindset Framing" },
  { id: 7, emotion: "angry", suggestion: "Create a brief pause — ask students to write one thing they appreciate about the lesson so far.", strategy: "Emotional Reset" },
  { id: 8, emotion: "angry", suggestion: "Lower your own voice and slow your speech; this naturally de-escalates classroom tension.", strategy: "Co-regulation" },
  { id: 9, emotion: "angry", suggestion: "Privately acknowledge the student's frustration and offer a face-saving way to re-engage.", strategy: "Private Redirection" },
  { id: 10, emotion: "happy", suggestion: "Harness positive energy with a collaborative challenge or group discussion to deepen engagement.", strategy: "Capitalise on Engagement" },
  { id: 11, emotion: "happy", suggestion: "This is a great moment to introduce more complex concepts — positive affect enhances memory consolidation.", strategy: "Optimal Learning Window" },
  { id: 12, emotion: "surprised", suggestion: "Use the moment of surprise as a springboard for inquiry — ask students what sparked their reaction.", strategy: "Curiosity-Driven Learning" },
  { id: 13, emotion: "disgusted", suggestion: "Address the source of discomfort directly; unresolved negative reactions block cognitive focus.", strategy: "Direct Address" },
  { id: 14, emotion: "fearful", suggestion: "Create a safe environment by explicitly stating there are no wrong answers in this activity.", strategy: "Psychological Safety" },
  { id: 15, emotion: "fearful", suggestion: "Use anonymous response tools (e.g., think-pair-share or digital polls) to reduce performance anxiety.", strategy: "Reduced Exposure" },
  { id: 16, emotion: "neutral", suggestion: "Introduce a surprising fact or open question to pique curiosity and shift neutral to engaged.", strategy: "Curiosity Hook" },
  { id: 17, emotion: "neutral", suggestion: "Check that the task difficulty is appropriately challenging — neutral often signals under-stimulation.", strategy: "Difficulty Calibration" },
];

router.get("/coaching-suggestions", async (req, res): Promise<void> => {
  const query = ListCoachingSuggestionsQueryParams.safeParse(req.query);
  let results = COACHING_SUGGESTIONS;
  if (query.success && query.data.emotion) {
    results = COACHING_SUGGESTIONS.filter((s) => s.emotion === query.data.emotion);
  }
  res.json(results);
});

export default router;
