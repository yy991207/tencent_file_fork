import React from "react";

export default function HighlightedText({ text, query }) {
  if (!query) {
    return text;
  }

  const lowerText = String(text);
  const lowerQuery = query.toLowerCase();
  const index = lowerText.toLowerCase().indexOf(lowerQuery);

  if (index === -1) {
    return text;
  }

  const before = lowerText.slice(0, index);
  const match = lowerText.slice(index, index + lowerQuery.length);
  const after = lowerText.slice(index + lowerQuery.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}
