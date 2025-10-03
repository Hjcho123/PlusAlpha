import React from 'react';
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for AI responses with support for:
 * - **bold** text
 * - *italic* text
 * - Code blocks and inline code
 * - Lists
 * - Math expressions (basic support)
 * - Headers
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ""
}) => {
  const renderContent = (text: string): React.ReactNode => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph, paraIndex) => {
      // Handle different types of content
      if (paragraph.trim().startsWith('#')) {
        // Headers
        const headerMatch = paragraph.match(/^(#{1,6})\s*(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
          return <HeaderTag key={paraIndex} className="font-semibold text-lg mb-2 mt-4">{renderInline(content)}</HeaderTag>;
        }
      }

      // Handle lists
      if (paragraph.trim().match(/^[-*]\s/) || paragraph.trim().match(/^\d+\.\s/)) {
        const listItems = paragraph.split('\n').filter(line => line.trim());
        return (
          <ul key={paraIndex} className="list-disc list-inside space-y-1 mb-2">
            {listItems.map((item, itemIndex) => {
              const cleanItem = item.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
              return (
                <li key={itemIndex}>
                  {renderInline(cleanItem)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Handle code blocks
      if (paragraph.startsWith('```')) {
        const codeLines = paragraph.split('\n').filter(line => !line.startsWith('```'));
        return (
          <pre key={paraIndex} className="bg-muted p-3 rounded-md overflow-x-auto text-sm mb-2 font-mono">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      }

      // Handle blockquotes
      if (paragraph.trim().startsWith('>')) {
        const quote = paragraph.replace(/^>\s*/, '');
        return (
          <blockquote key={paraIndex} className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-2">
            {renderInline(quote)}
          </blockquote>
        );
      }

      // Regular paragraph
      return (
        <p key={paraIndex} className="mb-2 last:mb-0">
          {renderInline(paragraph)}
        </p>
      );
    });
  };

  const renderInline = (text: string): React.ReactNode => {
    // Handle math expressions first (before other formatting to avoid conflicts)
    text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$'); // Convert LaTeX-style math
    text = text.replace(/\\[+\-\*/=]/g, (match) => {
      switch (match.slice(1)) {
        case '+': return '+';
        case '-': return '-';
        case '*': return '×';
        case '/': return '÷';
        case '=': return '=';
        default: return match;
      }
    });

    // Split by potential markdown elements
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let remaining = text;

    while (remaining.length > 0) {
      let nextMatch: { type: string; start: number; end: number; content?: string } | null = null;

      // Check for code blocks first
      const codeMatch = remaining.match(/`[^`]+`/);
      if (codeMatch) {
        nextMatch = {
          type: 'code',
          start: codeMatch.index!,
          end: codeMatch.index! + codeMatch[0].length,
          content: codeMatch[0].slice(1, -1)
        };
      }

      // Check for math expressions
      if (!nextMatch) {
        const mathMatch = remaining.match(/\$[^$]+\$/);
        if (mathMatch) {
          nextMatch = {
            type: 'math',
            start: mathMatch.index!,
            end: mathMatch.index! + mathMatch[0].length,
            content: mathMatch[0].slice(1, -1)
          };
        }
      }

      // Check for bold
      if (!nextMatch) {
        const boldMatch = remaining.match(/\*\*([^*\n]+)\*\*/);
        if (boldMatch) {
          nextMatch = {
            type: 'bold',
            start: boldMatch.index!,
            end: boldMatch.index! + boldMatch[0].length,
            content: boldMatch[0].slice(2, -2)
          };
        }
      }

      // Check for italic
      if (!nextMatch) {
        const italicMatch = remaining.match(/\*([^*\n]+)\*/);
        if (italicMatch) {
          nextMatch = {
            type: 'italic',
            start: italicMatch.index!,
            end: italicMatch.index! + italicMatch[0].length,
            content: italicMatch[0].slice(1, -1)
          };
        }
      }

      if (nextMatch) {
        // Add text before the match
        if (nextMatch.start > 0) {
          parts.push(remaining.slice(0, nextMatch.start));
        }

        // Add the formatted element
        switch (nextMatch.type) {
          case 'bold':
            parts.push(<strong key={parts.length} className="font-semibold">{nextMatch.content}</strong>);
            break;
          case 'italic':
            parts.push(<em key={parts.length} className="italic">{nextMatch.content}</em>);
            break;
          case 'code':
            parts.push(
              <code key={parts.length} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {nextMatch.content}
              </code>
            );
            break;
          case 'math':
            parts.push(
              <span key={parts.length} className="inline-math bg-blue-50 px-1.5 py-0.5 rounded border font-mono text-sm">
                {renderMathReact(nextMatch.content!)}
              </span>
            );
            break;
        }

        // Move to next part
        remaining = remaining.slice(nextMatch.end);
        currentIndex += nextMatch.end;
      } else {
        // No more formatting found
        parts.push(remaining);
        break;
      }
    }

    // If no formatting was found, return plain text
    return parts.length === 0 ? text : parts;
  };

  const renderMathReact = (mathText: string): React.ReactNode => {
    try {
      // Simple math expression renderer
      // Handle basic arithmetic and formatting
      let result = mathText;

      // Handle multiplication symbols
      result = result.replace(/\*/g, '×');
      result = result.replace(/\//g, '÷');

      // Parse and render more complex expressions

      // Handle currency
      if (result.includes('$')) {
        const currencyParts = result.split('$');
        return (
          <span>
            {currencyParts.map((part, index) => {
              if (index % 2 === 1) {
                return <span key={index} className="font-semibold">${part}</span>;
              }
              return part;
            })}
          </span>
        );
      }

      // Handle percentages
      if (result.includes('%')) {
        const percentParts = result.split('%');
        return (
          <span>
            {percentParts.map((part, index) => {
              if (index < percentParts.length - 1) {
                return (
                  <React.Fragment key={index}>
                    {part}
                    <span className="text-muted-foreground">%</span>
                  </React.Fragment>
                );
              }
              return part;
            })}
          </span>
        );
      }

      return result;
    } catch (error) {
      console.warn('Math rendering error:', error);
      return mathText;
    }
  };

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {renderContent(content)}
    </div>
  );
};

export default MarkdownRenderer;
