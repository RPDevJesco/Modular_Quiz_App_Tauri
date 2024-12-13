use reqwest::blocking::Client;
use serde::Deserialize;
use std::error::Error;

#[derive(Deserialize, Debug)]
pub struct Content {
    pub name: String,
    pub path: String,
    pub content: Option<String>,
    pub encoding: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct RepoItem {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub item_type: String,
}

pub fn fetch_file_content(owner: &str, repo: &str, path: &str) -> Result<String, Box<dyn Error>> {
    let url = format!("https://api.github.com/repos/{}/{}/contents/{}", owner, repo, path);
    let client = Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "request")
        .header("Accept", "application/vnd.github.v3.raw")
        .send()?;

    if response.status().is_success() {
        let content = response.text()?; // Directly read the response body as text
        Ok(content)
    } else {
        Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, "Failed to fetch file")))
    }
}

pub fn list_repo_contents(owner: &str, repo: &str) -> Result<Vec<RepoItem>, Box<dyn Error>> {
    let url = format!("https://api.github.com/repos/{}/{}/contents", owner, repo);
    let client = reqwest::blocking::Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "request")
        .send()?;

    let contents = response.json::<Vec<RepoItem>>()?;
    Ok(contents)
}