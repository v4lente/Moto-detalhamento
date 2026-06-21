import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  validatePublicImagePath,
  validateServicePostMediaPayload,
  validateSettingsImagePayload,
} from '../backend/api/lib/image-validation';

function withTempProject<T>(fn: (root: string) => T): T {
  const previousCwd = process.cwd();
  const previousUploadsDir = process.env.UPLOADS_DIR;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'image-validation-'));

  try {
    process.chdir(root);
    fs.mkdirSync(path.join(root, 'public/uploads'), { recursive: true });
    fs.mkdirSync(path.join(root, 'attached_assets'), { recursive: true });
    return fn(root);
  } finally {
    process.chdir(previousCwd);
    if (previousUploadsDir === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = previousUploadsDir;
    }
  }
}

test.describe('image validation', () => {
  test('accepts existing uploads, assets, and remote images', () => {
    withTempProject((root) => {
      fs.writeFileSync(path.join(root, 'public/uploads/product.jpg'), 'image');
      fs.writeFileSync(path.join(root, 'attached_assets/logo.png'), 'image');

      expect(validatePublicImagePath('/uploads/product.jpg', 'Imagem')).toEqual({ valid: true });
      expect(validatePublicImagePath('/assets/logo.png', 'Logo')).toEqual({ valid: true });
      expect(validatePublicImagePath('https://example.com/image.jpg', 'Imagem')).toEqual({ valid: true });
    });
  });

  test('keeps legacy public/uploads images valid when UPLOADS_DIR is configured', () => {
    withTempProject((root) => {
      const persistentDir = path.join(root, 'persistent/uploads');
      process.env.UPLOADS_DIR = persistentDir;
      fs.mkdirSync(persistentDir, { recursive: true });
      fs.writeFileSync(path.join(root, 'public/uploads/legacy.jpg'), 'image');

      expect(validatePublicImagePath('/uploads/legacy.jpg', 'Imagem')).toEqual({ valid: true });
    });
  });

  test('rejects missing local images and unsafe local paths', () => {
    withTempProject(() => {
      expect(validatePublicImagePath('/uploads/missing.jpg', 'Imagem').valid).toBe(false);
      expect(validatePublicImagePath('/tmp/missing.jpg', 'Imagem').valid).toBe(false);
      expect(validatePublicImagePath('/uploads/../attached_assets/logo.png', 'Imagem').valid).toBe(false);
    });
  });

  test('validates optional settings images only when provided', () => {
    withTempProject((root) => {
      fs.writeFileSync(path.join(root, 'attached_assets/logo.png'), 'image');

      expect(validateSettingsImagePayload({ logoImage: '', backgroundImage: null })).toEqual({ valid: true });
      expect(validateSettingsImagePayload({ logoImage: '/assets/logo.png' })).toEqual({ valid: true });
      expect(validateSettingsImagePayload({ backgroundImage: '/uploads/missing.jpg' }).valid).toBe(false);
    });
  });

  test('validates service post image media and leaves video URLs unchanged', () => {
    withTempProject((root) => {
      fs.writeFileSync(path.join(root, 'public/uploads/service.jpg'), 'image');

      expect(
        validateServicePostMediaPayload({
          mediaUrls: ['/uploads/service.jpg', '/uploads/missing.jpg'],
          mediaTypes: ['image', 'video'],
        }),
      ).toEqual({ valid: true });

      expect(
        validateServicePostMediaPayload({
          mediaUrls: ['/uploads/missing.jpg'],
          mediaTypes: ['image'],
        }).valid,
      ).toBe(false);
    });
  });
});
