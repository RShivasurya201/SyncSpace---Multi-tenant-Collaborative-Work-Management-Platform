const nodemailer = require("nodemailer");

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

});

async function sendInviteEmail(
  email,
  organizationName,
  inviterName,
  token
) {

  const inviteLink =
`${process.env.CLIENT_URL}/accept-invite/${token}`;

  const html = `
    <h2>You've been invited</h2>

    <p>
      ${inviterName}
      invited you to join
      <b>${organizationName}</b>
    </p>

    <p>
      Click below to join:
    </p>

    <a href="${inviteLink}">
      Join Organization
    </a>

    <p>
      Link expires in 7 days.
    </p>
  `;

  await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: email,

    subject: "Organization Invite",

    html,

  });

}

module.exports = {
  sendInviteEmail,
};