import { logger } from '@/lib/logger';
/**
 * IRS MeF SOAP Client
 * Real SOAP transmission to IRS MeF endpoints with mutual TLS
 * 
 * IMPORTANT: Requires IRS-issued certificates for production use.
 * Test mode uses IRS ATS (Assurance Testing System) endpoints.
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { MeFAcknowledgment, MeFError } from './acknowledgment';

// IRS MeF SOAP Endpoints
export const MEF_ENDPOINTS = {
  // Production endpoints (require approved software + certs)
  production: {
    transmit: 'https://la.www4.irs.gov/a2a/mef/transmitter/TransmitterService',
    ack: 'https://la.www4.irs.gov/a2a/mef/transmitter/AcknowledgementService',
    status: 'https://la.www4.irs.gov/a2a/mef/transmitter/StatusService'
  },
  // ATS Test endpoints (for software testing)
  test: {
    transmit: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/TransmitterService',
    ack: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/AcknowledgementService',
    status: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/StatusService'
  }
};

// SOAP Actions
const SOAP_ACTIONS = {
  transmit: 'TransmitReturn',
  getAck: 'GetAcknowledgement',
  getStatus: 'GetSubmissionStatus'
};

export interface SOAPClientConfig {
  environment: 'production' | 'test';
  efin: string;
  softwareId: string;
  // Certificate paths (for mutual TLS)
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  // Or certificate contents directly
  cert?: string;
  key?: string;
  ca?: string;
  // Passphrase for encrypted keys
  passphrase?: string;
  // Timeout in ms
  timeout?: number;
}

export interface SOAPTransmitRequest {
  submissionId: string;
  taxYear: number;
  xmlContent: string;
}

export interface SOAPTransmitResponse {
  success: boolean;
  submissionId: string;
  receiptId?: string;
  timestamp: string;
  acknowledgment?: MeFAcknowledgment;
  rawResponse?: string;
  error?: string;
}

export interface SOAPStatusResponse {
  submissionId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Error';
  dcn?: string;
  errors?: MeFError[];
  timestamp: string;
}

/**
 * IRS MeF SOAP Client for real transmission
 */
export class MeFSOAPClient {
  private config: SOAPClientConfig;
  private httpsAgent: https.Agent | null = null;

  constructor(config: SOAPClientConfig) {
    this.config = {
      timeout: 60000, // 60 second default
      ...config
    };
    this.initializeAgent();
  }

  /**
   * Initialize HTTPS agent with mutual TLS if certificates provided
   */
  private initializeAgent(): void {
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: true, // Always verify IRS certificates
      keepAlive: true
    };

    // Load certificates if provided
    if (this.config.certPath && this.config.keyPath) {
      try {
        agentOptions.cert = fs.readFileSync(this.config.certPath);
        agentOptions.key = fs.readFileSync(this.config.keyPath);
        if (this.config.caPath) {
          agentOptions.ca = fs.readFileSync(this.config.caPath);
        }
        if (this.config.passphrase) {
          agentOptions.passphrase = this.config.passphrase;
        }
        logger.info('[MeF SOAP] Loaded certificates from files');
      } catch (err) {
        logger.error('[MeF SOAP] Failed to load certificates:', err);
      }
    } else if (this.config.cert && this.config.key) {
      agentOptions.cert = this.config.cert;
      agentOptions.key = this.config.key;
      if (this.config.ca) {
        agentOptions.ca = this.config.ca;
      }
      if (this.config.passphrase) {
        agentOptions.passphrase = this.config.passphrase;
      }
      logger.info('[MeF SOAP] Using provided certificate strings');
    }

    this.httpsAgent = new https.Agent(agentOptions);
  }

  /**
   * Transmit a tax return to IRS
   */
  async transmit(request: SOAPTransmitRequest): Promise<SOAPTransmitResponse> {
    const endpoint = MEF_ENDPOINTS[this.config.environment].transmit;
    const timestamp = new Date().toISOString();

    // Build SOAP envelope
    const soapEnvelope = this.buildTransmitEnvelope(request);

    try {
      const response = await this.sendSOAPRequest(endpoint, SOAP_ACTIONS.transmit, soapEnvelope);
      const parsed = this.parseTransmitResponse(response, request.submissionId);
      
      return {
        ...parsed,
        timestamp,
        rawResponse: response
      };
    } catch (err) {
      return {
        success: false,
        submissionId: request.submissionId,
        timestamp,
        error: err instanceof Error ? err.message : 'Unknown transmission error'
      };
    }
  }

  /**
   * Get acknowledgment for a submission
   */
  async getAcknowledgment(submissionId: string): Promise<SOAPTransmitResponse> {
    const endpoint = MEF_ENDPOINTS[this.config.environment].ack;
    const timestamp = new Date().toISOString();

    const soapEnvelope = this.buildAckRequestEnvelope(submissionId);

    try {
      const response = await this.sendSOAPRequest(endpoint, SOAP_ACTIONS.getAck, soapEnvelope);
      const parsed = this.parseAckResponse(response, submissionId);
      
      return {
        ...parsed,
        timestamp,
        rawResponse: response
      };
    } catch (err) {
      return {
        success: false,
        submissionId,
        timestamp,
        error: err instanceof Error ? err.message : 'Unknown error getting acknowledgment'
      };
    }
  }

  /**
   * Get submission status
   */
  async getStatus(submissionId: string): Promise<SOAPStatusResponse> {
    const endpoint = MEF_ENDPOINTS[this.config.environment].status;
    const timestamp = new Date().toISOString();

    const soapEnvelope = this.buildStatusRequestEnvelope(submissionId);

    try {
      const response = await this.sendSOAPRequest(endpoint, SOAP_ACTIONS.getStatus, soapEnvelope);
      return this.parseStatusResponse(response, submissionId, timestamp);
    } catch (err) {
      return {
        submissionId,
        status: 'Error',
        timestamp,
        errors: [{
          errorCode: 'SOAP_ERROR',
          errorCategory: 'reject',
          errorMessage: err instanceof Error ? err.message : 'Unknown error'
        }]
      };
    }
  }

  /**
   * Build SOAP envelope for transmission
   */
  private buildTransmitEnvelope(request: SOAPTransmitRequest): string {
    const base64Content = Buffer.from(request.xmlContent).toString('base64');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mef="http://www.irs.gov/a2a/mef/MeFTransmitterService.xsd">
  <soap:Header>
    <mef:MeFHeader>
      <mef:EFIN>${this.config.efin}</mef:EFIN>
      <mef:SoftwareId>${this.config.softwareId}</mef:SoftwareId>
      <mef:SessionIndicator>Y</mef:SessionIndicator>
      <mef:TestIndicator>${this.config.environment === 'test' ? 'T' : 'P'}</mef:TestIndicator>
      <mef:Timestamp>${new Date().toISOString()}</mef:Timestamp>
    </mef:MeFHeader>
  </soap:Header>
  <soap:Body>
    <mef:TransmitRequest>
      <mef:TransmissionHeader>
        <mef:TransmissionId>${request.submissionId}</mef:TransmissionId>
        <mef:Timestamp>${new Date().toISOString()}</mef:Timestamp>
        <mef:TransmissionCount>1</mef:TransmissionCount>
      </mef:TransmissionHeader>
      <mef:ReturnDataList>
        <mef:ReturnData>
          <mef:SubmissionId>${request.submissionId}</mef:SubmissionId>
          <mef:TaxYear>${request.taxYear}</mef:TaxYear>
          <mef:ReturnType>1040</mef:ReturnType>
          <mef:ContentLocation>attachment</mef:ContentLocation>
        </mef:ReturnData>
      </mef:ReturnDataList>
      <mef:BinaryAttachmentList>
        <mef:BinaryAttachment>
          <mef:ContentId>attachment</mef:ContentId>
          <mef:ContentType>application/xml</mef:ContentType>
          <mef:BinaryContent>${base64Content}</mef:BinaryContent>
        </mef:BinaryAttachment>
      </mef:BinaryAttachmentList>
    </mef:TransmitRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build SOAP envelope for acknowledgment request
   */
  private buildAckRequestEnvelope(submissionId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mef="http://www.irs.gov/a2a/mef/MeFAcknowledgementService.xsd">
  <soap:Header>
    <mef:MeFHeader>
      <mef:EFIN>${this.config.efin}</mef:EFIN>
      <mef:SoftwareId>${this.config.softwareId}</mef:SoftwareId>
      <mef:SessionIndicator>Y</mef:SessionIndicator>
      <mef:TestIndicator>${this.config.environment === 'test' ? 'T' : 'P'}</mef:TestIndicator>
      <mef:Timestamp>${new Date().toISOString()}</mef:Timestamp>
    </mef:MeFHeader>
  </soap:Header>
  <soap:Body>
    <mef:GetAcknowledgementRequest>
      <mef:SubmissionId>${submissionId}</mef:SubmissionId>
    </mef:GetAcknowledgementRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build SOAP envelope for status request
   */
  private buildStatusRequestEnvelope(submissionId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mef="http://www.irs.gov/a2a/mef/MeFStatusService.xsd">
  <soap:Header>
    <mef:MeFHeader>
      <mef:EFIN>${this.config.efin}</mef:EFIN>
      <mef:SoftwareId>${this.config.softwareId}</mef:SoftwareId>
      <mef:SessionIndicator>Y</mef:SessionIndicator>
      <mef:TestIndicator>${this.config.environment === 'test' ? 'T' : 'P'}</mef:TestIndicator>
      <mef:Timestamp>${new Date().toISOString()}</mef:Timestamp>
    </mef:MeFHeader>
  </soap:Header>
  <soap:Body>
    <mef:GetSubmissionStatusRequest>
      <mef:SubmissionId>${submissionId}</mef:SubmissionId>
    </mef:GetSubmissionStatusRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Send SOAP request to IRS
   */
  private async sendSOAPRequest(endpoint: string, action: string, envelope: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': action,
          'Content-Length': Buffer.byteLength(envelope)
        },
        agent: this.httpsAgent || undefined,
        timeout: this.config.timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Don't log the full envelope (contains PII)
      logger.info(`[MeF SOAP] Sending ${action} to ${endpoint}`);
      req.write(envelope);
      req.end();
    });
  }

  /**
   * Parse transmission response
   */
  private parseTransmitResponse(response: string, submissionId: string): Partial<SOAPTransmitResponse> {
    // Parse SOAP response for receipt and status
    const receiptMatch = response.match(/<mef:ReceiptId>([^<]+)<\/mef:ReceiptId>/);
    const statusMatch = response.match(/<mef:StatusTxt>([^<]+)<\/mef:StatusTxt>/);
    const errorMatch = response.match(/<soap:Fault>[\s\S]*?<faultstring>([^<]+)<\/faultstring>/);

    if (errorMatch) {
      return {
        success: false,
        submissionId,
        error: errorMatch[1]
      };
    }

    const status = statusMatch?.[1]?.toLowerCase();
    
    return {
      success: status !== 'rejected' && status !== 'error',
      submissionId,
      receiptId: receiptMatch?.[1]
    };
  }

  /**
   * Parse acknowledgment response
   */
  private parseAckResponse(response: string, submissionId: string): Partial<SOAPTransmitResponse> {
    const statusMatch = response.match(/<mef:AcceptanceStatusTxt>([^<]+)<\/mef:AcceptanceStatusTxt>/);
    const dcnMatch = response.match(/<mef:DCN>([^<]+)<\/mef:DCN>/);
    
    // Parse errors
    const errors: MeFError[] = [];
    const errorRegex = /<mef:Error>[\s\S]*?<mef:ErrorCd>([^<]+)<\/mef:ErrorCd>[\s\S]*?<mef:ErrorCategoryTxt>([^<]+)<\/mef:ErrorCategoryTxt>[\s\S]*?<mef:ErrorMessageTxt>([^<]+)<\/mef:ErrorMessageTxt>[\s\S]*?<\/mef:Error>/g;
    
    let match: RegExpExecArray | null;
    while ((match = errorRegex.exec(response)) !== null) {
      errors.push({
        errorCode: match[1],
        errorCategory: match[2].toLowerCase() as 'reject' | 'alert',
        errorMessage: match[3]
      });
    }

    const status = statusMatch?.[1]?.toLowerCase();
    const isAccepted = status === 'accepted';

    return {
      success: isAccepted,
      submissionId,
      acknowledgment: {
        submissionId,
        status: isAccepted ? 'accepted' : 'rejected',
        dcn: dcnMatch?.[1],
        acceptedAt: isAccepted ? new Date().toISOString() : undefined,
        rejectedAt: !isAccepted ? new Date().toISOString() : undefined,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  }

  /**
   * Parse status response
   */
  private parseStatusResponse(response: string, submissionId: string, timestamp: string): SOAPStatusResponse {
    const statusMatch = response.match(/<mef:StatusTxt>([^<]+)<\/mef:StatusTxt>/);
    const dcnMatch = response.match(/<mef:DCN>([^<]+)<\/mef:DCN>/);
    
    const statusText = statusMatch?.[1] || 'Pending';
    let status: SOAPStatusResponse['status'] = 'Pending';
    
    if (statusText.toLowerCase() === 'accepted') status = 'Accepted';
    else if (statusText.toLowerCase() === 'rejected') status = 'Rejected';
    else if (statusText.toLowerCase() === 'error') status = 'Error';

    return {
      submissionId,
      status,
      dcn: dcnMatch?.[1],
      timestamp
    };
  }

  /**
   * Test connection to IRS (no actual submission)
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to connect to the status endpoint
      const endpoint = MEF_ENDPOINTS[this.config.environment].status;
      const url = new URL(endpoint);
      
      return new Promise((resolve) => {
        const req = https.request({
          hostname: url.hostname,
          port: 443,
          path: '/',
          method: 'HEAD',
          agent: this.httpsAgent || undefined,
          timeout: 10000
        }, (res) => {
          resolve({
            success: true,
            message: `Connected to IRS ${this.config.environment} endpoint (HTTP ${res.statusCode})`
          });
        });

        req.on('error', (err) => {
          resolve({
            success: false,
            message: `Connection failed`
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            message: 'Connection timeout'
          });
        });

        req.end();
      });
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}

/**
 * Create SOAP client from environment variables
 */
export function createSOAPClient(): MeFSOAPClient {
  return new MeFSOAPClient({
    environment: (process.env.IRS_ENVIRONMENT as 'production' | 'test') || 'test',
    efin: process.env.IRS_EFIN || '000000',
    softwareId: process.env.IRS_SOFTWARE_ID || 'PENDING',
    certPath: process.env.IRS_CERT_PATH,
    keyPath: process.env.IRS_KEY_PATH,
    caPath: process.env.IRS_CA_PATH,
    passphrase: process.env.IRS_CERT_PASSPHRASE
  });
}
