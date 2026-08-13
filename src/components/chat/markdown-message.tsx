"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "@phosphor-icons/react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  return (
    <div className={`markdown-content text-[14px] leading-relaxed text-[#111111] font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-black mt-3 mb-2 font-sans tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-black mt-3 mb-1.5 font-sans tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-black mt-2.5 mb-1 font-sans">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-black mt-2 mb-1 font-sans uppercase tracking-wider">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold text-black mt-1.5 mb-0.5 font-sans">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold text-neutral-600 mt-1 mb-0.5 font-sans">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-[14px] leading-relaxed text-[#111111] mb-2.5 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 my-2 space-y-1 text-[14px] text-[#111111]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 my-2 space-y-1 text-[14px] text-[#111111]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[14px] leading-relaxed text-[#111111] pl-0.5">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-black">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-black">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#16A34A] hover:text-[#15803D] underline underline-offset-2 font-medium transition-colors"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[#16A34A] pl-3 py-1 my-2.5 italic text-[#6B7280] bg-[#FAFAFA] rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 font-semibold text-black border-r border-[#E5E7EB] last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 text-[#111111] border-b border-r border-[#E5E7EB] last:border-r-0">
              {children}
            </td>
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[#F3F4F6] text-[#111111] font-mono text-[12px] border border-[#E5E7EB]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : ""}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden select-text text-xs shadow-2xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#F3F4F6] border-b border-[#E5E7EB] select-none">
        <span className="font-mono text-[11px] font-semibold text-[#6B7280] uppercase">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6B7280] hover:text-black transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#16A34A]" />
              <span className="text-[#16A34A]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[13px] leading-relaxed text-[#111111] bg-white">
        <code>{children}</code>
      </pre>
    </div>
  );
}
