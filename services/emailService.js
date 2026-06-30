/**
 * emailService.js
 *
 * Handles sending registration confirmation emails to students and
 * notification emails to the admin.
 */

const { Resend } = require('resend');
const { toDisplayFormat } = require('../utils/formatHelper');

// Initialize Resend client lazily so environment variables are loaded
let resendClient = null;

const getResendClient = () => {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY environment variable is not defined.');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
};

/**
 * Clean description text (replacing underscores if they were added, though description is free-text)
 */
const cleanText = (val) => {
  if (!val) return 'N/A';
  return val.trim();
};

/**
 * Generate the HTML email template for student confirmation
 */
const getStudentHtmlTemplate = (student, event) => {
  const displayPresenter = toDisplayFormat(event.presenter || 'N/A');
  const displayDomain = toDisplayFormat(event.domain || 'N/A');
  const displayLink = event.registrationLink ? `<a href="${event.registrationLink}" style="color: #4f46e5; text-decoration: underline;">${event.registrationLink}</a>` : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmed - ${event.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 30px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 30px 40px;
          color: #1f2937;
        }
        .welcome-msg {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 25px;
          color: #111827;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .info-table td {
          padding: 10px 0;
          vertical-align: top;
          font-size: 15px;
        }
        .info-label {
          width: 35%;
          font-weight: 600;
          color: #4b5563;
        }
        .info-value {
          width: 65%;
          color: #1f2937;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>C³ Event Registration Confirmation</h1>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="welcome-msg">
            Your registration is confirmed for: <strong>${event.title}</strong>
          </div>

          <!-- Event Details Section -->
          <div class="section-title">Event Details</div>
          <table class="info-table">
            <tr>
              <td class="info-label">Event Name</td>
              <td class="info-value"><strong>${event.title}</strong></td>
            </tr>
            <tr>
              <td class="info-label">Date</td>
              <td class="info-value">${cleanText(event.date)}</td>
            </tr>
            <tr>
              <td class="info-label">Time</td>
              <td class="info-value">${cleanText(event.time)}</td>
            </tr>
            <tr>
              <td class="info-label">Venue</td>
              <td class="info-value">${cleanText(event.venue)}</td>
            </tr>
            <tr>
              <td class="info-label">Presenter/Host</td>
              <td class="info-value">${displayPresenter}</td>
            </tr>
            <tr>
              <td class="info-label">Domain</td>
              <td class="info-value">${displayDomain}</td>
            </tr>
           
          </table>

          <div class="divider"></div>

          <!-- Student Info Section -->
          <div class="section-title">Student Information</div>
          <table class="info-table">
            <tr>
              <td class="info-label">Full Name</td>
              <td class="info-value">${cleanText(student.fullName)}</td>
            </tr>
            <tr>
              <td class="info-label">Email</td>
              <td class="info-value">${cleanText(student.email)}</td>
            </tr>
            <tr>
              <td class="info-label">Enrollment Number</td>
              <td class="info-value">${cleanText(student.enrollmentNo)}</td>
            </tr>
            <tr>
              <td class="info-label">Phone Number</td>
              <td class="info-value">${cleanText(student.phoneNumber)}</td>
            </tr>
            <tr>
              <td class="info-label">Institute</td>
              <td class="info-value">${cleanText(student.institute)}</td>
            </tr>
            <tr>
              <td class="info-label">Branch</td>
              <td class="info-value">${cleanText(student.branch)}</td>
            </tr>
            <tr>
              <td class="info-label">How did you know</td>
              <td class="info-value">${cleanText(student.source)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          This is an automated email from the C³ Club Event Management System.<br>
          Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate the HTML email template for admin notification
 */
const getAdminHtmlTemplate = (student, event) => {
  const displayPresenter = toDisplayFormat(event.presenter || 'N/A');
  const displayDomain = toDisplayFormat(event.domain || 'N/A');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Registration - ${event.title}</title>
      <style>
        body { font-family: sans-serif; color: #333; line-height: 1.5; padding: 20px; }
        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
        h2 { color: #4f46e5; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 180px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>New Student Registration Alert</h2>
        <p>A new student has registered for <strong>${event.title}</strong>.</p>
        
        <h3>Student Details:</h3>
        <table>
          <tr><td class="label">Full Name</td><td>${cleanText(student.fullName)}</td></tr>
          <tr><td class="label">Email</td><td>${cleanText(student.email)}</td></tr>
          <tr><td class="label">Enrollment Number</td><td>${cleanText(student.enrollmentNo)}</td></tr>
          <tr><td class="label">Phone Number</td><td>${cleanText(student.phoneNumber)}</td></tr>
          <tr><td class="label">Institute</td><td>${cleanText(student.institute)}</td></tr>
          <tr><td class="label">Branch</td><td>${cleanText(student.branch)}</td></tr>
          <tr><td class="label">How did they know</td><td>${cleanText(student.source)}</td></tr>
        </table>

        <h3>Event Details:</h3>
        <table>
          <tr><td class="label">Event ID</td><td>${cleanText(event.id || event._id)}</td></tr>
          <tr><td class="label">Event Title</td><td>${cleanText(event.title)}</td></tr>
          <tr><td class="label">Presenter</td><td>${displayPresenter}</td></tr>
          <tr><td class="label">Domain</td><td>${displayDomain}</td></tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send registration confirmation email to the student and notification to the admin.
 * Assumes sender is ccellwebsite@gmail.com.
 *
 * @param {object} studentData - Full student form data
 * @param {object} eventData - MongoDB Event object
 */
const sendRegistrationConfirmationEmail = async (studentData, eventData) => {
  const senderEmail = process.env.SMTP_USER || 'ccellwebsite@gmail.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'ccellwebsite@gmail.com';

  try {
    const resend = getResendClient();

    // 1. Send confirmation email to student
    /*
    console.log(`[EmailService] Attempting to send confirmation email to student: ${studentData.email}`);
    const { data: studentDataRes, error: studentError } = await resend.emails.send({
      from: '"C³ Club" <onboarding@resend.dev>',
      to: studentData.email,
      reply_to: 'no-reply@ccellwebsite.com',
      replyTo: 'no-reply@ccellwebsite.com',
      subject: `Registration Confirmed - ${eventData.title}`,
      html: getStudentHtmlTemplate(studentData, eventData),
    });

    if (studentError) {
      throw studentError;
    }
    console.log(`[EmailService] Student email sent successfully: ${studentDataRes ? studentDataRes.id : 'success'}`);
*/
    // 2. Send registration alert email to admin (ccellwebsite@gmail.com)
    // Admin notification disabled — re-enable by uncommenting the call below
    
    const adminMailOptions = {
      from: '"C³ Registration Portal" <onboarding@resend.dev>',
      to: adminEmail,
      reply_to: 'no-reply@ccellwebsite.com',
      replyTo: 'no-reply@ccellwebsite.com',
      subject: `New Registration - ${eventData.title} - ${studentData.fullName}`,
      html: getAdminHtmlTemplate(studentData, eventData),
    };

    console.log(`[EmailService] Attempting to send registration alert email to admin: ${adminEmail}`);
    const { data: adminDataRes, error: adminError } = await resend.emails.send(adminMailOptions);
    if (adminError) {
      console.error('[EmailService] Admin notification failed:', adminError);
    } else {
      console.log(`[EmailService] Admin email sent successfully: ${adminDataRes ? adminDataRes.id : 'success'}`);
    }
    

  } catch (error) {
    // If sending fails, we only log it, keeping the registration valid as per requirement.
    console.error('[EmailService] Failed to send registration emails:', error);
  }
};

module.exports = {
  sendRegistrationConfirmationEmail,
};
