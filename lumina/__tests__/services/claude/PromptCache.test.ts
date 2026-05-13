import { getCacheKey, getCachedContext, setCachedContext } from '../../../src/services/claude/PromptCache';
import { CACHE_TTL_MS } from '../../../src/constants/claude';

// Clear the in-memory cache between tests by replacing module-level state
// We do this by re-requiring the module with jest.isolateModules per suite.

describe('getCacheKey', () => {
  it('includes the userId and today date', () => {
    const key = getCacheKey('user-42');
    const today = new Date().toISOString().split('T')[0];
    expect(key).toBe(`user-42-${today}`);
  });

  it('produces different keys for different users', () => {
    expect(getCacheKey('alice')).not.toBe(getCacheKey('bob'));
  });
});

describe('setCachedContext / getCachedContext', () => {
  it('returns null for an unknown key', () => {
    expect(getCachedContext('no-such-key')).toBeNull();
  });

  it('returns the stored context immediately after setting', () => {
    setCachedContext('test-key', 'my context string');
    expect(getCachedContext('test-key')).toBe('my context string');
  });

  it('overwrites an existing entry', () => {
    setCachedContext('key-x', 'first');
    setCachedContext('key-x', 'second');
    expect(getCachedContext('key-x')).toBe('second');
  });

  it('returns null after TTL has expired', () => {
    jest.useFakeTimers();

    setCachedContext('ttl-key', 'will expire');
    expect(getCachedContext('ttl-key')).toBe('will expire');

    // Advance past the TTL
    jest.advanceTimersByTime(CACHE_TTL_MS + 1);
    expect(getCachedContext('ttl-key')).toBeNull();

    jest.useRealTimers();
  });

  it('does not expire before TTL', () => {
    jest.useFakeTimers();

    setCachedContext('fresh-key', 'still valid');
    jest.advanceTimersByTime(CACHE_TTL_MS - 1000);
    expect(getCachedContext('fresh-key')).toBe('still valid');

    jest.useRealTimers();
  });
});
