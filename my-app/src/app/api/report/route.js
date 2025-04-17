import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { message, page } = await request.json();

    if (!message || !page) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // ใช้ TLS
      requireTLS: true,
      auth: {
        user: process.env.NEXT_PUBLIC_GMAIL_USER, // เปลี่ยนจาก NEXT_PUBLIC_
        pass: process.env.NEXT_PUBLIC_GMAIL_PASS,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"ระบบรายงานปัญหาเว็บไซต์" <${process.env.NEXT_PUBLIC_GMAIL_USER}>`, // ใส่ชื่อระบบด้วย
      to:
        process.env.NEXT_PUBLIC_GMAIL_TO || process.env.NEXT_PUBLIC_GMAIL_USER,
      subject: `[รายงานปัญหา] จากหน้า ${page}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>รายงานปัญหาเว็บไซต์</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h1 style="color: #333;">รายงานปัญหาใหม่</h1>
            <hr style="border: 0; border-top: 1px solid #eee;">
            <p><strong>หน้า:</strong> ${page}</p>
            <p><strong>วันที่:</strong> ${new Date().toLocaleString(
              "th-TH"
            )}</p>
            <h3 style="margin-top: 20px;">รายละเอียดปัญหา:</h3>
            <div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ddd; margin: 10px 0;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            <hr style="border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 0.8em; color: #777;">
              อีเมลนี้ถูกส่งอัตโนมัติจากระบบรายงานปัญหาเว็บไซต์ กรุณาอย่าตอบกลับ
            </p>
          </div>
        </body>
        </html>
      `,
      headers: {
        "X-Priority": "1", // ความสำคัญสูง
        "X-Mailer": "Next.js Mailer",
      },
    };

    // เพิ่ม DKIM และ SPF records ใน DNS ของโดเมนคุณ
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send report", details: error.message },
      { status: 500 }
    );
  }
}
