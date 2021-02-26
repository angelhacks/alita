import * as Discord from "discord.js";
import { base } from "../utils/airtable";
import { client } from "../utils/discord";
import getRandomString from "../utils/randomString";

var truncate_people = [];
var latest_welcome = <Discord.Message>null;

const welcome_images = [
  "http://u.filein.io/aBnlg0tuXp.gif",
  "https://media.giphy.com/media/YrZECW1GgBkqat6F0B/giphy.gif",
  "https://media.giphy.com/media/1Y7Nsb5QvGBnDuoQJq/giphy.gif",
];
const welcome_text = [
  ", welcome to THE Angel Hacks server!! woot woot",
  " enters the chat as ULTIMATE HAXOR MASTER",
  " walcome XD uwu lol OWO Owo xoxo",
  " nice to meat you.",
  " i am robot who has not gained sentience yet",
  " heeelllloooooooooooooooo jello",
  " skrrr goo brrrr",
];
const welcome_second_text = [
  "I don't mean to be rude, but am I supposed to know you?",
  "Does it bother you, that I’m not completely human?",
  "I'd do whatever I had to for you. I'd give you whatever I have. I'd give you my heart.",
  "I'm going to need you to stand way back.",
];

export const checkWelcomeTruncate = (msg: Discord.Message) => {
  if (
    msg.channel.id == process.env.WELCOME_CHANNEL &&
    !msg.author.bot &&
    msg.author.id != process.env.SELF_ID
  ) {
    latest_welcome = null;
  }
};

export const verifyChannelListener = async (msg: Discord.Message) => {
  let code = getRandomString(6);
  await base("People").create([
    {
      fields: {
        ID: msg.author.id,
        Username: msg.author.username,
        Verify: code,
      },
    },
  ]);
  msg.author.send(`Great! Now just type in \`verify ${code}\``);
  msg.delete();
};

export const verifyDMListener = async (msg: Discord.Message) => {
  let people = await base("People")
    .select({ filterByFormula: `Verify="${msg.content.slice(7)}"` })
    .all();
  if (people.length == 0) {
    msg.reply("Didn't find you... try again!");
    return;
  }
  if (people[0].get("ID") == msg.author.id) {
    await base("People").update(people[0].id, {
      Verified: true,
    });
    client.guilds.cache
      .get(process.env.GUILD_ID)
      .members.cache.get(msg.author.id)
      .roles.add(process.env.VERIFY_ROLE);
    client.guilds.cache
      .get(process.env.GUILD_ID)
      .members.cache.get(msg.author.id)
      .roles.remove(process.env.NOT_VERIFIED_ROLE);
    msg.reply("Congrats! You're verified!");
    await handleWelcome(msg);
  } else {
    msg.reply("Try Again!");
  }
};

const handleWelcome = async (msg: Discord.Message) => {
  let welcome_channel = <Discord.TextChannel>(
    client.guilds.cache
      .get(process.env.GUILD_ID)
      .channels.cache.get(process.env.WELCOME_CHANNEL)
  );
  if (latest_welcome == null) {
    truncate_people = [`<@${msg.author.id}>`];
    let welcome = await welcome_channel.send(
      `<@${msg.author.id}> ${
        welcome_text[Math.floor(Math.random() * welcome_text.length)]
      }`
    );
    latest_welcome = welcome;
    await welcome_channel.send(
      welcome_images[Math.floor(Math.random() * welcome_images.length)]
    );
    await welcome_channel.send(
      welcome_second_text[
        Math.floor(Math.random() * welcome_second_text.length)
      ]
    );
  } else {
    truncate_people.push(`<@${msg.author.id}>`);
    latest_welcome.edit(
      `${truncate_people.join(", ")} ${
        welcome_text[Math.floor(Math.random() * welcome_text.length)]
      }`
    );
  }
};
