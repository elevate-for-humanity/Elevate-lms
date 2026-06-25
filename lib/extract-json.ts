export function extractJSON(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from text that might have surrounding content
    // Look for markdown code blocks first
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        throw new Error('Incomplete JSON structure');
      }
    }
    
    // Look for JSON object or array in text - need balanced braces
    // Check for complete JSON structure
    const completeMatch = text.match(/\{[^{}]*\}/) || text.match(/\[[^\[\]]*\]/);
    if (completeMatch) {
      try {
        return JSON.parse(completeMatch[0]);
      } catch {
        throw new Error('Incomplete JSON structure');
      }
    }
    
    // Check if there are any braces suggesting incomplete JSON
    if (text.includes('{') || text.includes('[')) {
      throw new Error('Incomplete JSON structure');
    }
    
    throw new Error('No JSON structure found');
  }
}