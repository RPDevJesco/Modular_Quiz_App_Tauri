document.addEventListener('DOMContentLoaded', () => {
    displayResults();

    const btnBackToMain = document.getElementById('btnBackToMain');
    btnBackToMain.addEventListener('click', backToMainPage);
});

function backToMainPage() {
    window.location.href = 'index.html';
}

function displayResults() {
    const resultsData = JSON.parse(localStorage.getItem('quizResults'));
    if (!resultsData) {
        console.error('No results data found.');
        return;
    }

    const resultsPanel = document.getElementById('resultsPanel');

    // Summary information
    const summary = document.createElement('div');
    summary.innerHTML = `<strong>Total Questions:</strong> ${resultsData.totalQuestions}<br>
                         <strong>Correct Answers:</strong> ${resultsData.correctAnswers}<br>
                         <strong>Incorrect Answers:</strong> ${resultsData.incorrectAnswers}`;
    resultsPanel.appendChild(summary);

    // Filter and display only incorrect answers
    resultsData.questions.forEach((question, index) => {
        if (!question.isCorrect) { // Display only if the question was answered incorrectly
            const detail = document.createElement('div');
            detail.classList.add('result');
            const userAnswerText = question.userAnswers ? question.userAnswers.map(idx => `Answer ${idx + 1}`).join(", ") : "No Answer";
            const correctAnswerText = question.correctAnswerIndices.map(idx => `Answer ${idx + 1}`).join(", ");

            detail.innerHTML = `<strong>Question ${index + 1}:</strong> ${question.questionText}<br>
                                <strong>Your Answer:</strong> ${userAnswerText}<br>
                                <strong>Correct Answer:</strong> ${correctAnswerText}<br>
                                <strong>Status:</strong> Incorrect`;
            detail.style.color = 'red'; // Highlight incorrect answers
            resultsPanel.appendChild(detail);
        }
    });
}