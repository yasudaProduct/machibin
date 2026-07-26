import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from './index';

describe('@machibin/schema', () => {
  it('エラーコード一覧に07 §1.3の主要コードを含む', () => {
    expect(ERROR_CODES).toContain('VALIDATION_ERROR');
    expect(ERROR_CODES).toContain('UNAUTHORIZED');
    expect(ERROR_CODES).toContain('POST_LIMIT_EXCEEDED');
  });
});
