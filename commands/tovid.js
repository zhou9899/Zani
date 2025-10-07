import fs from "fs";
import path from "path";
import os from "os";
import util from "util";
import { exec } from "child_process";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const run = util.promisify(exec);

export const name = "tovid";
export const description = "Convert animated sticker or view-once video to mp4";
export const aliases = ["stov", "st2vid"];

export async function execute(sock, msg) {
  const jid = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    return sock.sendMessage(
      jid,
      { text: "❌ Reply to a sticker or view-once video." },
      { quoted: msg }
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tovid_tmp_"));

  try {
    // ---------- STICKER ----------
    if (quoted.stickerMessage) {
      const buffer = await downloadMediaMessage(
        { message: { stickerMessage: quoted.stickerMessage } },
        "buffer",
        {},
        { logger: sock.logger || console }
      );

      const inFile = path.join(tmpDir, "input.webp");
      const outFile = path.join(tmpDir, "output.mp4");
      fs.writeFileSync(inFile, buffer);

      let frames = [];

      // try extracting frames from animated webp
      for (let i = 1; i < 500; i++) {
        const frameWebp = path.join(tmpDir, `frame_${String(i).padStart(3, '0')}.webp`);
        const framePng = path.join(tmpDir, `frame_${String(i).padStart(3, '0')}.png`);

        try {
          await run(`webpmux -get frame ${i} "${inFile}" -o "${frameWebp}"`);
          if (!fs.existsSync(frameWebp)) break;

          await run(`dwebp "${frameWebp}" -o "${framePng}"`);
          fs.unlinkSync(frameWebp);
          frames.push(framePng);
        } catch {
          break;
        }
      }

      if (frames.length > 1) {
        // animated sticker → mp4
        await run(
          `ffmpeg -y -framerate 15 -i "${path.join(tmpDir, "frame_%03d.png")}" -c:v libx264 -pix_fmt yuv420p -movflags faststart "${outFile}"`
        );
      } else {
        // static sticker → short loop
        const singlePng = path.join(tmpDir, "static.png");
        await run(`dwebp "${inFile}" -o "${singlePng}"`);
        await run(
          `ffmpeg -y -loop 1 -i "${singlePng}" -c:v libx264 -t 2 -pix_fmt yuv420p -movflags faststart "${outFile}"`
        );
      }

      const videoBuffer = fs.readFileSync(outFile);
      await sock.sendMessage(
        jid,
        { video: videoBuffer, mimetype: "video/mp4", caption: "🎬 Sticker → Video" },
        { quoted: msg }
      );
    }

    // ---------- VIEW-ONCE VIDEO (IMPROVED DETECTION) ----------
    else {
      let videoMessage = null;
      
      // Check multiple possible locations for view-once video
      if (quoted.viewOnceMessageV2?.message?.videoMessage) {
        videoMessage = quoted.viewOnceMessageV2.message.videoMessage;
      } 
      else if (quoted.viewOnceMessageV2Extension?.message?.videoMessage) {
        videoMessage = quoted.viewOnceMessageV2Extension.message.videoMessage;
      }
      else if (quoted.viewOnceMessage?.message?.videoMessage) {
        videoMessage = quoted.viewOnceMessage.message.videoMessage;
      }
      // Also check for direct video message in case it's not properly wrapped
      else if (quoted.videoMessage) {
        videoMessage = quoted.videoMessage;
      }

      if (videoMessage) {
        const buffer = await downloadMediaMessage(
          { 
            message: { 
              videoMessage: videoMessage 
            } 
          },
          "buffer",
          {},
          { logger: sock.logger || console }
        );

        await sock.sendMessage(
          jid,
          { 
            video: buffer, 
            mimetype: "video/mp4", 
            caption: "📤 View-once video saved" 
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          jid,
          { text: "❌ Reply to an animated sticker or a view-once video." },
          { quoted: msg }
        );
      }
    }

  } catch (e) {
    console.error("TOVID ERROR:", e);
    await sock.sendMessage(
      jid, 
      { text: `❌ TOVID ERROR: ${e.message}` }, 
      { quoted: msg }
    );
  } finally {
    try { 
      fs.rmSync(tmpDir, { recursive: true, force: true }); 
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
}
