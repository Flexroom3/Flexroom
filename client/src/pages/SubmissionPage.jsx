import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PeoplePage.module.css';
import { fetchAssessmentSubmissions } from '../api/assignmentsApi';

const SubmissionsPage = () => {
    const navigate = useNavigate();
    const { id: assessmentId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!assessmentId) return;
        setLoading(true);
        setError(null);
        fetchAssessmentSubmissions(assessmentId)
            .then(setSubmissions)
            .catch((e) => setError(e.message || 'Failed to load submissions'))
            .finally(() => setLoading(false));
    }, [assessmentId]);

    const handleRowClick = (row) => {
        navigate(`/evaluator/evaluate/${assessmentId}/${row.studentId}`, {
            state: {
                type: 'document',
                submissionId: row.submissionId,
            },
        });
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <p>Loading submissions…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.pageContainer}>
                <p style={{ color: '#c62828' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.headerContainer}>
                <h1 className={styles.classTitle}>Submissions</h1>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>S.No#</th>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((row, idx) => (
                        <tr
                            key={row.submissionId}
                            onClick={() => handleRowClick(row)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{idx + 1}.</td>
                            <td>{row.studentName}</td>
                            <td>{row.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {submissions.length === 0 && <p>No submissions yet.</p>}
        </div>
    );
};

export default SubmissionsPage;
