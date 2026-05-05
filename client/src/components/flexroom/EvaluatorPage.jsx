import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import Layout from './Layout';
import { fetchClassAssessments } from '../../api/assignmentsApi';

function readDisplayName() {
    try {
        const ev = window.localStorage.getItem('flexroomDisplayNameEvaluator');
        if (ev && ev.trim()) return ev.trim();
        const raw = sessionStorage.getItem('flexroom_user');
        if (raw) {
            const u = JSON.parse(raw);
            if (u?.name) return u.name;
        }
        const generic = window.localStorage.getItem('flexroomDisplayName');
        if (generic && generic.trim()) return generic.trim();
    } catch (_) {}
    return 'Hayyan';
}

function CourseBanner() {
    return (
        <div className="fr-course-banner">
            <h2>Class</h2>
            <p>Assignments for this course</p>
        </div>
    );
}

function EvaluatorModal({ open, onClose }) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="fr-modal-backdrop d-flex align-items-center justify-content-center p-3"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white border rounded shadow" style={{ width: '100%', maxWidth: 400 }}>
                <div
                    className="px-4 py-3 text-white d-flex justify-content-between align-items-center"
                    style={{ background: '#7d8b63' }}
                >
                    <h2 className="h6 mb-0">Select Assessment Type</h2>
                    <button onClick={onClose} className="btn-close btn-close-white" aria-label="Close" />
                </div>
                <div className="p-4 d-grid gap-3">
                    <Link
                        to="/create-code-assignment"
                        className="btn btn-outline-dark py-3 d-flex flex-column align-items-center"
                        style={{ borderColor: '#7d8b63' }}
                        onClick={onClose}
                    >
                        <strong>Upload Coding Assessment</strong>
                        <small className="text-muted">Automated test cases & scripts</small>
                    </Link>

                    <Link
                        to="/create-doc-assignment"
                        className="btn btn-outline-dark py-3 d-flex flex-column align-items-center"
                        style={{ borderColor: '#7d8b63' }}
                        onClick={onClose}
                    >
                        <strong>Upload Doc Assessment</strong>
                        <small className="text-muted">Instruction manuals or PDFs</small>
                    </Link>

                    <button type="button" onClick={onClose} className="btn btn-light border mt-2">
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function EvaluatorPage({ displayName: displayNameProp } = {}) {
    const resolvedName = displayNameProp?.trim() || readDisplayName();
    const [modalOpen, setModalOpen] = useState(false);
    const { id: classId } = useParams();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (!classId) return;
        setLoading(true);
        setLoadError(null);
        fetchClassAssessments(Number(classId))
            .then(setRows)
            .catch((e) => setLoadError(e.message || 'Could not load assessments'))
            .finally(() => setLoading(false));
    }, [classId]);

    return (
        <Layout sidebarVariant="evaluator" displayName={resolvedName} defaultSidebarOpen={true}>
            <CourseBanner />

            <div className="fr-page-pad fr-evaluator-page">
                <div className="d-flex align-items-center justify-content-between mb-4 fr-evaluator-toolbar">
                    <Link to="/evaluator" className="text-dark">
                        <ArrowLeft size={24} />
                    </Link>
                    <button type="button" onClick={() => setModalOpen(true)} className="btn border-0">
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                </div>

                {loadError && <p className="text-danger mb-2">{loadError}</p>}
                {loading && <p>Loading assignments…</p>}

                <div className="fr-eval-table-wrap">
                    <table
                        className="table mb-0 fr-eval-table"
                        style={{ borderCollapse: 'collapse', border: '1px solid black' }}
                    >
                        <colgroup>
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '46%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background: '#b7b7a4' }}>
                                <th style={{ border: '1px solid black', padding: '10px 14px' }}>S.No#</th>
                                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Title</th>
                                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Submitted</th>
                                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Left</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                rows.map((row, i) => {
                                    const submitted = row.submitted ?? 0;
                                    const left =
                                        row.numStudents != null
                                            ? Math.max(0, row.numStudents - submitted)
                                            : '—';
                                    return (
                                        <tr key={row.assessmentID} style={{ background: '#e9ecef' }}>
                                            <td
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '10px 14px',
                                                    color: '#2a2d26',
                                                }}
                                            >
                                                {i + 1}.
                                            </td>
                                            <td
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '10px 14px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                <Link
                                                    to={`/evaluator/submissions/${row.assessmentID}`}
                                                    style={{ color: '#2a2d26', textDecoration: 'none' }}
                                                >
                                                    {row.title}
                                                </Link>
                                            </td>
                                            <td
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '10px 14px',
                                                    color: '#2a2d26',
                                                }}
                                            >
                                                {submitted}
                                            </td>
                                            <td
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '10px 14px',
                                                    color: '#2a2d26',
                                                }}
                                            >
                                                {left}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            <EvaluatorModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </Layout>
    );
}

export default EvaluatorPage;
