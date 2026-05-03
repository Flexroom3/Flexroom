import React from 'react';
import styles from './ClassCard.module.css'; // Assuming you use modules

const ClassCard = ({ title, evaluatorName, assignments = [] }) => {
    return (
        <div className={styles.card}>
            <div className={styles.topSection}>
                <div className={styles.cardInfo}>
                    <h3>{title}</h3>
                    <p>Evaluator: {evaluatorName}</p>
                </div>
            </div>

            <div className={styles.bottomSection}>
                <div className={styles.bottomSection}>
                    {assignments && assignments.length > 0 ? (
                        assignments.map((assignment) => (
                         <a 
                            key={assignment.id} 
                            href={`/assignments/${assignment.id}`} 
                            className={styles.assignmentLink}
                        >
                        <div className={styles.assignmentRow}>
                            <span className={styles.dueDate}>{assignment.dueDate}</span>
                            <span className={styles.assignmentTitle}>{assignment.title}</span>
                        </div>
                         </a>
                         ))
                      ) : (
                     <p className={styles.noAssignments}>No upcoming assignments</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default ClassCard;