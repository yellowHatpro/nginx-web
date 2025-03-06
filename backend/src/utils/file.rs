use anyhow::{Context, Result};
use std::fs;
use std::path::Path;

/// Read a file and return its contents as a string
pub fn read_file<P: AsRef<Path>>(path: P) -> Result<String> {
    fs::read_to_string(&path).with_context(|| format!("Failed to read file: {:?}", path.as_ref()))
}

/// Write a string to a file
pub fn write_file<P: AsRef<Path>>(path: P, content: &str) -> Result<()> {
    fs::write(&path, content).with_context(|| format!("Failed to write file: {:?}", path.as_ref()))
}

/// Check if a file exists
pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists() && path.as_ref().is_file()
}

/// Create a directory if it doesn't exist
pub fn ensure_dir<P: AsRef<Path>>(path: P) -> Result<()> {
    let path = path.as_ref();
    if !path.exists() {
        fs::create_dir_all(path).with_context(|| format!("Failed to create directory: {:?}", path))
    } else if !path.is_dir() {
        Err(anyhow::anyhow!(
            "Path exists but is not a directory: {:?}",
            path
        ))
    } else {
        Ok(())
    }
}
