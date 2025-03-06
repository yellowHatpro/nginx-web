use pest::Parser;
use pest_derive::Parser;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Parser)]
#[grammar = "nginx.pest"]
struct NginxParser;

#[derive(Debug, Error)]
pub enum NginxParserError {
    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Failed to parse config: {0}")]
    ParseError(#[from] pest::error::Error<Rule>),

    #[error("Invalid directive: {0}")]
    InvalidDirective(String),
}

pub type Result<T> = std::result::Result<T, NginxParserError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DirectiveValue {
    String(String),
    Variable(String),
    Regex(String),
}

impl DirectiveValue {
    pub fn as_str(&self) -> &str {
        match self {
            DirectiveValue::String(s) => s,
            DirectiveValue::Variable(s) => s,
            DirectiveValue::Regex(s) => s,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Directive {
    Simple {
        name: String,
        values: Vec<DirectiveValue>,
    },
    Block {
        name: String,
        values: Vec<DirectiveValue>,
        children: Vec<Directive>,
    },
}

impl Directive {
    pub fn name(&self) -> &str {
        match self {
            Directive::Simple { name, .. } => name,
            Directive::Block { name, .. } => name,
        }
    }

    pub fn values(&self) -> &[DirectiveValue] {
        match self {
            Directive::Simple { values, .. } => values,
            Directive::Block { values, .. } => values,
        }
    }

    pub fn children(&self) -> Option<&[Directive]> {
        match self {
            Directive::Simple { .. } => None,
            Directive::Block { children, .. } => Some(children),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NginxConfig {
    pub directives: Vec<Directive>,
    pub source_path: Option<String>,
}

impl NginxConfig {
    pub fn parse_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = fs::read_to_string(&path)?;
        let mut config = Self::parse_str(&content)?;
        config.source_path = Some(path.as_ref().to_string_lossy().to_string());
        Ok(config)
    }

    pub fn parse_str(content: &str) -> Result<Self> {
        let pairs = NginxParser::parse(Rule::config, content)?;

        let mut directives = Vec::new();

        for pair in pairs {
            match pair.as_rule() {
                Rule::config => {
                    for directive_pair in pair.into_inner() {
                        if let Rule::directive = directive_pair.as_rule() {
                            directives.push(parse_directive(directive_pair)?);
                        }
                    }
                }
                _ => {}
            }
        }

        Ok(NginxConfig {
            directives,
            source_path: None,
        })
    }

    pub fn to_string(&self) -> String {
        let mut output = String::new();

        for directive in &self.directives {
            output.push_str(&directive_to_string(directive, 0));
        }

        output
    }

    pub fn find_blocks(&self, name: &str) -> Vec<&Directive> {
        let mut result = Vec::new();
        self.find_blocks_recursive(&self.directives, name, &mut result);
        result
    }

    fn find_blocks_recursive<'a>(
        &self,
        directives: &'a [Directive],
        name: &str,
        result: &mut Vec<&'a Directive>,
    ) {
        for directive in directives {
            match directive {
                Directive::Block {
                    name: block_name, ..
                } if block_name == name => {
                    result.push(directive);
                }
                Directive::Block { children, .. } => {
                    self.find_blocks_recursive(children, name, result);
                }
                _ => {}
            }
        }
    }

    pub fn find_server_blocks(&self) -> Vec<&Directive> {
        self.find_blocks("server")
    }

    pub fn find_http_block(&self) -> Option<&Directive> {
        self.find_blocks("http").first().copied()
    }

    pub fn find_upstream_blocks(&self) -> Vec<&Directive> {
        self.find_blocks("upstream")
    }

    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let content = self.to_string();
        fs::write(path, content)?;
        Ok(())
    }
}

fn parse_directive(pair: pest::iterators::Pair<Rule>) -> Result<Directive> {
    let inner_pairs = pair.into_inner();

    for pair in inner_pairs {
        match pair.as_rule() {
            Rule::simple_directive => return parse_simple_directive(pair),
            Rule::block_directive => return parse_block_directive(pair),
            _ => {}
        }
    }

    Err(NginxParserError::InvalidDirective(
        "Unknown directive type".to_string(),
    ))
}

fn parse_simple_directive(pair: pest::iterators::Pair<Rule>) -> Result<Directive> {
    let mut inner_pairs = pair.into_inner();

    let name = inner_pairs
        .next()
        .ok_or_else(|| NginxParserError::InvalidDirective("Missing directive name".to_string()))?
        .as_str()
        .to_string();

    let mut values = Vec::new();

    for pair in inner_pairs {
        if pair.as_rule() == Rule::value {
            values.push(parse_value(pair)?);
        }
    }

    Ok(Directive::Simple { name, values })
}

fn parse_block_directive(pair: pest::iterators::Pair<Rule>) -> Result<Directive> {
    let mut inner_pairs = pair.into_inner();

    let name = inner_pairs
        .next()
        .ok_or_else(|| NginxParserError::InvalidDirective("Missing block name".to_string()))?
        .as_str()
        .to_string();

    let mut values = Vec::new();
    let mut children = Vec::new();

    for pair in inner_pairs {
        match pair.as_rule() {
            Rule::value => values.push(parse_value(pair)?),
            Rule::directive => children.push(parse_directive(pair)?),
            _ => {}
        }
    }

    Ok(Directive::Block {
        name,
        values,
        children,
    })
}

fn parse_value(pair: pest::iterators::Pair<Rule>) -> Result<DirectiveValue> {
    let inner = pair
        .into_inner()
        .next()
        .ok_or_else(|| NginxParserError::InvalidDirective("Empty value".to_string()))?;

    match inner.as_rule() {
        Rule::quoted_string => {
            let s = inner.as_str();
            // Remove the quotes
            let s = &s[1..s.len() - 1];
            Ok(DirectiveValue::String(s.to_string()))
        }
        Rule::unquoted_string => Ok(DirectiveValue::String(inner.as_str().to_string())),
        Rule::variable => Ok(DirectiveValue::Variable(inner.as_str().to_string())),
        Rule::regex => Ok(DirectiveValue::Regex(inner.as_str().to_string())),
        _ => Err(NginxParserError::InvalidDirective(format!(
            "Unknown value type: {:?}",
            inner.as_rule()
        ))),
    }
}

fn directive_to_string(directive: &Directive, indent_level: usize) -> String {
    let indent = "    ".repeat(indent_level);

    match directive {
        Directive::Simple { name, values } => {
            let mut result = format!("{}{}", indent, name);

            for value in values {
                match value {
                    DirectiveValue::String(s) if s.contains(' ') => {
                        result.push_str(&format!(" \"{}\"", s));
                    }
                    DirectiveValue::String(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                    DirectiveValue::Variable(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                    DirectiveValue::Regex(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                }
            }

            result.push_str(";\n");
            result
        }
        Directive::Block {
            name,
            values,
            children,
        } => {
            let mut result = format!("{}{}", indent, name);

            for value in values {
                match value {
                    DirectiveValue::String(s) if s.contains(' ') => {
                        result.push_str(&format!(" \"{}\"", s));
                    }
                    DirectiveValue::String(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                    DirectiveValue::Variable(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                    DirectiveValue::Regex(s) => {
                        result.push_str(&format!(" {}", s));
                    }
                }
            }

            result.push_str(" {\n");

            for child in children {
                result.push_str(&directive_to_string(child, indent_level + 1));
            }

            result.push_str(&format!("{}}}\n", indent));
            result
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_parse_simple_config() {
        let config = r#"
        worker_processes 1;
        events {
            worker_connections 1024;
        }
        http {
            server {
                listen 80;
                server_name example.com;
                
                location / {
                    root /var/www/html;
                    index index.html;
                }
            }
        }
        "#;

        let parsed = NginxConfig::parse_str(config).unwrap();

        // Check if we have the correct number of top-level directives
        assert_eq!(parsed.directives.len(), 3);

        // Check if the first directive is worker_processes
        match &parsed.directives[0] {
            Directive::Simple { name, values } => {
                assert_eq!(name, "worker_processes");
                assert_eq!(values.len(), 1);
                assert_eq!(values[0].as_str(), "1");
            }
            _ => panic!("Expected Simple directive"),
        }

        // Check if we can find the server block
        let server_blocks = parsed.find_server_blocks();
        assert_eq!(server_blocks.len(), 1);

        // Regenerate the config and parse it again to ensure it's valid
        let regenerated = parsed.to_string();
        let reparsed = NginxConfig::parse_str(&regenerated).unwrap();

        // Check if the reparsed config has the same structure
        assert_eq!(reparsed.directives.len(), parsed.directives.len());
    }
}
