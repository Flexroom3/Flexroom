const express = require('express');
const sql = require('mssql');
const upload = require('../middleware/upload');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const { AuthService } = require('../server/singleton/AuthService');

const router = express.Router();
const auth = AuthService.getInstance();

/** Create Assessment (VARBINARY PDFs in SQL) */
router.post(
    '/assessments',
    auth.authorize(['evaluator']),
    upload.fields([
        { name: 'questionPdf', maxCount: 1 },
        { name: 'solutionKey', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { type, title, totalMarks, dueDate, classId, rubric, testCases } = req.body;

            const parsedRubric = rubric ? JSON.parse(rubric) : [];
            const parsedTestCases = testCases ? JSON.parse(testCases) : [];

            const questionFile = req.files['questionPdf'] ? req.files['questionPdf'][0] : null;
            const solutionFile = req.files['solutionKey'] ? req.files['solutionKey'][0] : null;

            const pool = await ConnectionManager.getInstance().getPool();

            const result = await pool.request()
                .input('classID', sql.Int, classId || 1)
                .input('title', sql.NVarChar, title)
                .input('type', sql.NVarChar, type || 'document')
                .input('marks', sql.Int, totalMarks)
                .input('dueDate', sql.NVarChar, dueDate || null)
                .input('qContent', sql.VarBinary(sql.MAX), questionFile ? questionFile.buffer : null)
                .input('sContent', sql.VarBinary(sql.MAX), solutionFile ? solutionFile.buffer : null)
                .query(`
                    INSERT INTO Assessment (classID, title, type, marks, uploadingDate, dueDate, status, questionFile, solutionFile)
                    OUTPUT INSERTED.assessmentID
                    VALUES (@classID, @title, @type, @marks, CONVERT(NVARCHAR(20), GETDATE(), 23), @dueDate, 'unmarked', @qContent, @sContent)
                `);

            const newId = result.recordset[0].assessmentID;

            void parsedRubric;
            void parsedTestCases;

            return res.status(201).json({
                assessmentID: newId,
                title,
                message: 'Assessment and Files saved to Database',
            });
        } catch (err) {
            console.error('Creation Error:', err);
            return res.status(500).json({ error: err.message });
        }
    }
);

/** Assessments in a class — students must be enrolled */
router.get('/classes/:classId/assessments', auth.authorize(['student', 'evaluator']), async (req, res) => {
    try {
        const classId = Number(req.params.classId);
        const pool = await ConnectionManager.getInstance().getPool();

        if (req.user.role === 'student') {
            const check = await pool.request()
                .input('uid', sql.Int, req.user.userId)
                .input('cid', sql.Int, classId)
                .query('SELECT 1 AS ok FROM ClassEnrollment WHERE userID = @uid AND classID = @cid');
            if (!check.recordset.length) {
                return res.status(403).json({ error: 'Not enrolled in this class' });
            }
        }

        const list = await pool.request()
            .input('cid', sql.Int, classId)
            .query(`
                SELECT 
                    a.assessmentID,
                    a.classID,
                    a.title,
                    a.type,
                    a.marks,
                    a.uploadingDate,
                    a.dueDate,
                    a.status,
                    cc.numStudents,
                    (
                        SELECT COUNT(*)
                        FROM Submissions s
                        WHERE s.AssignmentID = a.assessmentID
                    ) AS submitted
                FROM Assessment a
                INNER JOIN CourseClass cc ON cc.classID = a.classID
                WHERE a.classID = @cid
                ORDER BY a.assessmentID
            `);

        return res.json(list.recordset);
    } catch (err) {
        console.error('classes/:classId/assessments:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Evaluator: submissions for an assessment */
router.get('/assessments/:assessmentId/submissions', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const assessmentId = Number(req.params.assessmentId);
        const pool = await ConnectionManager.getInstance().getPool();

        const result = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .query(`
                SELECT 
                    s.SubmissionID AS submissionId,
                    s.Status AS status,
                    u.Name AS studentName,
                    s.StudentID AS studentId
                FROM Submissions s
                INNER JOIN Users u ON u.UserID = s.StudentID
                WHERE s.AssignmentID = @aid
                ORDER BY u.Name
            `);

        return res.json(result.recordset);
    } catch (err) {
        console.error('assessments/:assessmentId/submissions:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
