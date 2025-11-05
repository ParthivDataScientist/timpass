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

    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser().name || "Unknown";
    const os = ua.getOS().name + " " + (ua.getOS().version || "") || "Unknown OS";

    // Device detection improvements
    const deviceType = ua.getDevice().type || "Desktop";
    let deviceModel = ua.getDevice().model || "Unknown";
    
    // Normalize Android device names
    if (deviceModel === "Unknown" && ua.getOS().name === "Android") {
      deviceModel = "Android Phone";
    }
    if (deviceModel === "K") {
      deviceModel = "Realme / Redmi / Poco Family (Unknown exact model)";
    }

    // Better IP Geolocation API
    const geo = await fetch(`https://ipinfo.io/${ip}?token=2a9cc442be64c4`) // Free token
      .then(r => r.json())
      .catch(() => ({}));

    const country = geo.country || "Unknown";
    const city = geo.city || "Unknown";
    const isp = geo.org || "Unknown ISP";

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
