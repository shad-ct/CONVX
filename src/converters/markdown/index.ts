import { marked } from 'marked';
import { htmlToPdf } from '../html';

export async function markdownToHtml(mdText: string): Promise<string> {
  // marked.parse returns a string or Promise<string>. Wrap with await to ensure it's resolved.
  const html = await marked.parse(mdText);
  return html;
}

export async function markdownToPdf(mdText: string): Promise<Blob> {
  const html = await markdownToHtml(mdText);
  // Add basic styling for PDF printing
  const StyledHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; font-size: 14px;">
      ${html}
    </div>
  `;
  return htmlToPdf(StyledHtml);
}
