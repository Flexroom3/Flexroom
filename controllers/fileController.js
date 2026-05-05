const sql = require('mssql');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');

function sanitizeFilename(name) {
    if (!name || typeof name !== 'string') return 'download.pdf';
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'download.pdf';
}

function parseAssessmentDueDate(dueDateRaw) {
    if (dueDateRaw == null || dueDateRaw === '') return null;
    const d = new Date(dueDateRaw);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Midnight UTC of due date for same-calendar-day comparison */
function isBeforeDeadlineDay(now, due) {
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return nowDay < dueDay;
}

async function fetchAssessmentRow(pool, assessmentId) {
    const result = await pool.request()
        .input('aid', sql.Int, assessmentId)
        .query(`
            SELECT 
                assessmentID,
                classID,
                title,
                dueDate,
                questionFile,
                solutionFile
            FROM Assessment
            WHERE assessmentID = @aid
        `);
    return result.recordset[0] || null;
}

function pickSolutionBuffer(row) {
    if (row.solutionFile && row.solutionFile.length) return row.solutionFile;
    return null;
}

function pickSolutionFilename(row, fallbackTitle) {
    return `${fallbackTitle || 'solution'}_key.pdf`;
}

async function assertStudentEnrolled(pool, userId, classId) {
    const r = await pool.request()
        .input('uid', sql.Int, userId)
        .input('cid', sql.Int, classId)
        .query('SELECT 1 AS ok FROM ClassEnrollment WHERE userID = @uid AND classID = @cid');
    return r.recordset.length > 0;
}

const FileController = {
    async downloadQuestion(req, res) {
        try {
            const { assessmentId } = req.params;
            const pool = await ConnectionManager.getInstance().getPool();
            const row = await fetchAssessmentRow(pool, Number(assessmentId));

            if (!row || !row.questionFile || !row.questionFile.length) {
                return res.status(404).json({ error: 'Question paper not found' });
            }

            const role = req.user?.role;
            if (role === 'student') {
                const ok = await assertStudentEnrolled(pool, req.user.userId, row.classID);
                if (!ok) {
                    return res.status(403).json({ error: 'You are not enrolled in this class' });
                }
            }

            const name = sanitizeFilename(`${row.title || 'assessment'}_question.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
            return res.send(Buffer.from(row.questionFile));
        } catch (err) {
            console.error('downloadQuestion:', err);
            return res.status(500).json({ error: err.message });
        }
    },

    async downloadSolutionKey(req, res) {
        try {
            const { assessmentId } = req.params;
            const pool = await ConnectionManager.getInstance().getPool();
            const row = await fetchAssessmentRow(pool, Number(assessmentId));

            if (!row) {
                return res.status(404).json({ error: 'Assessment not found' });
            }

            const buf = pickSolutionBuffer(row);
            if (!buf || !buf.length) {
                return res.status(404).json({ error: 'Solution key not available' });
            }

            const role = req.user?.role;
            if (role === 'student') {
                const ok = await assertStudentEnrolled(pool, req.user.userId, row.classID);
                if (!ok) {
                    return res.status(403).json({ error: 'You are not enrolled in this class' });
                }
            }
            const due = parseAssessmentDueDate(row.dueDate);
            if (role === 'student' && due != null && isBeforeDeadlineDay(new Date(), due)) {
                return res.status(403).json({ error: 'Solution key is available on or after the due date' });
            }

            const name = sanitizeFilename(pickSolutionFilename(row, row.title));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
            return res.send(Buffer.from(buf));
        } catch (err) {
            console.error('downloadSolutionKey:', err);
            return res.status(500).json({ error: err.message });
        }
    },

    async downloadSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const pool = await ConnectionManager.getInstance().getPool();

            const result = await pool.request()
                .input('sid', sql.Int, Number(submissionId))
                .query(`
                    SELECT FileName, FileContent
                    FROM Submissions
                    WHERE SubmissionID = @sid
                `);

            const row = result.recordset[0];
            if (!row || !row.FileContent || !row.FileContent.length) {
                return res.status(404).json({ error: 'Submission file not found' });
            }

            const ext = (row.FileName && row.FileName.includes('.'))
                ? row.FileName.split('.').pop().toLowerCase()
                : '';
            const isPdf = ext === 'pdf';
            const name = sanitizeFilename(row.FileName || `submission_${submissionId}.${ext || 'bin'}`);
            res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${name}"`);
            return res.send(Buffer.from(row.FileContent));
        } catch (err) {
            console.error('downloadSubmission:', err);
            return res.status(500).json({ error: err.message });
        }
    },

    async uploadSubmission(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const assignmentId = Number(req.body.assignmentId);
            if (!assignmentId) {
                return res.status(400).json({ error: 'assignmentId is required' });
            }

            const pool = await ConnectionManager.getInstance().getPool();
            const studentId = req.user.userId;
            const fileName = req.file.originalname || 'submission.bin';

            await pool.request()
                .input('aid', sql.Int, assignmentId)
                .input('sid', sql.Int, studentId)
                .input('fn', sql.NVarChar, fileName)
                .input('fc', sql.VarBinary(sql.MAX), req.file.buffer)
                .query(`
                    INSERT INTO Submissions (AssignmentID, StudentID, FileName, FileContent, Status)
                    VALUES (@aid, @sid, @fn, @fc, 'On-Time')
                `);

            return res.status(201).json({ message: 'Submission saved' });
        } catch (err) {
            console.error('uploadSubmission:', err);
            return res.status(500).json({ error: err.message });
        }
    },
};

module.exports = FileController;
