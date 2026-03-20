use std::path::PathBuf;
use std::process::{self, Command, Stdio};

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Clone, Debug, ValueEnum, PartialEq, Eq)]
enum Strategy {
    Cannon,
    Linear,
}

impl Strategy {
    fn as_str(&self) -> &'static str {
        match self {
            Strategy::Cannon => "cannon",
            Strategy::Linear => "linear",
        }
    }
}

#[derive(Clone, Debug, Subcommand)]
enum GnodeCommand {
    /// Compile a TypeScript entrypoint into GG and print the topology.
    Compile {
        file: PathBuf,
        #[arg(long = "export")]
        export_name: Option<String>,
    },
    /// Print the laminar schedule that gnode will use for the compiled topology.
    Schedule {
        file: PathBuf,
        #[arg(long = "export")]
        export_name: Option<String>,
        #[arg(long, default_value_t = 4)]
        lanes: usize,
        #[arg(long, value_enum, default_value_t = Strategy::Cannon)]
        strategy: Strategy,
    },
    /// Compile the TypeScript file into GG and run it through Gnosis.
    Run {
        file: PathBuf,
        #[arg(long = "export")]
        export_name: Option<String>,
        #[arg(long)]
        input_json: Option<String>,
        #[arg(long, default_value_t = false)]
        print_gg: bool,
        #[arg(long, default_value_t = false)]
        print_schedule: bool,
        #[arg(long, default_value_t = 4)]
        lanes: usize,
        #[arg(long, value_enum, default_value_t = Strategy::Cannon)]
        strategy: Strategy,
    },
    /// Polyglot analysis: parse source code in any language via tree-sitter,
    /// extract control flow into GG topologies, and run Betty analysis.
    Polyglot {
        /// File or directory to scan.
        path: PathBuf,
        /// Override language detection.
        #[arg(long)]
        language: Option<String>,
        /// Output format: gg, json, or sarif.
        #[arg(long, default_value = "json")]
        format: String,
        /// Only analyze a specific function by name.
        #[arg(long)]
        function: Option<String>,
        /// Print the .gg source for each function.
        #[arg(long, default_value_t = false)]
        print_gg: bool,
    },
}

#[derive(Debug, Parser)]
#[command(name = "gnode")]
#[command(about = "Compile TypeScript orchestrators into GG and run them through Gnosis")]
struct Cli {
    #[arg(long, default_value = "bun")]
    bun: String,
    #[command(subcommand)]
    command: GnodeCommand,
}

fn driver_path() -> Result<PathBuf> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("bridge-driver.ts");
    if !path.exists() {
        bail!(
            "gnode bridge driver not found at {}",
            path.display()
        );
    }
    Ok(path)
}

fn build_driver_args(command: &GnodeCommand) -> Vec<String> {
    match command {
        GnodeCommand::Compile { file, export_name } => {
            let mut args = vec![
                "compile".to_string(),
                file.display().to_string(),
            ];
            if let Some(export_name) = export_name {
                args.push("--export".to_string());
                args.push(export_name.clone());
            }
            args
        }
        GnodeCommand::Schedule {
            file,
            export_name,
            lanes,
            strategy,
        } => {
            let mut args = vec![
                "schedule".to_string(),
                file.display().to_string(),
                "--lanes".to_string(),
                lanes.to_string(),
                "--strategy".to_string(),
                strategy.as_str().to_string(),
            ];
            if let Some(export_name) = export_name {
                args.push("--export".to_string());
                args.push(export_name.clone());
            }
            args
        }
        GnodeCommand::Run {
            file,
            export_name,
            input_json,
            print_gg,
            print_schedule,
            lanes,
            strategy,
        } => {
            let mut args = vec![
                "run".to_string(),
                file.display().to_string(),
                "--lanes".to_string(),
                lanes.to_string(),
                "--strategy".to_string(),
                strategy.as_str().to_string(),
            ];
            if let Some(export_name) = export_name {
                args.push("--export".to_string());
                args.push(export_name.clone());
            }
            if let Some(input_json) = input_json {
                args.push("--input-json".to_string());
                args.push(input_json.clone());
            }
            if *print_gg {
                args.push("--print-gg".to_string());
            }
            if *print_schedule {
                args.push("--print-schedule".to_string());
            }
            args
        }
        GnodeCommand::Polyglot { .. } => {
            // Handled separately in run(); this arm is unreachable.
            unreachable!("polyglot subcommand is handled directly")
        }
    }
}

fn polyglot_binary_path() -> Result<PathBuf> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("polyglot")
        .join("target")
        .join("release")
        .join("gnosis-polyglot");
    if !path.exists() {
        bail!(
            "gnosis-polyglot binary not found at {}. Run: cd polyglot && cargo build --release",
            path.display()
        );
    }
    Ok(path)
}

fn run() -> Result<()> {
    let cli = Cli::parse();

    // Polyglot subcommand uses the Rust polyglot binary directly.
    if let GnodeCommand::Polyglot {
        ref path,
        ref language,
        ref format,
        ref function,
        print_gg,
    } = cli.command
    {
        let binary = polyglot_binary_path()?;
        let mut args = vec![path.display().to_string()];
        args.push("--format".to_string());
        args.push(format.clone());
        if let Some(lang) = language {
            args.push("--language".to_string());
            args.push(lang.clone());
        }
        if let Some(func) = function {
            args.push("--function".to_string());
            args.push(func.clone());
        }
        if print_gg {
            args.push("--print-gg".to_string());
        }

        let status = Command::new(&binary)
            .args(&args)
            .stdin(Stdio::inherit())
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()
            .with_context(|| {
                format!(
                    "failed to launch gnosis-polyglot at {}",
                    binary.display()
                )
            })?;

        match status.code() {
            Some(code) => process::exit(code),
            None => bail!("gnosis-polyglot process terminated without an exit code"),
        }
    }

    let driver = driver_path()?;
    let driver_args = build_driver_args(&cli.command);

    let status = Command::new(&cli.bun)
        .arg("run")
        .arg(&driver)
        .arg("--")
        .args(&driver_args)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .with_context(|| {
            format!(
                "failed to launch Bun bridge driver {}",
                driver.display()
            )
        })?;

    match status.code() {
        Some(code) => {
            process::exit(code);
        }
        None => bail!("gnode bridge process terminated without an exit code"),
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("gnode: {error:#}");
        process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::{build_driver_args, GnodeCommand, Strategy};
    use std::path::PathBuf;

    #[test]
    fn builds_compile_args() {
        let args = build_driver_args(&GnodeCommand::Compile {
            file: PathBuf::from("./app.ts"),
            export_name: Some("main".to_string()),
        });

        assert_eq!(
            args,
            vec![
                "compile".to_string(),
                "./app.ts".to_string(),
                "--export".to_string(),
                "main".to_string()
            ]
        );
    }

    #[test]
    fn builds_run_args_with_passthrough_flags() {
        let args = build_driver_args(&GnodeCommand::Run {
            file: PathBuf::from("./app.ts"),
            export_name: Some("main".to_string()),
            input_json: Some("{\"value\":1}".to_string()),
            print_gg: true,
            print_schedule: true,
            lanes: 8,
            strategy: Strategy::Cannon,
        });

        assert_eq!(
            args,
            vec![
                "run".to_string(),
                "./app.ts".to_string(),
                "--lanes".to_string(),
                "8".to_string(),
                "--strategy".to_string(),
                "cannon".to_string(),
                "--export".to_string(),
                "main".to_string(),
                "--input-json".to_string(),
                "{\"value\":1}".to_string(),
                "--print-gg".to_string(),
                "--print-schedule".to_string()
            ]
        );
    }
}
