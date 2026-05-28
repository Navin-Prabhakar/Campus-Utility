This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create `.env.local` with the auth and SMTP settings needed for OTP email delivery:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret

# Use either this single Nodemailer SMTP URL:
EMAIL_SERVER=smtps://username:password@smtp.example.com:465

# Or replace EMAIL_SERVER with these separate SMTP fields:
# EMAIL_SERVER_HOST=smtp.example.com
# EMAIL_SERVER_PORT=465
# EMAIL_SERVER_USER=username
# EMAIL_SERVER_PASSWORD=password

EMAIL_FROM="IITP Unofficial <no-reply@example.com>"
```

For Gmail, use `smtp.gmail.com`, port `465`, and a 16-character Google App Password from the sender account. A normal Gmail password, revoked app password, or app password from a different Google account will be rejected by SMTP.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
