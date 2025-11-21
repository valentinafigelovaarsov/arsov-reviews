import { GoogleGenAI, Type } from "@google/genai";
import { Review, ReviewFormData, ProductAnalysis, ReviewLength } from "../types";

// Helper to safely get AI instance or throw readable error
const getAI = () => {
  const key = process.env.API_KEY;
  
  if (!key) {
    throw new Error("CHYBA: Chybí API klíč (API_KEY) v nastavení Vercel.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Step 1: Analyze the product URL to understand context, audience, and brand voice.
 * We use the 'googleSearch' tool here, so we CANNOT use JSON schema enforcement.
 */
const analyzeProductUrl = async (url: string): Promise<ProductAnalysis> => {
  const ai = getAI();
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Jdi na tuto URL: ${url}
    
    Proveď detailní analýzu produktu pro e-shop Tomas Arsov.
    Tvým úkolem je extrahovat a pochopit následující:
    1. Přesný název produktu.
    2. Klíčové ingredience a jejich benefity (proč to funguje?).
    3. Cílovou skupinu (kdo tento produkt nejvíce potřebuje? Např. ženy s barvenými vlasy, muži s lupy atd.).
    4. "Tone of voice" stránky - jak značka komunikuje?
    5. Hlavní marketingové háčky (Selling Points).

    Výstup zformátuj jasně a strukturovaně jako text.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Enable search to read the website
    },
  });

  const analysisText = response.text || "Nepodařilo se analyzovat stránku.";

  const nameMatch = analysisText.match(/název produktu:?\s*(.+)$/im) || analysisText.match(/Produkt:?\s*(.+)$/im);
  const name = nameMatch ? nameMatch[1].trim() : "Neznámý produkt";

  return {
    name: name,
    description: analysisText,
    targetAudience: "Detekováno z webu",
    marketingHooks: []
  };
};

/**
 * Helper to get length specific instructions
 */
const getLengthInstruction = (length: ReviewLength): string => {
  switch (length) {
    case ReviewLength.SHORT:
      return "Délka: PŘESNĚ JEDNA (1) složená věta. Musí to být krátké, úderné a k věci.";
    case ReviewLength.MEDIUM:
      return "Délka: 2 až 4 věty. Zlatý střed - řekni to podstatné, zmiň jeden benefit, ale nerozepisuj se do detailů.";
    case ReviewLength.LONG:
      return "Délka: 6 až 9 vět. Detailní popis, storytelling. Popiš pocity, vůni, ingredience a celkový zážitek (jako v příkladu: 'cítím se jako v obláčku', 'game changer' atd.).";
    default:
      return "Délka: 3-5 vět.";
  }
};

/**
 * Step 2: Generate structured reviews based on the analysis.
 * We do NOT use search here, so we CAN use JSON schema.
 */
export const generateReviews = async (formData: ReviewFormData, excludedNames: string[] = []): Promise<Review[]> => {
  const { productUrl, reviewCount, tone, length } = formData;
  const ai = getAI();

  try {
    // 1. Analyze the product page first
    const analysis = await analyzeProductUrl(productUrl);
    
    // 2. Generate reviews based on analysis
    const generationModel = "gemini-2.5-flash";
    const lengthInstruction = getLengthInstruction(length);
    
    const prompt = `
      Jsi špičkový copywriter pro značku Tomas Arsov.
      
      Mám pro tebe analýzu produktu získanou z webu:
      "${analysis.description}"
      
      Na základě této analýzy napiš ${reviewCount} autentických, prodejních recenzí v češtině.
      
      ZADÁNÍ A STRATEGIE:
      1. Tón: ${tone}.
      2. Hodnocení: VŽDY 5 hvězdiček.
      3. ${lengthInstruction} (Toto je kritické zadání pro délku).
      4. Autenticita & Vyváženost: 
         - Tón "Nadšený" je povolen, ale používej ho s mírou.
         - Můžeš použít emotivní slova ("Miluju to", "Záchrana"), ale NEPOUŽÍVEJ v každé větě poetická klišé jako "symfonie", "pohlazení", "klenot", "óda".
         - Působí to pak jako AI. Cílem je, aby recenze zněly, jako by je psaly skutečné ženy na mobilu.
      5. EXTRÉMNÍ VARIABILITA (KRITICKÉ):
         - Každá z ${reviewCount} recenzí MUSÍ být naprosto odlišná.
         - POHLAVÍ: Pokud je produkt unisex, MUSÍŠ střídat muže a ženy. Pokud je pro ženy, střídej aspoň věk/styl vyjadřování.
         - ZÁKAZ OPAKOVÁNÍ: NIKDY negeneruj 2 recenze po sobě, které znějí stejně (např. 2x za sebou muž, který filozofuje o vůni). 
         - STŘÍDEJ STYL PISATELE:
             * Pisatel A: Pragmatický, řeší výsledek, stručnější věty.
             * Pisatel B: Emotivní, řeší pocity ("cítím se skvěle"), delší souvětí.
             * Pisatel C: Řeší detail (složení, balení, dárek).
      6. Marketingová psychologie:
         - Zmiň konkrétní problém, který zákazník měl (např. "suché konce", "vlasy bez života").
         - Popiš transformaci po použití produktu.
      7. UNIKÁTNOST JMEN (HISTORIE):
         - V databázi už máme tato jména: ${JSON.stringify(excludedNames.slice(-200))}.
         - Pravidlo: NESMÍŠ vygenerovat autora se stejným CELÝM JMÉNEM (křestní + příjmení), které je v tomto seznamu.
         - Křestní jména se mohou opakovat. Příjmení se mohou opakovat. Ale NIKDY se nesmí opakovat celá kombinace.
      
      Formát výstupu: JSON pole objektů (bez nadpisu, pouze obsah a autor).
    `;

    const response = await ai.models.generateContent({
      model: generationModel,
      contents: prompt,
      config: {
        temperature: 1.1, // Increased temperature for even more randomness
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              author: { type: Type.STRING, description: "České jméno zákazníka (Dodrž pravidlo unikátnosti)" },
              rating: { type: Type.INTEGER, description: "Počet hvězdiček (vždy 5)" },
              content: { type: Type.STRING, description: "Text recenze (bez nadpisu)" },
              productName: { type: Type.STRING, description: "Název produktu (z analýzy)" } 
            },
            required: ["author", "rating", "content", "productName"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");

    const parsedReviews: Review[] = JSON.parse(jsonText);
    return parsedReviews;

  } catch (error) {
    console.error("Error in review generation flow:", error);
    throw error;
  }
};
