import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DocumentViewer.module.css';

function DocumentViewer({ submissionUrl, keyUrl, title }) {
    const [page, setPage] = useState(1);
    const totalPages = 6;
    const hasSub = Boolean(submissionUrl);
    const hasKey = Boolean(keyUrl);

    return (
        <div className={styles.viewerContainer}>
            <h2>{title}</h2>
            <div className={styles.dualPane}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>Submission</div>
                    <div className={styles.mediaFrame}>
                        {hasSub ? (
                            <iframe
                                title="Student submission"
                                src={submissionUrl}
                                className={styles.pdfFrame}
                            />
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className={`${styles.navBtn} ${styles.left}`}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className={`${styles.navBtn} ${styles.right}`}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight />
                                </button>
                                <div className={styles.pdfMock}>
                                    <p>No submission file</p>
                                    <p>
                                        Page {page} of {totalPages}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.pane}>
                    <div className={styles.paneHeader}>Key</div>
                    <div className={styles.mediaFrame}>
                        {hasKey ? (
                            <iframe title="Solution key" src={keyUrl} className={styles.pdfFrame} />
                        ) : (
                            <div className={styles.pdfMock}>
                                <p>No key loaded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocumentViewer;
