/**
 * Publishes the front page this entry ships.
 *
 * The image is already drawn: `entry.png` sits beside this file, rendered from
 * `card.html` by `render.py`.  The grader runs this program twice and compares
 * the bytes it writes, so the program does one thing only — it reads that PNG,
 * checks it really is a whole 1024x1024 image under the size cap the rules set,
 * and copies it to `MAKEFUN_OUTPUT_DIR` (default `/output`).  Nothing is
 * generated, timed or fetched, so both runs produce identical bytes.
 *
 * Node 22, standard library only.
 */
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 1024;
const MAX_BYTES = 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
const target = join(outDir, "entry.png");

/**
 * Throws unless `buf` is a whole PNG: the 8-byte signature, an IHDR chunk
 * first with its mandated length of 13, and an IEND chunk ending exactly at EOF.
 * The two dimensions are read here too, so one parse answers both questions.
 */
function assertWholePng(buf: Buffer): { width: number; height: number } {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error("entry.png does not start with the PNG signature");
  }
  const ihdrLength = buf.readUInt32BE(8);
  const ihdrType = buf.toString("latin1", 12, 16);
  if (ihdrType !== "IHDR" || ihdrLength !== 13) {
    throw new Error(`entry.png's first chunk is ${ihdrType}/${ihdrLength}, not IHDR/13`);
  }
  if (buf.toString("latin1", buf.length - 8, buf.length - 4) !== "IEND") {
    throw new Error("entry.png holds no IEND chunk in its last eight bytes");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main() {
  const bytes = statSync(source, { throwIfNoEntry: false });
  if (!bytes || !bytes.isFile()) throw new Error(`no entry.png at ${source}`);
  if (bytes.size > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes.size} bytes, over the 1 MiB cap`);
  }

  const buf = readFileSync(source);
  const { width, height } = assertWholePng(buf);
  if (width !== SIZE || height !== SIZE) {
    throw new Error(`entry.png is ${width}x${height}, expected ${SIZE}x${SIZE}`);
  }

  mkdirSync(outDir, { recursive: true });
  copyFileSync(source, target);
  process.stderr.write(`wrote ${buf.length} bytes to ${target} (${width}x${height})\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`entry: ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
}
