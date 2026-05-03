import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PeoplePage.module.css';

const PeoplePage = () => {
    const navigate = useNavigate();
    const classesData = [
        {
            title: 'Operating Systems',
            section: 'BSCS-4J',
            students: [
                { id: 1, name: 'Anosha Asher' },
                { id: 2, name: 'Amal Fazeel' },
                { id: 3, name: 'Muhammad Ibrahim' },
                { id: 4, name: 'Faiqa Qureshi' },
            ]
        },
        {
            title: 'SDA',
            section: 'BSCS-4A',
            students: [
                { id: 1, name: 'Ali Ahsan' },
                { id: 2, name: 'Zainab Ali' },
                { id: 3, name: 'Mustafa Khan' },
            ]
        }
    ];

    return (
        <div className={styles.pageContainer}>
            {classesData.map((cls, index) => (
                <div key={index}>
                    {/* The new Header Background */}
                    <div className={styles.headerContainer}>
                        <h1 className={styles.classTitle}>{cls.title}</h1>
                        <p className={styles.sectionTitle}>{cls.section}</p>
                    </div>

                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>S.No#</th>
                                <th>Name</th>
                                <th style={{ width: '150px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cls.students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.id}.</td>
                                    <td>{student.name}</td>
                                    <td>
                                        <button 
                                            className={styles.linkButton}
                                            // Navigate to the progress route
                                            onClick={() => navigate(`/evaluator/progress/${student.id}`)}
                                        >
                                            View Progress
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default PeoplePage;