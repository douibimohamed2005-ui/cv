import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendOTP = async (email, otp) => {
    // If no real SMTP password is set in .env, simulate the email for local testing
    if (!process.env.SMTP_PASSWORD) {
        console.log('\n=============================================');
        console.log('📧 DEVELOPMENT MODE: EMAIL SIMULATION');
        console.log(`To: ${email}`);
        console.log(`Subject: SmartCV - Password Reset Verification Code`);
        console.log(`Verification Code: [ ${otp} ]`);
        console.log('=============================================\n');
        return true;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"SmartCV" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: 'SmartCV - Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                    <h2 style="color: #7C3AED;">Password Reset Request</h2>
                    <p style="font-size: 16px; color: #333;">You requested to reset your password for your SmartCV account.</p>
                    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7C3AED; background: #f3f0ff; padding: 15px; border-radius: 10px; display: inline-block; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 14px; color: #666;">This code will expire in 5 minutes.</p>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
