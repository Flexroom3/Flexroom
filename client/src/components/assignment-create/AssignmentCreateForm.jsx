// ... existing imports ...

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

    // ... rest of the component (return statement remains the same) ...
}