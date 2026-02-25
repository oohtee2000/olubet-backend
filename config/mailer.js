// C:\express\osmium_blog_backend\osmium_blog_express_application\config\mailer.js
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Handlebars template engine
transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extName: ".hbs", // ✅ MUST be extName
      layoutsDir: path.join(__dirname, "../views/email/layouts"),
      defaultLayout: false,
      partialsDir: path.join(__dirname, "../views/email/partials"),
    },
    viewPath: path.join(__dirname, "../views/email"),
    extName: ".hbs", // ✅ MUST be extName
  })
);


export default transporter;
