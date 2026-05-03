/**
 * FlexRoom — Assessment & Grading API (Postman-friendly, multipart uploads).
 * Autograding (TestCase) and plagiarism (MatchResults) are intentionally separate.
 */
const express = require('express');
const multer = require('multer');
const { AssessmentFactory } = require('../server/assessment/AssessmentFactory');
const { Rubric } = require('../server/rubric/Rubric');
const { TestCase } = require('../server/testCase/TestCase');
const { SolutionKey } = require('../server/solutionKey/SolutionKey');
const { MatchResults } = require('../server/plagiarism/MatchResults');
const {
  assessments,
  submissions,
  createAssessmentId,
  createSubmissionId,
} = require('../server/grading/GradingRegistry');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const { StudentDashboardObserver, globalAutogradeSubject } = require('../server/observer/DashboardNotifier');

// Warm singleton side-effects (ensures upload folders exist).
ConnectionManager.getInstance();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

/** @type {Map<string, StudentDashboardObserver>} */
const studentObservers = new Map();

function ensureStudentObserver(studentId) {
  const key = String(studentId);
  if (!studentObservers.has(key)) {
    const observer = new StudentDashboardObserver(key);
    globalAutogradeSubject.subscribe(observer);
    studentObservers.set(key, observer);
  }
  return studentObservers.get(key);
}

/** Health + pattern smoke */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    module: 'grading',
    patterns: ['Factory', 'Composite', 'State', 'Template', 'Observer', 'Singleton'],
  });
});

/** Factory: create Document | Code assessment */
router.post('/assessments', express.json(), (req, res) => {
  try {
    const { type, title, marks, dueDate, classId, uploadingDate, status } = req.body;
    if (!type || !title || marks == null) {
      return res.status(400).json({ error: 'type, title, and marks are required.' });
    }
    const id = createAssessmentId();
    const assessment = AssessmentFactory.create(type, {
      id,
      title,
      marks: Number(marks),
      dueDate: dueDate || null,
      classId,
      uploadingDate,
      status,
    });
    assessments.set(id, assessment);
    return res.status(201).json(assessment.getAssessmentDetails());
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/assessments/:id', (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });
  return res.json({
    ...a.getAssessmentDetails(),
    submissionOpen: a.isSubmissionOpen(),
  });
});

/** Composite rubric */
router.post('/assessments/:id/rubric', express.json(), (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });

  const rubric = new Rubric();
  const criteria = req.body.criteria || [];
  for (const c of criteria) {
    rubric.addCriterion(String(c.heading), Number(c.points), c.sectionHeading || null);
  }
  a.linkRubric(rubric);
  return res.json({ ok: true, markingScheme: rubric.getMarkingScheme(), studentView: rubric.getStudentView() });
});

/** Test cases (autograde) */
router.post('/assessments/:id/test-cases', express.json(), (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });
  if (a.type !== 'code') {
    return res.status(400).json({ error: 'Test cases apply to code assessments only.' });
  }

  const testCase = new TestCase({
    assessmentId: req.params.id,
    getAssessmentStatus: () => assessments.get(req.params.id)?.status || 'unmarked',
  });
  const tests = req.body.tests || [];
  for (const t of tests) {
    testCase.addTest(String(t.input ?? ''), String(t.expectedOutput ?? ''));
  }
  a.linkTestCases(testCase);
  return res.json({ ok: true, testsConfigured: testCase.tests.length });
});

/** Solution key (multipart: file + fields) */
router.post('/assessments/:id/solution-key', upload.single('file'), (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });
  if (!req.file) return res.status(400).json({ error: 'file is required (form-data).' });

  const key = new SolutionKey({
    fileName: req.file.originalname,
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
  });
  if (req.body.releaseDate) {
    key.setReleaseDate(req.body.releaseDate);
  }
  a.attachSolutionKey(key);
  return res.json({ ok: true, state: key.getStateName(), releaseDate: key.releaseDate });
});

/** Evaluator: mark assessment complete (unlocks student-visible tests policy) */
router.patch('/assessments/:id/status', express.json(), (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });
  a.setStatus(req.body.status || 'marked');
  return res.json({ ok: true, status: a.status });
});

/** Student upload submission (PDF or CPP) */
router.post('/submissions', upload.single('file'), (req, res) => {
  const { assessmentId, studentId, type } = req.body;
  if (!assessmentId || !studentId || !type || !req.file) {
    return res.status(400).json({ error: 'assessmentId, studentId, type, and file are required.' });
  }
  if (type !== 'document' && type !== 'code') {
    return res.status(400).json({ error: "type must be 'document' or 'code'." });
  }

  const id = createSubmissionId();
  submissions.set(id, {
    id,
    assessmentId,
    studentId: String(studentId),
    type,
    fileName: req.file.originalname,
    buffer: req.file.buffer,
  });
  return res.status(201).json({ submissionId: id });
});

/** Evaluator-triggered autograde (separate from plagiarism) */
router.post('/autograde', upload.single('file'), async (req, res) => {
  try {
    const { assessmentId, studentId } = req.body;
    if (!assessmentId || !studentId || !req.file) {
      return res.status(400).json({ error: 'assessmentId, studentId, and file are required.' });
    }
    const assessment = assessments.get(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    if (assessment.type !== 'code') {
      return res.status(400).json({ error: 'Autograde applies to code assessments only.' });
    }
    if (!assessment.testCase) {
      return res.status(400).json({ error: 'No test cases linked. POST /assessments/:id/test-cases first.' });
    }

    const summary = await assessment.testCase.execute(
      req.file.buffer,
      assessment.rubric,
      assessment.marks
    );

    ensureStudentObserver(studentId);
    globalAutogradeSubject.notifyAutogradeComplete({
      assessmentId,
      studentId: String(studentId),
      summary,
      at: new Date().toISOString(),
    });

    return res.json({ ok: true, summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/** Student-visible tests (policy: only after marked) */
router.get('/assessments/:id/visible-tests', (req, res) => {
  const a = assessments.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assessment not found.' });
  if (!a.testCase) return res.status(400).json({ error: 'No test cases on this assessment.' });
  return res.json(a.testCase.showVisibleTests());
});

/** Download solution key — validates deadline + release state */
router.get('/assessments/:id/solution-key/download', (req, res) => {
  const userID = Number(req.query.userId || req.query.userID);
  if (!userID) return res.status(400).json({ error: 'userId query parameter required.' });
  const a = assessments.get(req.params.id);
  if (!a || !a.solutionKey) return res.status(404).json({ error: 'Solution key not found.' });
  try {
    const payload = a.solutionKey.downloadSolution(userID);
    res.setHeader('Content-Type', payload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
    return res.send(payload.buffer);
  } catch (err) {
    return res.status(403).json({ error: err.message, details: err.details });
  }
});

/** Plagiarism engine — compares target against full in-memory repository */
router.post('/plagiarism/run', express.json(), async (req, res) => {
  try {
    const { targetSubmissionId } = req.body;
    if (!targetSubmissionId) {
      return res.status(400).json({ error: 'targetSubmissionId is required.' });
    }
    const target = submissions.get(targetSubmissionId);
    if (!target) return res.status(404).json({ error: 'Submission not found.' });

    const repo = Array.from(submissions.values());
    const engine = new MatchResults();
    const report = await engine.runAnalysis(target, repo);
    return res.json({ ok: true, report: engine.getComparisonReport() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/** Observer demo: poll dashboard notifications for a student */
router.get('/students/:studentId/notifications', (req, res) => {
  const observer = ensureStudentObserver(req.params.studentId);
  return res.json({ studentId: req.params.studentId, notifications: observer.getNotifications() });
});

module.exports = router;
