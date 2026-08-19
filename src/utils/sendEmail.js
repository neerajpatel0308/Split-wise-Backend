import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  const { data, error } = await resend.emails.send({
    from: "SplitWise <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("RESEND EMAIL ERROR:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("EMAIL SENT:", data);

  return data;
};

export const sendOTPEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
        
        <div style="
          max-width:500px;
          margin:auto;
          background:white;
          padding:30px;
          border-radius:10px;
        ">

          <h2 style="color:#333;">
            SplitWise Email Verification
          </h2>

          <p>Hello,</p>

          <p>
            Thank you for creating your SplitWise account.
            Use the verification code below to verify your email address.
          </p>

          <div style="
            text-align:center;
            margin:30px 0;
            padding:20px;
            background:#f1f1f1;
            border-radius:8px;
          ">
            <h1 style="
              letter-spacing:8px;
              margin:0;
              color:#222;
            ">
              ${otp}
            </h1>
          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not create a SplitWise account, you can safely
            ignore this email.
          </p>

          <hr />

          <p style="font-size:12px;color:#777;">
            This is an automated email from SplitWise.
            Please do not reply to this email.
          </p>

        </div>

      </body>
    </html>
  `;

  return await sendEmail(email, "SplitWise - Email Verification Code", html);
};

export default sendEmail;
