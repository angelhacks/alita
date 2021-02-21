import * as Discord from "discord.js";
import { config } from "dotenv";
import Airtable from "airtable";
const VERIFY_CHANNEL = "803699094383755316";
const MIXER_CHANNEL = "808610652007563285";
const MIXER_MESSAGE = "812927864974344193";
const GUILD_ID = "803697140144144426";
const VERIFY_ROlE = "803705995162288169";
const NOT_VERIFIED_ROLE = "803706005233729566";
var respond = {};
var event_reload = 0;

config();
const client = new Discord.Client();
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  "app1lOaOX1W7GCYtT"
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (event_reload == 0) {
    let records = await base("respond").select().all();
    records.forEach((record) => {
      respond[record.get("phrase")] = record.get("reply");
    });
    event_reload = 10;
  }

  if (msg.content === "verify" && msg.channel.id == VERIFY_CHANNEL) {
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
  } else if (msg.content.slice(0, 6) == "verify" && msg.channel.type == "dm") {
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
        .get(GUILD_ID)
        .members.cache.get(msg.author.id)
        .roles.add(VERIFY_ROlE);
      client.guilds.cache
        .get(GUILD_ID)
        .members.cache.get(msg.author.id)
        .roles.remove(NOT_VERIFIED_ROLE);
      msg.reply("Congrats! You're verified!");
    } else {
      msg.reply("Try Again!");
    }

    console.log(people[0].get("Verify"), msg.content.slice(7));
  } else if (msg.content == "check" && msg.channel.type == "dm") {
    try {
      msg.reply("checking...");
      let people = await base("People")
        .select({ filterByFormula: `ID="${msg.author.id}"` })
        .all();
      if (people.length == 0) {
        msg.reply("Didn't find you... try again!");
        return;
      }
      let submission = await base("Team Mixer")
        .select({ filterByFormula: `Link="${people[0].id}"` })
        .all();
      if (submission.length == 0) {
        msg.reply("Didn't find you... try again!");
        return;
      }

      await base("Team Mixer").update(submission[0].id, {
        People: [people[0].id],
      });

      msg.reply("Done! We'll contact you when teams are made!");
    } catch (e) {
      console.log(e);
    }
  } else {
    let done = false;
    Object.keys(respond).forEach((v) => {
      if (msg.content.includes(v) && !done) {
        msg.channel.send(respond[v]);
        done = true;
      }
    });
  }

  event_reload--;
});

client.on("guildMemberAdd", (member) => {
  member.roles.add(NOT_VERIFIED_ROLE);
});

client.login(process.env.DISCORD_TOKEN).then(async () => {
  let channel = <Discord.TextChannel>await client.channels.fetch(MIXER_CHANNEL);
  channel.send("Up and running!");

  let message = await channel.messages.fetch(MIXER_MESSAGE);
  let collector = new Discord.ReactionCollector(message, () => true);

  collector.on("collect", async (reaction, user) => {
    if (reaction.emoji.name == "✅") {
      let records = await base("People")
        .select({ filterByFormula: `ID="${user.id}"` })
        .all();
      if (records.length == 0) {
        records = await base("People").create([
          {
            fields: {
              ID: user.id,
              Username: user.username,
            },
          },
        ]);
      }
      user.send(
        `Sign up for the team mixer at https://airtable.com/shrH2ActPIV38xQHw?prefill_Secret%20Sauce=${records[0].id}
		
		Once you're done, type \`check\` into this DM!`
      );
    }
  });
});
function getRandomString(length: number) {
  var randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}
