import * as Discord from "discord.js";
import { base } from "../utils/airtable";
import { client } from "../utils/discord";

export const mixerDMCheckListener = async (msg: Discord.Message) => {
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

    msg.reply(
      "Donezo! We'll contact you when we create the server channels for your team (or not if you're solo)!"
    );
  } catch (e) {
    console.log(e);
  }
};

export const messageListener = async () => {
  let channel = <Discord.TextChannel>(
    await client.channels.fetch(process.env.MIXER_CHANNEL)
  );

  let message = await channel.messages.fetch(process.env.MIXER_MESSAGE);
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
              Verified: true,
            },
          },
        ]);
      }
      user.send(
        `Sign up for the team mixer at https://airtable.com/shrH2ActPIV38xQHw?prefill_Secret%20Sauce=${records[0].id}
		
		Once you're done, type \`check\` into this DM!`
      );
      if (records[0].get("Teamate Names")) {
        user.send(
          `By the way, the people - \`${records[0].get(
            "Teamate Names"
          )}\` have all requested to be your team mate. Be sure to request them back to make it official!`
        );
      }
    }
  });
};

export const rename = async (msg: Discord.Message) => {
  let name = msg.content.split("alita rename ")[1];
  await msg.reply(`Changing to \`${name}\``);
  let user = msg.author.id;
  let person = await base("Team Mixer")
    .select({ filterByFormula: `ID='${user}'` })
    .all();
  let team = await base("Teams").find(person[0].get("Teams")[0]);
  let role = await msg.guild.roles.fetch(team.get("roleID"));
  let catagory = <Discord.CategoryChannel>(
    await client.channels.fetch(team.get("catagoryID"))
  );
  await role.edit({
    name: name,
  });
  await base("Teams").update(team.id, {
    Name: name,
  });
  await catagory.setName(name);
  msg.reply("Done!");
};
