const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const FileController = require('../controllers/fileController');
const { AuthService } = require('../server/singleton/AuthService');

const auth = AuthService.getInstance();

router.get(
    '/assessment/:assessmentId/question',
    auth.authorize(['student', 'evaluator']),
    FileController.downloadQuestion
);

router.get(
    '/assessment/:assessmentId/key',
    auth.authorize(['student', 'evaluator']),
    FileController.downloadSolutionKey
);

router.get(
    '/submission/:submissionId',
    auth.authorize(['evaluator']),
    FileController.downloadSubmission
);

router.post(
    '/upload',
    auth.authorize(['student']),
    upload.single('file'),
    FileController.uploadSubmission
);

module.exports = router;
