"use client";

import { useEffect, useRef, useState } from "react";
import { demoEvaluationTasks, demoSupportTasks, practiceTopics } from "@/lib/demo-tasks";
import { interactionTsv, judgmentTsv } from "@/lib/demo-export";
import type {
  EvaluationTask,
  InteractionRow,
  JudgmentRow,
  PairwiseTask,
  PublicStudyGate,
  VehicleListing,
} from "@/lib/study-types";
import { ReasonSelector, VehicleTable } from "./vehicle-table";

type Stage = "welcome" | "information" | "profile" | "practice" | "support" | "evaluation" | "feedback" | "complete";

type DemoSession = {
  participantId: string;
  sessionId: string;
  completionCode: string;
  withdrawalCode: string;
  support: Array<{ task: PairwiseTask; left: VehicleListing; right: VehicleListing }>;
  evaluation: EvaluationTask[];
};

const stages: Stage[] = ["information", "profile", "practice", "support", "evaluation", "feedback", "complete"];
const importanceLabels = ["Not important", "Slightly", "Moderately", "Very", "Essential"];

function randomToken(bytes = 12): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [result[index], result[random]] = [result[random], result[index]];
  }
  return result;
}

function createSession(): DemoSession {
  return {
    participantId: `demo_p_${randomToken(8)}`,
    sessionId: `demo_sess_${randomToken(12)}`,
    completionCode: `DEMO-${randomToken(4).toUpperCase()}`,
    withdrawalCode: `DEMO-W-${randomToken(5).toUpperCase()}`,
    support: demoSupportTasks.map((task) => {
      const swap = crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 1;
      return { task, left: swap ? task.candidateB : task.candidateA, right: swap ? task.candidateA : task.candidateB };
    }),
    evaluation: shuffle(demoEvaluationTasks),
  };
}

function downloadText(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/tab-separated-values;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Header({ stage }: { stage: Stage }) {
  const current = stage === "welcome" ? 0 : Math.max(1, stages.indexOf(stage) + 1);
  const percent = stage === "welcome" ? 0 : Math.round((current / stages.length) * 100);
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#main" aria-label="Vehicle Preference Study home">
          <span className="brand-mark" aria-hidden="true">VP</span>
          <span><strong>Vehicle Preference Study</strong><small>Research interface</small></span>
        </a>
        <div className="header-status">
          <span className="demo-pill"><span aria-hidden="true" /> Synthetic demo</span>
          {stage !== "welcome" && <span className="progress-copy">Step {current} of {stages.length}</span>}
        </div>
      </div>
      {stage !== "welcome" && <div className="progress-track" aria-label={`${percent}% complete`}><span style={{ width: `${percent}%` }} /></div>}
    </header>
  );
}

function StatusBanner({ gate }: { gate: PublicStudyGate }) {
  return (
    <div className="status-banner" role="status" aria-live="polite">
      <span className="status-icon" aria-hidden="true">!</span>
      <div><strong>Research participation is not open</strong><p>{gate.message} Nothing entered in this demonstration is sent to a research database.</p></div>
    </div>
  );
}

function Actions({ nextLabel, disabled, onNext, onLeave }: { nextLabel: string; disabled?: boolean; onNext: () => void; onLeave: () => void }) {
  return (
    <div className="action-row">
      <button className="button text-button" onClick={onLeave}>Leave demonstration</button>
      <button className="button primary" disabled={disabled} onClick={onNext}>{nextLabel}</button>
    </div>
  );
}

export function StudyExperience({ gate }: { gate: PublicStudyGate }) {
  const [session, setSession] = useState<DemoSession>(() => createSession());
  const [stage, setStage] = useState<Stage>("welcome");
  const [acknowledged, setAcknowledged] = useState({ demo: false, voluntary: false });
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [comprehension, setComprehension] = useState("");
  const [comprehensionError, setComprehensionError] = useState(false);
  const [supportIndex, setSupportIndex] = useState(0);
  const [evaluationIndex, setEvaluationIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [judgments, setJudgments] = useState<JudgmentRow[]>([]);
  const [exportError, setExportError] = useState("");
  const shownAt = useRef(0);

  useEffect(() => { shownAt.current = Date.now(); }, [stage, supportIndex, evaluationIndex]);

  const event = (values: Partial<InteractionRow>): InteractionRow => ({
    participant_id: session.participantId,
    session_id: session.sessionId,
    consent_version: gate.consentVersion,
    query_id: "",
    candidate_left_id: "",
    candidate_right_id: "",
    presentation_order: "",
    response_type: "",
    selected_candidate_id: "",
    grade: "",
    cannot_judge: "false",
    reason_codes: "",
    response_time_ms: String(shownAt.current ? Math.max(0, Date.now() - shownAt.current) : 0),
    role: "",
    repeat_id: "",
    attention_check_id: "",
    fold: "0",
    timestamp_utc: new Date().toISOString(),
    ...values,
  });

  const resetChoice = () => { setChoice(""); setReasons([]); };
  const leave = () => {
    setStage("welcome");
    setAcknowledged({ demo: false, voluntary: false });
    setProfile({}); setComprehension(""); setComprehensionError(false);
    setSupportIndex(0); setEvaluationIndex(0); setFeedback({});
    setInteractions([]); setJudgments([]); setExportError("");
    resetChoice(); setSession(createSession());
  };

  const confirmInformation = () => {
    setInteractions((rows) => [...rows, event({ query_id: "demo_information_acknowledgment", response_type: "demo_acknowledgment", selected_candidate_id: "acknowledged", role: "practice" })]);
    setStage("profile");
  };

  const saveProfile = () => {
    const encoded = Object.entries(profile).map(([key, value]) => `${key}:${value}`).join("|");
    setInteractions((rows) => [...rows, event({ query_id: "demo_preference_inventory", response_type: "structured_inventory", reason_codes: encoded, role: "practice" })]);
    setStage("practice");
  };

  const finishPractice = () => {
    if (comprehension !== "alternative") { setComprehensionError(true); return; }
    setComprehensionError(false);
    setInteractions((rows) => [...rows, event({ query_id: "demo_practice_comprehension", response_type: "comprehension_check", selected_candidate_id: comprehension, role: "practice", attention_check_id: "practice_check_001" })]);
    setStage("support");
  };

  const saveSupport = () => {
    if (!choice) return;
    const current = session.support[supportIndex];
    const cannot = choice === "cannot";
    setInteractions((rows) => [...rows, event({
      query_id: current.task.queryId,
      candidate_left_id: current.left.id,
      candidate_right_id: current.right.id,
      presentation_order: `${current.left.id}|${current.right.id}`,
      response_type: cannot ? "cannot_judge" : "pairwise_choice",
      selected_candidate_id: cannot ? "" : choice,
      cannot_judge: String(cannot),
      reason_codes: reasons.join("|"),
      role: "support",
    })]);
    if (!cannot) {
      const other = choice === current.left.id ? current.right.id : current.left.id;
      setJudgments((rows) => [...rows,
        { participant_id: session.participantId, query_id: current.task.queryId, candidate_id: choice, grade: "3", role: "support", fold: "0" },
        { participant_id: session.participantId, query_id: current.task.queryId, candidate_id: other, grade: "0", role: "support", fold: "0" },
      ]);
    }
    resetChoice();
    if (supportIndex + 1 < session.support.length) setSupportIndex((value) => value + 1);
    else setStage("evaluation");
  };

  const saveEvaluation = () => {
    if (!choice) return;
    const current = session.evaluation[evaluationIndex];
    const cannot = choice === "cannot";
    setInteractions((rows) => [...rows, event({
      query_id: current.queryId,
      candidate_left_id: current.reference.id,
      candidate_right_id: current.candidate.id,
      presentation_order: `${current.reference.id}|${current.candidate.id}`,
      response_type: cannot ? "cannot_judge" : "graded_relevance",
      selected_candidate_id: cannot ? "" : current.candidate.id,
      grade: cannot ? "" : choice,
      cannot_judge: String(cannot),
      reason_codes: reasons.join("|"),
      role: "evaluation",
      repeat_id: current.repeatId ?? "",
      attention_check_id: current.attentionCheckId ?? "",
    })]);
    if (!cannot) setJudgments((rows) => [...rows, { participant_id: session.participantId, query_id: current.queryId, candidate_id: current.candidate.id, grade: choice, role: "evaluation", fold: "0" }]);
    resetChoice();
    if (evaluationIndex + 1 < session.evaluation.length) setEvaluationIndex((value) => value + 1);
    else setStage("feedback");
  };

  const finishFeedback = () => {
    const rows = Object.entries(feedback).map(([queryId, grade]) => event({ query_id: `demo_feedback_${queryId}`, response_type: "usability_rating", grade, role: "feedback" }));
    setInteractions((current) => [...current, ...rows]);
    setStage("complete");
  };

  const exportJudgments = () => {
    try {
      if (!judgments.length) throw new Error("No analytic rows were created because every judgment was skipped.");
      downloadText("demo_judgments.tsv", judgmentTsv(judgments));
      setExportError("");
    } catch (error) { setExportError(error instanceof Error ? error.message : "The export could not be prepared."); }
  };

  const supportTask = session.support[supportIndex];
  const evaluationTask = session.evaluation[evaluationIndex];

  return (
    <div className="app-shell">
      <Header stage={stage} />
      <main id="main" className="main-content">
        {stage !== "welcome" && <StatusBanner gate={gate} />}

        {stage === "welcome" && (
          <section className="welcome-grid">
            <div className="welcome-copy">
              <span className="eyebrow">Synthetic interface preview</span>
              <h1>How do people decide whether one vehicle is a suitable alternative to another?</h1>
              <p className="lead">This website demonstrates a planned human study for vehicle preference retrieval. It separates early pairwise choices from later 0–3 suitability judgments while keeping method scores and rankings hidden.</p>
              <div className="welcome-actions"><button className="button primary" onClick={() => setStage("information")}>Try the demonstration</button><a className="button secondary" href="#study-overview">Read the overview</a></div>
              <p className="microcopy">Synthetic records only · no vehicle images · no research-data upload</p>
            </div>
            <aside className="gate-card" aria-label="Study readiness">
              <div className="gate-card-top"><span className="gate-symbol" aria-hidden="true">◆</span><span className="status-label">ETHICS GATE</span></div>
              <h2>Collection locked</h2>
              <p>The protocol is still pending institutional review and the vehicle redistribution licence remains unresolved.</p>
              <dl><div><dt>Ethics status</dt><dd>{gate.ethicsStatus}</dd></div><div><dt>Protocol</dt><dd>{gate.protocolVersion}</dd></div><div><dt>Data mode</dt><dd>Synthetic</dd></div></dl>
            </aside>
            <div id="study-overview" className="overview-strip">
              <article><span>01</span><h3>Learn</h3><p>Collect strict choices from support queries.</p></article>
              <article><span>02</span><h3>Evaluate</h3><p>Grade disjoint evaluation candidates from 0 to 3.</p></article>
              <article><span>03</span><h3>Analyze</h3><p>Export blinded qrels for offline model evaluation.</p></article>
            </div>
          </section>
        )}

        {stage === "information" && (
          <section className="content-card narrow-card">
            <span className="section-number">01 · Information</span><h1>Demonstration, not research participation</h1>
            <p className="lead-small">The planned study will examine how people compare vehicle listings. This preview lets investigators test the interface with synthetic examples before approval.</p>
            <div className="information-grid">
              <article><h2>Planned tasks</h2><p>A preference inventory, practice, pairwise choices, individual 0–3 ratings, and a short usability questionnaire.</p></article>
              <article><h2>Preview data</h2><p>Responses stay in this browser tab only. Demonstration TSV files can be downloaded locally.</p></article>
              <article><h2>Intentionally absent</h2><p>No names, emails, seller details, real photographs, model scores, weights, or external analytics.</p></article>
              <article><h2>Before a real pilot</h2><p>Approval, final consent, storage, retention, withdrawal, recruitment, and a frozen task bundle are required.</p></article>
            </div>
            <div className="acknowledgments">
              <label><input checked={acknowledged.demo} onChange={(e) => setAcknowledged({ ...acknowledged, demo: e.target.checked })} type="checkbox" /> I understand this is a synthetic demonstration, not a research session.</label>
              <label><input checked={acknowledged.voluntary} onChange={(e) => setAcknowledged({ ...acknowledged, voluntary: e.target.checked })} type="checkbox" /> I am testing the interface voluntarily and can leave at any time.</label>
            </div>
            <Actions nextLabel="Continue" disabled={!acknowledged.demo || !acknowledged.voluntary} onNext={confirmInformation} onLeave={leave} />
          </section>
        )}

        {stage === "profile" && (
          <section className="content-card">
            <span className="section-number">02 · Structured preferences</span><h1>What matters for this comparison?</h1>
            <p className="lead-small">There are no right answers. These demonstration values are not used to select or reorder examples.</p>
            <div className="form-grid">
              <label>Maximum listed-price band<select value={profile.budget ?? ""} onChange={(e) => setProfile({ ...profile, budget: e.target.value })}><option value="">Prefer not to answer</option><option>Under EUR 15,000</option><option>EUR 15,000–20,000</option><option>EUR 20,000–25,000</option><option>EUR 25,000–30,000</option><option>Over EUR 30,000</option></select></label>
              <label>Maximum seller-distance band<select value={profile.distance ?? ""} onChange={(e) => setProfile({ ...profile, distance: e.target.value })}><option value="">Prefer not to answer</option><option>Under 25 km</option><option>25–50 km</option><option>50–100 km</option><option>Over 100 km</option></select></label>
              {["Vehicle age", "Mileage", "Energy source", "Vehicle type", "Capacity", "Equipment"].map((item) => <label key={item}>{item}<select value={profile[item] ?? ""} onChange={(e) => setProfile({ ...profile, [item]: e.target.value })}><option value="">Prefer not to answer</option>{importanceLabels.map((label) => <option key={label}>{label}</option>)}</select></label>)}
            </div>
            <Actions nextLabel="Continue to practice" onNext={saveProfile} onLeave={leave} />
          </section>
        )}

        {stage === "practice" && (
          <section className="content-card">
            <span className="section-number">03 · Practice</span><h1>Judge suitability, not identity</h1>
            <p className="lead-small">Decide whether a candidate is an alternative you personally would consider—not whether two listings describe the same physical vehicle.</p>
            <div className="practice-grid">{practiceTopics.map((topic, index) => <article key={topic.title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{topic.title}</h2><p>{topic.text}</p></article>)}</div>
            <fieldset className={comprehensionError ? "comprehension error" : "comprehension"}>
              <legend>Check your understanding: what are you deciding?</legend>
              <label><input checked={comprehension === "identity"} name="comprehension" onChange={() => setComprehension("identity")} type="radio" /> Whether the listings describe the same physical vehicle.</label>
              <label><input checked={comprehension === "alternative"} name="comprehension" onChange={() => setComprehension("alternative")} type="radio" /> Whether the candidate is a suitable alternative for my needs.</label>
              {comprehensionError && <p role="alert">The task concerns suitability as an alternative, not vehicle identity.</p>}
            </fieldset>
            <Actions nextLabel="Begin comparison examples" disabled={!comprehension} onNext={finishPractice} onLeave={leave} />
          </section>
        )}

        {stage === "support" && supportTask && (
          <section className="content-card task-card">
            <div className="task-heading"><div><span className="section-number">04 · Pairwise choices</span><h1>Choose between two alternatives</h1></div><span className="task-counter">Choice {supportIndex + 1} of {session.support.length}</span></div>
            <p className="lead-small">Considering the reference vehicle and your own priorities, which option would you be more willing to consider?</p>
            <VehicleTable listings={[supportTask.task.reference, supportTask.left, supportTask.right]} />
            <fieldset className="response-fieldset"><legend>Your response</legend><div className="choice-grid three-choices">
              <label className={choice === supportTask.left.id ? "choice-card selected" : "choice-card"}><input checked={choice === supportTask.left.id} name="support" onChange={() => setChoice(supportTask.left.id)} type="radio" /><strong>Prefer vehicle A</strong><span>{supportTask.left.label}</span></label>
              <label className={choice === supportTask.right.id ? "choice-card selected" : "choice-card"}><input checked={choice === supportTask.right.id} name="support" onChange={() => setChoice(supportTask.right.id)} type="radio" /><strong>Prefer vehicle B</strong><span>{supportTask.right.label}</span></label>
              <label className={choice === "cannot" ? "choice-card selected" : "choice-card"}><input checked={choice === "cannot"} name="support" onChange={() => setChoice("cannot")} type="radio" /><strong>Cannot judge</strong><span>The information shown is insufficient</span></label>
            </div></fieldset>
            {choice && <ReasonSelector selected={reasons} onChange={setReasons} />}
            <Actions nextLabel="Save and continue" disabled={!choice} onNext={saveSupport} onLeave={leave} />
          </section>
        )}

        {stage === "evaluation" && evaluationTask && (
          <section className="content-card task-card">
            <div className="task-heading"><div><span className="section-number">05 · Suitability ratings</span><h1>Rate this alternative</h1></div><span className="task-counter">Rating {evaluationIndex + 1} of {session.evaluation.length}</span></div>
            <p className="lead-small">How suitable is this candidate as an alternative you would personally consider?</p>
            <VehicleTable listings={[evaluationTask.reference, evaluationTask.candidate]} />
            <fieldset className="response-fieldset"><legend>Your rating</legend><div className="rating-grid">
              {[["3", "Highly suitable", "I would seriously consider it; the differences are acceptable."], ["2", "Suitable with compromises", "I might consider it; compromises may be acceptable."], ["1", "Poor alternative", "I would be unlikely to consider it."], ["0", "Not suitable", "I would not consider it for this need."]].map(([grade, title, description]) => <label className={choice === grade ? "rating-card selected" : "rating-card"} key={grade}><input checked={choice === grade} name="grade" onChange={() => setChoice(grade)} type="radio" /><span className="grade-number">{grade}</span><span><strong>{title}</strong><small>{description}</small></span></label>)}
              <label className={choice === "cannot" ? "rating-card cannot selected" : "rating-card cannot"}><input checked={choice === "cannot"} name="grade" onChange={() => setChoice("cannot")} type="radio" /><span className="grade-number">—</span><span><strong>Cannot judge</strong><small>The information shown is insufficient.</small></span></label>
            </div></fieldset>
            {choice && <ReasonSelector selected={reasons} onChange={setReasons} />}
            <Actions nextLabel="Save and continue" disabled={!choice} onNext={saveEvaluation} onLeave={leave} />
          </section>
        )}

        {stage === "feedback" && (
          <section className="content-card narrow-card">
            <span className="section-number">06 · Interface feedback</span><h1>How did the task feel?</h1><p className="lead-small">These items evaluate the interface, not your vehicle preferences.</p>
            <div className="feedback-list">{[["instructions_clear", "The instructions were clear."], ["information_comparable", "The vehicle information was easy to compare."], ["responses_expressive", "The response options let me express my judgment."], ["task_tiring", "The task felt tiring."], ["task_difficult", "Overall, the task was difficult."]].map(([key, statement]) => <fieldset key={key}><legend>{statement}</legend><div className="likert-row">{["1", "2", "3", "4", "5"].map((value, index) => <label key={value}><input checked={feedback[key] === value} name={key} onChange={() => setFeedback({ ...feedback, [key]: value })} type="radio" /><span>{value}</span><small>{index === 0 ? "Strongly disagree" : index === 4 ? "Strongly agree" : ""}</small></label>)}</div></fieldset>)}</div>
            <Actions nextLabel="Finish demonstration" disabled={Object.keys(feedback).length !== 5} onNext={finishFeedback} onLeave={leave} />
          </section>
        )}

        {stage === "complete" && (
          <section className="content-card completion-card">
            <span className="completion-mark" aria-hidden="true">✓</span><span className="section-number">Demonstration complete</span>
            <h1>The collection flow is ready for synthetic usability testing.</h1>
            <p className="lead-small">No response was uploaded. These files are generated in this browser and illustrate the raw-interaction and analytic-qrels formats expected by the experiment code.</p>
            <div className="code-grid"><div><span>Demo completion code</span><strong>{session.completionCode}</strong></div><div><span>Demo withdrawal code</span><strong>{session.withdrawalCode}</strong></div></div>
            <div className="export-panel"><div><h2>Inspect demonstration exports</h2><p>{interactions.length} raw rows · {judgments.length} analytic rows</p></div><div className="export-actions"><button className="button secondary" onClick={() => downloadText("demo_interactions.tsv", interactionTsv(interactions))}>Download interactions.tsv</button><button className="button secondary" onClick={exportJudgments}>Download judgments.tsv</button></div>{exportError && <p className="export-error" role="alert">{exportError}</p>}</div>
            <div className="debrief"><h2>Why the tasks were separated</h2><p>The planned method learns relative property importance from earlier choices and evaluates ranking on disjoint graded queries. No score, weight, system identity, or ranking was shown while judging.</p></div>
            <div className="action-row centered"><button className="button primary" onClick={leave}>Reset demonstration</button></div>
          </section>
        )}
      </main>
      {stage !== "welcome" && stage !== "complete" && <footer className="study-footer"><span>Protocol {gate.protocolVersion}</span><button onClick={leave}>Pause or leave the demonstration</button></footer>}
    </div>
  );
}
