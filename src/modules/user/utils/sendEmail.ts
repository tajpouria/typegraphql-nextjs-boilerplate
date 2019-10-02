import nodemailer from "nodemailer";

export async function sendEmail(email: string, token: string) {
    const testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    const info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to: email, // list of receivers
        subject: "Confirmation ✔", // Subject line
        text: "Hello world?", // plain text body
        html: `<a href="http://localhost:3000/${token}">http://localhost:3000/${token}</a>` // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
