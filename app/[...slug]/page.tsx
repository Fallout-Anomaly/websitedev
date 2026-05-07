import { notFound } from 'next/navigation';
import { getDocBySlug } from '@/lib/markdown';
import DocsPageShell from '@/src/components/DocsPageShell';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const TerminalCard = ({ title, children }: any) => (
  <div className="my-10 border-2 border-[#2e2e2e] bg-black">
    {title && (
      <div className="border-b-2 border-[#2e2e2e] bg-[#1a1a1a] py-3 text-center">
        <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#e3e3e3]">{title}</span>
      </div>
    )}
    <div className="p-8 text-[16px] leading-relaxed text-[#e3e3e3] markdown-inner">
      {children}
    </div>
  </div>
);

const LinkCard = ({ title, meta, href }: any) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="group block my-10 border-2 border-[#2e2e2e] bg-[#1a1a1a] p-6 transition-colors hover:border-emerald-500"
  >
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-lg font-bold text-white group-hover:text-emerald-500 transition-colors">{title}</h4>
        <p className="mt-2 text-sm text-gray-400">{meta}</p>
      </div>
      <div className="text-gray-500 group-hover:text-emerald-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
      </div>
    </div>
  </a>
);

const StatCard = ({ value, label, variant }: any) => {
  const isRed = variant === 'red';
  return (
    <div className={`my-8 border-2 ${isRed ? 'border-red-900 bg-red-950/20' : 'border-[#2e2e2e] bg-[#111]'} p-6 text-center shadow-xl`}>
      <div className={`text-4xl font-black italic tracking-tighter ${isRed ? 'text-red-500' : 'text-emerald-500'} mb-1 uppercase`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{label}</div>
    </div>
  );
};


export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.join('/');
  const doc = getDocBySlug(resolvedParams.slug);

  if (!doc) {
    notFound();
  }

  return (
    <DocsPageShell 
      title={doc.meta.title} 
      subtitle={doc.meta.description || ''}
      slug={slug}
    >
      <div className="prose prose-invert max-w-none 
        prose-h1:hidden
        prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-[#2e2e2e] prose-h2:pb-2
        prose-h3:text-xl prose-h3:font-bold prose-h3:text-white prose-h3:mt-8 prose-h3:mb-4
        prose-p:text-[#e3e3e3] prose-p:leading-relaxed prose-p:mb-4 prose-p:text-[16px]
        prose-li:text-[#e3e3e3] prose-li:mb-1
        prose-strong:text-white prose-strong:font-bold
        prose-a:text-emerald-500 prose-a:no-underline hover:prose-a:underline
        prose-hr:border-[#2e2e2e] prose-hr:my-10
        prose-blockquote:border-emerald-500 prose-blockquote:bg-[#1a1a1a] prose-blockquote:rounded-md prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:not-italic
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            terminalcard: TerminalCard,
            linkcard: LinkCard,
            statcard: StatCard,
            a: ({ node, href, ...props }: any) => {

              let resolvedHref = href || '';
              if (resolvedHref.endsWith('.md')) {
                resolvedHref = resolvedHref.replace(/\.md$/, '');
              }
              if (resolvedHref.startsWith('./')) {
                resolvedHref = resolvedHref.replace(/^\.\//, '');
              }
              if (resolvedHref.startsWith('/docs/main/')) {
                resolvedHref = resolvedHref.replace('/docs/main/', '/');
              }
              
              if (resolvedHref.startsWith('http')) {
                return <a href={resolvedHref} target="_blank" rel="noopener noreferrer" {...props} />;
              }

              return <a href={resolvedHref} {...props} />;
            },
            div: ({node, children, ...props}: any) => {
              const type = props['data-admonition-type'];
              const title = props['data-admonition-title'];
              
              if (type) {
                let borderColor = 'border-emerald-500';
                let bgColor = 'bg-[#1a2e2a]';
                let icon = '💡';
                
                if (type === 'danger') {
                  borderColor = 'border-[#fa393e]';
                  bgColor = 'bg-[#2b1b1b]';
                  icon = '🚫';
                } else if (type === 'warning') {
                  borderColor = 'border-[#ffba00]';
                  bgColor = 'bg-[#2b251b]';
                  icon = '⚠️';
                } else if (type === 'tip') {
                  borderColor = 'border-[#00e676]';
                  bgColor = 'bg-[#1b2b22]';
                  icon = '✨';
                }

                return (
                  <div className={`my-8 border-l-4 ${borderColor} ${bgColor} overflow-hidden rounded-r-md`}>
                    <div className="flex items-center gap-2 px-4 py-2 font-black uppercase tracking-widest text-xs bg-black/20">
                      <span>{icon}</span>
                      <span>{title || type}</span>
                    </div>
                    <div className="p-4 text-[15px] leading-relaxed admonition-content">
                      {children}
                    </div>
                  </div>
                );
              }
              return <div {...props}>{children}</div>;
            }
          } as any}

        >
          {doc.content}
        </ReactMarkdown>
      </div>
    </DocsPageShell>
  );
}

