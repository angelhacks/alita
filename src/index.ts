import { config } from "dotenv";
config();

import * as Discord from "discord.js";
import { client } from "./utils/discord";
import { base } from "./utils/airtable";
import {
  verifyChannelListener,
  verifyDMListener,
  checkWelcomeTruncate,
} from "./commands/verify";
import {
  mixerDMCheckListener,
  messageListener,
  rename,
} from "./commands/mixer";
import { run } from "./utils/tallyWorkshop";
import { pointCheck } from "./commands/points";
var respond = {};
var event_reload = 0;

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

  if (
    msg.content === "verify" &&
    msg.channel.id == process.env.VERIFY_CHANNEL
  ) {
    verifyChannelListener(msg);
  } else if (msg.content.slice(0, 6) == "verify" && msg.channel.type == "dm") {
    verifyDMListener(msg);
  } else if (msg.content == "check" && msg.channel.type == "dm") {
    mixerDMCheckListener(msg);
  } else if (msg.content == "alita points") {
    pointCheck(msg);
  } else if (
    msg.content.slice(0, 13) == "alita rename " &&
    msg.content.split("alita rename ")[1] != ""
  ) {
    rename(msg);
  } else if (
    msg.channel.id == process.env.ADMIN_CHANNEL &&
    msg.content.slice(0, 12) == "alita count " &&
    msg.content.split("alita count ")[1] != ""
  ) {
    run(msg);
  } else {
    let done = false;
    Object.keys(respond).forEach((v) => {
      if (msg.content.toLowerCase().includes(v) && !done) {
        msg.channel.send(respond[v]);
        done = true;
      }
    });
  }
  checkWelcomeTruncate(msg);
  event_reload--;
});

client.on("guildMemberAdd", (member) => {
  member.roles.add(process.env.NOT_VERIFIED_ROLE);
});

client.login(process.env.DISCORD_TOKEN).then(async () => {
  let channel = <Discord.TextChannel>(
    await client.channels.fetch(process.env.BOT_SPAM)
  );
  channel.send("Up and running uwu rawr!");

  await messageListener();
});
