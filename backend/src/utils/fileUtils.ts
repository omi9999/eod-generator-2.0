import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export class FileUtils {
  static async ensureDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  static async writeJSON<T>(filepath: string, data: T): Promise<void> {
    await this.ensureDir(path.dirname(filepath));
    await writeFile(filepath, JSON.stringify(data, null, 2));
  }

  static async readJSON<T>(filepath: string): Promise<T | null> {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const content = await readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  static async writeFile(filepath: string, data: Buffer | string): Promise<void> {
    await this.ensureDir(path.dirname(filepath));
    await writeFile(filepath, data);
  }

  static async readFile(filepath: string): Promise<Buffer> {
    return readFile(filepath);
  }

  static async deleteFile(filepath: string): Promise<void> {
    if (fs.existsSync(filepath)) {
      await promisify(fs.unlink)(filepath);
    }
  }

  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  static generateFileName(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.${extension}`;
  }
}