import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { postCreateAssessment } from '../../api/assignmentsApi';
import styles from './AssignmentCreateForm.module.css';

function newId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDisplayDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function PdfDropzone({ label, file, onChange, inputId }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = (f) => {
        if (f && f.type === 'application/pdf') onChange(f);
    };

    return (
        <div className={styles.dropSection}>
            <div className={styles.dropLabel}>{label}</div>
            <div
                className={`${styles.dropZone} ${isDragActive ? styles.dropZoneActive : ''}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFile(e.dataTransfer.files[0]);
                    }
                }}
                onClick={() => inputRef.current?.click()}
            >
                <input 
                    type="file" 
                    accept="application/pdf" 
                    ref={inputRef} 
                    id={inputId} 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <p className={styles.dropHint}>Drag and Drop</p>
                <button type="button" className={styles.selectBtn}>
                    Select from PC
                </button>
                {file && <div className={styles.fileName}>{file.name}</div>}
            </div>
        </div>
    );
}

function isRubricComplete(items) {
    if (!items.length) return false;
    return items.every((r) => String(r.description || '').trim() !== '' && Number(r.marks) > 0);
}

function isTestCasesComplete(items) {
    if (!items.length) return false;
    return items.every((t) => String(t.inputText || '').trim() !== '' && Number(t.marks) > 0);
}

/**
 * @param {{ variant: 'document' | 'code' }} props
 */
export default function AssignmentCreateForm({ variant }) {
    // ... existing state and hooks ...

    const handleCreateAssignment = async () => {
        if (!canSubmit || submitting) return;
        setError(null);
        setSuccess(false);
        setSubmitting(true);

        try {
            // 1. Prepare FormData for multipart/form-data submission
            const formData = new FormData();
            
            // Basic Info
            formData.append('title', title.trim());
            formData.append('dueDate', dueDate);
            formData.append('assessmentType', variant === 'code' ? 'code' : 'document');
            formData.append('courseTitle', defaults.courseTitle);
            formData.append('courseCode', defaults.courseCode);
            formData.append('role', 'evaluator'); // Identifies this as an instructor upload

            if (totalMarks.trim() !== '') {
                formData.append('totalMarks', totalMarks.trim());
            }

            // 2. Append JSON data as strings
            formData.append(
                'rubric',
                JSON.stringify(
                    rubricItems.map((r, i) => ({
                        order: i + 1,
                        description: r.description.trim(),
                        marks: Number(r.marks),
                    }))
                )
            );

            if (variant === 'code') {
                formData.append(
                    'testCases',
                    JSON.stringify(
                        testCases.map((t, i) => ({
                            order: i + 1,
                            input: t.inputText.trim(),
                            marks: Number(t.marks),
                        }))
                    )
                );
            }

            // 3. Append the binary Files
            // These must match the field names expected by your Multer middleware
            if (questionPdf) {
                formData.append('questionPdf', questionPdf);
            }
            
            if (solutionKey) {
                formData.append('solutionKey', solutionKey);
            }

            // 4. Send to the API
            // Note: We use postCreateAssessment which should handle the Axios/Fetch POST
            await postCreateAssessment(formData);

            setSuccess(true);
            window.setTimeout(() => {
                navigate('/evaluator', { replace: true });
            }, 900);

        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                'Could not create assignment. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const titleDisplay = title.trim() === '' ? 'Add title' : title;

    return (
        <div className={styles.page}>
            {error && <div className={styles.bannerError}>{error}</div>}
            {success && (
                <div className={styles.bannerSuccess}>
                    Assignment created. Returning to your class dashboard…
                </div>
            )}

            <div className={styles.grid}>
                <section className={styles.mainCard}>
                    <div className={styles.titleRow}>
                        {!titleActive ? (
                            <button
                                type="button"
                                className={styles.titlePlaceholder}
                                onClick={() => setTitleActive(true)}
                            >
                                {titleDisplay}
                            </button>
                        ) : (
                            <input
                                className={styles.titleInput}
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => setTitleActive(false)}
                                placeholder="Assignment title"
                                aria-label="Assignment title"
                            />
                        )}

                        {!dueActive ? (
                            <button
                                type="button"
                                className={styles.duePlaceholder}
                                onClick={() => setDueActive(true)}
                            >
                                {dueDate ? dueDateLabel : 'Add due date'}
                            </button>
                        ) : (
                            <input
                                type="date"
                                className={styles.dueInput}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                onBlur={() => setDueActive(false)}
                                aria-label="Due date"
                            />
                        )}
                    </div>

                    <div className={styles.metaRow}>
                        <span>{evaluatorName}</span>
                        <span>{todayLabel}</span>
                        {!marksActive ? (
                            <button
                                type="button"
                                className={styles.marksBtn}
                                onClick={() => setMarksActive(true)}
                            >
                                {totalMarks.trim() !== '' ? `Marks: ${totalMarks}` : 'Add marks'}
                            </button>
                        ) : (
                            <input
                                className={styles.marksInput}
                                type="number"
                                min={0}
                                placeholder="Marks"
                                value={totalMarks}
                                onChange={(e) => setTotalMarks(e.target.value)}
                                onBlur={() => setMarksActive(false)}
                                aria-label="Total marks"
                            />
                        )}
                    </div>

                    <PdfDropzone
                        label="Add question PDF"
                        file={questionPdf}
                        onChange={setQuestionPdf}
                        inputId="question-pdf"
                    />
                    <PdfDropzone
                        label="Add key"
                        file={solutionKey}
                        onChange={setSolutionKey}
                        inputId="solution-key"
                    />

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.addBtn}
                            disabled={!canSubmit || submitting}
                            onClick={handleCreateAssignment}
                        >
                            Add
                            {submitting && <span className={styles.loading}>Saving…</span>}
                        </button>
                    </div>
                </section>

                <aside className={styles.sideStack}>
                    <div className={styles.panel}>
                        <div className={styles.panelHead}>Rubric</div>
                        <div className={styles.panelBody}>
                            {rubricItems.map((row, index) => (
                                <div key={row.id} className={styles.rubricRow}>
                                    <div className={styles.badge}>+{row.marks || '…'}</div>
                                    <div className={styles.rowFields}>
                                        <input
                                            className={styles.rowInput}
                                            placeholder="Add description"
                                            value={row.description}
                                            onChange={(e) => updateRubric(row.id, { description: e.target.value })}
                                        />
                                        <input
                                            className={styles.rowMarks}
                                            type="number"
                                            min={1}
                                            placeholder="Marks"
                                            value={row.marks}
                                            onChange={(e) => updateRubric(row.id, { marks: e.target.value })}
                                            aria-label={`Rubric ${index + 1} marks`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.addRowBtn}
                                onClick={addRubricRow}
                                aria-label="Add rubric criterion"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {variant === 'code' && (
                        <div className={styles.panel}>
                            <div className={styles.panelHead}>Test Cases</div>
                            <div className={styles.panelBody}>
                                {testCases.map((row, index) => (
                                    <div key={row.id} className={styles.testRow}>
                                        <div className={styles.badge}>{index + 1}</div>
                                        <div className={styles.rowFields}>
                                            <input
                                                className={styles.rowInput}
                                                placeholder="e.g. x = 3, y = -2"
                                                value={row.inputText}
                                                onChange={(e) =>
                                                    updateTestCase(row.id, { inputText: e.target.value })
                                                }
                                            />
                                            <input
                                                className={styles.rowMarks}
                                                type="number"
                                                min={1}
                                                placeholder="Marks"
                                                value={row.marks}
                                                onChange={(e) => updateTestCase(row.id, { marks: e.target.value })}
                                                aria-label={`Test case ${index + 1} marks`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className={styles.addRowBtn}
                                    onClick={addTestCaseRow}
                                    aria-label="Add test case"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}