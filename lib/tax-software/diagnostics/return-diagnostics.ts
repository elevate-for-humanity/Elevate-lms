export type ReturnDiagnostic={code:string;severity:'error'|'warning';section:string;message:string};
type DiagnosticInput={filingStatus?:string;taxpayerDob?:string;w2Count:number;unconfirmedW2Count:number;hasDependents:boolean;dependentCount:number;refundAmount:number;amountOwed:number;bankAccountConfigured:boolean;authorizationSigned:boolean;taxpayerName?:string;addressComplete:boolean};
export function runReturnDiagnostics(i:DiagnosticInput):ReturnDiagnostic[]{const d:ReturnDiagnostic[]=[];
if(!i.taxpayerName)d.push({code:'TAXPAYER_NAME_REQUIRED',severity:'error',section:'Personal Info',message:'Taxpayer legal name is required.'});
if(!i.taxpayerDob)d.push({code:'DOB_REQUIRED',severity:'error',section:'Personal Info',message:'Taxpayer date of birth is required.'});
if(!i.filingStatus)d.push({code:'FILING_STATUS_REQUIRED',severity:'error',section:'Personal Info',message:'Filing status is required.'});
if(!i.addressComplete)d.push({code:'ADDRESS_INCOMPLETE',severity:'error',section:'Personal Info',message:'Taxpayer mailing address is incomplete.'});
if(i.unconfirmedW2Count>0)d.push({code:'W2_UNCONFIRMED',severity:'error',section:'Income',message:`${i.unconfirmedW2Count} W-2 document(s) still require field confirmation.`});
if(i.hasDependents&&i.dependentCount===0)d.push({code:'DEPENDENT_DATA_MISSING',severity:'error',section:'Household',message:'Dependent answers indicate a dependent, but no dependent record is complete.'});
if(i.refundAmount>0&&!i.bankAccountConfigured)d.push({code:'REFUND_METHOD_REQUIRED',severity:'warning',section:'Refund',message:'Choose a refund delivery method before filing.'});
if(!i.authorizationSigned)d.push({code:'AUTHORIZATION_REQUIRED',severity:'error',section:'Sign & File',message:'Taxpayer filing authorization has not been completed.'});
return d;}
