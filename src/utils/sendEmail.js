import transporter from "../config/mail.js";

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"SplitWise" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 500px;
      margin: auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 10px;
    ">

      <h2>SplitWise Email Verification</h2>

      <p>Hello,</p>

      <p>
        Your OTP for verifying your SplitWise account is:
      </p>

      <h1 style="
        text-align: center;
        letter-spacing: 8px;
        font-size: 32px;
      ">
        ${otp}
      </h1>

      <p>
        This OTP is valid for <strong>10 minutes</strong>.
      </p>

      <p>
        If you did not create a SplitWise account, you can safely ignore
        this email.
      </p>

      <p>Thanks,<br />SplitWise Team</p>

    </div>
  `;

  await sendEmail(email, "SplitWise - Email Verification OTP", html);
};

export default sendEmail;
