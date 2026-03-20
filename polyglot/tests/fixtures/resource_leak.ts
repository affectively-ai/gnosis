// Bug: resource leak -- file opened but never closed on error path.
export function processFile(path: string): string {
    const stream = fs.createReadStream(path);
    const data = stream.read();
    if (!data) {
        // BUG: stream not closed before early return
        return "";
    }
    stream.close();
    return data.toString();
}
