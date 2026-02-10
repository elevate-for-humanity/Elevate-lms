class FormulaEngine {
  constructor() {
    this.functions = {
      SUM: (...args) => args.reduce((a, b) => a + b, 0),
      AVERAGE: (...args) =>
        args.length === 0 ? 0 : args.reduce((a, b) => a + b, 0) / args.length,
      MIN: (...args) => Math.min(...args),
      MAX: (...args) => Math.max(...args),
      COUNT: (...args) => args.length,
      IF: (condition, trueVal, falseVal) => (condition ? trueVal : falseVal),
      ROUND: (num, decimals = 0) =>
        Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
      SQRT: (num) => Math.sqrt(num),
      POWER: (base, exp) => Math.pow(base, exp),
      ABS: (num) => Math.abs(num),
    };
  }

  /**
   * Tokenize a formula expression into numbers, operators, parentheses,
   * function names, commas, and comparison operators.
   */
  _tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Numbers (including decimals)
      if (
        /\d/.test(ch) ||
        (ch === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))
      ) {
        let num = '';
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
          num += expr[i];
          i++;
        }
        tokens.push({ type: 'number', value: parseFloat(num) });
        continue;
      }

      // Comparison operators: >=, <=, !=, ==, >, <
      if (ch === '>' || ch === '<' || ch === '!' || ch === '=') {
        if (i + 1 < expr.length && expr[i + 1] === '=') {
          tokens.push({ type: 'operator', value: ch + '=' });
          i += 2;
          continue;
        }
        if (ch === '>' || ch === '<') {
          tokens.push({ type: 'operator', value: ch });
          i++;
          continue;
        }
        throw new Error(`Unexpected character: ${ch}`);
      }

      // Arithmetic operators
      if ('+-*/%^'.includes(ch)) {
        // Handle unary minus
        if (
          ch === '-' &&
          (tokens.length === 0 ||
            tokens[tokens.length - 1].type === 'operator' ||
            tokens[tokens.length - 1].type === 'lparen' ||
            tokens[tokens.length - 1].type === 'comma')
        ) {
          let num = '-';
          i++;
          while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
            num += expr[i];
            i++;
          }
          if (num === '-') {
            throw new Error('Unexpected minus sign');
          }
          tokens.push({ type: 'number', value: parseFloat(num) });
          continue;
        }
        tokens.push({ type: 'operator', value: ch });
        i++;
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: 'lparen', value: '(' });
        i++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'rparen', value: ')' });
        i++;
        continue;
      }

      if (ch === ',') {
        tokens.push({ type: 'comma', value: ',' });
        i++;
        continue;
      }

      // Function names (uppercase letters only)
      if (/[A-Z]/.test(ch)) {
        let name = '';
        while (i < expr.length && /[A-Z_]/.test(expr[i])) {
          name += expr[i];
          i++;
        }
        if (!this.functions[name]) {
          throw new Error(`Unknown function: ${name}`);
        }
        tokens.push({ type: 'function', value: name });
        continue;
      }

      throw new Error(`Unexpected character: ${ch}`);
    }
    return tokens;
  }

  /**
   * Recursive descent parser for safe expression evaluation.
   * Supports: arithmetic (+, -, *, /, %, ^), comparisons, and whitelisted function calls.
   * No eval() — prevents arbitrary code execution.
   */
  _parse(tokens) {
    let pos = 0;

    const peek = () => (pos < tokens.length ? tokens[pos] : null);
    const consume = (expectedType) => {
      const token = tokens[pos];
      if (!token) throw new Error('Unexpected end of expression');
      if (expectedType && token.type !== expectedType) {
        throw new Error(`Expected ${expectedType}, got ${token.type}`);
      }
      pos++;
      return token;
    };

    const parseComparison = () => {
      let left = parseAdditive();
      while (
        peek() &&
        peek().type === 'operator' &&
        ['>=', '<=', '!=', '==', '>', '<'].includes(peek().value)
      ) {
        const op = consume('operator').value;
        const right = parseAdditive();
        switch (op) {
          case '>=': left = left >= right ? 1 : 0; break;
          case '<=': left = left <= right ? 1 : 0; break;
          case '!=': left = left !== right ? 1 : 0; break;
          case '==': left = left === right ? 1 : 0; break;
          case '>':  left = left > right ? 1 : 0; break;
          case '<':  left = left < right ? 1 : 0; break;
        }
      }
      return left;
    };

    const parseAdditive = () => {
      let left = parseMultiplicative();
      while (
        peek() &&
        peek().type === 'operator' &&
        (peek().value === '+' || peek().value === '-')
      ) {
        const op = consume('operator').value;
        const right = parseMultiplicative();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const parseMultiplicative = () => {
      let left = parsePower();
      while (
        peek() &&
        peek().type === 'operator' &&
        (peek().value === '*' || peek().value === '/' || peek().value === '%')
      ) {
        const op = consume('operator').value;
        const right = parsePower();
        if (op === '*') left = left * right;
        else if (op === '/') {
          if (right === 0) throw new Error('Division by zero');
          left = left / right;
        } else left = left % right;
      }
      return left;
    };

    const parsePower = () => {
      let base = parsePrimary();
      if (peek() && peek().type === 'operator' && peek().value === '^') {
        consume('operator');
        const exp = parsePower();
        base = Math.pow(base, exp);
      }
      return base;
    };

    const parsePrimary = () => {
      const token = peek();
      if (!token) throw new Error('Unexpected end of expression');

      if (token.type === 'number') {
        consume('number');
        return token.value;
      }

      if (token.type === 'function') {
        const funcName = consume('function').value;
        consume('lparen');
        const args = [];
        if (peek() && peek().type !== 'rparen') {
          args.push(parseComparison());
          while (peek() && peek().type === 'comma') {
            consume('comma');
            args.push(parseComparison());
          }
        }
        consume('rparen');
        return this.functions[funcName](...args);
      }

      if (token.type === 'lparen') {
        consume('lparen');
        const result = parseComparison();
        consume('rparen');
        return result;
      }

      throw new Error(`Unexpected token: ${token.value}`);
    };

    const result = parseComparison();
    if (pos < tokens.length) {
      throw new Error(`Unexpected token: ${tokens[pos].value}`);
    }
    return result;
  }

  evaluate(formula, context = {}) {
    try {
      if (!formula || !formula.startsWith('=')) return formula;
      let expr = formula.substring(1);

      // Replace cell references (e.g., A1, B2) with their values from context.
      // Skip tokens that match a known function name.
      expr = expr.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
        const cellRef = `${col}${row}`;
        if (this.functions[cellRef] !== undefined) return match;
        return context[cellRef] !== undefined ? String(context[cellRef]) : '0';
      });

      const tokens = this._tokenize(expr);
      return this._parse(tokens);
    } catch (error) {
      return `#ERROR: ${error.message}`;
    }
  }
}

const formulaEngine = new FormulaEngine();
export default formulaEngine;
export { FormulaEngine };
