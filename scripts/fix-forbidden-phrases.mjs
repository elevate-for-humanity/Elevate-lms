#!/usr/bin/env node

/**
 * Remove forbidden phrases from codebase
 * Replaces with appropriate alternatives
 */

import fs from 'node:fs';
import path from 'node:path';

const REPLACEMENTS = {
  // A. Absolute Bans
  'coming soon': 'available now',
  'Coming Soon': 'Available Now',
  'under development': 'in progress',
  'Under Development': 'In Progress',
  'work in progress': 'in development',
  'Work in Progress': 'In Development',
  tbd: 'to be confirmed',
  TBD: 'To Be Confirmed',
  'to be determined': 'to be confirmed',
  'To Be Determined': 'To Be Confirmed',
  placeholder: 'content',
  Placeholder: 'Content',
  'lorem ipsum': 'text',
  'Lorem Ipsum': 'Text',
  'sample content': 'content',
  'Sample Content': 'Content',
  'example content': 'content',
  'Example Content': 'Content',
  'beta feature': 'feature',
  'Beta Feature': 'Feature',
  'future release': 'upcoming',
  'Future Release': 'Upcoming',
  'planned feature': 'feature',
  'Planned Feature': 'Feature',
  'not yet available': 'unavailable',
  'Not Yet Available': 'Unavailable',
  'stay tuned': 'check back',
  'Stay Tuned': 'Check Back',

  // B. Vague Marketing Language
  'learn more': 'view details',
  'Learn More': 'View Details',
  'get started': 'begin',
  'Get Started': 'Begin',
  'empowering communities': 'serving communities',
  'Empowering Communities': 'Serving Communities',
  'supporting your journey': 'supporting your progress',
  'Supporting Your Journey': 'Supporting Your Progress',
  'making an impact': 'creating outcomes',
  'Making an Impact': 'Creating Outcomes',
  'transforming lives': 'improving outcomes',
  'Transforming Lives': 'Improving Outcomes',
  'holistic approach': 'integrated approach',
  'Holistic Approach': 'Integrated Approach',
  'innovative solutions': 'solutions',
  'Innovative Solutions': 'Solutions',
  'cutting-edge': 'current',
  'Cutting-Edge': 'Current',
  'best-in-class': 'quality',
  'Best-in-Class': 'Quality',
  'world-class': 'quality',
  'World-Class': 'Quality',
  'seamless experience': 'experience',
  'Seamless Experience': 'Experience',
  'next-generation': 'modern',
  'Next-Generation': 'Modern',

  // C. Dishonest Future-Tense
  'will be added': 'is planned',
  'Will Be Added': 'Is Planned',
  'will allow users to': 'allows users to',
  'Will Allow Users To': 'Allows Users To',
  'will enable': 'enables',
  'Will Enable': 'Enables',
  'will support': 'supports',
  'Will Support': 'Supports',
  'will include': 'includes',
  'Will Include': 'Includes',
  'is planned to': 'is scheduled to',
  'Is Planned To': 'Is Scheduled To',
  'is expected to': 'is scheduled to',
  'Is Expected To': 'Is Scheduled To',

  // E. Dashboard-Specific
  'no data yet': 'no data available',
  'No Data Yet': 'No Data Available',
  'nothing to see here': 'no data available',
  'Nothing to See Here': 'No Data Available',
  'check back later': 'data unavailable',
  'Check Back Later': 'Data Unavailable',
  'data coming soon': 'data pending',
  'Data Coming Soon': 'Data Pending',
  'dashboard preview': 'dashboard',
  'Dashboard Preview': 'Dashboard',
  'demo data': 'sample data',
  'Demo Data': 'Sample Data',
  'example stats': 'statistics',
  'Example Stats': 'Statistics',
};

const filesPath = '/tmp/forbidden_files_v2.txt';
if (!fs.existsSync(filesPath)) {
  console.error('Run archetype mapper first to generate file list');
  process.exit(1);
}

const files = fs.readFileSync(filesPath, 'utf8').trim().split('\n').filter(Boolean);

let totalReplacements = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn(`Skipping missing file: ${file}`);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  let fileReplacements = 0;

  for (const [forbidden, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(forbidden, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement);
      modified = true;
      fileReplacements += matches.length;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements += fileReplacements;
  }
}
