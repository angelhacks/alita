import * as Discord from "discord.js";
import { base } from "../utils/airtable";
import { client } from "../utils/discord";

const run = async () => {
  let teams = await base("Teams")
    .select({ filterByFormula: "{needChannel}='1'" })
    .all();
  let guild = await client.guilds.fetch(process.env.GUILD_ID);
  let verified = await guild.roles.fetch(process.env.VERIFY_ROLE);
  let mentor = await guild.roles.fetch(process.env.MENTOR_ROLE);
  let helper = await guild.roles.fetch(process.env.HELPER_ROLE);
  console.log(verified.id);
  teams.forEach(async (team) => {
    let IDs = team.get("ids");
    let role = await guild.roles.create({
      data: {
        name: team.get("Name"),
        color: "RED",
      },
    });
    let category = await guild.channels.create(team.get("Name"), {
      type: "category",
    });
    await category.updateOverwrite(guild.roles.everyone, {
      VIEW_CHANNEL: false,
    });
    await category.updateOverwrite(verified, {
      VIEW_CHANNEL: false,
    });
    await category.updateOverwrite(mentor, { VIEW_CHANNEL: true });
    await category.updateOverwrite(helper, { VIEW_CHANNEL: true });
    await category.updateOverwrite(role, { VIEW_CHANNEL: true });
    let textChannel = await guild.channels.create("general", {
      type: "text",
      parent: category,
    });
    let voiceChannel = await guild.channels.create("voice", {
      type: "voice",
      parent: category,
    });
    let people: Array<Discord.GuildMember> = await Promise.all(
      IDs.map((v) => guild.members.fetch(v))
    );
    people.forEach(async (person) => {
      await person.roles.add(role);
    });
    await textChannel.send(
      `${IDs.map((v) => `<@${v}>`).join(
        ", "
      )} welcome to your new catagory with a private text and voice channel! You can change the name with \`alita rename newname\`! Make sure to ping the organizers if you need help, or someone isn't active for a long time! Ping helpers or mentors if you need code help. UWU have a fun time!`
    );
    if (team.get("mixer")) {
      IDs.forEach(async (v) => {
        let person = await base("Team Mixer")
          .select({ filterByFormula: `ID=${v}` })
          .all();
        if (person[0].get("Skills")) {
          await textChannel.send(
            `<@${v}> is an ${person[0].get("Level")} and is a ${person[0]
              .get("Skills")
              .join(", ")}!`
          );
        } else {
          await textChannel.send(`<@${v}> is a ${person[0].get("Level")}`);
        }
      });
    }
    await base("Teams").update(team.id, {
      roleID: role.id,
      textID: textChannel.id,
      voiceID: voiceChannel.id,
      catagoryID: category.id,
    });
  });
};

run().catch(console.log);
