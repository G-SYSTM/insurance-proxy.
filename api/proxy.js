// api/proxy.js
// Función simple para Vercel: proxy muy básico + allowlist de hosts
// Requiere Node 18+ (Vercel lo usa) para disponer de fetch global.

const ALLOWLIST = [
  "axa.fr","allianz.fr","groupama.fr","covea.fr","aviva.fr","swisslife.fr","cnp.fr","mma.fr","maaf.fr",
  "maif.fr","macif.fr","matmut.fr","gmf.fr","mutuellegenerale.fr","malakoffhumanis.com","harmonie-mutuelle.fr",
  "ag2rlamondiale.fr","probtp.com","ratp.fr","direct-assurance.fr","amaguiz.com","acommeassure.com",
  "boursorama.com","hellosafe.fr","luko.eu","leocare.eu","alan.com","fluo.io","clicassure.fr","aig.fr",
  "chubb.com","tokiomarine.fr","axaxl.com","zurich.fr","scor.com","munichre.com","allianz-trade.com",
  "april.fr","april-international.com","axaglobalhealthcare.com","groupama.com","swisscare.com","april-sante.fr",
  "mgen.fr","sma.fr","spb.fr","thelem.fr","mutuellesdusoleil.com","agpm.fr","swissre.com","cpi.fr"
].map(h => h.replace(/^www\./, '').toLowerCase());

function isAllowed(hostname){
  const h = hostname.replace(/^www\./,'').toLowerCase();
  return ALLOWLIST.includes(h);
}

export default async function handler(req, res) {
  try {
    const target = req.query.url;
    if (!target) return res.status(400).send('Falta parámetro ?url=');

    let url;
    try { url = new URL(target); } catch(e){ return res.status(400).send('URL inválida'); }

    if(!isAllowed(url.hostname)){
      return res.status(403).send('Domain not allowed');
    }

    // fetch remoto (Node 18+ tiene fetch global)
    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
    });

    const contentType = resp.headers.get('content-type') || '';

    // Si no es HTML, lo reenvíamos tal cual (pdf, imagen, etc)
    if (!contentType.includes('text/html')) {
      const buffer = await resp.arrayBuffer();
      const b = Buffer.from(buffer);
      res.setHeader('Content-Type', contentType);
      return res.status(200).send(b);
    }

    // Si es HTML -> modificar mínimamente: añadir <base href> y quitar meta CSP (simple)
    let body = await resp.text();

    const baseHref = `${url.protocol}//${url.host}`;
    if(!/\<base\s/i.test(body)){
      body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
    }

    // quitar meta CSP si lo hay (simple regex)
    body = body.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

    // inyectar banner informativo (opcional)
    body = body.replace(/<body([^>]*)>/i, `<body$1><div style="position:fixed;right:10px;bottom:10px;z-index:9999;background:#fff;padding:6px 10px;border-radius:6px;border:1px solid #eee;font-size:12px;color:#333">Vista proxied (interna)</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(body);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).send('Error proxyando: ' + (err && err.message ? err.message : String(err)));
  }
}
