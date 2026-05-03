/**
 * Plagiarism engine — Template Method pattern:
 * extract -> (pairwise) compare -> flag/report.
 * Separate from autograding (TestCase / CodeExecutionService).
 */
const { PDFParse } = require('pdf-parse');
const { compareTwoStrings } = require('string-similarity');

class MatchResults {
  constructor() {
    /** @type {object | null} */
    this._lastReport = null;
  }

  /**
   * Template method: run full repository comparison for one target.
   * @param {{ id: string|number; type: 'document'|'code'; fileName: string; buffer: Buffer }} targetSubmission
   * @param {Array<{ id: string|number; type: 'document'|'code'; fileName: string; buffer: Buffer }>} repository
   */
  async runAnalysis(targetSubmission, repository) {
    const targetText = await this.extract(targetSubmission);
    const comparisons = [];

    for (const source of repository) {
      if (String(source.id) === String(targetSubmission.id)) continue;
      if (source.type !== targetSubmission.type) continue;

      const sourceText = await this.extract(source);
      const percentage = this.calculateSimilarityFromText(targetText, sourceText);
      comparisons.push({
        targetId: targetSubmission.id,
        sourceId: source.id,
        similarityPercentage: percentage,
        flagged: this.generateFlagStatus(percentage),
      });
    }

    this._lastReport = {
      targetId: targetSubmission.id,
      generatedAt: new Date().toISOString(),
      comparisons,
    };
    return this._lastReport;
  }

  /**
   * Step 1 — Extract textual content for comparison.
   * @param {{ type: 'document'|'code'; fileName: string; buffer: Buffer }} submission
   */
  async extract(submission) {
    if (submission.type === 'document') {
      const lower = (submission.fileName || '').toLowerCase();
      if (lower.endsWith('.pdf')) {
        const parser = new PDFParse({ data: submission.buffer });
        try {
          const data = await parser.getText();
          return (data.text || '').replace(/\s+/g, ' ').trim();
        } finally {
          await parser.destroy();
        }
      }
      return submission.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
    }

    if (submission.type === 'code') {
      return submission.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
    }

    return submission.buffer.toString('utf8');
  }

  /**
   * Step 2 — Similarity metric (string-similarity Dice coefficient).
   * @param {string|Buffer} targetContent
   * @param {string|Buffer} sourceContent
   */
  calculateSimilarity(targetContent, sourceContent) {
    const a = Buffer.isBuffer(targetContent) ? targetContent.toString('utf8') : String(targetContent);
    const b = Buffer.isBuffer(sourceContent) ? sourceContent.toString('utf8') : String(sourceContent);
    return this.calculateSimilarityFromText(a, b);
  }

  /**
   * @param {string} targetText
   * @param {string} sourceText
   * @returns {number} percentage 0-100
   */
  calculateSimilarityFromText(targetText, sourceText) {
    const A = (targetText || '').trim();
    const B = (sourceText || '').trim();
    if (!A.length && !B.length) return 0;
    const sim = compareTwoStrings(A, B);
    return Math.round(sim * 10000) / 100;
  }

  /**
   * Step 3 — Flag if similarity exceeds policy threshold (aligns with SQL computed column in schema).
   * @param {number} percentage
   */
  generateFlagStatus(percentage) {
    return percentage > 30;
  }

  getComparisonReport() {
    if (!this._lastReport) {
      return { message: 'No plagiarism analysis has been executed yet.' };
    }
    return this._lastReport;
  }
}

module.exports = { MatchResults };
