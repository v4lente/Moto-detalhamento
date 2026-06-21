import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  ensureUploadsWriteDir,
  resolveUploadsReadDirs,
  resolveUploadsWriteDir,
} from '../backend/api/lib/uploads-dir';

test.describe('uploads directory resolver', () => {
  test('uses public/uploads as the local write fallback', () => {
    expect(resolveUploadsWriteDir({}, '/app')).toBe(path.resolve('/app', 'public/uploads'));
  });

  test('uses UPLOADS_DIR as the write directory when configured', () => {
    expect(resolveUploadsWriteDir({ UPLOADS_DIR: '../persistent-uploads' }, '/app/current')).toBe(
      path.resolve('/app/current', '../persistent-uploads'),
    );
  });

  test('reads from configured uploads first and public/uploads as legacy fallback', () => {
    expect(resolveUploadsReadDirs({ UPLOADS_DIR: '../persistent-uploads' }, '/app/current')).toEqual([
      path.resolve('/app/current', '../persistent-uploads'),
      path.resolve('/app/current', 'public/uploads'),
    ]);
  });

  test('does not duplicate read dirs when UPLOADS_DIR points to public/uploads', () => {
    expect(resolveUploadsReadDirs({ UPLOADS_DIR: 'public/uploads' }, '/app')).toEqual([
      path.resolve('/app', 'public/uploads'),
    ]);
  });

  test('creates only the write directory when missing', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-dir-'));
    const uploadsDir = ensureUploadsWriteDir({ UPLOADS_DIR: 'persistent/uploads' }, tempRoot);

    expect(uploadsDir).toBe(path.resolve(tempRoot, 'persistent/uploads'));
    expect(fs.existsSync(uploadsDir)).toBe(true);
    expect(fs.existsSync(path.resolve(tempRoot, 'public/uploads'))).toBe(false);
  });
});
