//! Cross-language semantic type bridge.
//!
//! Implements denotation functions [[\cdot]]_L : LanguageType -> TopologyType
//! for each supported language. The key insight is that all cross-language
//! data flows through JSON serialization, so we only need to model the
//! JSON-representable subset of each language's type system.

use crate::cfg::{TopologyType, JsonSchema, SemanticContract, SemanticPredicate, FunctionSignature};

/// Convert a language-specific type annotation string to a TopologyType.
/// This is the denotation function [[\cdot]]_L.
pub fn denote_type(language: &str, type_annotation: &str) -> TopologyType {
    match language {
        "python" => denote_python_type(type_annotation),
        "go" => denote_go_type(type_annotation),
        "rust" => denote_rust_type(type_annotation),
        "typescript" | "javascript" => denote_typescript_type(type_annotation),
        "java" => denote_java_type(type_annotation),
        _ => TopologyType::Unknown,
    }
}

/// Build a SemanticContract from a FunctionSignature using language-specific denotation.
pub fn build_semantic_contract(signature: &FunctionSignature, language: &str) -> SemanticContract {
    let param_types: Vec<TopologyType> = signature
        .params
        .iter()
        .map(|p| {
            p.type_annotation
                .as_ref()
                .map(|t| denote_type(language, t))
                .unwrap_or(TopologyType::Unknown)
        })
        .collect();

    let return_type = signature
        .return_type
        .as_ref()
        .map(|t| denote_type(language, t))
        .unwrap_or(TopologyType::Unknown);

    // Infer predicates from return type.
    let mut predicates = Vec::new();
    if let TopologyType::Json { ref schema } = return_type {
        predicates.push(SemanticPredicate::ValidJson {
            schema: schema.clone(),
        });
    }

    SemanticContract {
        param_types,
        return_type,
        predicates,
    }
}

// --- Python denotation ----------------------------------------------------

fn denote_python_type(ty: &str) -> TopologyType {
    let ty = ty.trim();
    match ty {
        "int" => TopologyType::Json { schema: JsonSchema::Integer },
        "float" => TopologyType::Json { schema: JsonSchema::Number },
        "str" => TopologyType::Json { schema: JsonSchema::String },
        "bool" => TopologyType::Json { schema: JsonSchema::Boolean },
        "None" | "NoneType" => TopologyType::Json { schema: JsonSchema::Null },
        "bytes" | "bytearray" => TopologyType::Bytes,
        "dict" => TopologyType::Product { fields: vec![], open: true },
        "list" => TopologyType::Stream {
            element: Box::new(TopologyType::Json { schema: JsonSchema::Any }),
        },
        "tuple" => TopologyType::Stream {
            element: Box::new(TopologyType::Json { schema: JsonSchema::Any }),
        },
        _ if ty.starts_with("list[") => {
            let inner = &ty[5..ty.len() - 1];
            TopologyType::Stream {
                element: Box::new(denote_python_type(inner)),
            }
        }
        _ if ty.starts_with("dict[") => {
            // dict[str, X] -> Product(open=true) with value type X
            // dict[K, V] where K != str -> requires proof obligation (JSON keys must be strings)
            let inner = &ty[5..ty.len() - 1];
            let parts: Vec<&str> = split_type_args(inner);
            if parts.len() == 2 {
                let key_ty = parts[0].trim();
                let _val_ty = parts[1].trim();
                if key_ty == "str" {
                    TopologyType::Product { fields: vec![], open: true }
                } else {
                    TopologyType::Opaque {
                        language: "python".to_string(),
                        name: format!("dict[{}, {}]", parts[0], parts[1]),
                    }
                }
            } else {
                TopologyType::Product { fields: vec![], open: true }
            }
        }
        _ if ty.starts_with("Optional[") || ty.starts_with("typing.Optional[") => {
            let start = if ty.starts_with("typing.") { 17 } else { 9 };
            let inner = &ty[start..ty.len() - 1];
            TopologyType::Option {
                inner: Box::new(denote_python_type(inner)),
            }
        }
        _ if ty.starts_with("tuple[") => {
            let inner = &ty[6..ty.len() - 1];
            let parts: Vec<&str> = split_type_args(inner);
            TopologyType::Product {
                fields: parts
                    .iter()
                    .enumerate()
                    .map(|(i, t)| (format!("_{}", i), denote_python_type(t.trim())))
                    .collect(),
                open: false,
            }
        }
        _ => TopologyType::Opaque {
            language: "python".to_string(),
            name: ty.to_string(),
        },
    }
}

// --- Go denotation --------------------------------------------------------

fn denote_go_type(ty: &str) -> TopologyType {
    let ty = ty.trim();
    match ty {
        "int" | "int8" | "int16" | "int32" | "int64" | "uint" | "uint8" | "uint16"
        | "uint32" | "uint64" => TopologyType::Json { schema: JsonSchema::Integer },
        "float32" | "float64" => TopologyType::Json { schema: JsonSchema::Number },
        "string" => TopologyType::Json { schema: JsonSchema::String },
        "bool" => TopologyType::Json { schema: JsonSchema::Boolean },
        "byte" => TopologyType::Json { schema: JsonSchema::Integer },
        "error" => TopologyType::Option {
            inner: Box::new(TopologyType::Json { schema: JsonSchema::String }),
        },
        "interface{}" | "any" => TopologyType::Json { schema: JsonSchema::Any },
        _ if ty.starts_with("[]byte") => TopologyType::Bytes,
        _ if ty.starts_with("[]") => {
            let inner = &ty[2..];
            TopologyType::Stream {
                element: Box::new(denote_go_type(inner)),
            }
        }
        _ if ty.starts_with("map[string]") => {
            let val = &ty[11..];
            if val == "interface{}" || val == "any" {
                TopologyType::Product { fields: vec![], open: true }
            } else {
                TopologyType::Product { fields: vec![], open: true }
            }
        }
        _ if ty.starts_with("map[") => TopologyType::Opaque {
            language: "go".to_string(),
            name: ty.to_string(),
        },
        _ if ty.starts_with("*") => {
            // Pointer type -- dereference for topology purposes.
            denote_go_type(&ty[1..])
        }
        _ if ty.contains(",") => {
            // Multi-return: (int, error) -> Product
            let parts: Vec<&str> = ty
                .trim_start_matches('(')
                .trim_end_matches(')')
                .split(',')
                .collect();
            TopologyType::Product {
                fields: parts
                    .iter()
                    .enumerate()
                    .map(|(i, t)| (format!("_{}", i), denote_go_type(t.trim())))
                    .collect(),
                open: false,
            }
        }
        _ => TopologyType::Opaque {
            language: "go".to_string(),
            name: ty.to_string(),
        },
    }
}

// --- Rust denotation ------------------------------------------------------

fn denote_rust_type(ty: &str) -> TopologyType {
    let ty = ty.trim();
    match ty {
        "i8" | "i16" | "i32" | "i64" | "i128" | "isize" | "u8" | "u16" | "u32" | "u64"
        | "u128" | "usize" => TopologyType::Json { schema: JsonSchema::Integer },
        "f32" | "f64" => TopologyType::Json { schema: JsonSchema::Number },
        "String" | "&str" => TopologyType::Json { schema: JsonSchema::String },
        "bool" => TopologyType::Json { schema: JsonSchema::Boolean },
        "()" => TopologyType::Json { schema: JsonSchema::Null },
        _ if ty.starts_with("Vec<u8>") => TopologyType::Bytes,
        _ if ty.starts_with("Vec<") => {
            let inner = &ty[4..ty.len() - 1];
            TopologyType::Stream {
                element: Box::new(denote_rust_type(inner)),
            }
        }
        _ if ty.starts_with("Option<") => {
            let inner = &ty[7..ty.len() - 1];
            TopologyType::Option {
                inner: Box::new(denote_rust_type(inner)),
            }
        }
        _ if ty.starts_with("HashMap<String,") || ty.starts_with("HashMap<&str,") => {
            TopologyType::Product { fields: vec![], open: true }
        }
        _ if ty.starts_with("HashMap<") => TopologyType::Opaque {
            language: "rust".to_string(),
            name: ty.to_string(),
        },
        _ if ty == "Value" || ty == "serde_json::Value" => {
            TopologyType::Json { schema: JsonSchema::Any }
        }
        _ if ty.starts_with("Result<") => {
            let inner = &ty[7..ty.len() - 1];
            let parts: Vec<&str> = split_type_args(inner);
            if parts.len() == 2 {
                TopologyType::Sum {
                    variants: vec![
                        ("Ok".to_string(), denote_rust_type(parts[0].trim())),
                        ("Err".to_string(), denote_rust_type(parts[1].trim())),
                    ],
                }
            } else {
                TopologyType::Unknown
            }
        }
        _ if ty.starts_with("(") && ty.ends_with(")") => {
            let inner = &ty[1..ty.len() - 1];
            let parts: Vec<&str> = split_type_args(inner);
            TopologyType::Product {
                fields: parts
                    .iter()
                    .enumerate()
                    .map(|(i, t)| (format!("_{}", i), denote_rust_type(t.trim())))
                    .collect(),
                open: false,
            }
        }
        _ if ty.starts_with("&") => denote_rust_type(&ty[1..]),
        _ if ty.starts_with("&mut ") => denote_rust_type(&ty[5..]),
        _ => TopologyType::Opaque {
            language: "rust".to_string(),
            name: ty.to_string(),
        },
    }
}

// --- TypeScript denotation ------------------------------------------------

fn denote_typescript_type(ty: &str) -> TopologyType {
    let ty = ty.trim();
    match ty {
        "number" => TopologyType::Json { schema: JsonSchema::Number },
        "string" => TopologyType::Json { schema: JsonSchema::String },
        "boolean" => TopologyType::Json { schema: JsonSchema::Boolean },
        "null" | "undefined" | "void" => TopologyType::Json { schema: JsonSchema::Null },
        "any" | "unknown" => TopologyType::Json { schema: JsonSchema::Any },
        "never" => TopologyType::Json { schema: JsonSchema::Null },
        "object" | "Record<string, unknown>" | "Record<string, any>" => {
            TopologyType::Product { fields: vec![], open: true }
        }
        "Uint8Array" | "ArrayBuffer" | "Buffer" => TopologyType::Bytes,
        _ if ty.ends_with("[]") => {
            let inner = &ty[..ty.len() - 2];
            TopologyType::Stream {
                element: Box::new(denote_typescript_type(inner)),
            }
        }
        _ if ty.starts_with("Array<") => {
            let inner = &ty[6..ty.len() - 1];
            TopologyType::Stream {
                element: Box::new(denote_typescript_type(inner)),
            }
        }
        _ if ty.starts_with("Map<string,") || ty.starts_with("Record<string,") => {
            TopologyType::Product { fields: vec![], open: true }
        }
        _ if ty.contains("|") => {
            // Union type: A | B | null -> Option if null is present
            let parts: Vec<&str> = ty.split('|').map(|s| s.trim()).collect();
            let has_null = parts.iter().any(|p| *p == "null" || *p == "undefined");
            let non_null: Vec<&&str> = parts
                .iter()
                .filter(|p| **p != "null" && **p != "undefined")
                .collect();
            if has_null && non_null.len() == 1 {
                TopologyType::Option {
                    inner: Box::new(denote_typescript_type(non_null[0])),
                }
            } else {
                TopologyType::Sum {
                    variants: parts
                        .iter()
                        .map(|p| (p.to_string(), denote_typescript_type(p)))
                        .collect(),
                }
            }
        }
        _ if ty.starts_with("Promise<") => {
            let inner = &ty[8..ty.len() - 1];
            denote_typescript_type(inner)
        }
        _ => TopologyType::Opaque {
            language: "typescript".to_string(),
            name: ty.to_string(),
        },
    }
}

// --- Java denotation ------------------------------------------------------

fn denote_java_type(ty: &str) -> TopologyType {
    let ty = ty.trim();
    match ty {
        "int" | "Integer" | "long" | "Long" | "short" | "Short" | "byte" | "Byte" => {
            TopologyType::Json { schema: JsonSchema::Integer }
        }
        "float" | "Float" | "double" | "Double" => {
            TopologyType::Json { schema: JsonSchema::Number }
        }
        "String" | "CharSequence" => TopologyType::Json { schema: JsonSchema::String },
        "boolean" | "Boolean" => TopologyType::Json { schema: JsonSchema::Boolean },
        "void" => TopologyType::Json { schema: JsonSchema::Null },
        "Object" => TopologyType::Json { schema: JsonSchema::Any },
        "byte[]" => TopologyType::Bytes,
        _ if ty.starts_with("List<") || ty.starts_with("ArrayList<") => {
            let start = ty.find('<').unwrap() + 1;
            let inner = &ty[start..ty.len() - 1];
            TopologyType::Stream {
                element: Box::new(denote_java_type(inner)),
            }
        }
        _ if ty.starts_with("Map<String,") || ty.starts_with("HashMap<String,") => {
            TopologyType::Product { fields: vec![], open: true }
        }
        _ if ty.starts_with("Optional<") => {
            let inner = &ty[9..ty.len() - 1];
            TopologyType::Option {
                inner: Box::new(denote_java_type(inner)),
            }
        }
        _ if ty.ends_with("[]") => {
            let inner = &ty[..ty.len() - 2];
            TopologyType::Stream {
                element: Box::new(denote_java_type(inner)),
            }
        }
        _ => TopologyType::Opaque {
            language: "java".to_string(),
            name: ty.to_string(),
        },
    }
}

// --- Utility --------------------------------------------------------------

/// Split type arguments respecting nested angle brackets.
fn split_type_args(s: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut depth = 0;
    let mut start = 0;

    for (i, c) in s.char_indices() {
        match c {
            '<' | '[' | '(' => depth += 1,
            '>' | ']' | ')' => depth -= 1,
            ',' if depth == 0 => {
                parts.push(&s[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    if start < s.len() {
        parts.push(&s[start..]);
    }
    parts
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cfg::TypeCompatibility;

    #[test]
    fn python_list_float_compatible_with_rust_vec_f64() {
        let py = denote_type("python", "list[float]");
        let rs = denote_type("rust", "Vec<f64>");
        assert_eq!(py.is_compatible_with(&rs), TypeCompatibility::Compatible);
    }

    #[test]
    fn python_dict_compatible_with_go_map_string_interface() {
        let py = denote_type("python", "dict");
        let go = denote_type("go", "map[string]interface{}");
        assert_eq!(py.is_compatible_with(&go), TypeCompatibility::Compatible);
    }

    #[test]
    fn go_int_compatible_with_python_int() {
        let go = denote_type("go", "int");
        let py = denote_type("python", "int");
        assert_eq!(go.is_compatible_with(&py), TypeCompatibility::Compatible);
    }

    #[test]
    fn rust_bytes_incompatible_with_python_str() {
        let rs = denote_type("rust", "Vec<u8>");
        let py = denote_type("python", "str");
        assert!(matches!(
            rs.is_compatible_with(&py),
            TypeCompatibility::Incompatible { .. }
        ));
    }

    #[test]
    fn typescript_number_array_compatible_with_python_list_float() {
        let ts = denote_type("typescript", "number[]");
        let py = denote_type("python", "list[float]");
        assert_eq!(ts.is_compatible_with(&py), TypeCompatibility::Compatible);
    }

    #[test]
    fn unknown_compatible_with_anything() {
        let unk = TopologyType::Unknown;
        let specific = denote_type("python", "int");
        assert_eq!(unk.is_compatible_with(&specific), TypeCompatibility::Compatible);
    }

    #[test]
    fn go_multi_return_is_product() {
        let ty = denote_type("go", "(int, error)");
        assert!(matches!(ty, TopologyType::Product { .. }));
    }

    #[test]
    fn rust_result_is_sum() {
        let ty = denote_type("rust", "Result<String, String>");
        assert!(matches!(ty, TopologyType::Sum { .. }));
    }
}
