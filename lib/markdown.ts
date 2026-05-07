import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Resolve to the project's local docs folder
const docsDirectory = path.join(process.cwd(), 'docs/main');

export function getDocBySlug(slugArray: string[]) {
  let realSlug = slugArray.join('/');
  
  // Handle legacy Docusaurus prefixes
  if (realSlug.startsWith('docs/main/')) {
    realSlug = realSlug.replace('docs/main/', '');
  }
  
  // 1. Try exact file: e.g. "intro.md"
  let fullPath = path.join(docsDirectory, `${realSlug}.md`);
  
  if (!fs.existsSync(fullPath)) {
    // 2. Try index.md in directory: e.g. "gameplay/index.md"
    fullPath = path.join(docsDirectory, realSlug, 'index.md');
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Pre-process Docusaurus specific syntax and rename project
    let processedContent = content
      // Strip MDX imports
      .replace(/^import\s+.*$/gm, '')
      // Rename branding
      .replace(/Fallout Anomaly/gi, 'Fallen World')
      // Convert JSX style={{...}} to HTML style="..."
      .replace(/style=\{\{(.*?)\}\}/g, (match, p1) => {
        const styleStr = p1.split(',')
          .map((s: string) => {
            const parts = s.split(':');
            if (parts.length < 2) return '';
            const prop = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            const kebabProp = prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const cleanVal = val.replace(/['"]/g, '');
            return `${kebabProp}: ${cleanVal};`;
          })
          .filter(Boolean)
          .join(' ');
        return `style="${styleStr}"`;
      })
      // Handle useBaseUrl and JSX src
      .replace(/src=\{useBaseUrl\(['"](.*?)['"]\)\}/g, 'src="$1"')
      .replace(/src=\{['"](.*?)['"]\}/g, 'src="$1"')
      // Fix camelCase attributes for HTML
      .replace(/frameBorder=/g, 'frameborder=')
      .replace(/allowFullScreen/g, 'allowfullscreen')
      // Convert admonitions to blockquotes

      // Convert admonitions to div blocks for custom component mapping
      .replace(/^:::(info|warning|danger|note|tip)\s*(.*)$/gm, '<div data-admonition-type="$1" data-admonition-title="$2">')
      .replace(/^:::$/gm, '</div>');

    return { 
      slug: realSlug, 
      meta: {
        title: data.title || realSlug.replace('-', ' '),
        description: data.description || '',
        ...data
      }, 
      content: processedContent 
    };
  } catch (error) {
    console.error("Error reading markdown file:", error);
    return null;
  }
}
