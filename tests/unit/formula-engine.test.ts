import { describe, it, expect } from 'vitest';
import formulaEngine from '../../utils/formula-engine';

describe('FormulaEngine', () => {
  describe('basic arithmetic', () => {
    it('evaluates addition', () => {
      expect(formulaEngine.evaluate('=1+2')).toBe(3);
    });

    it('evaluates subtraction', () => {
      expect(formulaEngine.evaluate('=10-3')).toBe(7);
    });

    it('evaluates multiplication', () => {
      expect(formulaEngine.evaluate('=4*5')).toBe(20);
    });

    it('evaluates division', () => {
      expect(formulaEngine.evaluate('=20/4')).toBe(5);
    });

    it('evaluates modulo', () => {
      expect(formulaEngine.evaluate('=10%3')).toBe(1);
    });

    it('evaluates exponentiation', () => {
      expect(formulaEngine.evaluate('=2^3')).toBe(8);
    });

    it('respects operator precedence', () => {
      expect(formulaEngine.evaluate('=2+3*4')).toBe(14);
    });

    it('respects parentheses', () => {
      expect(formulaEngine.evaluate('=(2+3)*4')).toBe(20);
    });

    it('handles negative numbers', () => {
      expect(formulaEngine.evaluate('=-5+3')).toBe(-2);
    });

    it('handles decimal numbers', () => {
      expect(formulaEngine.evaluate('=1.5+2.5')).toBe(4);
    });

    it('returns division by zero error', () => {
      expect(formulaEngine.evaluate('=1/0')).toBe('#ERROR: Division by zero');
    });
  });

  describe('comparison operators', () => {
    it('evaluates greater than', () => {
      expect(formulaEngine.evaluate('=5>3')).toBe(1);
      expect(formulaEngine.evaluate('=3>5')).toBe(0);
    });

    it('evaluates less than', () => {
      expect(formulaEngine.evaluate('=3<5')).toBe(1);
    });

    it('evaluates greater than or equal', () => {
      expect(formulaEngine.evaluate('=5>=5')).toBe(1);
    });

    it('evaluates less than or equal', () => {
      expect(formulaEngine.evaluate('=5<=5')).toBe(1);
    });

    it('evaluates equality', () => {
      expect(formulaEngine.evaluate('=5==5')).toBe(1);
      expect(formulaEngine.evaluate('=5==3')).toBe(0);
    });

    it('evaluates inequality', () => {
      expect(formulaEngine.evaluate('=5!=3')).toBe(1);
    });
  });

  describe('built-in functions', () => {
    it('evaluates SUM', () => {
      expect(formulaEngine.evaluate('=SUM(1,2,3)')).toBe(6);
    });

    it('evaluates AVERAGE', () => {
      expect(formulaEngine.evaluate('=AVERAGE(2,4,6)')).toBe(4);
    });

    it('evaluates AVERAGE with no args', () => {
      expect(formulaEngine.evaluate('=AVERAGE()')).toBe(0);
    });

    it('evaluates MIN', () => {
      expect(formulaEngine.evaluate('=MIN(5,2,8)')).toBe(2);
    });

    it('evaluates MAX', () => {
      expect(formulaEngine.evaluate('=MAX(5,2,8)')).toBe(8);
    });

    it('evaluates COUNT', () => {
      expect(formulaEngine.evaluate('=COUNT(1,2,3,4)')).toBe(4);
    });

    it('evaluates IF true branch', () => {
      expect(formulaEngine.evaluate('=IF(1>0,10,20)')).toBe(10);
    });

    it('evaluates IF false branch', () => {
      expect(formulaEngine.evaluate('=IF(0>1,10,20)')).toBe(20);
    });

    it('evaluates ROUND', () => {
      expect(formulaEngine.evaluate('=ROUND(3.456,2)')).toBe(3.46);
    });

    it('evaluates SQRT', () => {
      expect(formulaEngine.evaluate('=SQRT(16)')).toBe(4);
    });

    it('evaluates POWER', () => {
      expect(formulaEngine.evaluate('=POWER(2,10)')).toBe(1024);
    });

    it('evaluates ABS', () => {
      expect(formulaEngine.evaluate('=ABS(-5)')).toBe(5);
    });

    it('rejects unknown functions', () => {
      expect(formulaEngine.evaluate('=UNKNOWN(1)')).toMatch(/^#ERROR/);
    });
  });

  describe('cell references', () => {
    it('resolves cell references from context', () => {
      expect(formulaEngine.evaluate('=A1+B1', { A1: 10, B1: 20 })).toBe(30);
    });

    it('defaults missing cell references to 0', () => {
      expect(formulaEngine.evaluate('=A1+B1', { A1: 10 })).toBe(10);
    });

    it('uses cell references in functions', () => {
      expect(
        formulaEngine.evaluate('=SUM(A1,A2,A3)', { A1: 1, A2: 2, A3: 3 })
      ).toBe(6);
    });
  });

  describe('non-formula input', () => {
    it('returns non-formula strings as-is', () => {
      expect(formulaEngine.evaluate('hello')).toBe('hello');
    });

    it('returns null/undefined as-is', () => {
      expect(formulaEngine.evaluate(null)).toBe(null);
      expect(formulaEngine.evaluate(undefined)).toBe(undefined);
    });

    it('returns empty string as-is', () => {
      expect(formulaEngine.evaluate('')).toBe('');
    });
  });

  describe('security: code injection prevention', () => {
    it('rejects process.exit() injection', () => {
      const result = formulaEngine.evaluate('=process.exit(1)');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects require() injection', () => {
      const result = formulaEngine.evaluate("=require('child_process')");
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects constructor access', () => {
      const result = formulaEngine.evaluate('=constructor.constructor("return this")()');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects Function constructor', () => {
      const result = formulaEngine.evaluate('=Function("return 1")()');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects global object access', () => {
      const result = formulaEngine.evaluate('=globalThis');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects string concatenation tricks', () => {
      const result = formulaEngine.evaluate('="hello"+"world"');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects array literal injection', () => {
      const result = formulaEngine.evaluate('=[1,2,3]');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects object literal injection', () => {
      const result = formulaEngine.evaluate('={a:1}');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects semicolons (statement chaining)', () => {
      const result = formulaEngine.evaluate('=1;process.exit(1)');
      expect(result).toMatch(/^#ERROR/);
    });

    it('rejects backtick template literals', () => {
      const result = formulaEngine.evaluate('=`${process.env}`');
      expect(result).toMatch(/^#ERROR/);
    });
  });
});
