import { XMLBuilder, XMLValidator } from 'fast-xml-parser';
import fieldOrder from './ty2026-field-order.json';
import type { IrsNode } from './return-xml';
const orders = fieldOrder.orders as Record<string, string[]>;
function ordered(value: unknown, path: string): unknown {
  if (Array.isArray(value)) return value.map((v) => ordered(v, path));
  if (value === null || typeof value !== 'object') return value;
  const input = value as Record<string, unknown>,
    output: Record<string, unknown> = {};
  for (const [key, v] of Object.entries((input['@attributes'] ?? {}) as Record<string, unknown>))
    output['@_' + key] = v;
  const keys = Object.keys(input).filter((k) => k !== '@attributes'),
    sequence = orders[path] ?? [];
  keys.sort((a, b) => {
    const ai = sequence.indexOf(a),
      bi = sequence.indexOf(b);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
  });
  for (const key of keys) {
    const childPath = path === 'Return' ? key : path === 'ReturnData' ? key : path + '/' + key;
    output[key] = ordered(input[key], childPath);
  }
  return output;
}
export function serializeMefReturn2026(fields: IrsNode) {
  const root = ordered(fields, 'Return') as Record<string, unknown>;
  root['@_xmlns'] = 'http://www.irs.gov/efile';
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      suppressEmptyNode: true,
    }).build({ Return: root });
  if (XMLValidator.validate(xml) !== true) throw new Error('Unable to generate valid return XML');
  return xml;
}
