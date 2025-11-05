export default function handler(req, res) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress;

  const userAgent = req.headers['user-agent'];
  const time = new Date().toISOString();

  console.log("---- Visitor Log ----");
  console.log("IP:", ip);
  console.log("Time:", time);
  console.log("User-Agent:", userAgent);
  console.log("---------------------");

  res.status(200).json({ success: true });
}
