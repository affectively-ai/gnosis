import fs from 'fs';
import path from 'path';

export interface ModDependency {
    path: string;
    version: string;
}

export interface ModFile {
    module: string;
    gnosisVersion: string;
    requires: ModDependency[];
}

export class ModManager {
    private modFilePath = path.resolve(process.cwd(), 'gnosis.mod');

    public init(moduleName: string) {
        if (fs.existsSync(this.modFilePath)) {
            throw new Error('gnosis.mod already exists in this directory.');
        }

        const content = `module ${moduleName}\n\ngnosis 0.1.0\n`;
        fs.writeFileSync(this.modFilePath, content, 'utf-8');
        console.log(`[Gnosis Mod] Initialized module '${moduleName}' in gnosis.mod`);
    }

    public parse(): ModFile {
        if (!fs.existsSync(this.modFilePath)) {
            throw new Error('No gnosis.mod found. Run "gnosis mod init <module-name>" first.');
        }

        const content = fs.readFileSync(this.modFilePath, 'utf-8');
        const lines = content.split('\n');

        const modFile: ModFile = {
            module: '',
            gnosisVersion: '',
            requires: []
        };

        let inRequireBlock = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue;

            if (trimmed.startsWith('module ')) {
                modFile.module = trimmed.replace('module ', '').trim();
            } else if (trimmed.startsWith('gnosis ')) {
                modFile.gnosisVersion = trimmed.replace('gnosis ', '').trim();
            } else if (trimmed === 'require (') {
                inRequireBlock = true;
            } else if (trimmed.startsWith('require ') && !trimmed.endsWith('(')) {
                // Single line require e.g. require github.com/user/repo v1.0.0
                const parts = trimmed.replace('require ', '').trim().split(/\s+/);
                if (parts.length >= 2) {
                    modFile.requires.push({ path: parts[0], version: parts[1] });
                }
            } else if (inRequireBlock && trimmed === ')') {
                inRequireBlock = false;
            } else if (inRequireBlock) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    modFile.requires.push({ path: parts[0], version: parts[1] });
                }
            }
        }

        return modFile;
    }

    public tidy() {
        // Future: resolve dependencies, download them to a local cache (~/.gnosis/pkg/mod),
        // and update gnosis.sum. For now, just parse and validate.
        const modFile = this.parse();
        console.log(`[Gnosis Mod] Tidying module: ${modFile.module}`);
        if (modFile.requires.length > 0) {
            console.log(`[Gnosis Mod] Dependencies found:`);
            modFile.requires.forEach(req => {
                console.log(`  - ${req.path} @ ${req.version}`);
            });
            console.log(`[Gnosis Mod] Note: Dependency fetching is mocked in this version.`);
        } else {
            console.log(`[Gnosis Mod] No dependencies to tidy.`);
        }
    }
}
