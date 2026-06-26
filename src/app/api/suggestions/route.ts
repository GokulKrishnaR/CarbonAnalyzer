import { NextRequest, NextResponse } from "next/server";
import { UserInputs } from "@/utils/carbonCalculator";
import { InferenceClient } from "@huggingface/inference";
import { getRuleSuggestions } from "@/utils/ruleSuggestions";

const DEFAULT_MODELS = [
  "Qwen/Qwen2.5-7B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
  "HuggingFaceH4/zephyr-7b-beta",
];

function getModelPreferenceOrder(): string[] {
  const envModel = process.env.HF_MODEL?.trim();
  const models = envModel ? [envModel, ...DEFAULT_MODELS] : DEFAULT_MODELS;
  return [...new Set(models)];
}

export async function POST(req: NextRequest) {
  let inputs: any = null;
  let results: any = null;
  let hfToken: string | undefined;

  try {
    const body = await req.json();
    inputs = body.inputs;
    results = body.results;
    hfToken = typeof body.hfToken === "string" ? body.hfToken.trim() : undefined;

    if (!inputs || !results) {
      return NextResponse.json(
        { error: "Missing required parameters: 'inputs' or 'results'" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload. Please provide valid JSON." },
      { status: 400 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const token = hfToken || headerToken;

  if (!token) {
    return NextResponse.json(
      { error: "Hugging Face API key required. Add your token in the AI Suggestions panel." },
      { status: 400 }
    );
  }

  const rawEndpoint = process.env.HF_API_ENDPOINT?.trim();
  const endpointUrl = rawEndpoint && !rawEndpoint.includes("/hf-inference")
    ? rawEndpoint
    : undefined;
  const modelPreferenceOrder = getModelPreferenceOrder();
  const systemInstruction = "You are an expert climate scientist and eco-advisor. Provide a personalized, encouraging, and detailed carbon reduction plan. Speak directly to the user based on their specific lifestyle data. Include concrete suggestions with estimated monthly CO2e savings in kg. Format your output cleanly in markdown with headings, bold text, and bullet points.";
  const userPrompt = constructPrompt(inputs, results);

  const client = new InferenceClient(token, endpointUrl ? { endpointUrl } : {});

  let generatedText = "";
  let success = false;
  let lastError = "";

  // 5. Try each model in preference order via chat completion (required for instruct models)
  for (const model of modelPreferenceOrder) {
    try {
      console.log(`[AI Suggestions] Attempting chat completion with model: ${model}${endpointUrl ? ` via ${endpointUrl}` : ""}`);

      const completionPromise = client.chatCompletion({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 850,
        temperature: 0.7,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: Request to model ${model} timed out after 25 seconds`)), 25000)
      );

      const response = await Promise.race([completionPromise, timeoutPromise]);
      const content = response.choices?.[0]?.message?.content?.trim();

      if (content) {
        generatedText = content;
        success = true;
        console.log(`[AI Suggestions] Successfully generated recommendations using model: ${model}`);
        break;
      }

      lastError = `Received empty completion choice from model: ${model}`;
    } catch (err: any) {
      console.error(`[AI Suggestions] Model ${model} failed:`, err?.message || err);
      lastError = err?.message || `Inference error on model ${model}`;
    }
  }

  // 6. Return response if generated successfully
  if (success) {
    return NextResponse.json({
      markdown: generatedText,
      source: "ai",
      fallback: false
    });
  }

  // 7. If all models fail, fall back to rule-based suggestions instead of throwing HTTP error
  console.warn(`[AI Suggestions] All Hugging Face models failed to respond. Last error: ${lastError}. Serving server-side rules fallback.`);
  const fallbackMarkdown = generateRuleBasedMarkdown(inputs, results);
  return NextResponse.json({
    markdown: fallbackMarkdown,
    source: "rules",
    fallback: true
  }, { status: 200 });
}

// Generate fallback markdown dynamically from local rules calculations
function generateRuleBasedMarkdown(inputs: UserInputs, results: any): string {
  const suggestions = getRuleSuggestions(inputs);
  const comparisonText = results.comparisonPercentage > 0
    ? `${results.comparisonPercentage}% more than`
    : `${Math.abs(results.comparisonPercentage)}% less than`;

  let markdown = `## Lifestyle Analysis & Fallback Recommendations\n\n`;
  markdown += `Based on your inputs, your monthly footprint is **${results.monthly.total} kg CO2e** (projected to **${(results.yearly.total / 1000).toFixed(1)} metric tons** per year). This is **${comparisonText}** the global average baseline (~4.5 tons/year). Your Eco Score is **${results.ecoScore}/100**. Your biggest footprint contributor is **${results.biggestContributor.label}**.\n\n`;
  markdown += `Hugging Face AI was unavailable. Here are the top personalized carbon reduction actions calculated by our local rules engine:\n\n`;

  const topSuggestions = suggestions.slice(0, 7);
  topSuggestions.forEach((item, index) => {
    markdown += `### ${index + 1}. ${item.title}\n`;
    markdown += `${item.description}\n`;
    markdown += `* **[Estimated Savings: ${item.savings} kg CO2e/month]**\n\n`;
  });

  markdown += `### Recommended Next Steps\n`;
  markdown += `Implementing even a few of these recommendations will help bring you closer to the global sustainability target of 2.0 metric tons per year. Every action counts, keep going!`;

  return markdown;
}

function constructPrompt(inputs: UserInputs, results: any): string {
  const comparisonText = results.comparisonPercentage > 0
    ? `${results.comparisonPercentage}% more than`
    : `${Math.abs(results.comparisonPercentage)}% less than`;

  return `Here is my lifestyle details and carbon emission analysis:

EMISSIONS ANALYSIS SUMMARY:
- Total Monthly Footprint: ${results.monthly.total} kg CO2e
- Total Yearly Footprint: ${results.yearly.total} kg CO2e (~${(results.yearly.total / 1000).toFixed(1)} metric tons)
- Comparison: My footprint is ${comparisonText} the global baseline average (~4.5 metric tons/year).
- Eco Score: ${results.ecoScore}/100 (where 100 is excellent).
- Biggest Contributing Area: ${results.biggestContributor.label} (${results.biggestContributor.percentage}% of my total).

LIFESTYLE DATA:
* TRANSPORT:
  - Driving: ${inputs.carDistance} km/week with a ${inputs.carType} car.
  - Public Transit: ${inputs.publicTransitDistance} km/week.
  - Flying: ${inputs.flightHours} hours/year.
  - Ride-share: ${inputs.rideShareTrips} trips/week.
  - Travel frequency level: ${inputs.travelLevel}.

* HOME ENERGY:
  - Electricity consumption: ${inputs.electricityUsage} kWh/month (Region: ${inputs.electricityRegion}).
  - Cooking gas: ${inputs.cookingLpg} kg LPG/month.
  - AC & Heating: ${inputs.acHeatingHours} hours/day.

* DIET & FOOD:
  - Beef meals: ${inputs.beefMeals} per week.
  - Chicken/poultry meals: ${inputs.chickenMeals} per week.
  - Vegetarian meals: ${inputs.vegMeals} per week.
  - Vegan days: ${inputs.veganDays} per week.
  - Food waste: ${inputs.foodWaste} kg/week.

* CONSUMPTION & WASTE:
  - Clothing: ${inputs.clothingItems} new items purchased/month.
  - Electronics: ${inputs.electronicsItems} new devices/year.
  - Miscellaneous Shopping Level: ${inputs.shoppingLevel}.
  - Waste produced: ${inputs.wasteAmount} kg/week.
  - Recycling rate: ${inputs.recyclePercent}%.
  - Composting: ${inputs.compost ? "Yes" : "No"}.
  - Digital device screen-time: ${inputs.deviceHours} hours/day.

Please generate:
1. A brief, positive 2-3 sentence overview analyzing my profile, highlighting my primary carbon driver and what is working well.
2. 5-7 actionable, realistic carbon reduction tips tailored specifically to my inputs. For each tip:
   - Make the recommendation specific (e.g. "Switch 30km of weekly car travel to bus" rather than "use less car").
   - Include a brief explanation of the environmental benefit.
   - Estimate the approximate carbon savings in kg CO2e per month. Format it in bold like: **[Estimated Savings: XX kg CO2e/month]**
3. An encouraging closing sentence.`;
}
