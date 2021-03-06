import Record from "airtable/lib/record";
import { base } from "../utils/airtable";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

var teams = [];

class Member {
  id: string;
  name: string;
  recordID: string;
  record: Record;
  requested = Array<Member>();
  bidirectional = Array<Member>();
  requestUnformated: Array<Record>;
  constructor(id, name, record, requestUnformatted) {
    this.id = id;
    this.name = name;
    this.recordID = record.id;
    this.record = record;
    this.requestUnformated = requestUnformatted;
  }
  getPartners() {
    let bidirectional: Array<Member> = [this];
    if (!this.requested) {
      return null;
    }
    this.requested.forEach((member) => {
      if (member?.requested?.includes(this)) {
        bidirectional.push(member);
      }
    });
    return bidirectional;
  }
}

const runMixer = async () => {
  let teamMixer = await base("Team Mixer")
    .select({ filterByFormula: `NOT(Mixer="")` })
    .all();
  let teamMixerAll = await base("Team Mixer").select().all();
  let peopleTable = await base("People")
    .select({ filterByFormula: `NOT({Team Mixer}="")` })
    .all();
  let peopleTableSearch = {};
  let mixerSearch = { "not-there": "not-there" };
  let people: { prop: Member } = <{ prop: Member }>{};
  peopleTable.forEach((record) => {
    peopleTableSearch[record.id] = record;
  });
  teamMixerAll.forEach((record) => {
    mixerSearch[record.id] = record;
  });

  teamMixer.forEach(
    (v) =>
      (people[v.id] = new Member(
        v.id,
        v.get("Name"),
        v,
        v
          .get("Teammates")
          ?.map(
            (v) =>
              mixerSearch[
                peopleTableSearch[v]
                  ? peopleTableSearch[v].get("Team Mixer")[0]
                  : null
              ]
          )
      ))
  );
  //console.log(peopleTable);
  let todo = [];
  Object.values(people).forEach((member) => {
    member.requested = member.requestUnformated?.map((record) => {
      if (!record) {
        return null;
      }
      if (!people[record.id] && record) {
        people[record.id] = new Member(
          record.id,
          record.get("Name"),
          record,
          record
            .get("Teammates")
            ?.map(
              (v) =>
                mixerSearch[
                  peopleTableSearch[v]
                    ? peopleTableSearch[v].get("Team Mixer")[0]
                    : "not-there"
                ]
            )
        );
        todo.push(people[record.id]);
      }
      return record ? people[record.id] : null;
    });
  });

  todo.forEach((member) => {
    member.requested = member.requestUnformated?.map((record) => {
      return record ? people[record.id] : null;
    });
  });
  let unformattedTeams = [];
  Object.values(people).forEach((member) => {
    let team = member
      .getPartners()
      ?.map((v) => v.id)
      .sort();
    if (team && team.length > 1) {
      unformattedTeams.push(team);
    }
  });
  let toFill = [];
  unformattedTeams.forEach((team) => {
    if (
      team &&
      unformattedTeams.filter((v) => JSON.stringify(v) == JSON.stringify(team))
        .length == team.length
    ) {
      if (team.length == 4) {
        teams.push(team);
      } else {
        toFill.push(team);
      }
    }
  });
  toFill = [...new Set(toFill.map((v) => JSON.stringify(v)))].map((v) =>
    JSON.parse(v)
  );
  console.log(toFill);
  toFill = toFill.map((team) => {
    return {
      team: team,
      skills: [...new Set(team.map((id) => people[id].record.get("Level")))],
    };
  });

  let toSort = Object.values(people).filter((member) => !member.requested);
  let noMore = [];
  toSort.forEach((person, pi) => {
    let sorted = false;
    toFill.forEach((team, i) => {
      if (!team.team || noMore.includes(team.team[0])) {
        return;
      }
      if (team.team.length == 4) {
        teams.push(team.team);
        noMore.push(team.team[0]);
        delete toFill[i];
        return;
      }
      if (!sorted && team.skills.includes(person.record.get("Level"))) {
        toFill[i].team.push(person.id);
        delete toSort[pi];
        sorted = true;
      }
    });
    if (sorted == false) {
      toFill.push([person]);
    }
  });
  toSort = toSort.filter((v) => v);
  if (toSort.length > 0) {
    let i,
      j,
      temparray,
      chunk = 4;
    for (i = 0, j = toSort.length; i < j; i += chunk) {
      temparray = toSort.slice(i, i + chunk);
      teams.push(temparray.map((v) => v.id));
    }
  }
  toFill = toFill.filter((v) => v);
  teams.push(...toFill.map((v) => v.team));
  teams = teams.filter((v) => v);
  teams = [...new Set(teams.map((v) => JSON.stringify(v)))].map((v) =>
    JSON.parse(v)
  );
  teams.forEach((v) => {
    base("Teams")
      .create([
        {
          fields: {
            Name: uniqueNamesGenerator({
              dictionaries: [colors, adjectives, animals],
              separator: " ",
              style: "capital",
            }),
            Members: v,
            mixer: true,
          },
        },
      ])
      .catch(console.log);
  });
};

runMixer().catch(console.log);
