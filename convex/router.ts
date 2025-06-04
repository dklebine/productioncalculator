import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/generate-pdf",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { formData, quote, whatYouGet } = body;

    // TODO: Implement PDF generation with a library like PDFKit
    // For now, return a simple text representation
    const content = `
XVAL Production Services Quote

Total Cost: $${quote.total}

Cost Breakdown:
${quote.breakdown.map((item: { description: string; amount: number }) => `${item.description}: $${item.amount}`).join('\n')}

What You Get:
${whatYouGet.map((item: string) => `- ${item}`).join('\n')}
    `;

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": "attachment; filename=quote.txt"
      }
    });
  }),
});

export default http;
