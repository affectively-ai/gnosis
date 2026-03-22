//! Integration tests for Ditto framework recognition.
//! Tests that Express, Flask, Gin, Hono, Sinatra, Spring apps are
//! correctly detected and compiled to fork/race/fold server topologies.

use gnosis_polyglot::framework_recognizer::{detect_framework, HttpMethod};
use gnosis_polyglot::{ditto_compile, parse_and_extract_framework};

// ─── Express ────────────────────────────────────────────────────────────────

const EXPRESS_SOURCE: &str = r#"
const express = require('express');
const app = express();

app.use(express.json());

app.get('/users', async (req, res) => {
  res.json([]);
});

app.post('/users', async (req, res) => {
  res.status(201).json(req.body);
});

app.delete('/users/:id', async (req, res) => {
  res.status(204).send();
});

app.listen(3000);
"#;

#[test]
fn express_detected() {
    let result = parse_and_extract_framework(EXPRESS_SOURCE, "app.js").unwrap();
    let topo = result.topology.expect("Express should be detected");
    assert_eq!(topo.framework, "express");
    assert_eq!(topo.language, "typescript");
    assert_eq!(topo.routes.len(), 3);
    assert_eq!(topo.middleware.len(), 1);
    assert_eq!(topo.listen_port, Some(3000));
}

#[test]
fn express_routes_correct() {
    let result = parse_and_extract_framework(EXPRESS_SOURCE, "app.js").unwrap();
    let topo = result.topology.unwrap();

    assert_eq!(topo.routes[0].method, HttpMethod::Get);
    assert_eq!(topo.routes[0].path, "/users");

    assert_eq!(topo.routes[1].method, HttpMethod::Post);
    assert_eq!(topo.routes[1].path, "/users");

    assert_eq!(topo.routes[2].method, HttpMethod::Delete);
    assert_eq!(topo.routes[2].path, "/users/:id");
}

#[test]
fn express_compiles_to_gg() {
    let gg = ditto_compile(EXPRESS_SOURCE, "app.js").unwrap();
    let gg = gg.expect("Express should compile to GG");
    assert!(gg.contains("TCPListener"));
    assert!(gg.contains("port: '3000'"));
    assert!(gg.contains("LocationRouter"));
    assert!(gg.contains("FORK"));
    assert!(gg.contains("RACE"));
    assert!(gg.contains("FOLD"));
    assert!(gg.contains("PolyglotBridgeCall"));
}

// ─── Flask ──────────────────────────────────────────────────────────────────

const FLASK_SOURCE: &str = r#"
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/users', methods=['GET'])
def get_users():
    return jsonify([])

@app.post('/users')
def create_user():
    return jsonify(request.get_json()), 201

@app.route('/users/<int:user_id>', methods=['GET', 'DELETE'])
def user_detail(user_id):
    return jsonify({'id': user_id})

if __name__ == '__main__':
    app.run(port=5000)
"#;

#[test]
fn flask_detected() {
    let result = parse_and_extract_framework(FLASK_SOURCE, "app.py").unwrap();
    let topo = result.topology.expect("Flask should be detected");
    assert_eq!(topo.framework, "flask");
    assert_eq!(topo.language, "python");
    assert!(topo.routes.len() >= 3); // GET /users, POST /users, GET /users/<id>, DELETE /users/<id>
    assert_eq!(topo.listen_port, Some(5000));
}

#[test]
fn flask_compiles_to_gg() {
    let gg = ditto_compile(FLASK_SOURCE, "app.py").unwrap();
    let gg = gg.expect("Flask should compile to GG");
    assert!(gg.contains("flask"));
    assert!(gg.contains("FORK"));
    assert!(gg.contains("FOLD"));
}

// ─── Gin ────────────────────────────────────────────────────────────────────

const GIN_SOURCE: &str = r#"
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    r.Use(gin.Logger())
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.Run(":8080")
}

func getUsers(c *gin.Context) {
    c.JSON(http.StatusOK, []string{})
}

func createUser(c *gin.Context) {
    c.JSON(http.StatusCreated, nil)
}
"#;

#[test]
fn gin_detected() {
    let result = parse_and_extract_framework(GIN_SOURCE, "main.go").unwrap();
    let topo = result.topology.expect("Gin should be detected");
    assert_eq!(topo.framework, "gin");
    assert_eq!(topo.language, "go");
    assert_eq!(topo.routes.len(), 2);
    assert_eq!(topo.middleware.len(), 1);
    assert_eq!(topo.listen_port, Some(8080));
}

// ─── Hono ───────────────────────────────────────────────────────────────────

const HONO_SOURCE: &str = r#"
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));
app.post('/data', async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});
"#;

#[test]
fn hono_detected() {
    let result = parse_and_extract_framework(HONO_SOURCE, "app.ts").unwrap();
    let topo = result.topology.expect("Hono should be detected");
    assert_eq!(topo.framework, "hono");
    assert_eq!(topo.routes.len(), 2);
}

// ─── Sinatra ────────────────────────────────────────────────────────────────

const SINATRA_SOURCE: &str = r#"
require 'sinatra'
require 'json'

set :port, 4567

get '/users' do
  content_type :json
  [].to_json
end

post '/users' do
  status 201
  {}.to_json
end
"#;

#[test]
fn sinatra_detected() {
    let result = parse_and_extract_framework(SINATRA_SOURCE, "app.rb").unwrap();
    let topo = result.topology.expect("Sinatra should be detected");
    assert_eq!(topo.framework, "sinatra");
    assert_eq!(topo.language, "ruby");
    assert_eq!(topo.routes.len(), 2);
    assert_eq!(topo.listen_port, Some(4567));
}

// ─── Spring ─────────────────────────────────────────────────────────────────

const SPRING_SOURCE: &str = r#"
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    @GetMapping("/users")
    public List<User> getUsers() {
        return List.of();
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return user;
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
    }
}
"#;

#[test]
fn spring_detected() {
    let result = parse_and_extract_framework(SPRING_SOURCE, "UserController.java").unwrap();
    let topo = result.topology.expect("Spring should be detected");
    assert_eq!(topo.framework, "spring");
    assert_eq!(topo.language, "java");
    assert_eq!(topo.routes.len(), 3);
    // Class-level @RequestMapping("/api/v1") + method-level paths.
    assert!(topo.routes[0].path.starts_with("/api/v1"));
}

// ─── Non-framework code ────────────────────────────────────────────────────

#[test]
fn non_framework_returns_none() {
    let source = r#"
function add(a: number, b: number): number {
    return a + b;
}
"#;
    let result = parse_and_extract_framework(source, "math.ts").unwrap();
    assert!(result.topology.is_none());
}

// ─── detect_framework directly ─────────────────────────────────────────────

#[test]
fn detect_framework_returns_express() {
    let result = detect_framework(EXPRESS_SOURCE, "app.js", &[]);
    assert!(result.is_some());
    assert_eq!(result.unwrap().framework, "express");
}

#[test]
fn detect_framework_returns_none_for_plain_code() {
    let result = detect_framework("const x = 1 + 2;", "math.js", &[]);
    assert!(result.is_none());
}

// ─── Cross-framework equivalence ────────────────────────────────────────────
// The diversity theorem: all frameworks compile to the same beta1 structure.

#[test]
fn all_frameworks_produce_fork_race_fold() {
    let sources = vec![
        (EXPRESS_SOURCE, "app.js"),
        (FLASK_SOURCE, "app.py"),
        (GIN_SOURCE, "main.go"),
        (HONO_SOURCE, "app.ts"),
        (SINATRA_SOURCE, "app.rb"),
        (SPRING_SOURCE, "UserController.java"),
    ];

    for (source, path) in sources {
        let gg = ditto_compile(source, path).unwrap();
        let gg = gg.unwrap_or_else(|| panic!("Framework should be detected in {}", path));
        assert!(gg.contains("FORK"), "Missing FORK in {}", path);
        assert!(gg.contains("RACE"), "Missing RACE in {}", path);
        assert!(gg.contains("FOLD"), "Missing FOLD in {}", path);
        assert!(gg.contains("TCPListener"), "Missing TCPListener in {}", path);
        assert!(gg.contains("LocationRouter"), "Missing LocationRouter in {}", path);
        assert!(gg.contains("PolyglotBridgeCall"), "Missing PolyglotBridgeCall in {}", path);
    }
}
