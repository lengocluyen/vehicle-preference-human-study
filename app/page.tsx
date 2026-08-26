import { StudyExperience } from "./components/study-experience";
import { currentStudyGate } from "@/lib/server/study-gate";

export const dynamic = "force-dynamic";

export default function Home() {
  return <StudyExperience gate={currentStudyGate()} />;
}
