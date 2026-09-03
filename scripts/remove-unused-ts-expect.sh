#!/bin/bash
# Remove unused @ts-expect-error directives

FILES=$(npm run type-check 2>&1 | grep "Unused '@ts-expect-error'" -B1 | grep "\.tsx\|\.ts" | cut -d'(' -f1 | sort -u)

for file in $FILES; do
  if [ -f "$file" ]; then
    # Get line numbers of unused directives
    LINES=$(npm run type-check 2>&1 | grep "$file" | grep "Unused '@ts-expect-error'" | cut -d'(' -f2 | cut -d',' -f1 | sort -rn)
    
    for line in $LINES; do
      # Remove the @ts-expect-error comment line
      sed -i "${line}d" "$file"
    done
    echo "Processed: $file"
  fi
done

echo "✅ Removed unused @ts-expect-error directives"
