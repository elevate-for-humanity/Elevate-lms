#!/usr/bin/env python3
"""
Splits barber-apprenticeship.ts into modular files under lib/curriculum/blueprints/barber/
Run once, then delete this script.
"""
import os
import re

SRC = "lib/curriculum/blueprints/barber-apprenticeship.ts"
DEST_DIR = "lib/curriculum/blueprints/barber"

# Module separator line numbers (1-indexed) from grep output
MODULE_SEPARATORS = [55, 677, 1213, 1786, 2675, 3133, 3517, 3973, 4802]
MODULE_NAMES = [
    "module-1",  # Infection Control & Safety
    "module-2",  # Hair Science & Scalp Analysis
    "module-3",  # Tools, Equipment & Ergonomics
    "module-4",  # Haircutting Techniques
    "module-5",  # Shaving & Beard Services
    "module-6",  # Chemical Services
    "module-7",  # Professional & Business Skills
    "module-8",  # State Board Exam Preparation
]
EXPORT_NAMES = [
    "barberModule1",
    "barberModule2",
    "barberModule3",
    "barberModule4",
    "barberModule5",
    "barberModule6",
    "barberModule7",
    "barberModule8",
]

with open(SRC, "r") as f:
    all_lines = f.readlines()

# Total lines
total = len(all_lines)

os.makedirs(DEST_DIR, exist_ok=True)

# Extract header: lines 1..53 (0-indexed: 0..52)
header_lines = all_lines[:53]  # up to but not including `  modules: [`

# Extract footer: lines 4802..end (0-indexed: 4801..end)
# Line 4802 is `  ],` (end of modules array)
# Lines 4803..4822 are assessments + closing
footer_lines = all_lines[4801:]  # `  ],` onward = assessments close + `};`

# For each module, extract the object content (the { ... }, block)
module_contents = []
for i, (start_sep, name) in enumerate(zip(MODULE_SEPARATORS, MODULE_NAMES)):
    # start_sep is the comment line (1-indexed)
    # The object starts on start_sep+1 (0-indexed: start_sep)
    line_start = start_sep  # 0-indexed: the `{` line of the module object
    
    if i + 1 < len(MODULE_SEPARATORS):
        # End is the line before the next separator comment
        line_end = MODULE_SEPARATORS[i + 1] - 1  # 0-indexed exclusive
    else:
        # Last module ends at modules array close `  ],` which is line 4802 (0-indexed 4801)
        line_end = 4801  # exclusive, so we take up to 4800 inclusive
    
    # Get the module lines
    raw = all_lines[line_start:line_end]
    
    # Strip trailing comma from the last `    },` if present, to make it a clean object
    # Find last non-empty line
    stripped = list(raw)
    for j in range(len(stripped) - 1, -1, -1):
        if stripped[j].strip():
            # Remove trailing comma if present (it's inside modules: [...])
            stripped[j] = stripped[j].rstrip()
            if stripped[j].endswith(","):
                stripped[j] = stripped[j][:-1] + "\n"
            else:
                stripped[j] += "\n"
            break
    
    module_contents.append("".join(stripped))

# Write each module file
for name, export_name, content in zip(MODULE_NAMES, EXPORT_NAMES, module_contents):
    filepath = os.path.join(DEST_DIR, f"{name}.ts")
    with open(filepath, "w") as f:
        f.write(f"import type {{ BlueprintModule }} from '../types';\n\n")
        f.write(f"export const {export_name}: BlueprintModule = ")
        f.write(content.lstrip())  # remove leading whitespace/newline from `    {`
        # Ensure file ends cleanly
        if not f.name:
            pass
    # Re-open and fix: content starts with `    {` — need to strip leading spaces
    with open(filepath, "w") as f:
        f.write(f"import type {{ BlueprintModule }} from '../types';\n\n")
        f.write(f"export const {export_name}: BlueprintModule = ")
        # strip leading whitespace from first line of content
        lines = content.split("\n")
        lines[0] = lines[0].lstrip()
        f.write("\n".join(lines))
        if not content.rstrip().endswith(";"):
            f.write(";\n")
    print(f"  Wrote {filepath}")

# Now extract the blueprint shell: header + assessments from original
# Lines 1..53 = comment block, imports, video config
# Lines 4802..4822 = `  ],` ... `};`

# Parse header to get the blueprint open (lines 1-53 include up to before `modules: [`)
# We also need the blueprint metadata lines (22..53: the export const start)
# Lines 22-53 in file are:
#   export const barberApprenticeshipBlueprint: CredentialBlueprint = {
#   ...metadata...
#   modules: [   <- line 54, which we replace with import-based modules array

header_text = "".join(header_lines)

# Extract assessment content from footer
# footer_lines[0] = `  ],\n`  (closes modules array — line 4802)
# footer_lines[1..] = assessments array + `};`
# We want just the assessments array content
assessment_text = "".join(footer_lines[1:])  # skip the `  ],` close of modules

# Write index.ts
index_path = os.path.join(DEST_DIR, "index.ts")
with open(index_path, "w") as f:
    # Write original header (comment block + imports + video config)
    f.write(header_text)
    
    # Add module imports after the existing imports
    f.write("\n")
    for name, export_name in zip(MODULE_NAMES, EXPORT_NAMES):
        f.write(f"import {{ {export_name} }} from './{name}';\n")
    
    f.write("\n  modules: [\n")
    for export_name in EXPORT_NAMES:
        f.write(f"    {export_name},\n")
    f.write("  ],\n")
    f.write(assessment_text)

print(f"  Wrote {index_path}")
print("\nDone! Now update barber-apprenticeship.ts to re-export from ./barber/index")
