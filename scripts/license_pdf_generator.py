#!/usr/bin/env python3
"""
License PDF Generator for Elevate for Humanity Platform
Generates professional PDF license certificates for clients
"""

from fpdf import FPDF
from datetime import datetime, timedelta
import argparse
import sys
import os

class LicensePDFGenerator:
    def __init__(self):
        self.pdf = FPDF()
        self.setup_fonts()
    
    def setup_fonts(self):
        """Setup fonts for the PDF"""
        self.pdf.add_page()
        self.pdf.set_auto_page_break(auto=True, margin=15)
    
    def generate_license_certificate(self, licensee_name, domain, license_key, 
                                   tier="Basic", features=None, expiry_date=None, 
                                   output_path="license_certificate.pdf"):
        """Generate a professional license certificate PDF"""
        
        if features is None:
            features = ["LMS Access", "Basic Support"]
        
        if expiry_date is None:
            expiry_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
        
        # Clear the page
        self.pdf = FPDF()
        self.pdf.add_page()
        
        # Header with logo placeholder
        self.pdf.set_font("Arial", "B", 24)
        self.pdf.set_text_color(30, 27, 75)  # Dark blue
        self.pdf.cell(0, 20, "ELEVATE FOR HUMANITY", 0, 1, 'C')
        
        self.pdf.set_font("Arial", "", 14)
        self.pdf.set_text_color(100, 100, 100)
        self.pdf.cell(0, 10, "SECURE PLATFORM LICENSE CERTIFICATE", 0, 1, 'C')
        
        # Add decorative line
        self.pdf.set_draw_color(30, 27, 75)
        self.pdf.line(20, 50, 190, 50)
        
        self.pdf.ln(20)
        
        # Certificate body
        self.pdf.set_font("Arial", "B", 16)
        self.pdf.set_text_color(0, 0, 0)
        self.pdf.cell(0, 15, "LICENSE CERTIFICATE", 0, 1, 'C')
        
        self.pdf.ln(10)
        
        # License details
        self.pdf.set_font("Arial", "", 12)
        
        details = [
            ("Licensee:", licensee_name),
            ("Licensed Domain:", domain),
            ("License Tier:", tier),
            ("License Key:", license_key),
            ("Issue Date:", datetime.now().strftime('%Y-%m-%d')),
            ("Expiration Date:", expiry_date),
            ("Status:", "ACTIVE")
        ]
        
        for label, value in details:
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.cell(50, 8, label, 0, 0)
            self.pdf.set_font("Arial", "", 12)
            self.pdf.cell(0, 8, value, 0, 1)
        
        self.pdf.ln(5)
        
        # Features section
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.cell(0, 8, "Licensed Features:", 0, 1)
        
        self.pdf.set_font("Arial", "", 11)
        for feature in features:
            self.pdf.cell(10, 6, "•", 0, 0)
            self.pdf.cell(0, 6, feature, 0, 1)
        
        self.pdf.ln(10)
        
        # Terms and conditions
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.cell(0, 8, "TERMS AND CONDITIONS:", 0, 1)
        
        terms = [
            "This license is valid only for the specified domain and licensee.",
            "Unauthorized use, copying, or redistribution is strictly prohibited.",
            "License is non-transferable without written consent from Elevate for Humanity.",
            "Violation may result in immediate termination and legal action.",
            "This software is protected by copyright law and licensing agreements."
        ]
        
        self.pdf.set_font("Arial", "", 10)
        for term in terms:
            self.pdf.cell(5, 5, "•", 0, 0)
            self.pdf.multi_cell(0, 5, term)
            self.pdf.ln(2)
        
        self.pdf.ln(10)
        
        # Support information
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.cell(0, 8, "SUPPORT CONTACT:", 0, 1)
        
        self.pdf.set_font("Arial", "", 11)
        support_info = [
            "Email: licensing@elevateforhumanity.com",
            "Support: support@elevateforhumanity.com",
            "Legal: legal@elevateforhumanity.com",
            "Website: https://elevateforhumanity.com"
        ]
        
        for info in support_info:
            self.pdf.cell(0, 6, info, 0, 1)
        
        # Footer
        self.pdf.ln(15)
        self.pdf.set_draw_color(30, 27, 75)
        self.pdf.line(20, self.pdf.get_y(), 190, self.pdf.get_y())
        
        self.pdf.ln(5)
        self.pdf.set_font("Arial", "", 9)
        self.pdf.set_text_color(100, 100, 100)
        footer_text = f"© {datetime.now().year} Selfish Inc. DBA Rise Foundation. All Rights Reserved."
        self.pdf.cell(0, 5, footer_text, 0, 1, 'C')
        self.pdf.cell(0, 5, "Licensed Use Only - Unauthorized use prohibited", 0, 1, 'C')
        
        # Digital signature placeholder
        self.pdf.ln(10)
        self.pdf.set_font("Arial", "I", 10)
        self.pdf.cell(0, 5, f"Digital Certificate ID: {self.generate_certificate_id()}", 0, 1, 'C')
        
        # Save the PDF
        self.pdf.output(output_path)
        print(f"✅ License certificate saved to {output_path}")
        
        return output_path
    
    def generate_certificate_id(self):
        """Generate a unique certificate ID"""
        import hashlib
        timestamp = str(datetime.now().timestamp())
        return hashlib.md5(timestamp.encode()).hexdigest()[:16].upper()
    
    def generate_bulk_licenses(self, licenses_data, output_dir="licenses"):
        """Generate multiple license certificates"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        generated_files = []
        
        for i, license_data in enumerate(licenses_data):
            filename = f"license_{license_data.get('domain', f'client_{i}').replace('.', '_')}.pdf"
            output_path = os.path.join(output_dir, filename)
            
            self.generate_license_certificate(
                licensee_name=license_data.get('licensee', 'Unknown'),
                domain=license_data.get('domain', 'unknown.com'),
                license_key=license_data.get('license_key', 'UNKNOWN'),
                tier=license_data.get('tier', 'Basic'),
                features=license_data.get('features', ['LMS Access']),
                expiry_date=license_data.get('expiry_date'),
                output_path=output_path
            )
            
            generated_files.append(output_path)
        
        print(f"✅ Generated {len(generated_files)} license certificates in {output_dir}/")
        return generated_files

def main():
    parser = argparse.ArgumentParser(description='Generate Elevate Platform License Certificates')
    parser.add_argument('--licensee', required=True, help='Name of the licensee')
    parser.add_argument('--domain', required=True, help='Licensed domain')
    parser.add_argument('--license-key', required=True, help='License key')
    parser.add_argument('--tier', default='Basic', help='License tier (Basic, Sister, Enterprise)')
    parser.add_argument('--features', help='Comma-separated list of features')
    parser.add_argument('--expiry', help='Expiry date (YYYY-MM-DD)')
    parser.add_argument('--output', help='Output file path')
    
    args = parser.parse_args()
    
    # Parse features
    features = ['LMS Access', 'Basic Support']
    if args.features:
        features = [f.strip() for f in args.features.split(',')]
    
    # Set output path
    output_path = args.output or f"license_{args.domain.replace('.', '_')}.pdf"
    
    # Generate certificate
    generator = LicensePDFGenerator()
    generator.generate_license_certificate(
        licensee_name=args.licensee,
        domain=args.domain,
        license_key=args.license_key,
        tier=args.tier,
        features=features,
        expiry_date=args.expiry,
        output_path=output_path
    )

if __name__ == "__main__":
    # Example usage if run directly
    if len(sys.argv) == 1:
        print("Example usage:")
        print("python license_pdf_generator.py --licensee 'Acme Corp' --domain 'acme.com' --license-key 'LICENSE-XYZ-123456' --tier 'Enterprise'")
        
        # Generate a demo certificate
        generator = LicensePDFGenerator()
        generator.generate_license_certificate(
            licensee_name="Demo Client",
            domain="demo.elevateforhumanity.com",
            license_key="DEMO-LICENSE-2024",
            tier="Enterprise",
            features=["LMS Access", "Sister Sites", "AI Tutoring", "Analytics", "24/7 Support"],
            output_path="demo_license_certificate.pdf"
        )
    else:
        main()