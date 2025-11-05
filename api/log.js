import { google } from "googleapis";
import UAParser from "ua-parser-js";

export default async function handler(req, res) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const time = new Date().toISOString();

    // Parse Browser / Device
    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser().name || "Unknown";
    const os = ua.getOS().name + " " + (ua.getOS().version || "") || "Unknown OS";
    const deviceType = ua.getDevice().type || "Desktop";
    const deviceModel = ua.getDevice().model || "Unknown";

    // ✅ Fetch Geolocation (Country & City)
    const geo = await fetch(`https://ipapi.co/${ip}/json/`).then(r => r.json()).catch(() => ({}));
    const country = geo.country_name || "Unknown";
    const city = geo.city || "Unknown";
    const isp = geo.org || "Unknown ISP";

    // ✅ Append to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[ip, time, browser, os, deviceType, deviceModel, country, city, isp]],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Logging failed" });
  }
}
