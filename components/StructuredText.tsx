import React from 'react';

interface StructuredTextProps {
  text: string;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    // Split by bold (**) or underline (<u>) tags, keeping the delimiters.
    const parts = text.split(/(\*\*.*?\*\*|<u>.*?<\/u>)/g);
    
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
                }
                if (part.startsWith('<u>') && part.endsWith('</u>')) {
                    return <u key={index}>{part.substring(3, part.length - 4)}</u>;
                }
                return part;
            })}
        </>
    );
};

const StructuredText: React.FC<StructuredTextProps> = ({ text }) => {
  if (!text) return null;

  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block handling
    if (line.trim().startsWith('```')) {
        const codeLines = [];
        i++; // move past the opening ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
        }
        i++; // move past the closing ```
        elements.push(
            <pre key={`pre-${i}`}>
                <code>{codeLines.join('\n')}</code>
            </pre>
        );
        continue;
    }

    // Headings (more robust parsing)
    const headingMatch = line.match(/^(##+)\s*(.*)/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        if (level === 2) {
            elements.push(<h2 key={i}><FormattedText text={content} /></h2>);
        } else { // Handles ###, ####, etc. as h3
            elements.push(<h3 key={i}><FormattedText text={content} /></h3>);
        }
        i++;
        continue;
    }

    // Callout Boxes
    if (line.startsWith('> [!')) {
      const match = line.match(/^> \[!(NOTE|KEY|EXAMPLE)\]\s*(.*)/);
      if (match) {
        const type = match[1].toLowerCase();
        const content = match[2];
        elements.push(
          <div key={i} className={`callout-box callout-${type}`}>
            <p><FormattedText text={content} /></p>
          </div>
        );
        i++;
        continue;
      }
    }

    // Diagram Placeholders
    if (line.startsWith('[DIAGRAM:')) {
      const match = line.match(/\[DIAGRAM:\s*(.*?)\]/);
      if (match) {
        const prompt = match[1];
        elements.push(
          <div key={i} className="diagram-placeholder">
            <span className="diagram-placeholder-icon" role="img" aria-label="Diagram icon">🎨</span>
            <p className="diagram-placeholder-title">Visual Explanation</p>
            <p className="diagram-placeholder-prompt">"{prompt}"</p>
          </div>
        );
        i++;
        continue;
      }
    }

    // Tables
    if (line.includes('|')) {
      let tableLines = [];
      
      if (i + 1 < lines.length && lines[i+1].includes('|') && lines[i+1].replace(/[-| ]/g, '').length === 0) {
          tableLines.push(lines[i]); // Header
          tableLines.push(lines[i + 1]); // Separator
          i += 2;
          while (i < lines.length && lines[i].includes('|')) {
              tableLines.push(lines[i]);
              i++;
          }
      }
      
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
        const rows = tableLines.slice(2).map(rowLine => {
            const cells = rowLine.split('|').map(c => c.trim());
            // Remove first and last empty cells if they exist from slicing by '|'
            if (cells.length > headers.length) {
                return cells.slice(1, -1);
            }
            return cells;
        }).filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
        
        elements.push(
          <div key={i} className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {headers.map((header, index) => <th key={index}><FormattedText text={header} /></th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => <td key={cellIndex}><FormattedText text={cell} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue; // continue the main loop
      }
    }

    // Lists
    const listItems: string[] = [];
    const listItemRegex = /^\s*([-*]|\d+\.)\s+/;
    while (i < lines.length && listItemRegex.test(lines[i])) {
        listItems.push(lines[i].replace(listItemRegex, ''));
        i++;
    }
    if (listItems.length > 0) {
        elements.push(
            <ul key={`ul-${i}`}>
                {listItems.map((item, index) => (
                    <li key={index}><FormattedText text={item} /></li>
                ))}
            </ul>
        );
        continue;
    }

    // Paragraphs
    if (line.trim()) {
      elements.push(<p key={i}><FormattedText text={line} /></p>);
    }
    
    i++;
  }

  return <>{elements}</>;
};

export default StructuredText;
