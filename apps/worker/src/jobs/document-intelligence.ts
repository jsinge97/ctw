const documentTypes = ["unknown", "loi", "lease", "om", "estoppel", "comp_set", "other"] as const;

export type DocumentType = (typeof documentTypes)[number];
export type DocumentIntelligenceResult = {
  classificationStatus: "classified" | "failed";
  confidence: number;
  documentType: DocumentType;
  extractedText: string;
  ocrStatus: "complete" | "failed";
  summary: string;
};

export type AnalyzeDocumentInput = {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
};

export async function analyzeDocument(input: AnalyzeDocumentInput, source: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): Promise<DocumentIntelligenceResult> {
  if (input.bytes.byteLength === 0) return failedResult("Empty document");
  if (source.CTW_AI_MODE !== "live") return fakeAnalyzeDocument(input);

  const apiKey = source.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required when CTW_AI_MODE=live");
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: source.OPENAI_MODEL ?? "gpt-5.5",
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: input.filename,
              file_data: `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`
            },
            {
              type: "input_text",
              text: "Extract readable text from this commercial real estate document and classify it as one of: unknown, loi, lease, om, estoppel, comp_set, other. Return only the requested JSON."
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ctw_document_intelligence",
          strict: true,
          schema: documentIntelligenceSchema
        }
      }
    })
  });
  const body = await response.json() as unknown;
  if (!response.ok) throw new Error(`OpenAI document intelligence failed: ${response.status}`);
  return parseDocumentIntelligence(body);
}

export function classifyDocumentFromText(filename: string, extractedText = ""): { documentType: DocumentType; confidence: number } {
  const value = `${filename}\n${extractedText}`.toLowerCase();
  if (value.includes("letter of intent") || value.includes(" loi") || value.includes("loi ")) return { documentType: "loi", confidence: 0.91 };
  if (value.includes("lease")) return { documentType: "lease", confidence: 0.86 };
  if (value.includes("offering memorandum") || value.includes(" om ") || value.includes("memorandum")) return { documentType: "om", confidence: 0.84 };
  if (value.includes("estoppel")) return { documentType: "estoppel", confidence: 0.82 };
  if (value.includes("comparable") || value.includes("comp set") || value.includes("rent comp")) return { documentType: "comp_set", confidence: 0.8 };
  return { documentType: "unknown", confidence: 0.3 };
}

function fakeAnalyzeDocument(input: AnalyzeDocumentInput): DocumentIntelligenceResult {
  const decodedText = decodeTextLikeDocument(input);
  const classification = classifyDocumentFromText(input.filename, decodedText);
  return {
    classificationStatus: classification.documentType === "unknown" ? "failed" : "classified",
    confidence: classification.confidence,
    documentType: classification.documentType,
    extractedText: decodedText || `Fake OCR completed for ${input.filename}.`,
    ocrStatus: "complete",
    summary: decodedText ? decodedText.slice(0, 240) : `Local fake OCR processed ${input.filename}.`
  };
}

function decodeTextLikeDocument(input: AnalyzeDocumentInput): string {
  if (!/text|json|xml|csv|markdown|html/.test(input.mimeType)) return "";
  return new TextDecoder().decode(input.bytes).replace(/\s+/g, " ").trim();
}

function failedResult(reason: string): DocumentIntelligenceResult {
  return {
    classificationStatus: "failed",
    confidence: 0,
    documentType: "unknown",
    extractedText: "",
    ocrStatus: "failed",
    summary: reason
  };
}

function parseDocumentIntelligence(body: unknown): DocumentIntelligenceResult {
  const text = extractOutputText(body);
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const documentType = documentTypes.includes(parsed.documentType as DocumentType) ? parsed.documentType as DocumentType : "unknown";
  const extractedText = typeof parsed.extractedText === "string" ? parsed.extractedText : "";
  const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
  return {
    classificationStatus: documentType === "unknown" ? "failed" : "classified",
    confidence,
    documentType,
    extractedText,
    ocrStatus: extractedText.length > 0 ? "complete" : "failed",
    summary: typeof parsed.summary === "string" ? parsed.summary : ""
  };
}

function extractOutputText(body: unknown): string {
  if (isRecord(body) && typeof body.output_text === "string") return body.output_text;
  if (!isRecord(body) || !Array.isArray(body.output)) throw new Error("OpenAI response did not include output text");
  for (const output of body.output) {
    if (!isRecord(output) || !Array.isArray(output.content)) continue;
    for (const content of output.content) {
      if (isRecord(content) && typeof content.text === "string") return content.text;
    }
  }
  throw new Error("OpenAI response did not include output text");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

const documentIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: { type: "string", enum: documentTypes },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    extractedText: { type: "string" },
    summary: { type: "string" }
  },
  required: ["documentType", "confidence", "extractedText", "summary"]
};

