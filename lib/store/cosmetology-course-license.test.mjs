import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COSMETOLOGY_COURSE_LICENSE as course,cosmetologyLicenseTotal} from './cosmetology-course-license.ts';
test('organization quotes charge exactly $275 for each named student seat',()=>{assert.equal(course.pricePerStudentCents,27500);assert.equal(cosmetologyLicenseTotal(1),27500);assert.equal(cosmetologyLicenseTotal(10),275000);assert.equal(cosmetologyLicenseTotal(1000),27500000);});
test('invalid seat quantities cannot produce a quote',()=>{for(const count of [0,-1,1.5,NaN,Infinity,1001])assert.throws(()=>cosmetologyLicenseTotal(count));});
