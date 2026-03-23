import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, Header, Footer, PageNumber, NumberFormat, ImageRun,
} from 'docx';
import fs from 'fs';

const logoBuffer = fs.readFileSync('public/logo.png');
const NAVY = '1a3a6b';
const WHITE = 'FFFFFF';

const spacer = (pts = 120) => new Paragraph({ spacing: { before: pts } });

const rule = () => new Paragraph({
  border: { bottom: { color: NAVY, size: 8, style: BorderStyle.SINGLE } },
  spacing: { before: 60, after: 60 },
});

const sectionHeading = (text) => new Paragraph({
  children: [new TextRun({ text: text.toUpperCase(), bold: true, color: NAVY, size: 24, font: 'Calibri' })],
  spacing: { before: 280, after: 100 },
  border: { bottom: { color: NAVY, size: 4, style: BorderStyle.SINGLE } },
});

const body = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: 'Calibri', color: '111111' })],
  spacing: { before: 80, after: 80 },
  alignment: AlignmentType.JUSTIFIED,
});

const bullet = (text, bold = false) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: 'Calibri', bold })],
  bullet: { level: 0 },
  spacing: { before: 40, after: 40 },
});

const stageBox = (title, items) => [
  new Paragraph({
    children: [new TextRun({ text: title, bold: true, color: NAVY, size: 22, font: 'Calibri' })],
    spacing: { before: 160, after: 60 },
    border: { left: { color: NAVY, size: 18, style: BorderStyle.SINGLE } },
    indent: { left: 200 },
  }),
  ...items.map(item => new Paragraph({
    children: [new TextRun({ text: item, size: 22, font: 'Calibri' })],
    bullet: { level: 0 },
    indent: { left: 400 },
    spacing: { before: 30, after: 30 },
  })),
];

const outcomeTable = () => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Performance Indicator', bold: true, color: WHITE, size: 22, font: 'Calibri' })], spacing: { before: 60, after: 60 } })],
          shading: { type: ShadingType.CLEAR, fill: NAVY },
          width: { size: 38, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Measurement', bold: true, color: WHITE, size: 22, font: 'Calibri' })], spacing: { before: 60, after: 60 } })],
          shading: { type: ShadingType.CLEAR, fill: NAVY },
          width: { size: 62, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      ],
    }),
    ...([
      ['Credential Attainment', 'Completing industry-recognized certification'],
      ['OJT Placement Rate', 'Placed in paid On-the-Job Training'],
      ['Employment Placement Rate', 'Securing employment aligned with training pathway'],
      ['90-Day Retention', 'Employment stability at 30, 60, and 90 days post-placement'],
      ['Wage Progression', 'Starting wages and documented wage growth within first 90 days'],
      ['Housing Stability Advancement', 'Progress toward financial stabilization and homeownership readiness'],
    ].map(([indicator, measurement]) => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: indicator, bold: true, size: 22, font: 'Calibri' })], spacing: { before: 60, after: 60 } })],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: measurement, size: 22, font: 'Calibri' })], spacing: { before: 60, after: 60 } })],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      ],
    }))),
  ],
});

const alignGrid = (items) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: Array.from({ length: Math.ceil(items.length / 2) }, (_, i) =>
    new TableRow({
      children: [items[i * 2], items[i * 2 + 1] || null].filter(Boolean).map(([title, desc]) =>
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: title, bold: true, color: NAVY, size: 21, font: 'Calibri' })], spacing: { after: 40 } }),
            new Paragraph({ children: [new TextRun({ text: desc, size: 21, font: 'Calibri' })] }),
          ],
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
        })
      ),
    })
  ),
});

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const headerTableBorders = {
  top: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder,
  bottom: { color: NAVY, size: 6, style: BorderStyle.SINGLE },
};
const cellNoBorder = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [{ level: 0, format: NumberFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }],
    }],
  },
  sections: [

    // COVER PAGE
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        new Paragraph({
          children: [new ImageRun({ data: logoBuffer, transformation: { width: 200, height: 80 }, type: 'png' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 480 },
        }),
        rule(),
        spacer(360),
        new Paragraph({
          children: [new TextRun({ text: 'WORKFORCE & ECONOMIC MOBILITY PATHWAY', bold: true, color: NAVY, size: 36, font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Workforce to Homeownership Mobility Program', color: '333333', size: 28, font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Proposal for Strategic Collaboration', italics: true, color: '666666', size: 24, font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 480 },
        }),
        rule(),
        spacer(360),
        new Paragraph({ children: [new TextRun({ text: 'Prepared By:', bold: true, color: NAVY, size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: 'Elevate for Humanity', size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: 'Founder & Executive Director, Elizabeth L. Greene', size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 280 } }),
        new Paragraph({ children: [new TextRun({ text: 'Prepared For:', bold: true, color: NAVY, size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: 'Housing Authority Partners', size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: 'Workforce Development Agencies', size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: 'Employer & Community Partners', size: 22, font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
        rule(),
        spacer(240),
        new Paragraph({
          children: [new TextRun({ text: 'www.elevateforhumanity.org  |  (317) 314-3757  |  Elevate4humanityedu@gmail.com', size: 20, color: '777777', font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // MAIN CONTENT
    {
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: headerTableBorders,
              rows: [new TableRow({ children: [
                new TableCell({
                  children: [new Paragraph({ children: [new ImageRun({ data: logoBuffer, transformation: { width: 90, height: 36 }, type: 'png' })] })],
                  borders: cellNoBorder,
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Workforce to Homeownership Mobility Program', size: 16, color: '888888', font: 'Calibri' })], alignment: AlignmentType.RIGHT }),
                    new Paragraph({ children: [new TextRun({ text: 'Proposal for Strategic Collaboration', size: 16, color: '888888', font: 'Calibri' })], alignment: AlignmentType.RIGHT }),
                  ],
                  borders: cellNoBorder,
                }),
              ]})],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Elevate for Humanity  |  (317) 314-3757  |  www.elevateforhumanity.org          Page ', size: 16, color: '999999', font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999', font: 'Calibri' }),
              new TextRun({ text: ' of ', size: 16, color: '999999', font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '999999', font: 'Calibri' }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE } },
            spacing: { before: 80 },
          })],
        }),
      },
      children: [

        // TOC
        sectionHeading('Table of Contents'),
        ...[
          '1.   Executive Vision: Aligning With Policy & Opportunity',
          '2.   Program Overview & The Need We Address',
          '3.   Structured Pathway: Full Implementation Model',
          '4.   Outcomes & Performance Metrics',
          '5.   Federal Context & Policy Alignment',
          '6.   Organizational Alignment & Strategic Positioning',
          '7.   Program Impact',
          '8.   Next Steps: Partnership Discussion',
          '9.   Contact Information',
        ].map(item => new Paragraph({
          children: [new TextRun({ text: item, size: 22, font: 'Calibri' })],
          spacing: { before: 80, after: 80 },
          border: { bottom: { color: 'DDDDDD', size: 2, style: BorderStyle.SINGLE } },
        })),
        new Paragraph({ children: [new PageBreak()] }),

        // 1
        sectionHeading('1. Executive Vision: Aligning With Policy & Opportunity'),
        body('Across the country, there is renewed national focus on expanding workforce participation and increasing access to practical, skills-based training for low-income individuals. Recent federal policy direction, including the One Big Beautiful Bill Act, reflects a broader commitment to strengthening workforce engagement and ensuring individuals receiving public support have structured pathways into employment.'),
        body('Elevate for Humanity was built in direct response to this need. Our mission is to create intentional, structured career pathways that move individuals from instability to sustainability. We design measurable training-to-employment pipelines that result in:'),
        bullet('Credential attainment'),
        bullet('Paid On-the-Job Training (OJT)'),
        bullet('Employment placement'),
        bullet('Wage progression'),
        bullet('Long-term economic mobility leading toward housing stability and homeownership readiness'),

        // 2
        sectionHeading('2. Program Overview & The Need We Address'),
        body('Many residents face systemic barriers to employment including limited access to credentialed training, transportation challenges, financial constraints, and lack of employer connections. At the same time, regional industries — including healthcare, skilled trades, and technology — continue to experience workforce shortages. Elevate bridges this gap by aligning training directly with employer demand.'),
        body('Our programs are:'),
        bullet('Competency-based', true),
        bullet('Credential-focused', true),
        bullet('Structured to transition participants directly into paid OJT placements and employment opportunities', true),
        new Paragraph({ children: [new PageBreak()] }),

        // 3
        sectionHeading('3. Structured Pathway: Full Implementation Model'),
        new Paragraph({
          children: [new TextRun({ text: 'Workforce Training  \u2192  Paid Employment  \u2192  Wage Growth  \u2192  Housing Stability  \u2192  Homeownership Readiness', bold: true, color: NAVY, size: 22, font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 160 },
          border: {
            top: { color: NAVY, size: 6, style: BorderStyle.SINGLE },
            bottom: { color: NAVY, size: 6, style: BorderStyle.SINGLE },
          },
        }),
        body('Participants do not simply enroll in classes. They enter a defined progression model that includes structured preparation, industry-aligned training, paid workforce engagement, and transition toward financial independence.'),
        spacer(80),
        ...stageBox('Stage 1 \u2014 Resident Identification & Intake', ['Work readiness evaluation', 'Career interest mapping', 'Barrier assessment', 'Development of an Individual Workforce Plan']),
        ...stageBox('Stage 2 \u2014 Workforce Preparation', ['Professional communication training', 'Attendance and accountability standards', 'Workplace expectations', 'Financial literacy planning', 'Introduction to the housing-to-homeownership pathway']),
        ...stageBox('Stage 3 \u2014 Technical Training & Credentialing', ["Employer-aligned training in Healthcare, Skilled Trades (including HVAC), and Technology/Business Support", "Approved on Indiana's Eligible Training Provider List (ETPL) through WorkOne", 'Eligible participants access training at no out-of-pocket cost through WIOA and Workforce Ready Grant funding', 'Proctored credential testing integrated within the program structure']),
        ...stageBox('Stage 4 \u2014 Employer Alignment & Paid OJT', ['Employer interviews coordinated by Elevate', 'Paid On-the-Job Training placements', 'Direct hire employment pipelines', 'Participants enter the workplace credential-ready \u2014 improving retention, safety, and workforce stability']),
        ...stageBox('Stage 5 \u2014 Income Stabilization & Housing-to-Homeownership Pathway', ['Wage progression monitoring', 'Financial coaching referrals', 'Credit-building support', 'Savings planning', 'Transition toward homeownership readiness programming']),
        new Paragraph({ children: [new PageBreak()] }),

        // 4
        sectionHeading('4. Outcomes & Performance Metrics'),
        outcomeTable(),
        spacer(120),

        // 5
        sectionHeading('5. Federal Context & Policy Alignment'),
        body('In alignment with national policy trends, including the One Big Beautiful Bill Act, Elevate supports expanded access to workforce training and structured employment pathways that build long-term earning capacity and housing independence. Elevate operationalizes these priorities through structured, outcome-driven implementation \u2014 not philosophical alignment alone.'),
        new Paragraph({ children: [new PageBreak()] }),

        // 6
        sectionHeading('6. Organizational Alignment & Strategic Positioning'),
        spacer(80),
        alignGrid([
          ['WIOA Frameworks', 'Meets performance-based standards including credential attainment, employment placement, and retention metrics.'],
          ['Workforce Ready Grant (WRG)', 'Aligned with state-recognized high-demand sectors and credential-based workforce funding priorities.'],
          ['Justice Reinvestment Initiative (JRI)', 'Supports justice-involved individuals transitioning into structured employment pathways.'],
          ['Government Vendor & State Bidder', 'Structured to meet public-sector accountability requirements.'],
          ['501(c)(3) Nonprofit Status', 'In partnership with Selfish Inc., providing compliance oversight, governance, and mission-driven service delivery.'],
          ['Approved Proctored Testing', 'Participants complete industry certification within the program structure.'],
          ['ETPL Approved \u2014 WorkOne', 'Eligible participants access training at no out-of-pocket cost through WorkOne and WIOA funding.'],
          ['Affiliated Nonprofit Collaboration', 'Stabilization services, financial literacy support, and long-term housing advancement coordination.'],
        ]),
        new Paragraph({ children: [new PageBreak()] }),

        // 7
        sectionHeading('7. Program Impact'),
        bullet('Increase participant earning capacity'),
        bullet('Reduce long-term dependency on public assistance'),
        bullet('Strengthen workforce participation compliance'),
        bullet('Create employer-connected talent pipelines'),
        bullet('Support measurable movement toward housing independence'),

        // 8
        sectionHeading('8. Next Steps: Partnership Discussion'),
        body('Elevate is prepared to implement this Workforce to Homeownership Mobility Program immediately in collaboration with housing leadership and employer partners.'),
        body('We would welcome a 30-minute call to discuss how this model can be tailored to support the residents and workforce goals of your organization.'),

        // 9
        sectionHeading('9. Contact Information'),
        spacer(120),
        new Paragraph({ children: [new TextRun({ text: 'Elizabeth L. Greene', bold: true, size: 28, color: NAVY, font: 'Calibri' })] }),
        spacer(60),
        new Paragraph({ children: [new TextRun({ text: 'Founder & Executive Director', size: 22, font: 'Calibri' })] }),
        new Paragraph({ children: [new TextRun({ text: 'Elevate for Humanity Career & Technical Institute', size: 22, font: 'Calibri' })] }),
        new Paragraph({ children: [new TextRun({ text: '(317) 314-3757', size: 22, font: 'Calibri' })] }),
        new Paragraph({ children: [new TextRun({ text: 'www.elevateforhumanity.org', size: 22, font: 'Calibri', color: NAVY })] }),
        new Paragraph({ children: [new TextRun({ text: 'Elevate4humanityedu@gmail.com', size: 22, font: 'Calibri', color: NAVY })] }),
        spacer(360),
        rule(),
        new Paragraph({
          children: [new TextRun({ text: 'Elevate for Humanity is a 501(c)(3) nonprofit workforce development institute.', size: 18, color: '999999', font: 'Calibri', italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('outreach/follow-ups/workforce-homeownership-proposal.docx', buffer);
  console.log('done');
});
