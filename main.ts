/**
 * Publishes the front page this entry ships.
 *
 * The picture is already drawn: `entry.png` sits beside this file, rendered from
 * `card.html` by `render.py`.  The grader runs this program twice in a sandbox
 * with no network and compares the bytes it writes, so the program does one
 * thing only: it reads that PNG, proves it is a whole 1024x1024 image under the
 * size cap the rules set, and copies it into `MAKEFUN_OUTPUT_DIR` (default
 * `/output`).  It draws nothing, times nothing and fetches nothing, which is why
 * both runs agree byte for byte.
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
 * Proves `buf` is a whole PNG and hands back its two dimensions.
 *
 * A PNG opens with an 8-byte signature; its first chunk must be IHDR, whose
 * length the specification fixes at 13; and the file must end exactly on an
 * IEND chunk, so a truncated download or a half-written render is refused here
 * rather than shipped as a broken image.
 */
function assertWholePng(buf: Buffer): { width: number; height: number } {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error("entry.png does not open with the PNG signature");
  }

  const ihdrLength = buf.readUInt32BE(8);
  const ihdrType = buf.toString("latin1", 12, 16);
  if (ihdrType !== "IHDR" || ihdrLength !== 13) {
    throw new Error(`entry.png opens with ${ihdrType}/${ihdrLength}, not IHDR/13`);
  }

  const tail = buf.toString("latin1", buf.length - 8, buf.length - 4);
  if (tail !== "IEND") {
    throw new Error("entry.png does not end on an IEND chunk");
  }

  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main() {
  const stat = statSync(source, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    throw new Error(`no entry.png beside the program at ${source}`);
  }
  if (stat.size > MAX_BYTES) {
    throw new Error(`entry.png is ${stat.size} bytes, past the 1 MiB cap`);
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
