use std::fs::{self, File};
use std::io::{Read, Write}; // Ensure Read is imported
use std::path::PathBuf;
use reqwest; // Async requests
use serde::{Deserialize, Serialize};
use serde_json;
use tauri::State; // Ensure State is correctly imported
use tauri::command;
use rand::seq::SliceRandom;
#[derive(Deserialize)]
struct GitHubFile {
    name: String,
}

#[derive(Clone, serde::Serialize)]
struct AppConfig {
    app_dir: PathBuf,
}

#[derive(Serialize, Deserialize, Debug)]
struct Quiz {
    questions: Vec<QuizQuestion>,
}

#[derive(Serialize, Deserialize, Debug)]
struct QuizQuestion {
    questionText: String,
    answers: Vec<String>,
    correctAnswerIndex: Vec<usize>,
}

#[derive(Deserialize, Debug)]
struct Repo {
    id: u64,
    name: String,
    full_name: String,
    description: Option<String>,
    // Add more fields as needed
}

async fn fetch_repo_data(owner: &str, repo: &str) -> Result<Repo, Error> {
    let url = format!("https://api.github.com/repos/{}/{}", owner, repo);
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "request")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await?;

    let repo_data = response.json::<Repo>().await?;
    Ok(repo_data)
}

#[command]
async fn download_quizzes_if_not_exists(config: State<'_, AppConfig>) -> Result<Vec<String>, String> {
    let quizzes_dir = config.app_dir.join("Quiz").join("Quizzes");

    // Ensure the quizzes directory exists
    if !quizzes_dir.exists() {
        fs::create_dir_all(&quizzes_dir).map_err(|e| e.to_string())?;
    } else {
        // Check if the directory is not empty (i.e., contains at least one quiz)
        let mut entries = fs::read_dir(&quizzes_dir).map_err(|e| e.to_string())?;
        if entries.next().is_some() {
            // If there's at least one entry, assume quizzes are present and skip download
            return Ok(vec![]);
        }
    }

    let quizzes_list = response.json::<Vec<GitHubFile>>().await.map_err(|e| e.to_string())?;
    let mut downloaded_quizzes = Vec::new();

    for file in quizzes_list {
        let quiz_name = file.name.strip_suffix(".json").unwrap_or(&file.name).to_string();
        let quiz_path = quizzes_dir.join(&file.name);

if !quiz_path.exists() {
            let download_url = format!("https://raw.githubusercontent.com/RPDevJesco/Modular_Quiz_App/main/Quiz/Quizzes/{}", &file.name);
            let content = client.get(&download_url)
                .header("User-Agent", "request")
                .send()
                .await
                .map_err(|e| e.to_string())?
                .text()
                .await
                .map_err(|e| e.to_string())?;

            let mut file = File::create(&quiz_path).map_err(|e| e.to_string())?;
            file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
        } else {
            downloaded_quizzes.push(quiz_name); // Ensure this line is outside the if block
        }
    }

    Ok(downloaded_quizzes)
}

#[command]
fn list_quizzes(config: State<'_, AppConfig>) -> Result<Vec<String>, String> {
    let quizzes_dir = config.app_dir.join("Quiz").join("Quizzes");
    let mut quizzes = Vec::new();

    // Check if the quizzes directory exists locally
    if quizzes_dir.exists() {
        // List the quiz files from the filesystem
        let entries = fs::read_dir(quizzes_dir).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.file_type().map_err(|e| e.to_string())?.is_file() {
                // Extract and add the quiz name to the list
                if let Some(name) = entry.file_name().to_str() {
                    quizzes.push(name.replace(".json", ""));
                }
            }
        }
    }
    Ok(quizzes)
}

#[command]
async fn get_question_count(config: State<'_, AppConfig>, quiz_name: String) -> Result<usize, String> {
    let quiz_path = config.app_dir.join("Quiz").join("Quizzes").join(format!("{quiz_name}.json"));
    println!("Attempting to access quiz at path: {:?}", quiz_path);

    if !quiz_path.exists() {
        println!("File does not exist at path: {:?}", quiz_path);
        return Err("Quiz file does not exist".to_string());
    } else {
        println!("File found. Attempting to open...");
        // Attempt to open and read the quiz file
        let mut file = match File::open(&quiz_path) {
            Ok(file) => file,
            Err(_) => return Err("Failed to open quiz file".to_string()),
        };

        let mut contents = String::new();
        if let Err(_) = file.read_to_string(&mut contents) {
            return Err("Failed to read quiz file".to_string());
        }

        // Directly deserialize the JSON array into a Vec<QuizQuestion>
        let questions: Vec<QuizQuestion> = match serde_json::from_str(&contents) {
            Ok(questions) => questions,
            Err(e) => return Err(format!("Failed to parse quiz content: {}", e)),
        };

        // Return the total count of questions
        Ok(questions.len())
    }
}

#[command]
async fn load_quiz_data(config: State<'_, AppConfig>, quiz_name: String) -> Result<Vec<QuizQuestion>, String> {
    let quiz_path = config.app_dir.join("Quiz").join("Quizzes").join(format!("{quiz_name}.json"));
    println!("Attempting to access quiz at path: {:?}", quiz_path);

    if !quiz_path.exists() {
        println!("File does not exist at path: {:?}", quiz_path);
        return Err("Quiz file does not exist".to_string());
    }

    let mut file = match File::open(&quiz_path) {
        Ok(file) => file,
        Err(_) => return Err("Failed to open quiz file".to_string()),
    };

    let mut contents = String::new();
    if let Err(_) = file.read_to_string(&mut contents) {
        return Err("Failed to read quiz file".to_string());
    }

    let mut questions: Vec<QuizQuestion> = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse quiz content: {}", e))?;

    // Correctly call shuffle_questions with a mutable reference
    shuffle_questions(&mut questions);

    // No need to assign the result of shuffle_questions to a variable
    Ok(questions)
}

fn shuffle_questions(questions: &mut Vec<QuizQuestion>) {
    let mut rng = rand::thread_rng();
    questions.shuffle(&mut rng);
}

fn main() {
    let context = tauri::generate_context!();
    let app_data_dir = tauri::api::path::app_data_dir(context.config())
        .expect("failed to get app data dir");

    tauri::Builder::default()
        .manage(AppConfig { app_dir: app_data_dir })
        .invoke_handler(tauri::generate_handler![download_quizzes_if_not_exists, list_quizzes, get_question_count, load_quiz_data])
        .run(context)
        .expect("error while running tauri application");
}