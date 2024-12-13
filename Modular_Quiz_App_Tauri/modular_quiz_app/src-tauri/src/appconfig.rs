#[derive(Clone, serde::Serialize)]
pub struct AppConfig {
    app_dir: PathBuf,
}

impl AppConfig {
    // Getter method for app_dir
    pub fn app_dir(&self) -> &PathBuf {
        &self.app_dir
    }
}