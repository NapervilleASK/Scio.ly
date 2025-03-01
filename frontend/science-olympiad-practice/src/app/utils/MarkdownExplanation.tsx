
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownExplanationProps {
  text: string;
}

const MarkdownExplanation: React.FC<MarkdownExplanationProps> = ({ text }) => {
  return (
    <div className="markdown-explanation text-sm">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};

export default MarkdownExplanation; 