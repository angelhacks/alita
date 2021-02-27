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
  console.log("Starting creation!!!");
  for (let i = 0; i < teams.length; i++) {
    let team = teams[i];
    console.log(`On ${team.get("Name").toLowerCase().split(" ").join("-")}`);
    let category = <Discord.TextChannel>(
      await guild.client.channels.fetch(team.get("textID"))
    );
    await category.setName(team.get("Name").toLowerCase().split(" ").join("-"));
  }
  console.log("Doned!");
  client.destroy();
};
client.login(process.env.DISCORD_TOKEN).then(run);
