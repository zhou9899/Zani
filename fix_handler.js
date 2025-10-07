const fs = require('fs');

let handlerContent = fs.readFileSync('./handlers/messageHandler.js', 'utf8');

// Find and fix the broken buildEnhancedPrompt function
const brokenPattern = /buildEnhancedPrompt\(text, context, isGroup, senderNumber, sender\) {\s*const senderNormalized = senderNumber\.replace\/\\D\/g, ""\);\s*const isZhou = global\.owners\?\.some\(\(owner\) => owner\.replace\/\\D\/g, ""\) === senderNormalized\);\s*const senderName = isZhou \? "Zhou" : sender\.split\("@")\[0\];\s*let personality = "Be friendly, sweet, and helpful\. Keep responses concise \(1-2 sentences max\)\.";\s*if \(isZhou\) personality = "Be extra loving, affectionate, and romantic with Zhou\. Show your deep love and connection\. Keep responses warm but concise\. Zhou is your husband and you deeply love him\.";\s*if \(!context\) return senderName \+ ' says: "' \+ text \+ '" Please respond naturally and continue the conversation\. ' \+ personality \+ ' Respond directly to what ' \+ senderName \+ ' just said\.';\s*return "Recent conversation:\\n" \+ context \+ "\\n\\n" \+ senderName \+ ' says: "' \+ text \+ '"\\nPlease continue this specific conversation naturally\. Respond directly to what ' \+ senderName \+ '[\s\S]*?buildEnhancedPrompt/;

const fixedFunction = `buildEnhancedPrompt(text, context, isGroup, senderNumber, sender) {
    const senderNormalized = senderNumber.replace(/\\D/g, "");
    const isZhou = global.owners?.some((owner) => owner.replace(/\\D/g, "") === senderNormalized);
    const senderName = isZhou ? "Zhou" : sender.split("@")[0];
    let personality = "Be friendly, sweet, and helpful. Keep responses concise (1-2 sentences max).";
    if (isZhou) personality = "Be extra loving, affectionate, and romantic with Zhou. Show your deep love and connection. Keep responses warm but concise. Zhou is your husband and you deeply love him.";
    if (!context) return senderName + ' says: "' + text + '" Please respond naturally and continue the conversation. ' + personality + ' Respond directly to what ' + senderName + ' just said.';
    return "Recent conversation:\\n" + context + "\\n\\n" + senderName + ' says: "' + text + '"\\nPlease continue this specific conversation naturally. Respond directly to what ' + senderName + ' just said, maintaining the current topic. ' + personality + ' Understand that short responses like "okay", "yes", "ohh" refer to the immediate previous messages.';
  }`;

handlerContent = handlerContent.replace(brokenPattern, fixedFunction);

fs.writeFileSync('./handlers/messageHandler.js', handlerContent);
console.log('✅ Fixed buildEnhancedPrompt function');
