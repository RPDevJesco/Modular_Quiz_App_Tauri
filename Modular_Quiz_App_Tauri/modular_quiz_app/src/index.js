document.addEventListener('DOMContentLoaded', async () => {
    try {
        // First, ensure quizzes are downloaded or exist locally
        await window.__TAURI__.invoke('download_quizzes_if_not_exists');
        // After ensuring quizzes are available, load them into the combo box
        await loadQuizzes();
    } catch (error) {
        console.error("Error ensuring quizzes are downloaded or loading them:", error);
    }

    const cmbQuizType = document.getElementById('cmbQuizType');
    const txtNumberOfQuestions = document.getElementById('txtNumberOfQuestions');
    const btnStartQuiz = document.getElementById('btnStartQuiz');

    // This function will fetch and display the quiz count for the selected quiz
    async function updateQuizCount(selectedQuizName) {
        console.log('selectedQuizName: ' + selectedQuizName)
        try {
            txtNumberOfQuestions.value = await window.__TAURI__.invoke('get_question_count', {
                quizName: selectedQuizName // Ensure this key matches the expected parameter in your Rust command
            }); // Update the input box with the number of questions
            txtNumberOfQuestions.style.color = 'black'; // Change the color back to black
        } catch (error) {
            console.error("Error fetching quiz count:", error);
            txtNumberOfQuestions.value = "Error"; // Indicate an error
        }
    }

    cmbQuizType.addEventListener('change', (event) => {
        const selectedQuizName = event.target.value; // Correctly get the selected option's value
        updateQuizCount(selectedQuizName); // Update the quiz count whenever the selection changes
    });

    btnStartQuiz.addEventListener('click', () => {
        const selectedQuizName = cmbQuizType.value;
        const numberOfQuestions = txtNumberOfQuestions.value;

        // Store selected quiz details in localStorage
        localStorage.setItem('selectedQuizName', selectedQuizName);
        localStorage.setItem('numberOfQuestions', numberOfQuestions);

        // Navigate to the quiz page
        window.location.href = 'quiz.html';
    });

    // Optionally, trigger updateQuizCount initially if you want to load the count for the first/default selected quiz
    if (cmbQuizType.value) {
        console.log('cmbQuizType.value: ' + cmbQuizType.value)
        updateQuizCount(cmbQuizType.value);
    }
});

const loadQuizzes = async () => {
    try {
        const quizzes = await window.__TAURI__.invoke('list_quizzes');
        const cmbQuizType = document.getElementById('cmbQuizType');

        // Clear existing options before adding new ones
        cmbQuizType.innerHTML = '';

        quizzes.forEach(quiz => {
            let option = document.createElement('option');
            option.textContent = quiz; // Ensure 'quiz' is just the name, not including '.json'
            option.value = quiz; // It's a good practice to also set the value
            cmbQuizType.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load quiz names:", error);
    }
};