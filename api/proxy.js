export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) return res.status(400).send('Falta parámetro ?url=');

  try {
    const response = await fetch(target);
    const body = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(body);
  } catch (err) {
    return res.status(500).send('Error: ' + err.message);
  }
}
