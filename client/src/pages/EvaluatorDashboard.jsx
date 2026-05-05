import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';
import { fetchEvaluatorClasses } from '../api/assignmentsApi';

const EvaluatorDashboard = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [evaluatorClassList, setEvaluatorClassList] = useState([]);
    const [loadErr, setLoadErr] = useState(null);

    const [classTitle, setClassTitle] = useState('');
    const [section, setSection] = useState('');

    useEffect(() => {
        fetchEvaluatorClasses()
            .then((rows) =>
                setEvaluatorClassList(
                    rows.map((c) => ({
                        id: c.classID,
                        title: c.className,
                        section: String(c.classCode),
                        assignments: [],
                    })),
                ),
            )
            .catch((e) => setLoadErr(e.message || 'Could not load classes'));
    }, []);

    const handleCreateClass = () => {
        console.log('Creating:', classTitle, section);
        setShowModal(false);
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Evaluated Classes</h1>
                <button type="button" className={styles.addButton} onClick={() => setShowModal(true)}>
                    +
                </button>
            </div>

            {loadErr && <p style={{ color: '#c62828', padding: '0 20px' }}>{loadErr}</p>}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Create New Class</h2>
                        <input
                            type="text"
                            placeholder="Class Title"
                            className={styles.modalInput}
                            value={classTitle}
                            onChange={(e) => setClassTitle(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Section (e.g. BCS-4J)"
                            className={styles.modalInput}
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={handleCreateClass} className={styles.joinBtn}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {evaluatorClassList.map((cls) => (
                    <div
                        key={cls.id}
                        onClick={() => navigate(`/evaluator/class/${cls.id}`)}
                        style={{ cursor: 'pointer' }}
                        role="presentation"
                    >
                        <ClassCard
                            role="evaluator"
                            title={cls.title}
                            section={cls.section}
                            assignments={cls.assignments}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvaluatorDashboard;
