#!/usr/bin/env ruby
# frozen_string_literal: true

# Gnosis polyglot execution harness for Ruby.
#
# Protocol: reads JSON request from stdin, loads the target file,
# calls the named method, writes JSON response to stdout.

require 'json'
require 'stringio'

begin
  raw_input = $stdin.read
  if raw_input.nil? || raw_input.strip.empty?
    puts JSON.generate({ status: 'error', value: 'empty input', stdout: '', stderr: '' })
    exit 0
  end

  request = JSON.parse(raw_input)

  if request['action'] == 'ping'
    puts JSON.generate({ status: 'ok', value: 'pong', stdout: '', stderr: '' })
    exit 0
  end

  file_path = request['filePath'] || ''
  function_name = request['functionName'] || 'main'
  args = request['args'] || []

  # Capture stdout/stderr.
  captured_stdout = StringIO.new
  captured_stderr = StringIO.new
  old_stdout = $stdout
  old_stderr = $stderr

  begin
    $stdout = captured_stdout
    $stderr = captured_stderr

    # Load the target file.
    load(file_path)

    # Call the method.
    result = send(function_name.to_sym, *args)

    $stdout = old_stdout
    $stderr = old_stderr

    # Serialize result.
    value = begin
      JSON.generate(result)
      result
    rescue TypeError, JSON::GeneratorError
      result.to_s
    end

    puts JSON.generate({
      status: 'ok',
      value: value,
      stdout: captured_stdout.string,
      stderr: captured_stderr.string
    })

  rescue StandardError => e
    $stdout = old_stdout
    $stderr = old_stderr

    puts JSON.generate({
      status: 'error',
      value: "#{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}",
      stdout: captured_stdout.string,
      stderr: captured_stderr.string
    })
  end

rescue StandardError => e
  puts JSON.generate({
    status: 'error',
    value: "harness error: #{e.message}",
    stdout: '',
    stderr: ''
  })
end
