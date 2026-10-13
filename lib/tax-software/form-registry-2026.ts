export type TaxFormDefinition={code:string;name:string;category:'core'|'income'|'deduction'|'credit'|'business'|'payment'|'extension';interviewTrigger:string;selfFileChargeCode?:string;mef:boolean;};
export const TY2026_1040_FORM_REGISTRY:TaxFormDefinition[]=[
{code:'1040',name:'U.S. Individual Income Tax Return',category:'core',interviewTrigger:'always',mef:true},
{code:'W2',name:'Wage and Tax Statement',category:'income',interviewTrigger:'w2_income',mef:true},
{code:'1099-INT',name:'Interest Income',category:'income',interviewTrigger:'interest_income',mef:true},
{code:'1099-DIV',name:'Dividends and Distributions',category:'income',interviewTrigger:'dividend_income',mef:true},
{code:'1099-NEC',name:'Nonemployee Compensation',category:'income',interviewTrigger:'self_employment',mef:true},
{code:'1099-MISC',name:'Miscellaneous Information',category:'income',interviewTrigger:'misc_income',mef:true},
{code:'SCHEDULE_A',name:'Schedule A — Itemized Deductions',category:'deduction',interviewTrigger:'itemized_deductions',selfFileChargeCode:'SCHEDULE_A',mef:true},
{code:'SCHEDULE_B',name:'Schedule B — Interest and Ordinary Dividends',category:'income',interviewTrigger:'schedule_b',selfFileChargeCode:'SCHEDULE_B',mef:true},
{code:'SCHEDULE_C',name:'Schedule C — Profit or Loss From Business',category:'business',interviewTrigger:'self_employment',selfFileChargeCode:'SCHEDULE_C',mef:true},
{code:'SCHEDULE_D',name:'Schedule D — Capital Gains and Losses',category:'income',interviewTrigger:'capital_gains',selfFileChargeCode:'SCHEDULE_D',mef:true},
{code:'SCHEDULE_E',name:'Schedule E — Supplemental Income and Loss',category:'income',interviewTrigger:'rental_pass_through',selfFileChargeCode:'SCHEDULE_E',mef:true},
{code:'SCHEDULE_SE',name:'Schedule SE — Self-Employment Tax',category:'business',interviewTrigger:'schedule_se',selfFileChargeCode:'SCHEDULE_SE',mef:true},
{code:'2441',name:'Child and Dependent Care Expenses',category:'credit',interviewTrigger:'dependent_care',selfFileChargeCode:'FORM_2441',mef:true},
{code:'8863',name:'Education Credits',category:'credit',interviewTrigger:'education_credit',selfFileChargeCode:'FORM_8863',mef:true},
{code:'8889',name:'Health Savings Accounts',category:'deduction',interviewTrigger:'hsa',selfFileChargeCode:'FORM_8889',mef:true},
{code:'4868',name:'Application for Automatic Extension of Time to File',category:'extension',interviewTrigger:'extension',mef:true},
];
export function formsForTriggers(triggers:string[]){return TY2026_1040_FORM_REGISTRY.filter(f=>f.interviewTrigger==='always'||triggers.includes(f.interviewTrigger));}
