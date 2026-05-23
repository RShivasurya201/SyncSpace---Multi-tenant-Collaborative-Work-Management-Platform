const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function generateBlockerInfo(comments) {

  if (!comments.length) {

    return {
      summary: "No blocker information",
      type: "UNCLEAR",
    };

  }

  const combinedComments = comments
    .map(c => c.text)
    .join("\n");

  const prompt = `
Analyze these task comments.

Identify:

1. blocker summary (1 short sentence)
2. blocker type

Allowed blocker types:
DEPENDENCY
CLIENT
RESOURCE
UNCLEAR
OTHER

Comments:

${combinedComments}

Respond ONLY JSON:

{
 "summary":"",
 "type":""
}
`;

  try {

    const completion =
      await client.chat.completions.create({

      model:
      "llama-3.3-70b-versatile",

      messages: [

        {
          role:"user",
          content:prompt,
        }

      ],

      temperature:0.2,

    });

    const output =
      completion
      .choices[0]
      .message
      .content;

    const parsed =
      JSON.parse(output);

    return {

      summary:
      parsed.summary,

      type:
      parsed.type,

    };

  }

  catch(error){

    console.log(
      "AI blocker failed:",
      error.message
    );

    return {

      summary:
      "Could not determine blocker",

      type:
      "OTHER",

    };

  }

}

module.exports = {
  generateBlockerInfo,
};