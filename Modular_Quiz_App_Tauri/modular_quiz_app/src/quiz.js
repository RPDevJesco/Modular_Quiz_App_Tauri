let currentQuestionIndex = 0;
let questions = []; // This will be populated either statically or by fetching from the backend
const selectedQuizName = localStorage.getItem('selectedQuizName');

document.addEventListener('DOMContentLoaded', async () => {
    if (selectedQuizName) {
        await loadQuestions(selectedQuizName); // Pass selectedQuizName here correctly
        if (questions.length > 0) {
            displayCurrentQuestion(0);
        }

        const btnPrevious = document.getElementById('btnPrevious');
        const btnNext = document.getElementById('btnNext');
        btnPrevious.addEventListener('click', navigatePrevious);
        btnNext.addEventListener('click', navigateNext);

    } else {
        console.error('Quiz name not specified');
    }
});

async function loadQuestions(quizName) { // Ensure this function accepts quizName as an argument
    try {
        // Correctly pass quizName as the argument to the command
        questions = await window.__TAURI__.invoke('load_quiz_data', { quizName });
        console.log(questions);
        return questions;
    } catch (error) {
        console.error('Failed to load quiz questions:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

function displayCurrentQuestion(index) {
    if (index < 0 || index >= questions.length) {
        console.error("Index out of bounds", index);
        return; // Exit the function if index is invalid
    }

    const question = questions[index];
    console.log(question); // Inspect the current question object

    if (!question) {
        console.error("Question is undefined", index);
        return; // Exit if question is undefined
    }

    const questionElement = document.getElementById('question');
    const answersElement = document.getElementById('answers');

    questionElement.textContent = question.questionText;
    answersElement.innerHTML = ''; // Clear previous answers

    question.answers.forEach((answer, i) => {
        const answerOption = document.createElement('input');
        const label = document.createElement('label');
        answerOption.type = 'radio';
        answerOption.name = 'answer';
        answerOption.value = i;
        label.appendChild(answerOption);
        label.append(answer);
        answersElement.appendChild(label);
    });
}

function navigatePrevious() {
    if (currentQuestionIndex > 0) {
        // Submit and evaluate the answer for the current question before navigating
        submitAnswer();
        currentQuestionIndex--;
        displayCurrentQuestion(currentQuestionIndex);
    }
}

function navigateNext() {
    // Always submit and evaluate the current answer before moving on or ending the quiz
    submitAnswer();

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion(currentQuestionIndex);
    } else {
        // The endQuiz function will handle the last question's answer submission
        endQuiz();
    }
}

function submitAnswer() {
    const currentQuestion = questions[currentQuestionIndex];
    // Reset userAnswers for the current question
    currentQuestion.userAnswers = [];

    document.querySelectorAll('#answers input').forEach((input, index) => {
        if (input.checked) {
            currentQuestion.userAnswers.push(parseInt(input.value));
        }
    });

    // Evaluate the answer for the current question
    evaluateAnswer(currentQuestion);
}

function evaluateAnswer(question) {
    if (question.isMultipleChoice) {
        // Assuming correctAnswerIndex is an array of correct answer indices
        const sortedUserAnswers = [...question.userAnswers].sort();
        const sortedCorrectAnswers = [...question.correctAnswerIndex].sort();
        question.isCorrect = JSON.stringify(sortedUserAnswers) === JSON.stringify(sortedCorrectAnswers);
    } else {
        // For single-choice questions, check if the single user answer matches one of the correct answers
        question.isCorrect = question.correctAnswerIndex.includes(question.userAnswers[0]);
    }
}

function generateScoreReport() {
    let correctAnswers = questions.filter(q => q.isCorrect).length;
    let incorrectAnswers = questions.length - correctAnswers;

    const resultsData = {
        totalQuestions: questions.length,
        correctAnswers: correctAnswers,
        incorrectAnswers: incorrectAnswers,
        // Optionally include detailed results for each question
        questions: questions.map(q => ({
            questionText: q.questionText,
            isCorrect: q.isCorrect,
            userAnswers: q.userAnswers, // Indices of user-selected answers
            correctAnswerIndices: q.correctAnswerIndex, // Indices of correct answers
        }))
    };

    // Store results in localStorage
    localStorage.setItem('quizResults', JSON.stringify(resultsData));
}

function endQuiz() {
    // Assuming submitAnswer() evaluates the current question's answer and updates `questions`
    submitAnswer(); // Make sure this function exists and is implemented correctly

    // Now generate the score report
    generateScoreReport();

    // Navigate to the results page where you can display the results
    window.location.href = 'result.html';
}