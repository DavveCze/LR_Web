/**
 * sync-images.cjs
 * Spouští AutoCompress.php pro synchronizaci responsivních WebP variant před startem dev serveru nebo buildu.
 */

const http = require('http');
const { execSync } = require('child_process');

async function triggerViaHttp() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8080/api/AutoCompress.php?action=sync', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
  });
}

function triggerViaDocker() {
  try {
    const output = execSync('docker exec lrdance_php php /var/www/html/api/AutoCompress.php', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output;
  } catch (err) {
    throw err;
  }
}

async function main() {
  console.log('\x1b[36m[AutoCompress]\x1b[0m Kontrola a synchronizace WebP variant obrázků...');

  // 1. Zkusíme HTTP endpoint (běžící lrdance_php na portu 8080)
  try {
    const res = await triggerViaHttp();
    if (res && res.status === 'success') {
      console.log(`\x1b[32m[AutoCompress]\x1b[0m ${res.message}`);
      return;
    }
  } catch {
    // HTTP selhalo (např. server ještě nestartoval nebo běží pod jiným portem)
  }

  // 2. Zkusíme přímý docker exec
  try {
    const dockerOutput = triggerViaDocker();
    const lastLine = dockerOutput.trim().split('\n').pop();
    console.log(`\x1b[32m[AutoCompress]\x1b[0m ${lastLine}`);
    return;
  } catch {
    // Docker exec selhal
  }

  // 3. Pokud ani jedno neprošlo, informujeme vývojáře bez pádu procesu
  console.log('\x1b[33m[AutoCompress]\x1b[0m Upozornění: Backend kontejner (lrdance_php) není aktivní. Obrázky se zkomprimují po spuštění Dockeru (docker compose up -d v LR_Web_BE).');
}

main().catch((err) => {
  console.error('[AutoCompress] Chyba při synchronizaci:', err.message);
});
