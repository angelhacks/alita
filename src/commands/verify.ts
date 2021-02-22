import * as Discord from "discord.js";
import { base } from "../utils/airtable";
import { client } from "../utils/discord";
import getRandomString from "../utils/randomString";

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
      .roles.add(process.env.VERIFY_ROlE);
    client.guilds.cache
      .get(process.env.GUILD_ID)
      .members.cache.get(msg.author.id)
      .roles.remove(process.env.NOT_VERIFIED_ROLE);
    msg.reply("Congrats! You're verified!");
    let welcome_channel = <Discord.TextChannel>(
      client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env.WELCOME_CHANNEL)
    );
    welcome_channel.send(
      `Welcome <@${msg.author.id}>, to THE Angel Hacks server!! woot woot`
    );
  } else {
    msg.reply("Try Again!");
  }
};
