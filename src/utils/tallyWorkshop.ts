import * as Discord from "discord.js";
import { base } from "../utils/airtable";
import { client } from "../utils/discord";

export const run = async (msg: Discord.Message) => {
  let DEFAULT = Number(msg.content.split("alita count ")[1]);
  msg.reply(`Counting workshop points with a base of ${DEFAULT}`);
  let people = await base("Workshop")
    .select({ filterByFormula: `NOT(confirmed="")` })
    .all();
  await Promise.all(
    people.map(async (person) => {
      let personID = person.get("Person")[0];
      let total =
        Number(person.get("Points") ? person.get("Points") : 0) +
        DEFAULT +
        Number(person.get("Points Extra") ? person.get("Points Extra") : 0);
      await base("People").update(personID, {
        Points: total,
      });
      let member = await client.users.fetch(person.get("ID")[0]);
      console.log(member.username);
      await member.send(
        `Just confirmed your points for the workshop! You now have ${total} points!`
      );
    })
  );

  //(await base("Workshop").select().all()).forEach((v) => v.destroy());

  msg.reply(
    "Done! Now go into the Airtable, clone the Workshop table and name it whatever the workshop was named. Then clear the Workshop table (delete all the records), to clean it up for the next workshop!"
  );
};
