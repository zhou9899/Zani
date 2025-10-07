// handlers/messageHandler.js - PART 2
async function executeCommand(sock, msg, text, isGroup, sender, senderNumber) {
  const args = text.trim().split(/ +/);
  let cmdName = args.shift();
  for (const prefix of CONFIG.IGNORE_PREFIXES) {
    if (cmdName.startsWith(prefix)) {
      cmdName = cmdName.slice(prefix.length).toLowerCase();
      break;
    }
  }
  const cmd = global.commands[cmdName];
  if (!cmd) return;
  try { await cmd.execute(sock, msg, args); } catch (err) { console.error("❌ Command error:", err); }
}

// handleTriviaAnswer, handleTTTMove, handleWCGWord, startWCGTurnTimer, TTT helpers...
// (Copy everything from previous full version starting from these functions)

export async function handleAI(sock,msg,text,sender,senderNumber,isGroup,context,chatId){
  if(helpers.isRateLimited(senderNumber)) return;
  const senderNormalized=senderNumber.replace(/\D/g,"");
  const isZhou=global.owners?.some(o=>o.replace(/\D/g,"")===senderNormalized);
  try{
    const profile={number:senderNumber,isZhou};
    const aiResponse=await getAIResponse(text,profile,isZhou,chatId);
    helpers.storeMessageHistory(chatId,sender,text);
    await sock.sendMessage(chatId,{ text: aiResponse.text },{ quoted: msg });
    if(aiResponse.sticker?.sendSticker && aiResponse.sticker.path) await sendSticker(sock,chatId,aiResponse.sticker.path);
  }catch(err){ console.error("❌ AI error:",err);}
}

export function handleMessages(sock){
  sock.ev.on("group-participants.update", async(update)=>{ try{ await handleGroupParticipantsUpdate(sock,update);}catch(err){console.error("Group update error:",err);} });
  sock.ev.on("messages.upsert", async({messages})=>{
    if(!messages?.length) return;
    for(const msg of messages){
      if(!msg.message || msg.key.fromMe) continue;
      try{
        const text=helpers.extractText(msg.message);
        if(!text) continue;
        await handleAFKMentions(sock,msg);
        const isGroup=msg.key.remoteJid.endsWith("@g.us");
        const sender=msg.key.participant||msg.key.remoteJid;
        const senderNumber=sender.split("@")[0].replace(/\D/g,"");
        const chatId=msg.key.remoteJid;
        if(!isRegistered(senderNumber)) registerUser(senderNumber,senderNumber);
        helpers.storeMessageHistory(chatId,sender,text);

        if(helpers.isTriviaAnswer(text,chatId)){ if(await handleTriviaAnswer(sock,msg,text,chatId,sender)) continue; }
        if(helpers.isTTTMove(text,chatId)){ if(await handleTTTMove(sock,msg,text,chatId,sender)) continue; }
        if(await helpers.isWCGWord(text,chatId)){ if(await handleWCGWord(sock,msg,text,chatId,sender)) continue; }

        // Prefix-less commands
        const firstWord = text.split(/ +/)[0].toLowerCase();
        if(global.commands[firstWord]){ await executeCommand(sock,msg,text,isGroup,sender,senderNumber); continue; }

        // Commands with prefixes
        let isCommand = CONFIG.IGNORE_PREFIXES.some(prefix => text.startsWith(prefix));
        if(isCommand){ await executeCommand(sock,msg,text,isGroup,sender,senderNumber); continue; }

        // AI triggers
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
        const botNumber = (sock.user?.id.split(":")[0] || "64369295642766").replace(/\D/g,"");
        if(helpers.shouldTriggerAI(text,contextInfo,isGroup,botNumber,sock)){
          await handleAI(sock,msg,text,sender,senderNumber,isGroup,contextInfo,chatId);
        }

      }catch(err){ console.error("❌ Message processing error:",err); }
    }
  });
}

export const _testHelpers = helpers;
