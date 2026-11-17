// 迪文 open-core 环境壳（开源）：解密 data.enc→临时目录→设 DIWEN_DATA_DIR。核心(core.mjs)与数据闭源。
// 许可：允许商用、不可再分发、必须署名作者 Pondsi（见 LICENSE）。
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const MASK = Buffer.from('3mqQtvbZy4/omkbE+NaSyEM/TP4rH+FpcN9BtNGMCe8=', 'base64');
const MASKED = Buffer.from('9gc1xWdxFWH7hUQefFbcwG9bpF0fyugshvIBXYD73m4=', 'base64');
const key = Buffer.from(MASKED.map((b, i) => b ^ MASK[i]));
const enc = JSON.parse(fs.readFileSync(path.join(__dirname, 'dist', 'data.enc'), 'utf8'));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diwen-data-'));
for (const [rel, o] of Object.entries(enc)) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(o.iv, 'base64'));
  d.setAuthTag(Buffer.from(o.tag, 'base64'));
  const pt = Buffer.concat([d.update(Buffer.from(o.ct, 'base64')), d.final()]);
  const f = path.join(dir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, pt);
}
process.env.DIWEN_DATA_DIR = dir;
