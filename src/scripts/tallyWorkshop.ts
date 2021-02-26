import { base } from "../utils/airtable";
import { client } from "../utils/discord";
const DEFAULT = 30;
export const run = async () => {
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

  (await base("Workshop").select().all()).forEach((v) => v.destroy());
  client.destroy();
};

client.login(process.env.DISCORD_TOKEN).then(run);
