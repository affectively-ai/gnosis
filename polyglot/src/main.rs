use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use clap::{Parser, ValueEnum};

#[derive(Clone, Debug, ValueEnum)]
enum OutputFormat {
    Gg,
    Json,
    Sarif,
}

#[derive(Debug, Parser)]
#[command(name = "gnosis-polyglot")]
#[command(about = "Universal bug detection via topological verification")]
#[command(long_about = "Parses source code in 200+ languages via tree-sitter, extracts control flow \
    into GG topologies, and runs Betty analysis to find bugs no human could.")]
struct Cli {
    /// File or directory to scan.
    path: PathBuf,

    /// Override language detection (e.g. typescript, rust, python, go, java).
    #[arg(long)]
    language: Option<String>,

    /// Output format.
    #[arg(long, value_enum, default_value_t = OutputFormat::Json)]
    format: OutputFormat,

    /// Only analyze a specific function by name.
    #[arg(long)]
    function: Option<String>,

    /// Print the .gg source for each function (useful for debugging).
    #[arg(long, default_value_t = false)]
    print_gg: bool,
}

fn main() {
    if let Err(error) = run() {
        eprintln!("gnosis-polyglot: {error:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse();

    if cli.path.is_dir() {
        scan_directory(&cli)
    } else {
        scan_file(&cli, &cli.path)
    }
}

fn scan_directory(cli: &Cli) -> Result<()> {
    let extractors = gnosis_polyglot::extractors::all_extractors();
    let supported_extensions: Vec<&str> = extractors
        .iter()
        .flat_map(|e| e.file_extensions().to_vec())
        .collect();

    let mut files = Vec::new();
    collect_files(&cli.path, &supported_extensions, &mut files)?;

    if files.is_empty() {
        eprintln!("no supported source files found in {}", cli.path.display());
        return Ok(());
    }

    eprintln!("scanning {} files...", files.len());

    let mut all_results = Vec::new();
    for file in &files {
        match scan_file_inner(file) {
            Ok(result) => all_results.push(result),
            Err(e) => eprintln!("  error in {}: {e}", file.display()),
        }
    }

    // Print combined results.
    match cli.format {
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(&all_results)?);
        }
        OutputFormat::Gg => {
            for result in &all_results {
                for topo in &result.topologies {
                    println!("{}", topo.gg_source);
                }
            }
        }
        OutputFormat::Sarif => {
            let mut all_diags = Vec::new();
            for result in &all_results {
                for topo in &result.topologies {
                    let diags = gnosis_polyglot::diagnostics::analyze_topology(&topo.topology);
                    all_diags.extend(diags);
                }
            }
            let file = all_results.first().map(|r| r.file_path.as_str()).unwrap_or("unknown");
            let lang = all_results.first().map(|r| r.language.as_str()).unwrap_or("unknown");
            let sarif = gnosis_polyglot::diagnostics::diagnostics_to_sarif(file, lang, &all_diags);
            println!("{}", serde_json::to_string_pretty(&sarif)?);
        }
    }

    // Summary.
    let total_functions: usize = all_results.iter().map(|r| r.topologies.len()).sum();
    let total_errors: usize = all_results.iter().map(|r| r.errors.len()).sum();
    eprintln!(
        "scanned {} files, {} functions, {} errors",
        all_results.len(),
        total_functions,
        total_errors
    );

    Ok(())
}

fn scan_file(cli: &Cli, file_path: &PathBuf) -> Result<()> {
    let result = scan_file_inner(file_path)?;

    match cli.format {
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
        OutputFormat::Gg => {
            for topo in &result.topologies {
                if let Some(ref filter_fn) = cli.function {
                    if &topo.function_name != filter_fn {
                        continue;
                    }
                }
                println!("{}", topo.gg_source);
            }
        }
        OutputFormat::Sarif => {
            let mut all_diags = Vec::new();
            for topo in &result.topologies {
                let diags = gnosis_polyglot::diagnostics::analyze_topology(&topo.topology);
                all_diags.extend(diags);
            }
            let sarif = gnosis_polyglot::diagnostics::diagnostics_to_sarif(
                &result.file_path,
                &result.language,
                &all_diags,
            );
            println!("{}", serde_json::to_string_pretty(&sarif)?);
        }
    }

    if cli.print_gg {
        for topo in &result.topologies {
            eprintln!("--- {} ---", topo.function_name);
            eprintln!("{}", topo.gg_source);
        }
    }

    if !result.errors.is_empty() {
        for err in &result.errors {
            eprintln!("error: {}", err.message);
        }
        std::process::exit(1);
    }

    Ok(())
}

fn scan_file_inner(
    file_path: &PathBuf,
) -> Result<gnosis_polyglot::serialization::PolyglotScanResult> {
    let source = fs::read_to_string(file_path)
        .with_context(|| format!("failed to read {}", file_path.display()))?;

    let path_str = file_path.to_string_lossy();
    gnosis_polyglot::parse_and_extract(&source, &path_str)
}

fn collect_files(
    dir: &PathBuf,
    extensions: &[&str],
    files: &mut Vec<PathBuf>,
) -> Result<()> {
    let entries = fs::read_dir(dir)
        .with_context(|| format!("failed to read directory {}", dir.display()))?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        // Skip hidden dirs and node_modules.
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" || name == "build" {
                continue;
            }
        }

        if path.is_dir() {
            collect_files(&path, extensions, files)?;
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            let dot_ext = format!(".{ext}");
            if extensions.iter().any(|e| *e == dot_ext.as_str()) {
                files.push(path);
            }
        }
    }

    Ok(())
}
