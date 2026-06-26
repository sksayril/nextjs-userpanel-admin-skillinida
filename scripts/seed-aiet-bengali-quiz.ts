import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join } from "path";

function loadEnvLocal() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist in some environments
  }
}

loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in .env.local");
}

const COURSE = "Agragami Instructor Eligibility Test (AIET)";
const QUIZ_TITLE = "Agragami Instructor Eligibility Test (AIET) _Bengali";
const DURATION_MINUTES = 150;
const SCHEDULED_AT = new Date(
  `${new Date().toISOString().slice(0, 10)}T13:45:00+05:30`
);

const ASSIGNED_STUDENT_IDS = [
  "6a3c5c5da13e15dd162784b9",
  "6a3c4fccd87e1998d4afc33a",
  "6a3c4f69d87e1998d4afc331",
  "6a3c4ef2d87e1998d4afc328",
  "6a3c4e98d87e1998d4afc31f",
  "6a3c4af8d87e1998d4afc30d",
  "6a3c4e28d87e1998d4afc316",
  "6a3c4a6fd87e1998d4afc304",
  "6a3c4a05d87e1998d4afc2fb",
  "6a3c4997d87e1998d4afc2f2",
  "6a3c4922d87e1998d4afc2e9",
  "6a3c48b7d87e1998d4afc2e0",
  "6a3c4826d87e1998d4afc2d7",
  "6a3c47a1d87e1998d4afc2ce",
  "6a3c4728d87e1998d4afc2c5",
  "6a3c4691d87e1998d4afc2bc",
  "6a3c4619d87e1998d4afc2b3",
  "6a3c4598d87e1998d4afc2aa",
  "6a3c4521d87e1998d4afc2a1",
  "6a3c447ed87e1998d4afc298",
  "6a3c4378d87e1998d4afc28f",
  "6a3c41e3d87e1998d4afc286",
  "6a3c3d61d87e1998d4afc27d",
  "6a3c3cc6d87e1998d4afc274",
  "6a3c3c34d87e1998d4afc26b",
];

const QuizQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  marks: { type: Number, required: true, default: 1 },
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: String, required: true, index: true },
  questions: [QuizQuestionSchema],
  scheduledAt: { type: Date, default: Date.now },
  duration: { type: Number, required: true, default: 30 },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
  examPassword: { type: String },
  createdAt: { type: Date, default: Date.now },
});

async function main() {
  const { AIET_BENGALI_ANSWER_KEY } = await import("./data/aiet-bengali-answers");
  const rawQuestions = JSON.parse(
    readFileSync(join(process.cwd(), "scripts", "data", "aiet-bengali-questions.json"), "utf8")
  ) as Array<{
    questionText: string;
    options: string[];
    marks: number;
  }>;

  if (rawQuestions.length !== 100) {
    throw new Error(`Expected 100 questions, found ${rawQuestions.length}`);
  }

  if (AIET_BENGALI_ANSWER_KEY.length !== 100) {
    throw new Error(`Expected 100 answers, found ${AIET_BENGALI_ANSWER_KEY.length}`);
  }

  const questions = rawQuestions.map((question, index) => ({
    questionText: question.questionText,
    options: question.options,
    marks: question.marks ?? 1,
    correctAnswerIndex: AIET_BENGALI_ANSWER_KEY[index],
  }));

  await mongoose.connect(MONGODB_URI!);
  const Quiz = mongoose.models.SeedQuiz || mongoose.model("SeedQuiz", QuizSchema, "quizzes");

  const existing = await Quiz.findOne({
    title: QUIZ_TITLE,
    course: COURSE,
  });

  if (existing) {
    await Quiz.deleteOne({ _id: existing._id });
    console.log(`Removed previous quiz: ${existing._id}`);
  }

  const Candidate =
    mongoose.models.SeedCandidate ||
    mongoose.model(
      "SeedCandidate",
      new mongoose.Schema({ course: String }),
      "candidates"
    );

  const courseStudents = await Candidate.find({
    course: COURSE,
  }).select("_id");

  const assignedIdSet = new Set(ASSIGNED_STUDENT_IDS);
  for (const student of courseStudents) {
    assignedIdSet.add(student._id.toString());
  }

  const assignedStudents = [...assignedIdSet].map((id) => new mongoose.Types.ObjectId(id));

  const quiz = await Quiz.create({
    title: QUIZ_TITLE,
    course: COURSE,
    questions,
    scheduledAt: SCHEDULED_AT,
    duration: DURATION_MINUTES,
    assignedStudents,
    examPassword: "",
  });

  console.log("Quiz created successfully");
  console.log("ID:", quiz._id.toString());
  console.log("Title:", quiz.title);
  console.log("Course:", quiz.course);
  console.log("Questions:", quiz.questions.length);
  console.log("Assigned students:", quiz.assignedStudents.length);
  console.log("Scheduled at (UTC):", quiz.scheduledAt.toISOString());
  console.log("Duration (mins):", quiz.duration);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
