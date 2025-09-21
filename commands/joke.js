// commands/joke.js - FIXED WITH AXIOS
import axios from 'axios';

const jokes = [
    "Why don't skeletons ever fight each other? They don't have the guts.",
    "I told my computer I needed a break... now it won't stop sending me Kit-Kats.",
    "Why can't your nose be 12 inches long? Because then it would be a foot!",
    "What do you call a fake noodle? An impasta!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a sleeping bull? A bulldozer!",
    "Why did the math book look so sad? Because it had too many problems!",
    "What's orange and sounds like a parrot? A carrot!",
    "Why did the coffee file a police report? It got mugged!",
    "What do you call a fish wearing a bowtie? Sofishticated!"
];

export const name = "joke";
export const description = "Get a random joke";

export async function execute(sock, msg) {
    let jokeText = "";
    try {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        if (response.data) {
            const data = response.data;
            jokeText = `${data.setup}\n${data.punchline}`;
        } else {
            throw new Error("API returned no data");
        }
    } catch (err) {
        const localJoke = jokes[Math.floor(Math.random() * jokes.length)];
        jokeText = `😄 Here's a joke:\n${localJoke}`;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: jokeText });
}
