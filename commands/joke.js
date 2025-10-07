// commands/joke.js - DARK HUMOR EDITION
import axios from 'axios';

const darkJokes = [
    "Why don't skeletons fight each other? They don't have the guts.",
    "What does a zombie vegetarian eat? GRAAAAAINS!",
    "Why did the vampire go to the therapist? He was feeling a little batty.",
    "What do you call a haunted chicken? A poultry-geist!",
    "Why don't ghosts like rain? It dampens their spirits.",
    "What's a zombie's favorite snack? Fingers food!",
    "Why was the graveyard so noisy? Because of all the coffin!",
    "What do you call a skeleton who won't work? Lazy bones!",
    "Why did the ghost become a detective? He was good at following clues!",
    "What's a vampire's favorite fruit? A blood orange!",
    "Why don't mummies take vacations? They're afraid to unwind!",
    "What do you call a witch at the beach? A sand-witch!"
];

const sarcasticJokes = [
    "I'm not arguing, I'm just explaining why I'm right.",
    "I'm not lazy, I'm in energy-saving mode.",
    "I don't need anger management, I need people to stop pissing me off.",
    "My personality is 90% sarcasm and 10% I'm not sure what you're talking about.",
    "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
    "I'm not procrastinating, I'm just doing tomorrow's work today... tomorrow.",
    "I'm not short, I'm concentrated awesome.",
    "I'm not ignoring you, I'm just prioritizing my peace.",
    "I'm not stubborn, I'm just always right.",
    "I'm not weird, I'm limited edition."
];

export const name = "joke";
export const description = "Get a random dark/sarcastic joke";

export async function execute(sock, msg, args) {
    try {
        let jokeText = "";
        let category = "dark";
        
        // Check if user wants specific type
        if (args[0]?.toLowerCase() === 'sarcastic') {
            category = "sarcastic";
        }

        try {
            // Try multiple joke APIs for variety
            const apis = [
                'https://v2.jokeapi.dev/joke/Dark?type=twopart',
                'https://v2.jokeapi.dev/joke/Pun?type=twopart',
                'https://official-joke-api.appspot.com/random_joke'
            ];
            
            const randomApi = apis[Math.floor(Math.random() * apis.length)];
            const response = await axios.get(randomApi, { timeout: 5000 });
            
            if (randomApi.includes('jokeapi.dev')) {
                if (response.data && response.data.setup) {
                    jokeText = `🎭 ${response.data.setup}\n\n💀 ${response.data.delivery || response.data.joke}`;
                } else {
                    throw new Error("Invalid API response");
                }
            } else {
                // official-joke-api
                if (response.data && response.data.setup) {
                    jokeText = `🎭 ${response.data.setup}\n\n💀 ${response.data.punchline}`;
                } else {
                    throw new Error("Invalid API response");
                }
            }
            
        } catch (apiError) {
            console.log("API failed, using local jokes");
            // Fallback to local jokes
            const jokePool = category === 'sarcastic' ? sarcasticJokes : darkJokes;
            const randomJoke = jokePool[Math.floor(Math.random() * jokePool.length)];
            
            if (randomJoke.includes('?')) {
                const parts = randomJoke.split('?');
                jokeText = `🎭 ${parts[0]}?\n\n💀 ${parts[1]?.trim() || "..."}`;
            } else {
                jokeText = `💀 ${randomJoke}`;
            }
        }

        // Add some flavor based on category
        const emojis = category === 'sarcastic' ? "😏🎯" : "👻🖤";
        const caption = category === 'sarcastic' ? "Sarcasm Mode: Activated" : "Dark Humor Incoming";
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `${emojis} *${caption}*\n\n${jokeText}\n\n_Type .joke sarcastic for sarcastic jokes_`
        }, { 
            quoted: msg  // This makes it quote the original message
        });

    } catch (error) {
        console.error("Joke command error:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ Even my humor died trying... Try again! 😵"
        }, { 
            quoted: msg 
        });
    }
}
