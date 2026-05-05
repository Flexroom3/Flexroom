import React, { useEffect, useState } from 'react';
import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';
import { fetchStudentClasses, joinClassByCode } from '../api/assignmentsApi';

const StudentDashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [classList, setClassList] = useState([]);
    const [loadErr, setLoadErr] = useState(null);
    const [classCode, setClassCode] = useState('');

    const refreshClasses = () => {
        fetchStudentClasses()
            .then((rows) =>
                setClassList(
                    rows.map((c) => ({
                        id: c.classID,
                        title: c.className,
                        evaluatorName: '—',
                    })),
                ),
            )
            .catch((e) => setLoadErr(e.message || 'Could not load classes'));
    };

    useEffect(() => {
        refreshClasses();
    }, []);

    const handleJoin = async () => {
        const code = String(classCode || '').trim();
        if (!code) {
            alert('Enter a class code.');
            return;
        }
        try {
            await joinClassByCode(code);
            setClassCode('');
            setShowModal(false);
            refreshClasses();
        } catch (e) {
            alert(e.message || 'Join failed');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Classes</h1>
                <button type="button" className={styles.addButton} onClick={() => setShowModal(true)}>
                    +
                </button>
            </div>

            {loadErr && <p style={{ color: '#c62828', padding: '0 20px' }}>{loadErr}</p>}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Join New Class</h2>
                        <input
                            type="text"
                            placeholder="Enter class code"
                            className={styles.modalInput}
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={handleJoin} className={styles.joinBtn}>
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {classList.map((cls) => (
                    <ClassCard key={cls.id} role="student" {...cls} />
                ))}
            </div>
        </div>
    );
};

export default StudentDashboard;
