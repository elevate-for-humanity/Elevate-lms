export type MefReadinessInput={
  schemaVersion?:string; wsdlVersion?:string; softwareId?:string; etin?:string;
  appSysId?:string; certificateConfigured:boolean; schemaInstalled:boolean;
  businessRulesInstalled:boolean; atsEnvironmentConfigured:boolean;
};
export type MefReadinessItem={code:string;ok:boolean;message:string;external:boolean};
export function assessMefReadiness(i:MefReadinessInput):MefReadinessItem[]{
 return [
  {code:'SCHEMA',ok:i.schemaInstalled,message:i.schemaInstalled?'TY2026 schema package installed':'Install current TY2026 MeF schema package from IRS SOR',external:!i.schemaInstalled},
  {code:'BUSINESS_RULES',ok:i.businessRulesInstalled,message:i.businessRulesInstalled?'Business rules installed':'Install matching TY2026 IRS business rules',external:!i.businessRulesInstalled},
  {code:'WSDL',ok:Boolean(i.wsdlVersion),message:i.wsdlVersion?`WSDL ${i.wsdlVersion} configured`:'Configure IRS TY2026/processing-year-2027 WSDL package',external:false},
  {code:'SOFTWARE_ID',ok:Boolean(i.softwareId),message:i.softwareId?'IRS Software ID configured':'IRS Software ID pending issuance/configuration',external:!i.softwareId},
  {code:'ETIN',ok:Boolean(i.etin),message:i.etin?'ETIN configured':'Test/production ETIN pending IRS configuration',external:!i.etin},
  {code:'APPSYSID',ok:Boolean(i.appSysId),message:i.appSysId?'A2A AppSysId configured':'A2A AppSysId pending Automated Enrollment',external:!i.appSysId},
  {code:'CERT',ok:i.certificateConfigured,message:i.certificateConfigured?'A2A certificate configured':'Strong-authentication certificate not configured',external:!i.certificateConfigured},
  {code:'ATS',ok:i.atsEnvironmentConfigured,message:i.atsEnvironmentConfigured?'ATS endpoint configured':'ATS endpoint/configuration pending',external:false},
 ];
}
