import PDFDocument from "pdfkit";

interface StoryPagePayload {
  pageNumber: number;
  content: string;
  imageUrl?: string | null;
}

interface StoryPayload {
  title: string;
  dedication?: string | null;
}

export class PDFService {
  async generateStorybookPdf(story: StoryPayload, pages: StoryPagePayload[]) {
    const doc = new PDFDocument({
      margin: 50,
      size: "LETTER",
      info: {
        Title: story.title,
        Author: "Portrait AI",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    doc.fontSize(26).text(story.title, { align: "center" });
    doc.moveDown();

    if (story.dedication) {
      doc.fontSize(14).text(`Dedication: ${story.dedication}`, {
        align: "center",
      });
      doc.addPage();
    } else {
      doc.addPage();
    }

    for (const page of pages.sort((a, b) => a.pageNumber - b.pageNumber)) {
      doc.fontSize(20).text(`Page ${page.pageNumber}`, { align: "left" });
      doc.moveDown();
      doc.fontSize(14).text(page.content, {
        align: "left",
        lineGap: 6,
      });

      if (page.imageUrl) {
        doc.moveDown();
        doc.text("[Illustration placeholder]", { align: "center", italics: true });
      }

      doc.addPage();
    }

    doc.end();

    return Buffer.concat(buffers);
  }
}

