const nodemailer = require('nodemailer');
const smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

// Implement two-factor authentication
const twoFactorAuth = () => {
    // Generate a random code
    const code = Math.floor(Math.random() * 1000000);
    // Send the code to the user's phone or email
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'user-email@example.com',
        subject: 'Two-factor authentication code',
        text: `Your two-factor authentication code is: ${code}`
    };
    smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
};