import { Message } from "discord.js";
import { base } from "../utils/airtable";

export const pointCheck = async (msg: Message) => {
  let person = await base("People")
    .select({ filterByFormula: `ID='${msg.author.id}'` })
    .all();
  if (person.length == 0) {
    msg.reply("Record not found!");
    return;
  }
  msg.reply(
    `Yahooo you have ${
      person[0].get("Points") ? person[0].get("Points") : "no"
    } points!`
  );
};
