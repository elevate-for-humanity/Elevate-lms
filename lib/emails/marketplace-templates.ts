// Email templates for marketplace transactions

export interface BuyerDeliveryEmailData {
  buyerEmail: string;
  productTitle: string;
  creatorName: string;
  downloadToken: string;
  expiresAt: string;
  amountPaid: number;
}

export interface CreatorSaleEmailData {
  creatorEmail: string;
  creatorName: string;
  productTitle: string;
  saleAmount: number;
  creatorEarnings: number;
  buyerEmail: string;
}

export interface CreatorApprovalEmailData {
  creatorEmail: string;
  creatorName: string;
}

export function generateBuyerDeliveryEmail(data: BuyerDeliveryEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/download/${data.downloadToken}`;

  return {
    subject: `Your Purchase: ${data.productTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e5e7eb; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Your Purchase!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Your purchase of <strong>${data.productTitle}</strong> by ${data.creatorName} is complete!</p>

              <div style="text-align: center;">
                <a href="${downloadUrl}" class="button">Download Your Product</a>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Purchase Details</h3>
                <p><strong>Product:</strong> ${data.productTitle}</p>
                <p><strong>Creator:</strong> ${data.creatorName}</p>
                <p><strong>Amount Paid:</strong> $${(data.amountPaid / 100).toFixed(2)}</p>
                <p><strong>Download Link Expires:</strong> ${new Date(data.expiresAt).toLocaleDateString()}</p>
              </div>

              <h3>Important Information:</h3>
              <ul>
                <li>Your download link is valid for 30 days</li>
                <li>You can download the product multiple times within this period</li>
                <li>Save this email for future reference</li>
                <li>For product support, contact the creator directly</li>
              </ul>

              <p>If you have any issues accessing your purchase, please contact us at <a href="mailto:support@www.elevateforhumanity.org">support@www.elevateforhumanity.org</a></p>

              <p>Thank you for supporting our creator community!</p>
              <p><strong>Elevate for Humanity Team</strong></p>
            </div>
            <div class="footer">
              <p>Elevate for Humanity Creator Marketplace</p>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/marketplace">Browse More Products</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Thank You for Your Purchase!

Your purchase of "${data.productTitle}" by ${data.creatorName} is complete!

Download your product here:
${downloadUrl}

Purchase Details:
- Product: ${data.productTitle}
- Creator: ${data.creatorName}
- Amount Paid: $${(data.amountPaid / 100).toFixed(2)}
- Download Link Expires: ${new Date(data.expiresAt).toLocaleDateString()}

Important Information:
- Your download link is valid for 30 days
- You can download the product multiple times within this period
- Save this email for future reference
- For product support, contact the creator directly

If you have any issues, contact: support@www.elevateforhumanity.org

Thank you for supporting our creator community!

Elevate for Humanity Team
    `,
  };
}

export function generateCreatorSaleEmail(data: CreatorSaleEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `New Sale: ${data.productTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e5e7eb; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .earnings-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
            .earnings-amount { font-size: 36px; font-weight: bold; color: #059669; margin: 10px 0; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 You Made a Sale!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.creatorName},</p>
              <p>Great news! Someone just purchased your product.</p>

              <div class="earnings-box">
                <p style="margin: 0; font-size: 14px; color: #059669;">Your Earnings</p>
                <div class="earnings-amount">$${(data.creatorEarnings / 100).toFixed(2)}</div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Sale Details</h3>
                <p><strong>Product:</strong> ${data.productTitle}</p>
                <p><strong>Sale Amount:</strong> $${(data.saleAmount / 100).toFixed(2)}</p>
                <p><strong>Your Earnings (70%):</strong> $${(data.creatorEarnings / 100).toFixed(2)}</p>
                <p><strong>Platform Fee (30%):</strong> $${((data.saleAmount - data.creatorEarnings) / 100).toFixed(2)}</p>
              </div>

              <h3>What's Next?</h3>
              <ul>
                <li>Your earnings will be included in your next payout</li>
                <li>Payouts are processed monthly (minimum $50)</li>
                <li>View your dashboard for detailed analytics</li>
              </ul>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard" style="display: inline-block; background: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a>
              </p>

              <p>Keep creating amazing products!</p>
              <p><strong>Elevate for Humanity Team</strong></p>
            </div>
            <div class="footer">
              <p>Elevate for Humanity Creator Marketplace</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🎉 You Made a Sale!

Hi ${data.creatorName},

Great news! Someone just purchased your product.

Your Earnings: $${(data.creatorEarnings / 100).toFixed(2)}

Sale Details:
- Product: ${data.productTitle}
- Sale Amount: $${(data.saleAmount / 100).toFixed(2)}
- Your Earnings (70%): $${(data.creatorEarnings / 100).toFixed(2)}
- Platform Fee (30%): $${((data.saleAmount - data.creatorEarnings) / 100).toFixed(2)}

What's Next?
- Your earnings will be included in your next payout
- Payouts are processed monthly (minimum $50)
- View your dashboard for detailed analytics

View Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard

Keep creating amazing products!

Elevate for Humanity Team
    `,
  };
}

export function generateCreatorApprovalEmail(data: CreatorApprovalEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Welcome to the Creator Marketplace!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e5e7eb; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .info-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 You're Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.creatorName},</p>
              <p>Congratulations! Your creator application has been approved. You can now start selling your digital products on the Elevate for Humanity Marketplace.</p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard" class="button">Go to Creator Dashboard</a>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Getting Started</h3>
                <ol>
                  <li>Log in to your creator dashboard</li>
                  <li>Upload your first product</li>
                  <li>Wait for product approval (usually 1-2 business days)</li>
                  <li>Start earning 70% on every sale!</li>
                </ol>
              </div>

              <h3>Important Reminders:</h3>
              <ul>
                <li>Revenue split: 70% creator / 30% platform</li>
                <li>Monthly payouts (minimum $50)</li>
                <li>All products must be approved before listing</li>
                <li>Review the <a href="${process.env.NEXT_PUBLIC_SITE_URL}/legal/creator-agreement">Creator Agreement</a></li>
              </ul>

              <p>We're excited to have you in our creator community!</p>
              <p><strong>Elevate for Humanity Team</strong></p>
            </div>
            <div class="footer">
              <p>Questions? Email us at <a href="mailto:creators@www.elevateforhumanity.org">creators@www.elevateforhumanity.org</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🎉 You're Approved!

Hi ${data.creatorName},

Congratulations! Your creator application has been approved. You can now start selling your digital products on the Elevate for Humanity Marketplace.

Go to Creator Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/creator/dashboard

Getting Started:
1. Log in to your creator dashboard
2. Upload your first product
3. Wait for product approval (usually 1-2 business days)
4. Start earning 70% on every sale!

Important Reminders:
- Revenue split: 70% creator / 30% platform
- Monthly payouts (minimum $50)
- All products must be approved before listing
- Review the Creator Agreement: ${process.env.NEXT_PUBLIC_SITE_URL}/legal/creator-agreement

We're excited to have you in our creator community!

Elevate for Humanity Team

Questions? Email: creators@www.elevateforhumanity.org
    `,
  };
}
