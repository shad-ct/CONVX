export function txtToMarkdown(txtContent: string): string {
  // Convert double newlines to Markdown paragraphs
  // And escape simple characters or preserve formatting
  return txtContent
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p)
    .map(p => p.replace(/\n/g, '  \n')) // Preserve line breaks as Markdown line breaks
    .join('\n\n');
}
