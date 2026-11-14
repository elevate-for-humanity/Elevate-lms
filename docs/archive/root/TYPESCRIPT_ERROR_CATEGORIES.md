# TypeScript Error Categories - 483 Total Errors

## Summary
After fixing 7 files (~200+ errors reduced from ~700+), **483 errors remain**.

## By Error Code

| Error Code | Count | Description | Fix Strategy |
|------------|-------|-------------|--------------|
| TS2339 | 117 | Property does not exist on type | Add missing types or cast to `any` |
| TS2353 | 55 | Argument not assignable to parameter | Fix argument types |
| TS2345 | 54 | Argument type mismatch | Fix type assignments |
| TS2322 | 52 | Type not assignable to type | Fix type declarations |
| TS2304 | 50 | Cannot find name | Import missing or add `any` |
| TS7030 | 32 | Parameter implicitly has any | Add explicit type annotations |
| TS2307 | 21 | Module not found | Add missing imports or install packages |
| TS2554 | 14 | Expected arguments mismatch | Fix function signatures |
| TS2352 | 12 | Type conversion error | Fix type casting |
| TS2305 | 12 | Module has no exported member | Add export or fix import |
| TS2741 | 10 | Property missing in type | Add missing properties |
| TS2740 | 9 | Type missing properties | Add missing type properties |
| TS2769 | 6 | No overload matches | Fix function overloads |
| TS2724 | 4 | File has no default export | Add export or use named export |
| TS1117 | 4 | Invalid object literal | Fix object literal syntax |
| TS2739 | 3 | Property missing required | Add required property |
| TS2440 | 3 | Duplicate identifier | Remove duplicate |
| TS1361 | 3 | Cannot be used as value | Fix import type vs value |
| TS2551 | 2 | Property does not exist | Fix property name |
| TS2451 | 2 | Duplicate name declaration | Remove duplicate |

## By Module

| Module | Error Count | Priority |
|--------|-------------|----------|
| lib/paris | 45 | High |
| lib/ai | 35 | High |
| lib/curriculum | 33 | High |
| lib/grants | 20 | Medium |
| lib/licensing | 14 | Medium |
| lib/compliance | 10 | Medium |
| components/lms | 15 | Medium |
| lib/course-factory | 10 | Medium |

## Top Priority Files (10+ errors)

| File | Count | Error Types |
|------|-------|-------------|
| lib/paris/import-engine/github-analyzer.ts | 13 | TS2305, TS2322, TS2362, TS2769 |
| lib/paris/course-orchestrator.ts | 12 | TS2339, TS2345, TS2353 |
| lib/ai/workforce-gap-scanner.ts | 12 | TS2339, TS2345, TS2322 |
| lib/qa/auto-healing-agent.ts | 10 | Various |
| lib/paris/dev-studio.ts | 8 | TS2339, TS2322 |
| lib/curriculum/package/generator.ts | 8 | TS2339, TS2322 |

## Error Patterns

### 1. Missing Types (TS2339 - 117 errors)
**Pattern**: Property 'X' does not exist on type 'Y'
**Solution**: Add missing property to interface/type, cast to `any` for quick fix

### 2. Import Issues (TS2304, TS2307, TS2305 - 83 errors)
**Pattern**: Cannot find name/module has no exported member
**Solution**: Add missing imports, create missing type definitions

### 3. Type Mismatches (TS2345, TS2353, TS2322 - 161 errors)
**Pattern**: Argument type not assignable
**Solution**: Fix function parameter types, use `as` type assertions

### 4. Implicit Any (TS7030 - 32 errors)
**Pattern**: Parameter implicitly has 'any' type
**Solution**: Add explicit type annotations
