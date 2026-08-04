export type CategorySort = "top" | "hot" | "new";

export interface Category {
  slug: string;
  name: string;
  description: string;
  subreddits: string[];
  sort: CategorySort;
  limit: number;
}

// Each category is a curated set of subreddits whose posts fit the theme.
// Snapshots for every category are refreshed twice a day by the cron trigger.
export const categories: Category[] = [
  {
    slug: "funny-reddit-stories",
    name: "Funny Reddit Stories",
    description:
      "Laugh-out-loud funny reddit stories — jokes, one-liners, and silly true tales upvoted by reddit.",
    subreddits: ["Jokes", "dadjokes", "CleanJokes"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "funniest-reddit-stories",
    name: "Funniest Reddit Stories",
    description:
      "The funniest reddit stories reddit has to offer, ranked by upvotes across the biggest comedy communities.",
    subreddits: ["dadjokes", "Jokes", "CleverComebacks"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "best-reddit-stories",
    name: "Best Reddit Stories",
    description:
      "The best reddit stories of the week — the highest-rated storytelling posts from reddit's story subreddits.",
    subreddits: ["stories", "RedditStoryTime", "nosleep"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "scary-reddit-stories",
    name: "Scary Reddit Stories",
    description:
      "Scary reddit stories that will keep you up at night — horror and suspense from the creepiest corners of reddit.",
    subreddits: ["nosleep", "scarystories", "creepypasta"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "creepy-reddit-stories",
    name: "Creepy Reddit Stories",
    description:
      "Creepy reddit stories and unsettling true encounters from reddit's paranormal and horror communities.",
    subreddits: ["creepypasta", "Paranormal", "Ghosts"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "sus-reddit-stories",
    name: "Sus Reddit Stories",
    description:
      "Sus reddit stories — suspicious, weird, and unexplainable events that make you raise an eyebrow.",
    subreddits: ["Glitch_in_the_Matrix", "Paranormal", "UnresolvedMysteries"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "craziest-reddit-stories",
    name: "Craziest Reddit Stories",
    description:
      "The craziest reddit stories — unbelievable true tales from work, retail, and the front lines of everyday life.",
    subreddits: ["TalesFromRetail", "TalesFromTheFrontDesk", "MaliciousCompliance"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "crazy-reddit-stories",
    name: "Crazy Reddit Stories",
    description:
      "Crazy reddit stories about chaos at work, petty revenge, and situations you would not believe actually happened.",
    subreddits: ["MaliciousCompliance", "TalesFromTechSupport", "pettyrevenge"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "interesting-reddit-stories",
    name: "Interesting Reddit Stories",
    description:
      "Interesting reddit stories worth reading — thoughtful true tales, secrets, and off-my-chest posts from reddit.",
    subreddits: ["stories", "TrueOffMyChest", "OffMyChest"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "ai-reddit-stories",
    name: "AI Reddit Stories",
    description:
      "AI reddit stories — the viral, wild-sounding tales from AITA-style communities that reddit loves to debate.",
    subreddits: ["AITAH", "AmItheAsshole", "TrueOffMyChest"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "fake-reddit-stories",
    name: "Fake Reddit Stories",
    description:
      "Fake reddit stories — the over-the-top dramatic posts everyone suspects were made up, collected in one place.",
    subreddits: ["AITAH", "TIFU", "AmItheAsshole"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "smosh-reads-reddit-stories",
    name: "Smosh Reads Reddit Stories",
    description:
      "Smosh reads reddit stories — the same AITA, TIFU, and confession posts the Smosh crew features on their show.",
    subreddits: ["AmItheAsshole", "TIFU", "confession"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "smosh-reddit-stories",
    name: "Smosh Reddit Stories",
    description:
      "Smosh reddit stories — the best storytelling posts in the style of Smosh Reads Reddit Stories, all in one feed.",
    subreddits: ["stories", "confession", "relationship_advice"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "truck-driver-reddit-stories",
    name: "Truck Driver Reddit Stories",
    description:
      "Truck driver reddit stories — true tales from behind the wheel shared by truckers on reddit.",
    subreddits: ["Truckers", "TalesFromTheRoad"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "am-i-the-asshole-reddit-stories",
    name: "Am I The Asshole Reddit Stories",
    description:
      "Am I the asshole reddit stories — judgment-worthy dilemmas from r/AITA and r/AITAH, ranked by upvotes.",
    subreddits: ["AmItheAsshole", "AITAH"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "confession-reddit-stories",
    name: "Confession Reddit Stories",
    description:
      "Confession reddit stories — secrets, regrets, and off-my-chest tales confessed anonymously on reddit.",
    subreddits: ["confession", "TrueOffMyChest", "OffMyChest"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "paranormal-reddit-stories",
    name: "Paranormal Reddit Stories",
    description:
      "Paranormal reddit stories — ghosts, hauntings, and unexplained phenomena recounted by redditors.",
    subreddits: ["Paranormal", "Ghosts", "HighStrangeness"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "work-reddit-stories",
    name: "Work Reddit Stories",
    description:
      "Work reddit stories — customer horror stories, toxic coworkers, and office chaos from reddit's working subs.",
    subreddits: ["TalesFromTechSupport", "TalesFromRetail", "TalesFromTheFrontDesk"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "petty-revenge-reddit-stories",
    name: "Petty Revenge Reddit Stories",
    description:
      "Petty revenge reddit stories — deliciously petty, malicious, and pro-level revenge tales from reddit.",
    subreddits: ["pettyrevenge", "MaliciousCompliance", "ProRevenge"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "relationship-reddit-stories",
    name: "Relationship Reddit Stories",
    description:
      "Relationship reddit stories — dating disasters, partner drama, and relationship advice stories from reddit.",
    subreddits: ["relationship_advice", "Relationships", "dating_advice"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "food-reddit-stories",
    name: "Food & Restaurant Reddit Stories",
    description:
      "Food and restaurant reddit stories — kitchen chaos and serving nightmares from the hospitality subs.",
    subreddits: ["TalesFromYourServer", "KitchenConfidential"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "school-reddit-stories",
    name: "School Reddit Stories",
    description:
      "School reddit stories — classroom chaos and teaching tales from teachers and students on reddit.",
    subreddits: ["Teachers", "TalesFromTheClassroom"],
    sort: "top",
    limit: 25,
  },
  {
    slug: "true-crime-reddit-stories",
    name: "True Crime Reddit Stories",
    description:
      "True crime reddit stories — real mysteries, cold cases, and true crime discussion from reddit.",
    subreddits: ["UnresolvedMysteries", "TrueCrimeDiscussion"],
    sort: "top",
    limit: 25,
  },
];

const bySlug = new Map(categories.map((category) => [category.slug, category]));

export function categoryBySlug(slug: string): Category | undefined {
  return bySlug.get(slug);
}
